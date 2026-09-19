export const roles = [
  "farmer",
  "fpo",
  "buyer",
  "transporter",
  "admin",
] as const;
export type Role = (typeof roles)[number];
export const crops = [
  "wheat",
  "paddy",
  "maize",
  "tomato",
  "onion",
  "potato",
  "mustard",
  "sorghum",
  "gram",
  "groundnut",
] as const;
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function insist(
  value: unknown,
  code: string,
  message: string,
  status = 400,
): asserts value {
  if (!value) throw new DomainError(code, message, status);
}
export function kgToGrams(value: string): bigint {
  insist(
    /^\d{1,12}(\.\d{1,3})?$/.test(value),
    "INVALID_QUANTITY",
    "Enter a positive quantity with up to three decimal places.",
  );
  const [a, b = ""] = value.split(".");
  const result = BigInt(a) * 1000n + BigInt(b.padEnd(3, "0"));
  insist(result > 0n, "INVALID_QUANTITY", "Quantity must be positive.");
  return result;
}
export function gramsToKg(value: bigint) {
  return (
    (value / 1000n).toString() +
    "." +
    (value % 1000n).toString().padStart(3, "0")
  );
}
export function rupeesToPaise(value: string): bigint {
  insist(
    /^\d{1,12}(\.\d{1,2})?$/.test(value),
    "INVALID_MONEY",
    "Enter an amount with up to two decimal places.",
  );
  const [a, b = ""] = value.split(".");
  return BigInt(a) * 100n + BigInt(b.padEnd(2, "0"));
}
export function totalPaise(kg: string, ratePerQuintal: bigint) {
  return (kgToGrams(kg) * ratePerQuintal + 50000n) / 100000n;
}
export function allocate(
  total: bigint,
  members: { id: string; weight: bigint }[],
) {
  const ordered = [...members].sort((a, b) => a.id.localeCompare(b.id));
  const sum = ordered.reduce((s, m) => s + m.weight, 0n);
  insist(
    total >= 0n && sum > 0n && ordered.every((m) => m.weight > 0n),
    "INVALID_ALLOCATION",
    "Positive accepted weights are required.",
  );
  const result = ordered.map((m) => ({
    id: m.id,
    amount: (total * m.weight) / sum,
  }));
  let residual = total - result.reduce((s, m) => s + m.amount, 0n);
  for (const m of result)
    if (residual > 0n) {
      m.amount++;
      residual--;
    }
  return result;
}
export function canVerify(
  issuer: {
    id: string;
    role: string;
    status: string;
    suspended: boolean;
    permissions: string[];
  },
  subject: { id: string; role: string },
) {
  if (
    issuer.id === subject.id ||
    issuer.suspended ||
    issuer.status !== "approved"
  )
    return false;
  const matrix: Record<string, string[]> = {
    admin: ["farmer", "fpo", "buyer", "transporter"],
    fpo: ["farmer", "buyer", "transporter"],
    farmer: ["transporter"],
    buyer: ["transporter"],
    transporter: [],
  };
  return (
    (matrix[issuer.role] || []).includes(subject.role) &&
    (issuer.role !== "fpo" || issuer.permissions.includes("verify"))
  );
}
export function safeSellingDates(input: {
  deadline?: Date;
  condition?: string;
  collectionHours: number;
  travelHours: number;
  dates: Date[];
}) {
  if (
    !input.deadline ||
    !input.condition ||
    input.collectionHours < 0 ||
    input.travelHours < 0
  )
    return { allowed: [], reason: "MISSING_CONDITIONS" };
  const allowed = input.dates.filter(
    (d) =>
      d.getTime() + (input.collectionHours + input.travelHours) * 3600000 <=
      input.deadline!.getTime(),
  );
  return { allowed, reason: allowed.length ? "SAFE_WINDOW" : "SPOILAGE_GUARD" };
}
export const jsonSafe = (value: unknown): unknown =>
  JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
export function money(value: string | bigint | number | null | undefined) {
  return value == null
    ? "Unknown"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(Number(value) / 100);
}
