import { z } from "zod";
import type { User } from "@prisma/client";
import { atomic, event, type Tx } from "../lib/db";
import {
  insist,
  crops,
  kgToGrams,
  rupeesToPaise,
  totalPaise,
} from "../lib/domain";
const text = z.string().trim().min(1).max(300),
  id = text;
const qty = z.string().refine((v) => {
  try {
    return kgToGrams(v) > 0n;
  } catch {
    return false;
  }
}, "Invalid quantity");
const cash = z.string().refine((v) => {
  try {
    return rupeesToPaise(v) > 0n;
  } catch {
    return false;
  }
}, "Invalid amount");
export const schemas = {
  "lot.create": z.object({
    title: text,
    crop: z.enum(crops),
    category: z.enum(["produce", "residue"]),
    kg: qty,
    rate: cash,
    grade: text.optional(),
    assessmentId: id,
    ownerId: id.optional(),
    location: text,
    harvestDate: z.iso.date(),
    availableDate: z.iso.date(),
    deadline: z.iso.date(),
    material: z.string().max(100).optional(),
    form: z.string().max(100).optional(),
    intendedUse: z.string().max(300).optional(),
    contamination: z.string().max(300).optional(),
  }),
  "lot.status": z.object({
    id,
    status: z.enum(["open", "paused", "withdrawn"]),
  }),
  "bid.create": z.object({
    lotId: id,
    rate: cash,
    cost: z.string().optional(),
    payer: z.enum(["seller", "buyer"]),
    arranger: z.enum(["seller", "buyer"]),
    terms: text,
  }),
  "bid.accept": z.object({ id }),
  "bid.withdraw": z.object({ id }),
  "demand.create": z.object({
    crop: z.enum(crops),
    category: z.enum(["produce", "residue"]),
    kg: qty,
    grade: text,
    location: text,
    deadline: z.iso.date(),
    terms: text,
  }),
};
export function approved(u: User, roles: string[]) {
  insist(
    roles.includes(u.role) && u.status === "approved" && !u.suspended,
    "PERMISSION_DENIED",
    "An active, verified account with the required role is needed.",
    403,
  );
}
export function fpoAccess(u: User, fpoId: string, permission: string) {
  approved(u, ["fpo"]);
  insist(
    u.fpoId === fpoId && u.permissions.includes(permission),
    "PERMISSION_DENIED",
    "Your FPO staff permission does not allow this action.",
    403,
  );
}
export async function lock(
  tx: Tx,
  table: "Lot" | "Warehouse" | "TransportJob" | "Circle" | "Agreement",
  id: string,
) {
  if (table === "Lot")
    await tx.$queryRaw`SELECT id FROM "Lot" WHERE id=${id} FOR UPDATE`;
  if (table === "Warehouse")
    await tx.$queryRaw`SELECT id FROM "Warehouse" WHERE id=${id} FOR UPDATE`;
  if (table === "TransportJob")
    await tx.$queryRaw`SELECT id FROM "TransportJob" WHERE id=${id} FOR UPDATE`;
  if (table === "Circle")
    await tx.$queryRaw`SELECT id FROM "Circle" WHERE id=${id} FOR UPDATE`;
  if (table === "Agreement")
    await tx.$queryRaw`SELECT id FROM "Agreement" WHERE id=${id} FOR UPDATE`;
}
export async function trading(action: string, raw: unknown, u: User) {
  if (action === "lot.create") {
    insist(
      ["farmer", "fpo"].includes(u.role) && !u.suspended,
      "PERMISSION_DENIED",
      "Only farmers and FPOs may create drafts.",
      403,
    );
    const parsed = schemas[action].parse(raw);
    const { rate, assessmentId, ownerId: requestedOwnerId, ...d } = parsed;
    insist(
      new Date(d.deadline) > new Date() &&
        d.availableDate <= d.deadline &&
        d.harvestDate <= d.availableDate,
      "INVALID_DATE",
      "Check harvest, availability and bidding dates.",
    );
    if (d.category === "residue")
      insist(
        d.material && d.form && d.intendedUse && d.contamination,
        "RESIDUE_DETAILS_REQUIRED",
        "Residue needs material, form, intended use and contamination information.",
      );
    return atomic(async (tx) => {
      const assessment = await tx.imageAssessment.findUnique({
        where: { id: assessmentId },
      });
      insist(
        assessment &&
          assessment.ownerId === u.id &&
          assessment.crop === d.crop &&
          assessment.category === d.category &&
          !assessment.lotId &&
          assessment.createdAt > new Date(Date.now() - 86400000),
        "QUALITY_IMAGE_REQUIRED",
        "Upload and assess a photo for this crop before saving the listing.",
      );
      let ownerId = u.id;
      if (u.role === "fpo") {
        insist(requestedOwnerId, "FARMER_REQUIRED", "Choose the farmer who owns this produce.");
        const member = await tx.user.findUniqueOrThrow({ where: { id: requestedOwnerId } });
        insist(member.role === "farmer" && member.fpoId === u.fpoId, "PERMISSION_DENIED", "Choose a farmer registered with your FPO.", 403);
        ownerId = member.id;
      }
      const directGrade = u.role === "fpo" && parsed.grade && ["A", "B", "C"].includes(parsed.grade) ? parsed.grade : null;
      const lot = await tx.lot.create({
        data: {
          ...d,
          grade: directGrade || assessment.grade || "Pending FPO review",
          gradeMethod: directGrade ? "fpo_verified" : assessment.grade ? "ml_provisional" : "manual_pending",
          imageAssessmentId: assessment.id,
          expectedRate: rupeesToPaise(rate),
          ownerId,
          fpoId: u.role === "fpo" ? u.fpoId : u.fpoId,
          harvestDate: new Date(d.harvestDate),
          availableDate: new Date(d.availableDate),
          deadline: new Date(d.deadline + "T23:59:59+05:30"),
        },
      });
      const claimed = await tx.imageAssessment.updateMany({
        where: { id: assessment.id, lotId: null },
        data: { lotId: lot.id },
      });
      insist(
        claimed.count === 1,
        "QUALITY_IMAGE_REQUIRED",
        "This assessment has already been used.",
      );
      if (!assessment.grade && lot.fpoId)
        await tx.quality.create({
          data: {
            lotId: lot.id,
            requesterId: ownerId,
            fpoId: lot.fpoId,
            reason:
              "Image received; supported automatic grade unavailable. Manual inspection required.",
          },
        });
      await event(
        tx,
        u.id,
        action,
        lot.id,
        "Listing draft created with photo assessment",
      );
      return lot;
    });
  }
  if (action === "lot.status") {
    const d = schemas[action].parse(raw);
    return atomic(async (tx) => {
      await lock(tx, "Lot", d.id);
      const lot = await tx.lot.findUniqueOrThrow({ where: { id: d.id } });
      approved(u, ["farmer", "fpo"]);
      if (lot.ownerId !== u.id) fpoAccess(u, lot.fpoId || "", "manage");
      insist(
        ["draft", "open", "paused"].includes(lot.status) &&
          lot.reservedKg.isZero(),
        "QUANTITY_RESERVED",
        "Committed or reserved stock cannot be changed.",
      );
      if (d.status === "open")
        insist(
          lot.deadline > new Date(),
          "BID_EXPIRED",
          "Set a future deadline before publishing.",
        );
      const result = await tx.lot.update({
        where: { id: d.id },
        data: { status: d.status },
      });
      await event(tx, u.id, action, d.id, "Listing " + d.status);
      return result;
    });
  }
  if (action === "bid.create") {
    approved(u, ["buyer"]);
    const d = schemas[action].parse(raw);
    return atomic(async (tx) => {
      await lock(tx, "Lot", d.lotId);
      const lot = await tx.lot.findUniqueOrThrow({ where: { id: d.lotId } });
      insist(
        lot.status === "open" && lot.deadline > new Date(),
        "BID_ROUND_CLOSED",
        "Bidding is closed.",
      );
      insist(
        lot.reservedKg.isZero(),
        "QUANTITY_RESERVED",
        "This lot has quantity reserved for collection.",
      );
      const eligible = await tx.user.findMany({
        where: { role: "buyer", status: "approved", suspended: false },
        select: { id: true },
      });
      const highest = await tx.bid.findFirst({
        where: {
          lotId: lot.id,
          status: "active",
          expiresAt: { gt: new Date() },
          buyerId: { in: eligible.map((x) => x.id) },
        },
        orderBy: { rate: "desc" },
      });
      const rate = rupeesToPaise(d.rate);
      insist(
        !highest || rate >= highest.rate + 100n,
        "BID_TOO_LOW",
        "Increase the highest active bid by at least ₹1 per quintal.",
      );
      const bid = await tx.bid.create({
        data: {
          lotId: lot.id,
          buyerId: u.id,
          rate,
          costPaise: d.cost ? rupeesToPaise(d.cost) : null,
          payer: d.payer,
          arranger: d.arranger,
          terms: d.terms,
          expiresAt: lot.deadline,
        },
      });
      await event(
        tx,
        u.id,
        action,
        bid.id,
        "A new competing bid was submitted",
        [lot.ownerId, ...(highest ? [highest.buyerId] : [])],
      );
      return bid;
    });
  }
  if (action === "bid.accept" || action === "bid.withdraw") {
    const d = schemas[action].parse(raw);
    return atomic(async (tx) => {
      const before = await tx.bid.findUniqueOrThrow({ where: { id: d.id } });
      await lock(tx, "Lot", before.lotId);
      const bid = await tx.bid.findUniqueOrThrow({ where: { id: d.id } });
      const lot = await tx.lot.findUniqueOrThrow({ where: { id: bid.lotId } });
      insist(
        bid.status === "active" && lot.status === "open",
        "BID_ROUND_CLOSED",
        "This bid or round is no longer active.",
      );
      insist(
        bid.expiresAt > new Date() && lot.deadline > new Date(),
        "BID_EXPIRED",
        "The offer has expired.",
      );
      if (action === "bid.withdraw") {
        approved(u, ["buyer"]);
        insist(
          bid.buyerId === u.id,
          "PERMISSION_DENIED",
          "Only the bidder can withdraw.",
          403,
        );
        const r = await tx.bid.update({
          where: { id: bid.id },
          data: { status: "withdrawn" },
        });
        await event(tx, u.id, action, bid.id, "Bid withdrawn", [lot.ownerId]);
        return r;
      }
      approved(u, ["farmer", "fpo"]);
      insist(
        lot.ownerId === u.id,
        "PERMISSION_DENIED",
        "Only the seller can accept.",
        403,
      );
      const buyer = await tx.user.findUniqueOrThrow({
        where: { id: bid.buyerId },
      });
      approved(buyer, ["buyer"]);
      insist(
        lot.reservedKg.isZero(),
        "QUANTITY_RESERVED",
        "This stock is already reserved.",
      );
      const agreement = await tx.agreement.create({
        data: {
          lotId: lot.id,
          bidId: bid.id,
          sellerId: u.id,
          buyerId: bid.buyerId,
          kg: lot.kg,
          rate: bid.rate,
          totalPaise: totalPaise(lot.kg.toString(), bid.rate),
          costPaise: bid.costPaise,
          payer: bid.payer,
          arranger: bid.arranger,
          terms: bid.terms,
        },
      });
      if (lot.circleId)
        await tx.circle.update({
          where: { id: lot.circleId },
          data: { status: "committed" },
        });
      await tx.lot.update({
        where: { id: lot.id },
        data: { status: "committed", reservedKg: lot.kg },
      });
      await tx.bid.updateMany({
        where: { lotId: lot.id, status: "active" },
        data: { status: "rejected" },
      });
      await tx.bid.update({
        where: { id: bid.id },
        data: { status: "accepted" },
      });
      await tx.transportJob.create({
        data: {
          agreementId: agreement.id,
          sellerId: u.id,
          buyerId: bid.buyerId,
          pickup: lot.location,
          destination: "Buyer collection point, Nagpur",
          kg: lot.kg,
          payer: bid.payer,
          arranger: bid.arranger,
        },
      });
      await tx.thread.create({
        data: {
          title: "Transaction " + lot.title,
          contextId: agreement.id,
          memberIds: [u.id, bid.buyerId],
        },
      });
      await event(
        tx,
        u.id,
        action,
        agreement.id,
        "Bid accepted; agreement and transport request created",
        [u.id, bid.buyerId],
      );
      return agreement;
    });
  }
  if (action === "demand.create") {
    approved(u, ["buyer"]);
    const d = schemas[action].parse(raw);
    insist(
      new Date(d.deadline) > new Date(),
      "INVALID_DATE",
      "Demand deadline must be in the future.",
    );
    return atomic(async (tx) => {
      const r = await tx.demand.create({
        data: { ...d, buyerId: u.id, deadline: new Date(d.deadline) },
      });
      await event(tx, u.id, action, r.id, "Buyer demand published");
      return r;
    });
  }
  return undefined;
}
