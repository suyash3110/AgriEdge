import { z } from "zod";
import type { User } from "@prisma/client";
import { randomInt, createHmac, timingSafeEqual } from "node:crypto";
import { atomic, event, demo } from "../lib/db";
import { hashSecret } from "../lib/auth";
import { insist, rupeesToPaise, kgToGrams, allocate } from "../lib/domain";
import { approved, lock } from "./trading";
const id = z.string().min(1).max(150),
  text = z.string().trim().min(3).max(1000);
export async function fulfilment(action: string, raw: unknown, u: User) {
  if (action === "vehicle.create") {
    approved(u, ["transporter"]);
    const d = z
      .object({ registration: text, type: text, capacityKg: z.string() })
      .parse(raw);
    kgToGrams(d.capacityKg);
    return atomic(async (tx) => {
      const v = await tx.vehicle.create({ data: { ...d, ownerId: u.id } });
      await event(tx, u.id, action, v.id, "Vehicle registered");
      return v;
    });
  }
  if (action === "transport.quote") {
    approved(u, ["transporter"]);
    const d = z
      .object({ jobId: id, vehicleId: id, amount: z.string(), terms: text })
      .parse(raw);
    return atomic(async (tx) => {
      await lock(tx, "TransportJob", d.jobId);
      const j = await tx.transportJob.findUniqueOrThrow({
          where: { id: d.jobId },
        }),
        v = await tx.vehicle.findUniqueOrThrow({ where: { id: d.vehicleId } });
      insist(
        j.status === "open" && v.ownerId === u.id && v.capacityKg.gte(j.kg),
        "INVALID_QUOTE",
        "Choose your own vehicle with enough capacity for an open job.",
      );
      const q = await tx.quote.upsert({
        where: { jobId_transporterId: { jobId: j.id, transporterId: u.id } },
        create: {
          jobId: j.id,
          transporterId: u.id,
          vehicleId: v.id,
          amountPaise: rupeesToPaise(d.amount),
          terms: d.terms,
        },
        update: {
          amountPaise: rupeesToPaise(d.amount),
          terms: d.terms,
          vehicleId: v.id,
        },
      });
      await event(tx, u.id, action, q.id, "Transport quote received", [
        j.sellerId,
        j.buyerId,
      ]);
      return q;
    });
  }
  if (action === "transport.assign") {
    const d = z.object({ id }).parse(raw);
    return atomic(async (tx) => {
      const q = await tx.quote.findUniqueOrThrow({ where: { id: d.id } });
      await lock(tx, "TransportJob", q.jobId);
      const j = await tx.transportJob.findUniqueOrThrow({
        where: { id: q.jobId },
      });
      insist(
        u.id === (j.arranger === "seller" ? j.sellerId : j.buyerId),
        "PERMISSION_DENIED",
        "Only the agreed arranger may accept a quote.",
        403,
      );
      approved(u, ["farmer", "buyer", "fpo"]);
      const transporter = await tx.user.findUniqueOrThrow({
        where: { id: q.transporterId },
      });
      approved(transporter, ["transporter"]);
      insist(
        j.status === "open",
        "JOB_ASSIGNED",
        "This job has already been assigned.",
      );
      await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id=${q.vehicleId} FOR UPDATE`;
      const busy = await tx.transportJob.count({
        where: {
          vehicleId: q.vehicleId,
          status: { in: ["assigned", "picked_up", "in_transit"] },
        },
      });
      insist(!busy, "VEHICLE_BUSY", "This vehicle already has an active job.");
      const r = await tx.transportJob.update({
        where: { id: j.id },
        data: {
          transporterId: q.transporterId,
          vehicleId: q.vehicleId,
          quotePaise: q.amountPaise,
          status: "assigned",
        },
      });
      const thread = await tx.thread.findFirst({
        where: { contextId: j.agreementId },
      });
      if (thread)
        await tx.thread.update({
          where: { id: thread.id },
          data: { memberIds: { push: q.transporterId } },
        });
      await event(tx, u.id, action, j.id, "Transport assigned", [
        j.sellerId,
        j.buyerId,
        q.transporterId,
      ]);
      return r;
    });
  }
  if (action === "checkpoint.request") {
    const d = z
      .object({ jobId: id, purpose: z.enum(["pickup", "delivery"]) })
      .parse(raw);
    return atomic(async (tx) => {
      await lock(tx, "TransportJob", d.jobId);
      const j = await tx.transportJob.findUniqueOrThrow({
        where: { id: d.jobId },
      });
      insist(
        u.id === (d.purpose === "pickup" ? j.sellerId : j.buyerId),
        "PERMISSION_DENIED",
        "Only the releasing or receiving party can request this handover code.",
        403,
      );
      insist(
        d.purpose === "pickup"
          ? j.status === "assigned"
          : ["picked_up", "in_transit"].includes(j.status),
        "INVALID_STATE",
        "This checkpoint is not available yet.",
      );
      insist(
        demo,
        "PROVIDER_UNAVAILABLE",
        "OTP delivery is not configured.",
        503,
      );
      const recent = await tx.challenge.count({
        where: {
          subjectId: j.id,
          purpose: d.purpose,
          createdAt: { gt: new Date(Date.now() - 15 * 60000) },
        },
      });
      insist(
        recent < 5,
        "RATE_LIMITED",
        "Please wait before requesting another handover code.",
        429,
      );
      const code = String(randomInt(100000, 1000000));
      await tx.challenge.updateMany({
        where: { subjectId: j.id, purpose: d.purpose, consumed: false },
        data: { consumed: true },
      });
      await tx.challenge.create({
        data: {
          phone: u.phone,
          purpose: d.purpose,
          subjectId: j.id,
          hash: hashSecret(code),
          expiresAt: new Date(Date.now() + 5 * 60000),
        },
      });
      return {
        demoCode: code,
        notice:
          "Demo handover inbox. Share this code with the assigned transporter at the checkpoint.",
      };
    });
  }
  if (action === "checkpoint.verify") {
    approved(u, ["transporter"]);
    const d = z
      .object({
        jobId: id,
        purpose: z.enum(["pickup", "delivery"]),
        code: z.string().regex(/^\d{6}$/),
        evidence: text,
      })
      .parse(raw);
    const r = await atomic(async (tx) => {
      await lock(tx, "TransportJob", d.jobId);
      const j = await tx.transportJob.findUniqueOrThrow({
        where: { id: d.jobId },
      });
      insist(
        j.transporterId === u.id,
        "PERMISSION_DENIED",
        "Only the assigned transporter can verify handover.",
        403,
      );
      insist(
        d.purpose === "pickup"
          ? j.status === "assigned"
          : ["picked_up", "in_transit"].includes(j.status),
        "INVALID_STATE",
        "Checkpoint state does not match.",
      );
      const c = await tx.challenge.findFirst({
        where: { subjectId: j.id, purpose: d.purpose, consumed: false },
        orderBy: { createdAt: "desc" },
      });
      if (!c || c.expiresAt < new Date() || c.attempts >= 5)
        return { invalid: true };
      await tx.challenge.update({
        where: { id: c.id },
        data: { attempts: { increment: 1 } },
      });
      if (
        !timingSafeEqual(Buffer.from(c.hash), Buffer.from(hashSecret(d.code)))
      )
        return { invalid: true };
      await tx.challenge.update({
        where: { id: c.id },
        data: { consumed: true },
      });
      const status = d.purpose === "pickup" ? "picked_up" : "delivered";
      await tx.transportJob.update({ where: { id: j.id }, data: { status } });
      await tx.agreement.update({
        where: { id: j.agreementId },
        data: { fulfilment: status },
      });
      await event(tx, u.id, action, j.id, status + ": " + d.evidence, [
        j.sellerId,
        j.buyerId,
      ]);
      return { status };
    });
    insist(
      !("invalid" in r),
      "OTP_INVALID",
      "Handover OTP is invalid or expired.",
    );
    return r;
  }
  if (action === "transport.location") {
    approved(u, ["transporter"]);
    const d = z
      .object({
        jobId: id,
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy: z.number().min(0).max(100000),
        consent: z.literal(true),
      })
      .parse(raw);
    return atomic(async (tx) => {
      const j = await tx.transportJob.findUniqueOrThrow({
        where: { id: d.jobId },
      });
      insist(
        j.transporterId === u.id &&
          ["assigned", "picked_up", "in_transit"].includes(j.status),
        "GPS_UNAVAILABLE",
        "GPS sharing is limited to your active assignment.",
        403,
      );
      return tx.locationPing.create({
        data: {
          jobId: j.id,
          latitude: d.latitude,
          longitude: d.longitude,
          accuracy: d.accuracy,
        },
      });
    });
  }
  if (action === "agreement.inspect") {
    const d = z.object({ id, reason: text }).parse(raw);
    return atomic(async (tx) => {
      await lock(tx, "Agreement", d.id);
      const a = await tx.agreement.findUniqueOrThrow({ where: { id: d.id } });
      insist(
        a.buyerId === u.id && a.fulfilment === "delivered",
        "PERMISSION_DENIED",
        "The buyer may inspect only after delivery.",
        403,
      );
      await tx.agreement.update({
        where: { id: a.id },
        data: { fulfilment: "inspected" },
      });
      await event(
        tx,
        u.id,
        action,
        a.id,
        "Buyer quality inspection: " + d.reason,
        [a.sellerId],
      );
      return { id: a.id };
    });
  }
  if (action === "payment.order") {
    const d = z.object({ id }).parse(raw);
    return atomic(async (tx) => {
      await lock(tx, "Agreement", d.id);
      const a = await tx.agreement.findUniqueOrThrow({ where: { id: d.id } });
      insist(
        a.buyerId === u.id && a.fulfilment === "inspected",
        "PAYMENT_PENDING",
        "Payment is available to the buyer after delivery inspection.",
      );
      insist(
        demo,
        "PROVIDER_UNAVAILABLE",
        "A live gateway must be configured.",
        503,
      );
      const r = await tx.paymentOrder.upsert({
        where: { agreementId: a.id },
        update: {},
        create: {
          agreementId: a.id,
          amountPaise: a.totalPaise,
          mode: "sandbox",
          provider: "mock",
        },
      });
      await tx.agreement.update({
        where: { id: a.id },
        data: { payment: r.status },
      });
      await event(tx, u.id, action, r.id, "Sandbox payment order created");
      return r;
    });
  }
  if (action === "payment.demo") {
    insist(
      demo,
      "PERMISSION_DENIED",
      "Simulation is disabled in production.",
      403,
    );
    const d = z.object({ id }).parse(raw);
    const { db } = await import("../lib/db");
    const p = await db();
    const order = await p.paymentOrder.findUniqueOrThrow({
      where: { id: d.id },
    });
    const a = await p.agreement.findUniqueOrThrow({
      where: { id: order.agreementId },
    });
    insist(
      a.buyerId === u.id,
      "PERMISSION_DENIED",
      "Only the buyer can simulate their sandbox payment.",
      403,
    );
    return processPaymentEvent(
      {
        eventId: "mock-capture-" + order.id,
        orderId: order.id,
        kind: "captured",
        amountPaise: order.amountPaise.toString(),
        currency: "INR",
        mode: "sandbox",
      },
      true,
    );
  }
  return undefined;
}
export const paymentEventSchema = z.object({
  eventId: z.string().min(1).max(150),
  orderId: z.string().min(1).max(150),
  kind: z.enum(["authorised", "captured", "failed", "refunded"]),
  amountPaise: z.string().regex(/^\d+$/),
  currency: z.literal("INR"),
  mode: z.enum(["sandbox", "live"]),
});
export async function processPaymentEvent(raw: unknown, verified: boolean) {
  insist(verified, "INVALID_SIGNATURE", "Payment signature is invalid.", 401);
  const d = paymentEventSchema.parse(raw);
  return atomic(async (tx) => {
    const order = await tx.paymentOrder.findUniqueOrThrow({
      where: { id: d.orderId },
    });
    await lock(tx, "Agreement", order.agreementId);
    const fresh = await tx.paymentOrder.findUniqueOrThrow({
      where: { id: d.orderId },
    });
    insist(
      fresh.amountPaise === BigInt(d.amountPaise) &&
        fresh.currency === d.currency &&
        fresh.mode === d.mode,
      "PAYMENT_MISMATCH",
      "Payment does not match the linked order.",
    );
    const existing = await tx.providerEvent.findUnique({
      where: { id: d.eventId },
    });
    if (existing) {
      insist(
        existing.orderId === d.orderId && existing.kind === d.kind,
        "PAYMENT_MISMATCH",
        "Event identity mismatch.",
      );
      return { duplicate: true };
    }
    await tx.providerEvent.create({
      data: { id: d.eventId, orderId: order.id, kind: d.kind, verified: true },
    });
    if (
      d.kind === "captured" &&
      !["captured", "refunded"].includes(fresh.status)
    ) {
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: "captured" },
      });
      await tx.agreement.update({
        where: { id: order.agreementId },
        data: { payment: "captured" },
      });
      await tx.ledgerEntry.createMany({
        data: [
          {
            eventId: d.eventId,
            agreementId: order.agreementId,
            account: "gateway",
            amountPaise: order.amountPaise,
          },
          {
            eventId: d.eventId,
            agreementId: order.agreementId,
            account: "seller_payable",
            amountPaise: -order.amountPaise,
          },
        ],
      });
      const a = await tx.agreement.findUniqueOrThrow({
        where: { id: order.agreementId },
        include: { lot: true },
      });
      if (a.lot.circleId) {
        const cs = await tx.contribution.findMany({
          where: { circleId: a.lot.circleId, status: "accepted" },
        });
        const weights = new Map<string, bigint>();
        for (const c of cs)
          weights.set(
            c.farmerId,
            (weights.get(c.farmerId) || 0n) +
              kgToGrams(c.acceptedKg.toString()),
          );
        const costs = a.costPaise || 0n;
        insist(
          costs <= order.amountPaise,
          "INVALID_ALLOCATION",
          "Disclosed costs exceed sale proceeds.",
        );
        for (const share of allocate(
          order.amountPaise - costs,
          [...weights].map(([id, weight]) => ({ id, weight })),
        ))
          await tx.allocation.create({
            data: {
              agreementId: a.id,
              farmerId: share.id,
              amountPaise: share.amount,
            },
          });
      }
      await event(
        tx,
        "provider",
        "payment.captured",
        order.agreementId,
        "Sandbox payment captured; bank settlement remains pending",
        [a.sellerId, a.buyerId],
      );
    } else if (d.kind === "refunded") {
      insist(
        fresh.status === "captured",
        "PAYMENT_PENDING",
        "Refund requires reconciled capture.",
      );
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: "refunded" },
      });
      await tx.agreement.update({
        where: { id: order.agreementId },
        data: { payment: "refunded" },
      });
      await tx.ledgerEntry.createMany({
        data: [
          {
            eventId: d.eventId,
            agreementId: order.agreementId,
            account: "gateway",
            amountPaise: -order.amountPaise,
          },
          {
            eventId: d.eventId,
            agreementId: order.agreementId,
            account: "seller_payable",
            amountPaise: order.amountPaise,
          },
        ],
      });
      await tx.allocation.updateMany({
        where: { agreementId: order.agreementId },
        data: { status: "reversed" },
      });
    } else if (!["captured", "refunded"].includes(fresh.status)) {
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: d.kind },
      });
    }
    return { recorded: true };
  });
}
export function verifySignature(
  body: string,
  signature: string,
  secret: string,
) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  return timingSafeEqual(
    Buffer.from(createHmac("sha256", secret).update(body).digest("hex")),
    Buffer.from(signature),
  );
}

