import type { MarketObservation } from "./mandi-csv";
/** Compare like-for-like observations; never extrapolate a future selling price. */
export function sellingGuidance(rows: MarketObservation[], crop: string, variety: string,
  quantityKg: number, costs: Record<string, number> = {}, now = Date.now()) {
  if (!Number.isFinite(quantityKg) || quantityKg <= 0 || quantityKg > 100000000) throw new Error("INVALID_QUANTITY");
  const matches = rows.filter((r) => r.crop.toLowerCase() === crop.toLowerCase() && r.variety === variety &&
    Number.isFinite(Date.parse(r.observedDate)) && Date.parse(r.observedDate) <= now && Number(r.modalPaise) > 0);
  const latest = matches.map((r) => r.observedDate).sort().at(-1);
  if (!latest) return { date: null, stale: true, options: [] };
  const seen = new Set<string>();
  const options = matches.filter((r) => r.observedDate === latest).filter((r) => {
    if (seen.has(r.market)) return false; seen.add(r.market); return true;
  }).map((r) => {
    const cost = costs[r.market] ?? 0;
    if (!Number.isFinite(cost) || cost < 0 || cost > 1000000000) throw new Error("INVALID_COST");
    const grossPaise = Math.round(Number(r.modalPaise) * quantityKg / 100);
    return { ...r, grossPaise, costPaise: Math.round(cost * 100), netPaise: grossPaise - Math.round(cost * 100) };
  }).sort((a,b) => b.netPaise - a.netPaise);
  return { date: latest, stale: now - Date.parse(latest) > 2 * 86400000, options };
}
