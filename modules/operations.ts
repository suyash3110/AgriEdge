import { z } from "zod";
import type { User } from "@prisma/client";
import { atomic, event } from "../lib/db";
import { insist, kgToGrams, gramsToKg, canVerify, crops } from "../lib/domain";
import { approved, fpoAccess, lock } from "./trading";
const id = z.string().min(1).max(150),
  text = z.string().trim().min(3).max(1000);
const qty = z.string().refine((v) => {
  try {
    return kgToGrams(v) > 0n;
  } catch {
    return false;
  }
});
export async function operations(action: string, raw: unknown, u: User) {
  if (action === "verification.decide") {
    const d = z
      .object({
        id,
        decision: z.enum(["approved", "rejected", "revoked", "suspended"]),
        evidence: text,
      })
      .parse(raw);
    return atomic(async (tx) => {
      const subject = await tx.user.findUniqueOrThrow({ where: { id: d.id } });
      insist(
        canVerify(u, subject),
        "VERIFIER_NOT_ALLOWED",
        "You cannot verify this account.",
        403,
      );
      if (u.role === "fpo")
        insist(
          subject.fpoId === u.fpoId,
          "PERMISSION_DENIED",
          "Only consented FPO members may be reviewed here.",
          403,
        );
      if (["revoked", "suspended"].includes(d.decision)) approved(u, ["admin"]);
      const v = await tx.verification.create({
        data: {
          subjectId: d.id,
          issuerId: u.id,
          issuerRole: u.role,
          decision: d.decision,
          evidence: d.evidence,
        },
      });
      await tx.user.update({
        where: { id: d.id },
        data:
          d.decision === "suspended"
            ? { suspended: true }
            : { status: d.decision },
      });
      await event(
        tx,
        u.id,
        action,
        d.id,
        "Verification " + d.decision + " by " + u.role,
        [d.id],
      );
      return v;
    });
  }
  if (action === "profile.update") {
    const d = z
      .object({
        name: text,
        village: text,
        language: z.enum(["en", "hi", "mr"]),
        crops: z.array(z.enum(crops)).max(10),
      })
      .parse(raw);
    return atomic(async (tx) => {
      const r = await tx.user.update({ where: { id: u.id }, data: d });
      await event(tx, u.id, action, u.id, "Profile updated");
      return r;
    });
  }
  if (action === "circle.create") {
    approved(u, ["fpo"]);
    insist(
      u.permissions.includes("manage"),
      "PERMISSION_DENIED",
      "FPO manager permission is required.",
      403,
    );
    const d = z
      .object({
        demandId: id,
        name: text,
        targetKg: qty,
        minimumKg: qty,
        hub: text,
        deadline: z.iso.date(),
      })
      .parse(raw);
    return atomic(async (tx) => {
      const demand = await tx.demand.findUniqueOrThrow({
        where: { id: d.demandId },
      });
      insist(
        kgToGrams(d.minimumKg) <= kgToGrams(d.targetKg) &&
          new Date(d.deadline) > new Date(),
        "INVALID_CIRCLE",
        "Check target and deadline.",
      );
      const r = await tx.circle.create({
        data: {
          ...d,
          deadline: new Date(d.deadline),
          fpoId: u.fpoId!,
          crop: demand.crop,
          grade: demand.grade,
        },
      });
      await event(tx, u.id, action, r.id, "Harvest Circle opened");
      return r;
    });
  }
  if (action === "circle.join") {
    approved(u, ["farmer"]);
    const d = z
      .object({ circleId: id, lotId: id, kg: qty, consent: z.literal(true) })
      .parse(raw);
    return atomic(async (tx) => {
      await lock(tx, "Circle", d.circleId);
      await lock(tx, "Lot", d.lotId);
      const c = await tx.circle.findUniqueOrThrow({
          where: { id: d.circleId },
        }),
        lot = await tx.lot.findUniqueOrThrow({ where: { id: d.lotId } });
      insist(
        ["forming", "target_pledged", "collecting"].includes(c.status) &&
          c.deadline > new Date(),
        "CIRCLE_CLOSED",
        "This circle is no longer accepting contributions.",
      );
      insist(
        lot.ownerId === u.id &&
          lot.crop === c.crop &&
          lot.category === "produce" &&
          lot.status === "open",
        "INVALID_CONTRIBUTION",
        "Choose your own compatible open produce lot.",
      );
      insist(
        kgToGrams(lot.kg.toString()) -
          BigInt(lot.reservedKg.mul(1000).toFixed(0)) >=
          kgToGrams(d.kg),
        "QUANTITY_RESERVED",
        "Insufficient available stock.",
      );
      const r = await tx.contribution.create({
        data: {
          circleId: c.id,
          lotId: lot.id,
          farmerId: u.id,
          pledgedKg: d.kg,
          consent: true,
        },
      });
      await tx.lot.update({
        where: { id: lot.id },
        data: { reservedKg: { increment: d.kg } },
      });
      const all = await tx.contribution.findMany({
        where: { circleId: c.id, status: { not: "withdrawn" } },
      });
      if (
        c.status !== "collecting" &&
        all.reduce((s, x) => s + kgToGrams(x.pledgedKg.toString()), 0n) >=
          kgToGrams(c.targetKg.toString())
      )
        await tx.circle.update({
          where: { id: c.id },
          data: { status: "target_pledged" },
        });
      await event(
        tx,
        u.id,
        action,
        r.id,
        "Contribution reserved with member consent",
        [c.fpoId, u.id],
      );
      return r;
    });
  }
  if (action === "circle.requestLots") {
    approved(u, ["buyer", "fpo"]);
    const d = z.object({
      demandId: id,
      lotIds: z.array(id).min(2).max(20),
      name: text,
      minimumKg: qty,
      hub: text,
      deadline: z.iso.date(),
    }).parse(raw);
    return atomic(async (tx) => {
      const demand = await tx.demand.findUniqueOrThrow({ where: { id: d.demandId } });
      if (u.role === "buyer") insist(demand.buyerId === u.id, "PERMISSION_DENIED", "Choose one of your buyer demands.", 403);
      const lots = await tx.lot.findMany({ where: { id: { in: d.lotIds } } });
      insist(lots.length === d.lotIds.length && lots.every((lot) => lot.status === "open" && lot.category === "produce" && lot.crop === demand.crop && lot.fpoId), "INVALID_CONTRIBUTION", "Choose compatible open produce lots for the demand.");
      const fpoId = lots[0].fpoId!;
      insist(lots.every((lot) => lot.fpoId === fpoId), "INVALID_CIRCLE", "Selected lots must belong to the same FPO.");
      if (u.role === "fpo") fpoAccess(u, fpoId, "manage");
      const targetKg = lots.reduce((sum, lot) => sum + Number(lot.kg) - Number(lot.reservedKg), 0);
      insist(targetKg > 0 && kgToGrams(d.minimumKg) <= kgToGrams(String(targetKg)) && new Date(d.deadline) > new Date(), "INVALID_CIRCLE", "Check selected quantity, minimum and deadline.");
      const circle = await tx.circle.create({ data: { demandId: demand.id, name: d.name, crop: demand.crop, grade: demand.grade, targetKg: String(targetKg), minimumKg: d.minimumKg, hub: d.hub, deadline: new Date(d.deadline), fpoId } });
      for (const lot of lots) {
        await tx.contribution.create({ data: { circleId: circle.id, farmerId: lot.ownerId, lotId: lot.id, pledgedKg: String(Number(lot.kg) - Number(lot.reservedKg)), consent: false, status: "requested" } });
        await event(tx, u.id, action, circle.id, "Harvest Circle participation requested", [lot.ownerId]);
      }
      return circle;
    });
  }
  if (action === "contribution.respond") {
    approved(u, ["farmer"]);
    const d = z.object({ id, decision: z.enum(["accepted", "rejected"]) }).parse(raw);
    return atomic(async (tx) => {
      const item = await tx.contribution.findUniqueOrThrow({ where: { id: d.id } });
      insist(item.farmerId === u.id && item.status === "requested", "PERMISSION_DENIED", "This request is unavailable.", 403);
      if (d.decision === "accepted") {
        await lock(tx, "Lot", item.lotId);
        const lot = await tx.lot.findUniqueOrThrow({ where: { id: item.lotId } });
        insist(kgToGrams(lot.kg.toString()) - BigInt(lot.reservedKg.mul(1000).toFixed(0)) >= kgToGrams(item.pledgedKg.toString()), "QUANTITY_RESERVED", "This quantity is no longer available.");
        await tx.lot.update({ where: { id: lot.id }, data: { reservedKg: { increment: item.pledgedKg } } });
      }
      const result = await tx.contribution.update({ where: { id: item.id }, data: { status: d.decision === "accepted" ? "pledged" : "rejected", consent: d.decision === "accepted" } });
      const circle = await tx.circle.findUniqueOrThrow({ where: { id: item.circleId } });
      await event(tx, u.id, action, result.id, `Harvest Circle request ${d.decision}`, [circle.fpoId]);
      return result;
    });
  }
  if (action === "contribution.withdraw") {
    approved(u, ["farmer"]);
    const d = z.object({ id }).parse(raw);
    return atomic(async (tx) => {
      const item = await tx.contribution.findUniqueOrThrow({
        where: { id: d.id },
      });
      await lock(tx, "Circle", item.circleId);
      await lock(tx, "Lot", item.lotId);
      const c = await tx.circle.findUniqueOrThrow({
        where: { id: item.circleId },
      });
      const fresh = await tx.contribution.findUniqueOrThrow({
        where: { id: d.id },
      });
      insist(
        fresh.farmerId === u.id &&
          fresh.status === "pledged" &&
          c.deadline > new Date() &&
          ["forming", "target_pledged"].includes(c.status),
        "CONTRIBUTION_LOCKED",
        "Contribution can no longer be withdrawn.",
      );
      await tx.lot.update({
        where: { id: fresh.lotId },
        data: { reservedKg: { decrement: fresh.pledgedKg } },
      });
      await tx.circle.update({
        where: { id: c.id },
        data: { status: "forming" },
      });
      await tx.contribution.update({
        where: { id: d.id },
        data: { status: "withdrawn" },
      });
      await event(tx, u.id, action, d.id, "Contribution withdrawn");
      return { id: d.id };
    });
  }
  if (action === "circle.intake") {
    const d = z
      .object({ id, receivedKg: qty, acceptedKg: qty, grade: text })
      .parse(raw);
    return atomic(async (tx) => {
      const item = await tx.contribution.findUniqueOrThrow({
        where: { id: d.id },
      });
      await lock(tx, "Circle", item.circleId);
      await lock(tx, "Lot", item.lotId);
      const c = await tx.circle.findUniqueOrThrow({
        where: { id: item.circleId },
      });
      fpoAccess(u, c.fpoId, "collect");
      const fresh = await tx.contribution.findUniqueOrThrow({
        where: { id: d.id },
      });
      insist(
        fresh.status === "pledged" &&
          !["committed", "dispatched", "settled"].includes(c.status),
        "INTAKE_RECORDED",
        "This contribution was already handled.",
      );
      insist(
        kgToGrams(d.acceptedKg) <= kgToGrams(d.receivedKg) &&
          kgToGrams(d.receivedKg) <= kgToGrams(fresh.pledgedKg.toString()) &&
          d.grade === c.grade,
        "INVALID_INTAKE",
        "Accepted weight must fit received/pledged weight and the circle grade.",
      );
      await tx.lot.update({
        where: { id: item.lotId },
        data: {
          reservedKg: {
            decrement: gramsToKg(
              kgToGrams(item.pledgedKg.toString()) - kgToGrams(d.acceptedKg),
            ),
          },
        },
      });
      const r = await tx.contribution.update({
        where: { id: d.id },
        data: {
          receivedKg: d.receivedKg,
          acceptedKg: d.acceptedKg,
          grade: d.grade,
          status: "accepted",
        },
      });
      const all = await tx.contribution.findMany({
        where: { circleId: c.id, status: "accepted" },
      });
      const accepted = all.reduce(
        (s, x) => s + kgToGrams(x.acceptedKg.toString()),
        0n,
      );
      await tx.circle.update({
        where: { id: c.id },
        data: {
          status:
            accepted >= kgToGrams(c.targetKg.toString())
              ? "ready"
              : "collecting",
        },
      });
      await event(tx, u.id, action, d.id, "Actual intake weighed and graded", [
        item.farmerId,
      ]);
      return r;
    });
  }
  if (action === "circle.aggregate") {
    const d = z.object({ id, rate: z.string() }).parse(raw);
    return atomic(async (tx) => {
      await lock(tx, "Circle", d.id);
      const c = await tx.circle.findUniqueOrThrow({ where: { id: d.id } });
      fpoAccess(u, c.fpoId, "manage");
      insist(
        c.status === "ready",
        "CIRCLE_SHORTFALL",
        "Accepted stock must meet the target; shortfalls require a revised agreement.",
      );
      const items = await tx.contribution.findMany({
        where: { circleId: c.id, status: "accepted", consent: true },
      });
      const grams = items.reduce(
        (s, x) => s + kgToGrams(x.acceptedKg.toString()),
        0n,
      );
      const { rupeesToPaise } = await import("../lib/domain");
      const lot = await tx.lot.create({
        data: {
          ownerId: u.id,
          fpoId: c.fpoId,
          circleId: c.id,
          title: c.name + " · aggregate",
          crop: c.crop,
          kg: gramsToKg(grams),
          grade: c.grade,
          expectedRate: rupeesToPaise(d.rate),
          harvestDate: new Date(),
          availableDate: new Date(),
          deadline: new Date(Date.now() + 3 * 86400000),
          status: "open",
          location: c.hub,
        },
      });
      await tx.circle.update({
        where: { id: c.id },
        data: { status: "ready" },
      });
      await event(
        tx,
        u.id,
        action,
        lot.id,
        "Aggregate lot backed by accepted stock",
      );
      return lot;
    });
  }
  if (action === "booking.request") {
    approved(u, ["farmer"]);
    const d = z
      .object({
        warehouseId: id,
        crop: z.enum(crops),
        kg: qty,
        startDate: z.iso.date(),
        endDate: z.iso.date(),
      })
      .parse(raw);
    return atomic(async (tx) => {
      const w = await tx.warehouse.findUniqueOrThrow({
        where: { id: d.warehouseId },
      });
      insist(
        w.crops.includes(d.crop) &&
          d.startDate < d.endDate &&
          new Date(d.endDate) > new Date(),
        "INVALID_BOOKING",
        "Check crop suitability and storage dates.",
      );
      const r = await tx.booking.create({
        data: {
          ...d,
          farmerId: u.id,
          startDate: new Date(d.startDate),
          endDate: new Date(d.endDate),
        },
      });
      await event(
        tx,
        u.id,
        action,
        r.id,
        "Storage requested; space is not yet confirmed",
        [w.fpoId],
      );
      return r;
    });
  }
  if (
    action === "booking.confirm" ||
    action === "booking.reject" ||
    action === "booking.checkin" ||
    action === "booking.checkout"
  ) {
    const d = z.object({ id, reason: text }).parse(raw);
    return atomic(async (tx) => {
      const b = await tx.booking.findUniqueOrThrow({ where: { id: d.id } });
      await lock(tx, "Warehouse", b.warehouseId);
      const fresh = await tx.booking.findUniqueOrThrow({ where: { id: d.id } });
      const w = await tx.warehouse.findUniqueOrThrow({
        where: { id: b.warehouseId },
      });
      fpoAccess(u, w.fpoId, "warehouse");
      let status = "";
      if (action === "booking.confirm") {
        insist(
          fresh.status === "requested",
          "BOOKING_NOT_CONFIRMED",
          "Only a requested booking may be confirmed.",
        );
        const conflicts = await tx.booking.findMany({
          where: {
            warehouseId: w.id,
            status: { in: ["confirmed", "checked_in"] },
            startDate: { lt: b.endDate },
            endDate: { gt: b.startDate },
          },
        });
        const used = conflicts.reduce(
          (s, x) => s + kgToGrams(x.kg.toString()),
          0n,
        );
        insist(
          used + kgToGrams(b.kg.toString()) <=
            kgToGrams(w.capacityKg.toString()),
          "CAPACITY_EXCEEDED",
          "Overlapping bookings exceed facility capacity.",
        );
        status = "confirmed";
      }
      if (action === "booking.reject") {
        insist(
          fresh.status === "requested",
          "INVALID_STATE",
          "Only requested bookings can be rejected.",
        );
        status = "rejected";
      }
      if (action === "booking.checkin") {
        insist(
          fresh.status === "confirmed",
          "BOOKING_NOT_CONFIRMED",
          "Space must be confirmed before check-in.",
        );
        status = "checked_in";
      }
      if (action === "booking.checkout") {
        insist(
          fresh.status === "checked_in",
          "INVALID_STATE",
          "Stock must be checked in first.",
        );
        status = "checked_out";
      }
      const stock = await tx.stockMovement.findMany({
        where: { bookingId: b.id },
      });
      const balance = stock.reduce((sum, m) => sum.add(m.deltaKg), b.kg.mul(0));
      if (status === "checked_in" || status === "checked_out")
        await tx.stockMovement.create({
          data: {
            bookingId: b.id,
            farmerId: b.farmerId,
            fpoId: w.fpoId,
            deltaKg: status === "checked_in" ? b.kg : balance.negated(),
            reason: d.reason,
            actorId: u.id,
          },
        });
      const r = await tx.booking.update({
        where: { id: b.id },
        data: { status, reason: d.reason },
      });
      await event(tx, u.id, action, b.id, "Storage " + status, [b.farmerId]);
      return r;
    });
  }
  if (action === "quality.request") {
    approved(u, ["farmer", "fpo"]);
    const d = z.object({ lotId: id, reason: text }).parse(raw);
    return atomic(async (tx) => {
      const lot = await tx.lot.findUniqueOrThrow({ where: { id: d.lotId } });
      insist(
        lot.ownerId === u.id && lot.fpoId,
        "PERMISSION_DENIED",
        "Only the owner with an FPO relationship may request review.",
        403,
      );
      const r = await tx.quality.create({
        data: {
          lotId: lot.id,
          requesterId: u.id,
          fpoId: lot.fpoId,
          reason: d.reason,
        },
      });
      await event(tx, u.id, action, r.id, "Manual quality review requested", [
        lot.fpoId,
      ]);
      return r;
    });
  }
  if (action === "quality.review") {
    const d = z
      .object({
        id,
        grade: z.enum(["A", "B", "C"]),
        measurements: text,
        reason: text,
      })
      .parse(raw);
    return atomic(async (tx) => {
      const q = await tx.quality.findUniqueOrThrow({ where: { id: d.id } });
      fpoAccess(u, q.fpoId, "verify");
      await lock(tx, "Lot", q.lotId);
      const lot = await tx.lot.findUniqueOrThrow({ where: { id: q.lotId } });
      insist(
        ["draft", "open", "paused"].includes(lot.status) &&
          lot.reservedKg.isZero(),
        "QUANTITY_RESERVED",
        "A committed lot grade cannot be changed. Use the dispute process.",
      );
      insist(
        lot.ownerId !== u.id,
        "SELF_APPROVAL",
        "An independent FPO assessor must review this lot.",
        403,
      );
      await tx.lot.update({
        where: { id: lot.id },
        data: { grade: d.grade, gradeMethod: "fpo_verified" },
      });
      if (lot.grade === "A" && ["B", "C"].includes(d.grade)) {
        const owner = await tx.user.findUniqueOrThrow({ where: { id: lot.ownerId } });
        const delta = d.grade === "C" ? -15 : -8;
        const trustScore = Math.max(0, owner.trustScore + delta);
        await tx.user.update({ where: { id: owner.id }, data: { trustScore, ...(trustScore < 60 ? { status: "unverified" } : {}) } });
        await tx.trustEvent.create({ data: { userId: owner.id, actorId: u.id, delta, reason: "FPO inspection found the listed quality lower than declared", action: "quality.review" } });
      }
      if (lot.grade !== d.grade)
        await tx.bid.updateMany({
          where: { lotId: lot.id, status: "active" },
          data: { status: "withdrawn" },
        });
      const r = await tx.quality.create({
        data: {
          lotId: q.lotId,
          requesterId: q.requesterId,
          fpoId: q.fpoId,
          assessorId: u.id,
          grade: d.grade,
          measurements: d.measurements,
          reason: d.reason,
          method: "FPO manual verification",
        },
      });
      await event(
        tx,
        u.id,
        action,
        r.id,
        "FPO manual quality assessment recorded",
        [q.requesterId],
      );
      return r;
    });
  }
  return undefined;
}
