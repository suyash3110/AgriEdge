import { db } from "@/lib/db";
import { createHash } from "node:crypto";
import { readJson } from "@/lib/http";
import { validOrigin } from "@/lib/origin";
import { NextRequest, NextResponse } from "next/server";
import { requestOtp, verifyOtp } from "@/lib/auth";
import { z } from "zod";
import { DomainError, jsonSafe } from "@/lib/domain";
import { cookies } from "next/headers";
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (!validOrigin(origin))
      return NextResponse.json(
        { error: { message: "Invalid request origin" } },
        { status: 403 },
      );
    const d = z
      .object({
        action: z.enum(["request", "verify", "logout"]),
        phone: z.string().optional(),
        challengeId: z.string().optional(),
        code: z.string().optional(),
      })
      .parse(await readJson(req));
    if (d.action === "logout") {
      const token = (await cookies()).get("agri_session")?.value;
      if (token)
        await (
          await db()
        ).session.deleteMany({
          where: { id: createHash("sha256").update(token).digest("hex") },
        });
      (await cookies()).delete("agri_session");
      return NextResponse.json({ data: { ok: true } });
    }
    const data =
      d.action === "request"
        ? await requestOtp(d.phone || "")
        : await verifyOtp(d.challengeId || "", d.code || "");
    return NextResponse.json({ data: jsonSafe(data) });
  } catch (e) {
    return NextResponse.json(
      {
        error: {
          message:
            e instanceof DomainError
              ? e.message
              : "Unable to sign in. Check your details.",
          code: e instanceof DomainError ? e.code : "INVALID_REQUEST",
        },
      },
      { status: e instanceof DomainError ? e.status : 400 },
    );
  }
}
