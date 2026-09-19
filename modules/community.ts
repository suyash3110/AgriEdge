import { z } from "zod";
import type { User } from "@prisma/client";
import { atomic, event } from "../lib/db";
import { insist } from "../lib/domain";
import { approved } from "./trading";
const id = z.string().min(1).max(150),
  text = z.string().trim().min(1).max(2000);
export async function community(action: string, raw: unknown, u: User) {
  if (action === "thread.create") {
    const d = z.object({ lotId: id }).parse(raw);
    approved(u, ["buyer"]);
    return atomic(async (tx) => {
      const lot = await tx.lot.findUniqueOrThrow({ where: { id: d.lotId } });
      insist(
        lot.status === "open",
        "BID_ROUND_CLOSED",
        "Enquiries require an open listing.",
      );
      const existing = await tx.thread.findFirst({
        where: { contextId: lot.id, memberIds: { has: u.id } },
      });
      if (existing) return existing;
      return tx.thread.create({
        data: {
          title: lot.title + " enquiry",
          contextId: lot.id,
          memberIds: [u.id, lot.ownerId],
        },
      });
    });
  }
  if (action === "message.send") {
    const d = z.object({ threadId: id, body: text }).parse(raw);
    return atomic(async (tx) => {
      const t = await tx.thread.findUniqueOrThrow({
        where: { id: d.threadId },
      });
      insist(
        t.memberIds.includes(u.id) && !t.blockedIds.length,
        "PERMISSION_DENIED",
        "Thread is private or blocked.",
        403,
      );
      const r = await tx.message.create({
        data: { threadId: t.id, senderId: u.id, body: d.body },
      });
      await event(
        tx,
        u.id,
        action,
        r.id,
        "New message",
        t.memberIds.filter((x) => x !== u.id),
      );
      return r;
    });
  }
  if (action === "message.report") {
    const d = z.object({ id, reason: text }).parse(raw);
    return atomic(async (tx) => {
      const m = await tx.message.findUniqueOrThrow({ where: { id: d.id } }),
        t = await tx.thread.findUniqueOrThrow({ where: { id: m.threadId } });
      insist(
        t.memberIds.includes(u.id),
        "PERMISSION_DENIED",
        "This message is private.",
        403,
      );
      await tx.message.update({
        where: { id: m.id },
        data: { reported: true },
      });
      await event(tx, u.id, action, m.id, d.reason);
      return { reported: true };
    });
  }
  if (action === "message.read") {
    const d = z.object({ id }).parse(raw);
    return atomic(async (tx) => {
      const m = await tx.message.findUniqueOrThrow({ where: { id: d.id } });
      const t = await tx.thread.findUniqueOrThrow({ where: { id: m.threadId } });
      insist(t.memberIds.includes(u.id), "PERMISSION_DENIED", "This message is private.", 403);
      insist(m.senderId !== u.id, "INVALID_STATE", "Sent messages are already read by you.");
      return tx.message.update({ where: { id: m.id }, data: { readAt: new Date() } });
    });
  }
  if (action === "thread.block") {
    const d = z.object({ id }).parse(raw);
    return atomic(async (tx) => {
      const t = await tx.thread.findUniqueOrThrow({ where: { id: d.id } });
      insist(
        t.memberIds.includes(u.id),
        "PERMISSION_DENIED",
        "This thread is private.",
        403,
      );
      return tx.thread.update({
        where: { id: t.id },
        data: { blockedIds: { set: [...new Set([...t.blockedIds, u.id])] } },
      });
    });
  }
  if (action === "notification.read") {
    const d = z.object({ id }).parse(raw);
    return atomic(async (tx) => {
      const n = await tx.notification.findUniqueOrThrow({
        where: { id: d.id },
      });
      insist(
        n.userId === u.id,
        "PERMISSION_DENIED",
        "This notification is private.",
        403,
      );
      return tx.notification.update({
        where: { id: n.id },
        data: { read: true },
      });
    });
  }
  if (action === "dispute.open") {
    const d = z
      .object({ agreementId: id, category: text, explanation: text })
      .parse(raw);
    return atomic(async (tx) => {
      const a = await tx.agreement.findUniqueOrThrow({
        where: { id: d.agreementId },
      });
      insist(
        [a.sellerId, a.buyerId].includes(u.id),
        "PERMISSION_DENIED",
        "Only transaction parties can open a dispute.",
        403,
      );
      const r = await tx.dispute.create({ data: { ...d, openedBy: u.id } });
      await event(tx, u.id, action, r.id, "Dispute opened: " + d.category, [
        a.sellerId,
        a.buyerId,
      ]);
      return r;
    });
  }
  if (action === "dispute.resolve") {
    approved(u, ["admin"]);
    const d = z.object({ id, outcome: text }).parse(raw);
    return atomic(async (tx) => {
      const r = await tx.dispute.update({
        where: { id: d.id },
        data: { status: "resolved", outcome: d.outcome },
      });
      await event(tx, u.id, action, r.id, d.outcome);
      return r;
    });
  }
  return undefined;
}
