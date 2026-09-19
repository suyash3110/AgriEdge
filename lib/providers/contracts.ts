export interface OtpProvider {
  send(input: {
    phone: string;
    code: string;
    purpose: "login" | "pickup" | "delivery";
  }): Promise<{ reference: string }>;
}
export interface GatewayOrder {
  id: string;
  amountPaise: string;
  currency: "INR";
  mode: "sandbox" | "live";
  checkoutUrl?: string;
}
export interface PaymentGateway {
  readonly name: string;
  readonly supportsRecipientSettlement: boolean;
  createOrder(input: {
    agreementId: string;
    amountPaise: string;
    currency: "INR";
    idempotencyKey: string;
  }): Promise<GatewayOrder>;
  fetchPayment(
    orderId: string,
  ): Promise<{ status: string; amountPaise: string; currency: "INR" }>;
  verifyWebhook(rawBody: Uint8Array, signature: string): Promise<boolean>;
  requestRefund(input: {
    orderId: string;
    amountPaise: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<{ reference: string }>;
  fetchSettlement(reference: string): Promise<{ status: string }>;
}
export interface ChatProvider {
  answer(input: {
    question: string;
    language: "en" | "hi";
    evidence: { text: string; source: string; date: string }[];
  }): Promise<{ text: string; sources: string[] }>;
}
export interface QualityProvider {
  assess(input: {
    bytes: Uint8Array;
    crop: string;
  }): Promise<{
    status: "supported" | "unsupported" | "retake";
    method: string;
    modelVersion?: string;
    limitations: string[];
  }>;
}
