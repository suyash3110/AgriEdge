import { z } from "zod";
import type { User } from "@prisma/client";
import { atomic, event } from "../lib/db";
import { insist, crops, kgToGrams, rupeesToPaise } from "../lib/domain";
import { approved, fpoAccess, lock } from "./trading";
const id = z.string().min(1).max(150),
  text = z.string().trim().min(2).max(500);
export async function management(action: string, raw: unknown, u: User) {
  if (action === "trust.adjust") {
    approved(u, ["admin"]);
    const d = z.object({ id, delta: z.coerce.number().int().min(-50).max(25).refine((value) => value !== 0), reason: text }).parse(raw);
    return atomic(async (tx) => {
      const target = await tx.user.findUniqueOrThrow({ where: { id: d.id } });
      const trustScore = Math.max(0, Math.min(100, target.trustScore + d.delta));
      const result = await tx.user.update({ where: { id: target.id }, data: { trustScore, ...(trustScore < 60 ? { status: "unverified" } : {}) } });
      await tx.trustEvent.create({ data: { userId: target.id, actorId: u.id, delta: trustScore - target.trustScore, reason: d.reason, action } });
      await event(tx, u.id, action, target.id, `Trust score ${target.trustScore} → ${trustScore}: ${d.reason}`, [target.id]);
      return result;
    });
  }
  if (action === "profile.onboard") {
    insist(
      u.status === "pending",
      "PERMISSION_DENIED",
      "Verified roles cannot be changed here.",
      403,
    );
    const d = z
      .object({
        name: text,
        role: z.enum(["farmer", "fpo", "buyer", "transporter"]),
        village: text,
      })
      .parse(raw);
    return atomic(async (tx) => {
      const r = await tx.user.update({
        where: { id: u.id },
        data: { ...d, fpoId: d.role === "fpo" ? u.id : null, permissions: [] },
      });
      await event(tx, u.id, action, u.id, "Onboarding submitted");
      return r;
    });
  }
  if (action === "member.join") {
    approved(u, ["farmer"]);
    const d = z.object({ fpoId: id, consent: z.literal(true) }).parse(raw);
    return atomic(async (tx) => {
      const f = await tx.user.findUniqueOrThrow({ where: { id: d.fpoId } });
      approved(f, ["fpo"]);
      insist(
        !u.fpoId || u.fpoId === f.fpoId,
        "MEMBERSHIP_EXISTS",
        "Existing membership needs review before transfer.",
      );
      const r = await tx.user.update({
        where: { id: u.id },
        data: { fpoId: f.fpoId },
      });
      await event(tx, u.id, action, u.id, "Farmer consented to membership", [
        f.id,
      ]);
      return r;
    });
  }
  if (action === "staff.grant") {
    const d = z
      .object({
        id,
        permission: z.enum([
          "verify",
          "collect",
          "warehouse",
          "accounts",
          "manage",
        ]),
        reason: text,
      })
      .parse(raw);
    return atomic(async (tx) => {
      const target = await tx.user.findUniqueOrThrow({ where: { id: d.id } });
      approved(u, ["admin"]);
      insist(
        target.role === "fpo" && target.status === "approved",
        "INVALID_STAFF",
        "Choose approved FPO staff.",
      );
      const r = await tx.user.update({
        where: { id: target.id },
        data: {
          permissions: {
            set: [...new Set([...target.permissions, d.permission])],
          },
        },
      });
      await event(tx, u.id, action, target.id, d.reason);
      return r;
    });
  }
  if (action === "warehouse.create") {
    approved(u, ["fpo"]);
    insist(
      u.permissions.includes("warehouse"),
      "PERMISSION_DENIED",
      "Warehouse permission required.",
      403,
    );
    const d = z
      .object({
        name: text,
        address: text,
        type: text,
        capacityKg: z.string(),
        rate: z.string(),
        crop: z.enum(crops),
      })
      .parse(raw);
    kgToGrams(d.capacityKg);
    return atomic(async (tx) => {
      const r = await tx.warehouse.create({
        data: {
          name: d.name,
          address: d.address,
          type: d.type,
          capacityKg: d.capacityKg,
          ratePaise: rupeesToPaise(d.rate),
          crops: [d.crop],
          fpoId: u.fpoId!,
        },
      });
      await event(tx, u.id, action, r.id, "Warehouse listed");
      return r;
    });
  }
  if (action === "inventory.loss") {
    const d = z
      .object({ bookingId: id, kg: z.string(), reason: text })
      .parse(raw);
    const grams = kgToGrams(d.kg);
    return atomic(async (tx) => {
      const b = await tx.booking.findUniqueOrThrow({
        where: { id: d.bookingId },
      });
      await lock(tx, "Warehouse", b.warehouseId);
      const w = await tx.warehouse.findUniqueOrThrow({
        where: { id: b.warehouseId },
      });
      fpoAccess(u, w.fpoId, "warehouse");
      insist(
        b.status === "checked_in",
        "INVALID_STATE",
        "Loss requires checked-in stock.",
      );
      const ms = await tx.stockMovement.findMany({
        where: { bookingId: b.id },
      });
      const balance = ms.reduce(
        (s, m) => s + BigInt(m.deltaKg.mul(1000).toFixed(0)),
        0n,
      );
      insist(
        balance >= grams,
        "INSUFFICIENT_STOCK",
        "Loss exceeds physical stock.",
      );
      const r = await tx.stockMovement.create({
        data: {
          bookingId: b.id,
          farmerId: b.farmerId,
          fpoId: w.fpoId,
          deltaKg: "-" + d.kg,
          reason: d.reason,
          actorId: u.id,
        },
      });
      await event(tx, u.id, action, r.id, "Stock loss: " + d.reason, [
        b.farmerId,
      ]);
      return r;
    });
  }
  return undefined;
}
