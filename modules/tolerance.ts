import { z } from "zod";
import type { User } from "@prisma/client";
import { atomic, event } from "../lib/db";
import { insist, rupeesToPaise, totalPaise } from "../lib/domain";
import { lock, approved } from "./trading";

export async function tolerance(action: string, raw: unknown, user: User) {
  if (!["tolerance.propose", "tolerance.respond"].includes(action)) return undefined;
  approved(user, ["farmer", "buyer", "fpo"]);
  const d = z.object({ id: z.string().min(1), amount: z.string().optional(), reason: z.string().trim().min(3).max(500).optional(), decision: z.enum(["accepted", "rejected"]).optional() }).parse(raw);
  return atomic(async (tx) => {
    const proposal = action === "tolerance.respond" ? await tx.toleranceProposal.findUniqueOrThrow({ where: { id: d.id } }) : null;
    const agreementId = proposal?.agreementId || d.id;
    await lock(tx, "Agreement", agreementId);
    const agreement = await tx.agreement.findUniqueOrThrow({ where: { id: agreementId } });
    insist([agreement.sellerId, agreement.buyerId].includes(user.id), "PERMISSION_DENIED", "Only the buyer and seller can agree tolerance.", 403);
    insist(agreement.payment === "unpaid" && !(await tx.paymentOrder.findUnique({ where: { agreementId } })), "TERMS_LOCKED", "Tolerance cannot change after a payment order is created.");
    if (!proposal) {
      insist(d.amount !== undefined && d.reason, "INVALID_INPUT", "Enter the extra amount per quintal and the reason.");
      const amountPaise = rupeesToPaise(d.amount);
      insist(amountPaise >= 0n && amountPaise <= 10000000n, "INVALID_INPUT", "Tolerance must be between ₹0 and ₹100,000 per quintal.");
      await tx.toleranceProposal.updateMany({ where: { agreementId, status: "pending" }, data: { status: "superseded" } });
      const created = await tx.toleranceProposal.create({ data: { agreementId, proposerId: user.id, amountPaise, reason: d.reason } });
      await event(tx, user.id, action, agreementId, "Tolerance proposal awaiting the other party's agreement", [agreement.sellerId, agreement.buyerId].filter((id) => id !== user.id));
      return created;
    }
    const current = await tx.toleranceProposal.findUniqueOrThrow({ where: { id: proposal.id } });
    insist(current.status === "pending" && current.proposerId !== user.id, "PERMISSION_DENIED", "Only the other party can accept or reject a pending proposal.", 403);
    insist(d.decision, "INVALID_INPUT", "Choose accept or reject.");
    if (d.decision === "accepted") {
      const rate = agreement.rate - agreement.tolerancePaise + current.amountPaise;
      await tx.agreement.update({ where: { id: agreementId }, data: { tolerancePaise: current.amountPaise, rate, totalPaise: totalPaise(agreement.kg.toString(), rate) } });
    }
    const result = await tx.toleranceProposal.update({ where: { id: current.id }, data: { status: d.decision, decidedBy: user.id } });
    await event(tx, user.id, action, agreementId, `Tolerance proposal ${d.decision}`, [current.proposerId]);
    return result;
  });
}
