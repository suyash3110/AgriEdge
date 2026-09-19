import { marketObservations } from "@/lib/local-market-data";
export const dynamic = "force-dynamic";
export async function GET() {
  const rows = await marketObservations();
  return Response.json({ asOf: new Date().toISOString(), count: rows.length, rows }, { headers: { "Cache-Control": "no-store" } });
}
