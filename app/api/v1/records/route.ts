import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { portalData } from "@/lib/portal-data";
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const data = await portalData(user);
    const resource = req.nextUrl.searchParams.get("resource");
    const allow: Record<string, unknown> = {
      transport: data.jobs,
      lots: data.lots,
      agreements: data.agreements,
      notifications: data.notifications,
    };
    if (!resource || !(resource in allow))
      return Response.json({ error: "Unknown resource" }, { status: 404 });
    return Response.json(
      { data: allow[resource] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
}
