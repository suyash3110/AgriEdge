import { marketObservations } from "./local-market-data";
export type PublicPrice = {
  crop: string; market: string; date: string; modal: string; change: string | null; source: string; variety?: string;
};
export async function allPublicPrices(): Promise<PublicPrice[]> {
  return (await marketObservations()).map((r) => ({ crop: r.crop, market: r.market, date: r.observedDate,
    modal: r.modalPaise, change: null, source: r.source, variety: r.variety }));
}
export async function publicPrices(): Promise<PublicPrice[]> {
  const rows = await allPublicPrices();
  return rows.filter((row, i) => rows.findIndex((r) => r.crop === row.crop) === i).slice(0, 4);
}
