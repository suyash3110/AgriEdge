import { cookies } from "next/headers";
import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { db, demo, atomic } from "./db";
import { DomainError, insist } from "./domain";
import { seed } from "./seed";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export const hashSecret = hash;
export async function currentUser() {
  const token = (await cookies()).get("agri_session")?.value;
  if (!token) return null;
  const p = await db();
  const session = await p.session.findUnique({ where: { id: hash(token) } });
  if (!session || session.expiresAt < new Date()) return null;
  return p.user.findUnique({ where: { id: session.userId } });
}
export async function requireUser() {
  const u = await currentUser();
  insist(u, "UNAUTHENTICATED", "Please sign in.", 401);
  insist(
    !u.suspended,
    "ACCOUNT_SUSPENDED",
    "Your account is suspended. Contact support.",
    403,
  );
  return u;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const p = await db();
  await p.session.create({
    data: {
      id: hash(token),
      userId,
      expiresAt: new Date(Date.now() + 8 * 3600000),
    },
  });
  (await cookies()).set("agri_session", token, {
    httpOnly: true,
    secure: !demo,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 3600,
  });
}
export async function requestOtp(phone: string) {
  insist(
    /^[6-9]\d{9}$/.test(phone),
    "INVALID_PHONE",
    "Enter a valid 10-digit mobile number.",
  );
  const p = await db();
  if (demo) await seed(p);
  const recent = await p.challenge.count({
    where: {
      phone,
      purpose: "login",
      OR: [{ consumed: false }, { attempts: 0 }],
      createdAt: { gt: new Date(Date.now() - 15 * 60000) },
    },
  });
  insist(
    recent < 5,
    "RATE_LIMITED",
    "Please wait 15 minutes before requesting another OTP.",
    429,
  );
  insist(
    demo,
    "PROVIDER_UNAVAILABLE",
    "OTP provider has not been configured.",
    503,
  );
  const code = String(randomInt(100000, 1000000));
  const result = await atomic(async (tx) => {
    await tx.challenge.updateMany({
      where: { phone, purpose: "login", consumed: false },
      data: { consumed: true },
    });
    return tx.challenge.create({
      data: {
        phone,
        purpose: "login",
        hash: hash(code),
        expiresAt: new Date(Date.now() + 5 * 60000),
      },
    });
  });
  return {
    challengeId: result.id,
    demoCode: code,
    mode: "Fictional demo OTP inbox — no SMS sent",
  };
}
export async function verifyOtp(id: string, code: string) {
  const result = await atomic(async (tx) => {
    const c = await tx.challenge.findUnique({ where: { id } });
    if (
      !c ||
      c.purpose !== "login" ||
      c.consumed ||
      c.expiresAt < new Date() ||
      c.attempts >= 5
    )
      return null;
    await tx.challenge.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
    if (!timingSafeEqual(Buffer.from(c.hash), Buffer.from(hash(code))))
      return null;
    await tx.challenge.update({ where: { id }, data: { consumed: true } });
    return tx.user.upsert({
      where: { phone: c.phone },
      update: {},
      create: { phone: c.phone, name: "New farmer", role: "farmer" },
    });
  });
  if (!result)
    throw new DomainError(
      "OTP_INVALID",
      "OTP is invalid or expired. Request a new code.",
    );
  await createSession(result.id);
  return result;
}
