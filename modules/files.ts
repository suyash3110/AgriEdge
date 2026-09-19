import type { User } from "@prisma/client";
import { db, demo } from "../lib/db";
import { insist } from "../lib/domain";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
export async function contextAccess(u: User, id: string) {
  const p = await db();
  const lot = await p.lot.findUnique({ where: { id } });
  if (lot)
    return (
      lot.ownerId === u.id ||
      (u.role === "fpo" &&
        u.fpoId === lot.fpoId &&
        u.permissions.includes("verify"))
    );
  const a = await p.agreement.findUnique({ where: { id } });
  if (a)
    return (
      [a.sellerId, a.buyerId].includes(u.id) ||
      !!(await p.transportJob.findFirst({
        where: { agreementId: id, transporterId: u.id },
      }))
    );
  return !!(await p.thread.findUnique({ where: { id } }))?.memberIds.includes(
    u.id,
  );
}
function storage() {
  insist(
    process.env.OBJECT_STORAGE_BUCKET &&
      process.env.OBJECT_STORAGE_ENDPOINT &&
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID &&
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    "STORAGE_UNAVAILABLE",
    "Private storage is not configured.",
    503,
  );
  return new S3Client({
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
    region: "auto",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    },
  });
}
export function detectMime(b: Buffer) {
  if (b.subarray(0, 3).equals(Buffer.from([255, 216, 255])))
    return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return "image/png";
  if (b.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  return null;
}
export async function saveAttachment(
  u: User,
  contextId: string,
  bytes: Buffer,
  type: string,
) {
  insist(
    await contextAccess(u, contextId),
    "PERMISSION_DENIED",
    "This record is private.",
    403,
  );
  insist(
    bytes.length > 0 && bytes.length <= 5242880,
    "INVALID_FILE",
    "Maximum size is 5 MB.",
  );
  const mime = detectMime(bytes);
  insist(
    mime && mime === type,
    "INVALID_FILE",
    "Only JPEG, PNG and PDF evidence is accepted.",
  );
  const p = await db();
  insist(
    (await p.attachment.count({
      where: {
        ownerId: u.id,
        createdAt: { gt: new Date(Date.now() - 3600000) },
      },
    })) < 30,
    "RATE_LIMITED",
    "Please wait before uploading more evidence.",
    429,
  );
  const key = crypto.randomUUID();
  if (demo) {
    await mkdir(process.env.PRIVATE_FILE_DIR || "work/private-files", { recursive: true });
    await writeFile(path.resolve(process.env.PRIVATE_FILE_DIR || "work/private-files", key), bytes, {
      flag: "wx",
    });
  } else
    await storage().send(
      new PutObjectCommand({
        Bucket: process.env.OBJECT_STORAGE_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: mime,
        ServerSideEncryption: "AES256",
      }),
    );
  const a = await p.attachment.create({
    data: { ownerId: u.id, contextId, key, mime, size: bytes.length },
  });
  return { id: a.id, mime, size: a.size };
}
export async function readAttachment(u: User, id: string) {
  const a = await (await db()).attachment.findUniqueOrThrow({ where: { id } });
  insist(
    await contextAccess(u, a.contextId),
    "PERMISSION_DENIED",
    "This evidence is private.",
    403,
  );
  const bytes = demo
    ? await readFile(/* turbopackIgnore: true */ path.resolve(process.env.PRIVATE_FILE_DIR || "work/private-files", a.key))
    : Buffer.from(
        await (
          await storage().send(
            new GetObjectCommand({
              Bucket: process.env.OBJECT_STORAGE_BUCKET,
              Key: a.key,
            }),
          )
        ).Body!.transformToByteArray(),
      );
  return { attachment: a, bytes };
}
