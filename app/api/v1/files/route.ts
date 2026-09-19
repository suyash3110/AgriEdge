import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { validOrigin } from "@/lib/origin";
import { saveAttachment, readAttachment } from "@/modules/files";
import { DomainError, insist } from "@/lib/domain";
export async function POST(req: NextRequest) {
  try {
    insist(
      validOrigin(req.headers.get("origin")),
      "INVALID_ORIGIN",
      "Invalid origin.",
      403,
    );
    const u = await requireUser();
    const reader = req.body?.getReader();
    insist(reader, "INVALID_FILE", "Choose a file.");
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 5242880) {
        await reader.cancel();
        throw new DomainError("INVALID_FILE", "Maximum size is 5 MB.", 413);
      }
      chunks.push(value);
    }
    return Response.json({
      data: await saveAttachment(
        u,
        req.nextUrl.searchParams.get("contextId") || "",
        Buffer.concat(chunks),
        req.headers.get("content-type") || "",
      ),
    });
  } catch (e) {
    return Response.json(
      {
        error: {
          message:
            e instanceof DomainError ? e.message : "Unable to save evidence.",
        },
      },
      { status: e instanceof DomainError ? e.status : 400 },
    );
  }
}
export async function GET(req: NextRequest) {
  try {
    const { attachment: a, bytes } = await readAttachment(
      await requireUser(),
      req.nextUrl.searchParams.get("id") || "",
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": a.mime,
        "Content-Disposition": 'attachment; filename="evidence-' + a.id + '"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Evidence unavailable or access denied." },
      { status: 403 },
    );
  }
}
