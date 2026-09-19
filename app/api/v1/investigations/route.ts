import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { validOrigin } from "@/lib/origin";
import { atomic, event } from "@/lib/db";
import { z } from "zod";
export async function POST(req: NextRequest) {
  try {
    if (!validOrigin(req.headers.get("origin")))
      return Response.json({ error: "Invalid origin" }, { status: 403 });
    const u = await requireUser();
    if (u.role !== "admin" || u.status !== "approved")
      return Response.json(
        { error: "Admin permission required" },
        { status: 403 },
      );
    const d = z
      .object({ reason: z.string().trim().min(10).max(500) })
      .parse(await req.json());
    const data = await atomic(async (tx) => {
      await event(
        tx,
        u.id,
        "investigation.reported_messages",
        "reported",
        d.reason,
      );
      return tx.message.findMany({
        where: { reported: true },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          threadId: true,
          senderId: true,
          body: true,
          createdAt: true,
        },
      });
    });
    return Response.json(
      { data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "A review reason of at least 10 characters is required." },
      { status: 400 },
    );
  }
}
