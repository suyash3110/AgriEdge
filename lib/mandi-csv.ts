import { parse } from "csv-parse/sync";
export type MarketObservation = {
  id: string; crop: string; market: string; variety: string; observedDate: string;
  minPaise: string | null; modalPaise: string; maxPaise: string | null; source: string; unit: string;
};
const aliases: Record<string, string> = {
  "bengal gram(gram)(whole)": "gram", "paddy(dhan)(common)": "paddy", "jowar(sorghum)": "sorghum",
};
export function canonicalCrop(value: string) { const name = value.trim().toLowerCase(); return aliases[name] || name; }
function dateValue(value: string): string | null {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  let iso = value.trim();
  const match = /^(\d{1,2})-([a-z]{3})-(\d{2}|\d{4})$/i.exec(iso);
  if (match) {
    const month = months.indexOf(match[2].toLowerCase()) + 1;
    if (!month) return null;
    iso = `${match[3].length === 2 ? "20" + match[3] : match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(iso + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? date.toISOString() : null;
}
function paise(value: string): string | null {
  const v = value.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  const n = Math.round(Number(v) * 100);
  return n > 0 && n <= 100000000 ? String(n) : null;
}
export function parseMandiCsv(text: string, now = Date.now()): MarketObservation[] {
  const input: string[][] = parse(text, { bom: true, trim: true, skip_empty_lines: true, max_record_size: 10000 });
  if (input.length < 2) throw new Error("EMPTY_MANDI_CSV");
  const headers = input[0].map((v) => v.toLowerCase());
  for (const field of ["market", "district", "modal price", "date"])
    if (!headers.includes(field)) throw new Error("INVALID_MANDI_HEADERS");
  const cropIndex = headers.findIndex((v) => ["", "commodity", "crop"].includes(v));
  if (cropIndex < 0) throw new Error("MISSING_COMMODITY_COLUMN");
  const rows: MarketObservation[] = [];
  for (const [index, values] of input.slice(1).entries()) {
    const get = (name: string) => values[headers.indexOf(name)] || "";
    if (get("district").toLowerCase() !== "nagpur") continue;
    const crop = canonicalCrop(values[cropIndex] || ""), date = dateValue(get("date"));
    const modal = paise(get("modal price")), min = paise(get("min price")), max = paise(get("max price"));
    if (!crop || !get("market") || !date || new Date(date).getTime() > now || !modal ||
        (min !== null && Number(min) > Number(modal)) || (max !== null && Number(max) < Number(modal))) continue;
    rows.push({ id: `mandi-${index}`, crop, market: get("market"), variety: get("grade") || get("variety") || "unspecified",
      observedDate: date, minPaise: min, modalPaise: modal, maxPaise: max, unit: "INR/quintal",
      source: `${get("source") || "User-provided data"} · mandi-prices.csv` });
  }
  if (!rows.length) throw new Error("NO_VALID_NAGPUR_OBSERVATIONS");
  return rows.sort((a, b) => b.observedDate.localeCompare(a.observedDate));
}
export function latestMarkets(rows: MarketObservation[]) {
  const seen = new Set<string>();
  return [...rows].sort((a,b) => b.observedDate.localeCompare(a.observedDate)).filter((r) => {
    const key = [r.crop, r.market, r.variety].map((v) => v.toLowerCase()).join("|");
    if (seen.has(key)) return false; seen.add(key); return true;
  });
}
