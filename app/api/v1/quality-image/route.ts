import { db } from "@/lib/db";
import { crops } from "@/lib/domain";
import { createHash } from "node:crypto";
import { appearanceGrade } from "@/lib/quality-grade";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { validOrigin } from "@/lib/origin";
import { readJson } from "@/lib/http";
import { DomainError } from "@/lib/domain";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
export const runtime = "nodejs";
const execute = promisify(execFile);
let active = 0;
const schema = z.object({
  crop: z.enum([...crops, "rice"]),
  image: z.string().max(7_000_000),
  category: z.enum(["produce", "residue"]).default("produce"),
});
function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export async function POST(req: NextRequest) {
  let directory: string | undefined;
  let acquired = false;
  try {
    if (!validOrigin(req.headers.get("origin")))
      throw new DomainError("FORBIDDEN", "Invalid origin", 403);
    const user = await requireUser();
    const p = await db();
    if (
      (await p.imageAssessment.count({
        where: {
          ownerId: user.id,
          createdAt: { gt: new Date(Date.now() - 3600000) },
        },
      })) >= 30
    )
      throw new DomainError("BUSY", "Upload limit reached", 429);
    if (active >= 2)
      throw new DomainError(
        "BUSY",
        "Image checks are busy. Try again shortly.",
        429,
      );
    active++;
    acquired = true;
    const data = schema.parse(await readJson(req, 7_100_000));
    const match =
      /^data:image\/(?:jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
        data.image,
      );
    if (!match)
      throw new DomainError("INVALID_IMAGE", "Choose a JPEG or PNG image.");
    const bytes = Buffer.from(match[1], "base64");
    if (!bytes.length || bytes.length > 5 * 1024 * 1024)
      throw new DomainError("INVALID_IMAGE", "Maximum image size is 5 MB.");
    const python = process.env.ML_PYTHON;
    const root = process.env.ML_PROJECT_ROOT;
    if (!python || !root)
      throw new DomainError(
        "MODEL_UNAVAILABLE",
        "Image runtime is not configured.",
        503,
      );
    directory = await mkdtemp(path.join(tmpdir(), "agriedge-quality-"));
    const filename = path.join(directory, "upload.image");
    await writeFile(filename, bytes);
    const modelCrop = data.crop === "paddy" ? "rice" : data.crop;
    let output;
    try {
      output = await execute(
        python,
        [
          path.join(root, "ml", "predict_quality.py"),
          "--crop",
          ["tomato", "potato", "rice", "groundnut"].includes(modelCrop) &&
          data.category === "produce"
            ? modelCrop
            : "validate",
          "--image",
          filename,
          "--models-root",
          path.join(root, "work", "models"),
        ],
        { timeout: 60_000, maxBuffer: 128 * 1024, windowsHide: true },
      );
    } catch (error) {
      const details = String((error as { stderr?: string }).stderr || "");
      if (
        /UNSUPPORTED_IMAGE|cannot identify image|DecompressionBomb|IMAGE_TOO_LARGE/.test(
          details,
        )
      )
        throw new DomainError(
          "INVALID_IMAGE",
          "Choose a clear, valid crop image.",
        );
      throw new DomainError(
        "MODEL_UNAVAILABLE",
        "The model could not complete this check. Try again.",
        503,
      );
    }
    const result = JSON.parse(output.stdout);
    const grade =
      data.category === "produce"
        ? appearanceGrade(modelCrop, result.label)
        : null;
    const saved = await p.imageAssessment.create({
      data: {
        ownerId: user.id,
        crop: data.crop,
        category: data.category,
        grade,
        label: result.label || null,
        modelHash: result.artifact_sha256 || null,
        imageHash: createHash("sha256").update(bytes).digest("hex"),
        image: new Uint8Array(bytes),
        mime: bytes[0] === 137 ? "image/png" : "image/jpeg",
      },
    });
    return response({
      data: {
        ...result,
        crop: data.crop,
        grade,
        assessmentId: saved.id,
        gradeMethod: grade ? "ml_provisional" : "manual_pending",
        rubric: "AgriEdge appearance v1",
      },
    });
  } catch (error) {
    return response(
      {
        error: {
          code: error instanceof DomainError ? error.code : "INVALID_REQUEST",
        },
      },
      error instanceof DomainError ? error.status : 400,
    );
  } finally {
    if (acquired) active--;
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const p = await db();
    const id = req.nextUrl.searchParams.get("id") || "";
    const record = await p.imageAssessment.findUnique({ where: { id } });
    if (!record) throw new Error("Not found");
    const lot = record.lotId
      ? await p.lot.findUnique({ where: { id: record.lotId } })
      : null;
    const permitted =
      record.ownerId === user.id ||
      (user.role === "admin" && user.status === "approved") ||
      (lot &&
        user.status === "approved" &&
        ((user.role === "fpo" &&
          user.fpoId === lot.fpoId &&
          user.permissions.includes("verify")) ||
          (user.role === "buyer" && lot.status === "open")));
    if (!permitted) throw new Error("Forbidden");
    return new Response(new Uint8Array(record.image), {
      headers: {
        "Content-Type": record.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return response({ error: { code: "FORBIDDEN" } }, 403);
  }
}
