import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { geminiAnswer } from "./gemini";
import type { PublicPrice } from "./public-prices";
import { crops } from "./domain";

let pending: Promise<PublicPrice[]> | undefined;
let lastAttempt = 0;
const rowSchema = z.object({ crop: z.enum(crops), market: z.string().min(2).max(100), date: z.iso.date(), modal: z.number().positive().max(1000000), sourceUrl: z.url() });
const cachePath = () => path.join(process.env.ML_PROJECT_ROOT || process.cwd(), "work", "live-market-cache.json");
const fresh = (date: string) => { const age = Date.now() - new Date(date).getTime(); return age >= -86400000 && age <= 7 * 86400000; };

export async function livePrices(): Promise<PublicPrice[]> {
  let saved: { fetchedAt: number; rows: PublicPrice[] } = { fetchedAt: 0, rows: [] };
  try { saved = JSON.parse(await readFile(cachePath(), "utf8")); } catch {}
  if (Date.now() - saved.fetchedAt < 3600000) return saved.rows.filter((row) => fresh(row.date));
  if (!process.env.GEMINI_API_KEY || Date.now() - lastAttempt < 300000) return saved.rows.filter((row) => fresh(row.date));
  if (pending) return saved.rows.filter((row) => fresh(row.date));
  lastAttempt = Date.now();
  pending = (async () => {
    try {
      const result = await geminiAnswer(
        "You extract reported agricultural prices from web sources. Search Agmarknet, eNAM, Maharashtra market boards, or reporting sites citing these. Never estimate or invent a price or date. Only Nagpur district. Return a JSON array, no prose: [{crop,market,date,modal,sourceUrl}]. crop must be a canonical crop code. date is the actual observation YYYY-MM-DD, modal is INR per quintal, sourceUrl must be the exact URL of a grounded source. Return [] if no observations from the last 7 days exist. Do not substitute old data or predict prices.",
        `Today is ${new Date().toISOString().slice(0, 10)}. Search for latest reported Nagpur district mandi prices for ${crops.join(", ")}. Include actual observation dates and source URLs.`, [], true,
      );
      const parsed = z.array(rowSchema).max(100).parse(JSON.parse(result.answer.replace(/^```(?:json)?\s*|\s*```$/g, "")));
      const grounded = new Set(result.sources.map((source) => source.url));
      const rows: PublicPrice[] = parsed.filter((row) => fresh(row.date) && grounded.has(row.sourceUrl)).map((row) => ({ crop: row.crop, market: row.market, date: new Date(row.date).toISOString(), modal: String(Math.round(row.modal * 100)), change: null, source: row.sourceUrl }));
      if (rows.length) {
        await mkdir(path.dirname(cachePath()), { recursive: true });
        await writeFile(cachePath(), JSON.stringify({ fetchedAt: Date.now(), rows }));
        return rows;
      }
    } catch { /* Keep previously sourced, dated records during an outage. */ }
    return saved.rows.filter((row) => fresh(row.date));
  })().finally(() => { pending = undefined; });
  // Keep page loads responsive while the provider refreshes in the background.
  return saved.rows.filter((row) => fresh(row.date));
}
