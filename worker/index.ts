import { db, closeDb } from "../lib/db";
import { importPrices } from "../modules/markets";
if (!process.env.DATABASE_URL)
  throw new Error(
    "The independent worker requires DATABASE_URL. Embedded demo uses web notifications and operator CSV retry.",
  );
let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});
const p = await db();
let lastImport = 0;
while (!stopping) {
  if (process.env.PRICE_CSV_URI && Date.now() - lastImport > 15 * 60000) {
    try {
      await importPrices();
    } catch (e) {
      console.error(
        JSON.stringify({
          event: "csv_import_failed",
          type: e instanceof Error ? e.name : "UnknownError",
        }),
      );
    }
    lastImport = Date.now();
  }
  await p.$transaction(async (tx) => {
    const jobs = await tx.$queryRaw<
      { id: string; type: string }[]
    >`SELECT id,type FROM "Outbox" WHERE status='pending' AND "availableAt"<=NOW() ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 20`;
    for (const job of jobs) {
      await tx.outbox.update({
        where: { id: job.id },
        data: { status: "delivered", attempts: { increment: 1 } },
      });
    }
  });
  await new Promise((r) => setTimeout(r, 5000));
}
await closeDb();
