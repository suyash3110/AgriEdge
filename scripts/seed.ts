import { db, demo, closeDb } from "../lib/db";
import { seed } from "../lib/seed";
import { importPrices } from "../modules/markets";
if (!demo) throw new Error("Fictional seed is disabled in production");
const p = await db();
await seed(p);
await importPrices();
console.log("Fictional demo seed and CSV ready");
await closeDb();
