import "server-only";
import { readFile, stat, mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { parseMandiCsv, latestMarkets, type MarketObservation } from "./mandi-csv";
import { livePrices } from "./live-prices";
import { db } from "./db";
let cached: { file: string; version: string; rows: MarketObservation[] } | undefined;
export async function localMarketHistory(): Promise<MarketObservation[]> {
  const root = process.env.ML_PROJECT_ROOT || process.cwd();
  const backup = path.join(root, "work", "last-good-mandi.csv");
  const files = [process.env.MANDI_CSV_PATH, path.join(root, "data", "mandi-prices.csv"), backup].filter(Boolean) as string[];
  for (const file of files) {
    try {
      const meta = await stat(file);
      if (meta.size > 10 * 1024 * 1024) continue;
      const version = `${meta.mtimeMs}:${meta.size}`;
      if (cached?.file === file && cached.version === version) return cached.rows;
      const text = await readFile(file, "utf8");
      const rows = parseMandiCsv(text);
      if (file !== backup) {
        try {
          await mkdir(path.dirname(backup), { recursive: true });
          const temp = backup + "." + process.pid + "." + Date.now() + ".tmp";
          await writeFile(temp, text); await rename(temp, backup);
        } catch { /* Read-only installations can still serve valid source data. */ }
      }
      cached = { file, version, rows }; return rows;
    } catch {
      // Retain the previously loaded version when a file is being replaced.
      if (cached?.file === file) return cached.rows;
    }
  }
  return cached?.rows || [];
}
export async function marketObservations(): Promise<MarketObservation[]> {
  const [local, live] = await Promise.all([localMarketHistory(), livePrices()]);
  const remote: MarketObservation[] = live.map((r, i) => ({ id: `grounded-${i}`, crop: r.crop, market: r.market,
    variety: "unspecified", observedDate: r.date, minPaise: null, modalPaise: r.modal, maxPaise: null, source: r.source, unit: "INR/quintal" }));
  if (local.length || remote.length) return latestMarkets([...remote, ...local]);
  const p = await db();
  const rows = await p.priceObservation.findMany({
    where: { district: { equals: "Nagpur", mode: "insensitive" }, NOT: { source: { contains: "fictional", mode: "insensitive" } } },
    orderBy: { observedDate: "desc" }, take: 2000,
  });
  return latestMarkets(rows.map((r) => ({ id: r.id, crop: r.crop, market: r.market, variety: r.variety,
    observedDate: r.observedDate.toISOString(), minPaise: r.minPaise?.toString() || null,
    modalPaise: r.modalPaise.toString(), maxPaise: r.maxPaise?.toString() || null, source: r.source, unit: r.unit })));
}
