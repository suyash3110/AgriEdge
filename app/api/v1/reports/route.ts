import { csvCell } from "@/lib/csv";
import { requireUser } from "@/lib/auth";
import { portalData } from "@/lib/portal-data";
export async function GET() {
  try {
    const u = await requireUser();
    if (
      !["admin", "fpo"].includes(u.role) ||
      (u.role === "fpo" && !u.permissions.includes("accounts"))
    )
      return Response.json({ error: "Permission denied" }, { status: 403 });
    const d = await portalData(u);
    const rows = [
      [
        "Agreement",
        "Seller",
        "Buyer",
        "Quantity kg",
        "Gross paise",
        "Payment",
        "Settlement",
      ],
      ...d.agreements.map((a) => [
        a.id,
        a.sellerId,
        a.buyerId,
        a.kg,
        a.totalPaise,
        a.payment,
        a.settlement,
      ]),
    ];
    return new Response(
      "\ufeff" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="agriedge-transactions.csv"',
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
}
