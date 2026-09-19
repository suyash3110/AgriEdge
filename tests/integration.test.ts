import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { db } from "../lib/db";
import { seed } from "../lib/seed";
import { trading } from "../modules/trading";
import { operations } from "../modules/operations";
import { community } from "../modules/community";
import {
  fulfilment,
  processPaymentEvent,
  verifySignature,
} from "../modules/fulfilment";
import { importPrices } from "../modules/markets";
import type { PrismaClient, User } from "@prisma/client";
process.env.TEST_DATABASE = "memory";
let p: PrismaClient,
  farmer: User,
  buyer: User,
  buyer2: User,
  fpo: User,
  transporter: User;
beforeAll(async () => {
  p = await db();
  await seed(p);
  farmer = await p.user.findUniqueOrThrow({ where: { id: "farmer-1" } });
  buyer = await p.user.findUniqueOrThrow({ where: { id: "buyer-1" } });
  buyer2 = await p.user.findUniqueOrThrow({ where: { id: "buyer-2" } });
  fpo = await p.user.findUniqueOrThrow({ where: { id: "fpo-1" } });
  transporter = await p.user.findUniqueOrThrow({
    where: { id: "transporter-1" },
  });
});
afterAll(async () => {
  await p?.$disconnect();
});
describe("database-backed business boundaries", () => {
  it("CSV replay is idempotent and sample provenance survives", async () => {
    const a = await importPrices(),
      b = await importPrices();
    expect(a.id).toBe(b.id);
    expect(await p.priceObservation.count()).toBe(5);
    expect((await p.priceObservation.findFirstOrThrow()).source).toContain(
      "Fictional",
    );
  });
  it("first bid leaves round open and lower competing rate is rejected", async () => {
    await trading(
      "bid.create",
      {
        lotId: "lot-tomato",
        rate: "1800",
        payer: "buyer",
        arranger: "buyer",
        terms: "Payment after inspection",
      },
      buyer,
    );
    expect(
      (await p.lot.findUniqueOrThrow({ where: { id: "lot-tomato" } })).status,
    ).toBe("open");
    await expect(
      trading(
        "bid.create",
        {
          lotId: "lot-tomato",
          rate: "1799",
          payer: "buyer",
          arranger: "buyer",
          terms: "Payment after inspection",
        },
        buyer2,
      ),
    ).rejects.toThrow();
  });
  it("two concurrent acceptances create exactly one agreement", async () => {
    const results = await Promise.allSettled([
      trading("bid.accept", { id: "bid-1" }, farmer),
      trading("bid.accept", { id: "bid-2" }, farmer),
    ]);
    expect(results.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(await p.agreement.count({ where: { lotId: "lot-wheat" } })).toBe(1);
    expect(
      (
        await p.lot.findUniqueOrThrow({ where: { id: "lot-wheat" } })
      ).reservedKg.toString(),
    ).toBe("1200");
  });
  it("circle reservations prevent individual sale and over-pledge", async () => {
    const second = await p.user.findUniqueOrThrow({
      where: { id: "farmer-2" },
    });
    await operations(
      "circle.join",
      { circleId: "circle-1", lotId: "lot-wheat-2", kg: "700", consent: true },
      second,
    );
    await expect(
      trading(
        "bid.create",
        {
          lotId: "lot-wheat-2",
          rate: "2600",
          payer: "buyer",
          arranger: "buyer",
          terms: "Payment after inspection",
        },
        buyer,
      ),
    ).rejects.toThrow();
    await expect(
      operations(
        "circle.join",
        {
          circleId: "circle-1",
          lotId: "lot-wheat-2",
          kg: "200",
          consent: true,
        },
        second,
      ),
    ).rejects.toThrow();
  });
  it("concurrent overlapping warehouse confirmation cannot overbook", async () => {
    const one = await p.booking.create({
      data: {
        warehouseId: "warehouse-1",
        farmerId: farmer.id,
        crop: "wheat",
        kg: "15000",
        startDate: new Date("2026-10-01"),
        endDate: new Date("2026-10-10"),
      },
    });
    const two = await p.booking.create({
      data: {
        warehouseId: "warehouse-1",
        farmerId: farmer.id,
        crop: "wheat",
        kg: "15000",
        startDate: new Date("2026-10-02"),
        endDate: new Date("2026-10-09"),
      },
    });
    const results = await Promise.allSettled([
      operations(
        "booking.confirm",
        { id: one.id, reason: "Capacity reviewed" },
        fpo,
      ),
      operations(
        "booking.confirm",
        { id: two.id, reason: "Capacity reviewed" },
        fpo,
      ),
    ]);
    expect(results.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  });
  it("unrelated users cannot read/write a private conversation", async () => {
    await expect(
      community(
        "message.send",
        { threadId: "thread-1", body: "Unauthorized" },
        buyer2,
      ),
    ).rejects.toThrow();
    expect(await p.message.count({ where: { body: "Unauthorized" } })).toBe(0);
  });
  it("wrong verifier and cross-FPO staff cannot approve", async () => {
    await expect(
      operations(
        "verification.decide",
        { id: buyer.id, decision: "approved", evidence: "not allowed" },
        farmer,
      ),
    ).rejects.toThrow();
    await expect(
      operations(
        "verification.decide",
        { id: farmer.id, decision: "approved", evidence: "not a member" },
        { ...fpo, fpoId: "another-fpo" },
      ),
    ).rejects.toThrow();
  });
  it("duplicate capture and later failed event cannot double-credit", async () => {
    const a = await p.agreement.findFirstOrThrow();
    await p.agreement.update({
      where: { id: a.id },
      data: { fulfilment: "inspected" },
    });
    const currentBuyer = await p.user.findUniqueOrThrow({
      where: { id: a.buyerId },
    });
    await fulfilment("payment.order", { id: a.id }, currentBuyer);
    const order = await p.paymentOrder.findUniqueOrThrow({
      where: { agreementId: a.id },
    });
    const e = {
      eventId: "test-capture",
      orderId: order.id,
      kind: "captured",
      amountPaise: order.amountPaise.toString(),
      currency: "INR",
      mode: "sandbox",
    };
    await processPaymentEvent(e, true);
    await processPaymentEvent(e, true);
    await processPaymentEvent(
      { ...e, eventId: "test-failed", kind: "failed" },
      true,
    );
    expect(await p.ledgerEntry.count({ where: { agreementId: a.id } })).toBe(2);
    expect(
      (await p.paymentOrder.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe("captured");
    const ledger = await p.ledgerEntry.findMany({
      where: { agreementId: a.id },
    });
    expect(ledger.reduce((n, e) => n + e.amountPaise, 0n)).toBe(0n);
    await expect(
      processPaymentEvent({ ...e, eventId: "wrong", amountPaise: "1" }, true),
    ).rejects.toThrow();
  });
  it("rejects spoofed signatures and GPS outside assignment", async () => {
    expect(verifySignature("{}", "bad", "secret")).toBe(false);
    const j = await p.transportJob.findFirstOrThrow();
    await expect(
      fulfilment(
        "transport.location",
        {
          jobId: j.id,
          latitude: 24,
          longitude: 81,
          accuracy: 10,
          consent: true,
        },
        transporter,
      ),
    ).rejects.toThrow();
  });
  it("idempotency replays one mutation and rejects changed input", async () => {
    const { mutationContext } = await import("../lib/request-context");
    const payload = {
      crop: "gram",
      category: "produce",
      kg: "100",
      grade: "FAQ",
      location: "Rewa",
      deadline: "2030-01-01",
      terms: "After inspection",
    };
    const key = "test-idempotency-" + crypto.randomUUID();
    const first = await mutationContext.run({ key, fingerprint: "same" }, () =>
      trading("demand.create", payload, buyer),
    );
    const second = await mutationContext.run({ key, fingerprint: "same" }, () =>
      trading("demand.create", payload, buyer),
    );
    expect((first as { id: string }).id).toBe((second as { id: string }).id);
    await expect(
      mutationContext.run({ key, fingerprint: "changed" }, () =>
        trading("demand.create", payload, buyer),
      ),
    ).rejects.toThrow();
  });
  it("withdrawal versus acceptance resolves to one final state", async () => {
    const lot = await p.lot.create({
      data: {
        ownerId: farmer.id,
        title: "Race lot",
        crop: "gram",
        kg: "100",
        expectedRate: 500000n,
        harvestDate: new Date(),
        availableDate: new Date(),
        deadline: new Date(Date.now() + 86400000),
        status: "open",
      },
    });
    const b = await p.bid.create({
      data: {
        lotId: lot.id,
        buyerId: buyer.id,
        rate: 500000n,
        payer: "buyer",
        arranger: "buyer",
        terms: "Inspection",
        expiresAt: lot.deadline,
      },
    });
    const results = await Promise.allSettled([
      trading("bid.withdraw", { id: b.id }, buyer),
      trading("bid.accept", { id: b.id }, farmer),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const latest = await p.bid.findUniqueOrThrow({ where: { id: b.id } });
    expect(["withdrawn", "accepted"]).toContain(latest.status);
  });
  it("two farmers contribute actual stock and aggregate allocation balances", async () => {
    const second = await p.user.findUniqueOrThrow({
      where: { id: "farmer-2" },
    });
    const demand = await p.demand.create({
      data: {
        buyerId: buyer.id,
        crop: "wheat",
        kg: "800",
        grade: "FAQ",
        location: "Rewa",
        deadline: new Date("2030-01-01"),
        terms: "Inspection",
      },
    });
    const circle = (await operations(
      "circle.create",
      {
        demandId: demand.id,
        name: "Test actual intake circle",
        targetKg: "800",
        minimumKg: "700",
        hub: "Rewa",
        deadline: "2030-01-01",
      },
      fpo,
    )) as { id: string };
    for (const member of [farmer, second]) {
      const l = await p.lot.create({
        data: {
          ownerId: member.id,
          title: "Circle source",
          crop: "wheat",
          kg: "500",
          expectedRate: 240000n,
          harvestDate: new Date(),
          availableDate: new Date(),
          deadline: new Date("2030-01-01"),
          status: "open",
        },
      });
      const c = (await operations(
        "circle.join",
        { circleId: circle.id, lotId: l.id, kg: "500", consent: true },
        member,
      )) as { id: string };
      await operations(
        "circle.intake",
        { id: c.id, receivedKg: "450", acceptedKg: "400", grade: "FAQ" },
        fpo,
      );
    }
    expect(
      (await p.circle.findUniqueOrThrow({ where: { id: circle.id } })).status,
    ).toBe("ready");
    const aggregate = (await operations(
      "circle.aggregate",
      { id: circle.id, rate: "2500" },
      fpo,
    )) as { id: string; kg: { toString(): string } };
    expect(aggregate.kg.toString()).toBe("800");
    const b = (await trading(
      "bid.create",
      {
        lotId: aggregate.id,
        rate: "2500",
        cost: "100",
        payer: "seller",
        arranger: "seller",
        terms: "Inspection",
      },
      buyer,
    )) as { id: string };
    const a = (await trading("bid.accept", { id: b.id }, fpo)) as {
      id: string;
    };
    await p.agreement.update({
      where: { id: a.id },
      data: { fulfilment: "inspected" },
    });
    const order = (await fulfilment("payment.order", { id: a.id }, buyer)) as {
      id: string;
      amountPaise: bigint;
    };
    await processPaymentEvent(
      {
        eventId: "circle-capture",
        orderId: order.id,
        kind: "captured",
        amountPaise: order.amountPaise.toString(),
        currency: "INR",
        mode: "sandbox",
      },
      true,
    );
    const allocations = await p.allocation.findMany({
      where: { agreementId: a.id },
    });
    expect(allocations).toHaveLength(2);
    expect(
      allocations.reduce((sum, x) => sum + x.amountPaise, 0n) + 10000n,
    ).toBe(order.amountPaise);
  });
  it("storage checkin, loss and checkout preserve a zero final balance", async () => {
    const { management } = await import("../modules/management");
    const b = await p.booking.create({
      data: {
        warehouseId: "warehouse-1",
        farmerId: farmer.id,
        crop: "gram",
        kg: "100",
        startDate: new Date("2031-01-01"),
        endDate: new Date("2031-01-10"),
      },
    });
    await operations(
      "booking.confirm",
      { id: b.id, reason: "Capacity checked" },
      fpo,
    );
    await operations(
      "booking.checkin",
      { id: b.id, reason: "Actual 100 kg received" },
      fpo,
    );
    await management(
      "inventory.loss",
      { bookingId: b.id, kg: "10", reason: "Recorded damaged stock" },
      fpo,
    );
    await operations(
      "booking.checkout",
      { id: b.id, reason: "Remaining stock released" },
      fpo,
    );
    const movements = await p.stockMovement.findMany({
      where: { bookingId: b.id },
    });
    expect(movements.reduce((n, m) => n + Number(m.deltaKg), 0)).toBe(0);
  });
  it("file signatures and evidence access reject strangers", async () => {
    const { contextAccess, detectMime } = await import("../modules/files");
    expect(await contextAccess(buyer2, "thread-1")).toBe(false);
    expect(await contextAccess(farmer, "thread-1")).toBe(true);
    expect(detectMime(Buffer.from("<script>alert(1)</script>"))).toBe(null);
  });
  it("refund uses reversing entries and preserves event history", async () => {
    const order = await p.paymentOrder.findFirstOrThrow({
      where: { status: "captured" },
    });
    const e = {
      eventId: "refund-test",
      orderId: order.id,
      kind: "refunded",
      amountPaise: order.amountPaise.toString(),
      currency: "INR",
      mode: "sandbox",
    };
    await processPaymentEvent(e, true);
    await processPaymentEvent(e, true);
    const entries = await p.ledgerEntry.findMany({
      where: { agreementId: order.agreementId },
    });
    expect(entries).toHaveLength(4);
    expect(entries.reduce((s, e) => s + e.amountPaise, 0n)).toBe(0n);
    const agreement = await p.agreement.findUniqueOrThrow({where:{id:order.agreementId}});
    const payer = await p.user.findUniqueOrThrow({where:{id:agreement.buyerId}});
    await fulfilment("payment.order",{id:agreement.id},payer);
    expect((await p.agreement.findUniqueOrThrow({where:{id:agreement.id}})).payment).toBe("refunded");
  });
});
