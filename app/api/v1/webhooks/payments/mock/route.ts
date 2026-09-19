import { demo } from "@/lib/db";
import { processPaymentEvent, verifySignature } from "@/modules/fulfilment";
export async function POST(req: Request) {
  const body = await req.text(),
    secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (
    !demo ||
    !secret ||
    !verifySignature(
      body,
      req.headers.get("x-agriedge-signature") || "",
      secret,
    )
  )
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  try {
    return Response.json(await processPaymentEvent(JSON.parse(body), true));
  } catch {
    return Response.json({ error: "Payment event rejected" }, { status: 400 });
  }
}
