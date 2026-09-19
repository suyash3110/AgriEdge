import { db } from "@/lib/db";
export async function GET() {
  try {
    await (
      await db()
    ).$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok", database: "ready" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
