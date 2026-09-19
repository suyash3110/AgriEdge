import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { readFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { mutationContext } from "./request-context";
import { insist, jsonSafe } from "./domain";
export type Tx = Prisma.TransactionClient;
const shared = globalThis as unknown as {
  agriDb?: Promise<PrismaClient>;
  agriPg?: PGlite;
};
export const demo = process.env.APP_ENV !== "production";
export async function db(): Promise<PrismaClient> {
  if (!shared.agriDb)
    shared.agriDb = (async () => {
      if (
        !demo &&
        (!process.env.DATABASE_URL ||
          !process.env.SESSION_SECRET ||
          process.env.OTP_PROVIDER === "mock" ||
          !process.env.OTP_PROVIDER ||
          process.env.PAYMENT_MODE !== "live")
      )
        throw new Error(
          "Production configuration incomplete; demo providers cannot process real transactions.",
        );
      if (process.env.DATABASE_URL)
        return new PrismaClient({
          adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
        });
      if (!demo) throw new Error("DATABASE_URL required");
      const databaseDirectory =
        process.env.DATABASE_DIR ||
        path.join(process.cwd(), "work", "database");
      await mkdir(databaseDirectory, { recursive: true });
      const pg = new PGlite(
        process.env.TEST_DATABASE === "memory" ? undefined : databaseDirectory,
      );
      shared.agriPg = pg;
      await pg.waitReady;
      await pg.exec(
        'CREATE TABLE IF NOT EXISTS "_AgriDemoMigration" (name TEXT PRIMARY KEY)',
      );
      const migrations = (
        await readdir(path.join(process.cwd(), "prisma", "migrations"), {
          withFileTypes: true,
        })
      )
        .filter((x) => x.isDirectory())
        .map((x) => x.name)
        .sort();
      for (const migration of migrations) {
        const done = await pg.query(
          'SELECT name FROM "_AgriDemoMigration" WHERE name=$1',
          [migration],
        );
        if (done.rows.length) continue;
        const exists = await pg.query<{ exists: boolean }>(
          `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='User') AS exists`,
        );
        await pg.transaction(async (t) => {
          if (!(migration === "202609060001_initial" && exists.rows[0].exists))
            await t.exec(
              await readFile(
                path.join(
                  process.cwd(),
                  "prisma",
                  "migrations",
                  migration,
                  "migration.sql",
                ),
                "utf8",
              ),
            );
          await t.query('INSERT INTO "_AgriDemoMigration" (name) VALUES ($1)', [
            migration,
          ]);
        });
      }
      return new PrismaClient({ adapter: new PrismaPGlite(pg) });
    })();
  return shared.agriDb;
}
export async function closeDb() {
  if (shared.agriDb) await (await shared.agriDb).$disconnect();
  if (shared.agriPg) await shared.agriPg.close();
  shared.agriDb = undefined;
  shared.agriPg = undefined;
}
export async function atomic<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
  const p = await db();
  for (let i = 0; i < 3; i++) {
    try {
      return await p.$transaction(
        async (tx) => {
          const context = mutationContext.getStore();
          if (context) {
            await tx.$queryRaw`SELECT TRUE AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${context.key})::bigint)) AS request_lock`;
            const prior = await tx.idempotency.findUnique({
              where: { id: context.key },
            });
            if (prior) {
              const stored = prior.result as {
                fingerprint: string;
                value: unknown;
              };
              insist(
                stored.fingerprint === context.fingerprint,
                "IDEMPOTENCY_CONFLICT",
                "This request key was already used with different input.",
                409,
              );
              return stored.value as T;
            }
          }
          const result = await work(tx);
          if (context)
            await tx.idempotency.create({
              data: {
                id: context.key,
                result: {
                  fingerprint: context.fingerprint,
                  value: jsonSafe(result),
                } as Prisma.InputJsonValue,
              },
            });
          return result;
        },
        { isolationLevel: "Serializable", timeout: 15000 },
      );
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2034" &&
        i < 2
      )
        continue;
      throw e;
    }
  }
  throw new Error("Transaction retry exhausted");
}
export async function event(
  tx: Tx,
  actorId: string,
  action: string,
  subjectId: string,
  detail: string,
  recipients: string[] = [],
) {
  await tx.auditEvent.create({ data: { actorId, action, subjectId, detail } });
  await tx.outbox.create({
    data: { type: action, payload: { subjectId, detail, recipients } },
  });
  for (const userId of [...new Set(recipients)])
    await tx.notification.create({
      data: {
        userId,
        title: detail,
        href:
          action.startsWith("bid") || action.startsWith("lot")
            ? "lots"
            : action.startsWith("circle") || action.startsWith("contribution")
              ? "circles"
              : action.startsWith("booking")
                ? "warehouse"
                : action.startsWith("quality")
                  ? "quality"
                  : action.startsWith("message")
                    ? "messages"
                    : action.startsWith("transport") ||
                        action.startsWith("checkpoint")
                      ? "transport"
                      : "transactions",
      },
    });
}
