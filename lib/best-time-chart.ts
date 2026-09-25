import type { MarketObservation } from "./mandi-csv";

export interface MonthlyAverage {
  /** 0-based month index (0 = Jan, 11 = Dec) */
  month: number;
  /** Short month name */
  label: string;
  /** Average modal price in INR/quintal (from paise) */
  avgModal: number;
  /** Number of observations in this month */
  count: number;
  /** Whether this is the best (peak) month */
  isBest: boolean;
  /** Whether this is the worst (lowest) month */
  isWorst: boolean;
}

export interface BestTimeChartData {
  crop: string;
  variety: string;
  months: MonthlyAverage[];
  bestMonth: string;
  worstMonth: string;
  /** Summary text */
  summary: string;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Computes monthly average modal prices for a given crop+variety.
 * Groups all observations by calendar month and averages the modal price
 * to identify the best/worst months to sell.
 *
 * Prices in the CSV are stored as paise strings — we convert to INR for display.
 */
export function computeBestTimeChart(
  rows: MarketObservation[],
  crop: string,
  variety: string,
): BestTimeChartData {
  const matching = rows.filter(
    (r) =>
      r.crop.toLowerCase() === crop.toLowerCase() &&
      r.variety === variety &&
      Number(r.modalPaise) > 0 &&
      Number.isFinite(Date.parse(r.observedDate)),
  );

  if (matching.length === 0) {
    return {
      crop,
      variety,
      months: [],
      bestMonth: "—",
      worstMonth: "—",
      summary: `No historical data available for ${crop} (${variety}).`,
    };
  }

  // Group by calendar month
  const byMonth: Record<number, number[]> = {};
  for (const r of matching) {
    const d = new Date(r.observedDate);
    const m = d.getMonth();
    (byMonth[m] ??= []).push(Number(r.modalPaise) / 100); // paise → INR
  }

  const averages: MonthlyAverage[] = [];
  for (let m = 0; m < 12; m++) {
    const prices = byMonth[m];
    if (!prices || prices.length === 0) continue;
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    averages.push({
      month: m,
      label: MONTH_NAMES[m],
      avgModal: Math.round(avg),
      count: prices.length,
      isBest: false,
      isWorst: false,
    });
  }

  if (averages.length === 0) {
    return {
      crop,
      variety,
      months: [],
      bestMonth: "—",
      worstMonth: "—",
      summary: `No valid price observations for ${crop} (${variety}).`,
    };
  }

  // Find best and worst
  let bestIdx = 0;
  let worstIdx = 0;
  for (let i = 1; i < averages.length; i++) {
    if (averages[i].avgModal > averages[bestIdx].avgModal) bestIdx = i;
    if (averages[i].avgModal < averages[worstIdx].avgModal) worstIdx = i;
  }
  averages[bestIdx].isBest = true;
  averages[worstIdx].isWorst = true;

  return {
    crop,
    variety,
    months: averages,
    bestMonth: averages[bestIdx].label,
    worstMonth: averages[worstIdx].label,
    summary: `Based on ${matching.length} observations, ${crop} fetches the highest price around ${averages[bestIdx].label} (avg ₹${averages[bestIdx].avgModal}/q). Avoid selling in ${averages[worstIdx].label} (avg ₹${averages[worstIdx].avgModal}/q).`,
  };
}
