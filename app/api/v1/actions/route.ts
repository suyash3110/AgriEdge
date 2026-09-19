import { readJson } from "@/lib/http";
import { management } from "@/modules/management";
import { tolerance } from "@/modules/tolerance";
import { validOrigin } from "@/lib/origin";
import { mutationContext } from "@/lib/request-context";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DomainError, insist, jsonSafe } from "@/lib/domain";
import { trading } from "@/modules/trading";
import { operations } from "@/modules/operations";
import { fulfilment } from "@/modules/fulfilment";
import { community } from "@/modules/community";
import { importPrices } from "@/modules/markets";
import { z } from "zod";
import { Prisma } from "@prisma/client";
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    insist(
      validOrigin(req.headers.get("origin")),
      "INVALID_ORIGIN",
      "Request origin was rejected.",
      403,
    );
    insist(
      Number(req.headers.get("content-length") || 0) < 65536,
      "PAYLOAD_TOO_LARGE",
      "Request is too large.",
      413,
    );
    const u = await requireUser();
    const { action, payload } = z
      .object({ action: z.string().max(80), payload: z.unknown() })
      .parse(await readJson(req));
    const p = await db();
    const count = await p.auditEvent.count({
      where: { actorId: u.id, createdAt: { gt: new Date(Date.now() - 60000) } },
    });
    insist(count < 60, "RATE_LIMITED", "Please wait before trying again.", 429);
    let data: unknown;
    if (action === "prices.retry") {
      insist(
        u.role === "admin",
        "PERMISSION_DENIED",
        "Admin permission required.",
        403,
      );
      data = await importPrices();
    } else {
      for (const handler of [
        trading,
        operations,
        fulfilment,
        community,
        management,
        tolerance,
      ]) {
        const suppliedKey = req.headers.get("idempotency-key");
        if (suppliedKey && action !== "checkpoint.request") {
          insist(
            /^[a-zA-Z0-9-]{8,100}$/.test(suppliedKey),
            "INVALID_INPUT",
            "Invalid request key.",
          );
          data = await mutationContext.run(
            {
              key: u.id + ":" + action + ":" + suppliedKey,
              fingerprint: createHash("sha256")
                .update(JSON.stringify(payload))
                .digest("hex"),
            },
            () => handler(action, payload, u),
          );
        } else data = await handler(action, payload, u);
        if (data !== undefined) break;
      }
    }
    insist(
      data !== undefined,
      "UNKNOWN_ACTION",
      "This action is unavailable.",
      404,
    );
    return NextResponse.json(
      { data: jsonSafe(data), error: null, requestId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const known = e instanceof DomainError,
      validation = e instanceof z.ZodError,
      conflict =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2034"].includes(e.code);
    if (!known && !validation && !conflict)
      console.error(
        JSON.stringify({
          requestId,
          type: e instanceof Error ? e.name : "UnknownError",
        }),
      );
    return NextResponse.json(
      {
        data: null,
        error: {
          code: known
            ? e.code
            : conflict
              ? "CONFLICT"
              : validation
                ? "INVALID_INPUT"
                : "REQUEST_FAILED",
          message: known
            ? e.message
            : conflict
              ? "This record changed or already exists. Refresh and try again."
              : validation
                ? "Check the required fields and their formats."
                : "The request could not be completed. Your confirmed records are preserved.",
        },
        requestId,
      },
      { status: known ? e.status : conflict ? 409 : validation ? 400 : 500 },
    );
  }
}
