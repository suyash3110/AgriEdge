import { describe, it, expect } from "vitest";
import {
  kgToGrams,
  gramsToKg,
  rupeesToPaise,
  totalPaise,
  allocate,
  canVerify,
  safeSellingDates,
} from "../lib/domain";
import { canonicalCrop } from "../modules/markets";
describe("exact quantities and money", () => {
  it("converts kg and rejects excess precision", () => {
    expect(kgToGrams("1.001")).toBe(1001n);
    expect(gramsToKg(1001n)).toBe("1.001");
    expect(() => kgToGrams("1.0001")).toThrow();
    expect(() => kgToGrams("-1")).toThrow();
  });
  it("rounds once at the gross amount boundary", () => {
    expect(rupeesToPaise("2450.01")).toBe(245001n);
    expect(totalPaise("1200", 245000n)).toBe(2940000n);
    expect(totalPaise("0.001", 100000n)).toBe(1n);
  });
  it("preserves residual paise deterministically", () => {
    expect(
      allocate(100n, [
        { id: "b", weight: 1n },
        { id: "a", weight: 1n },
        { id: "c", weight: 1n },
      ]),
    ).toEqual([
      { id: "a", amount: 34n },
      { id: "b", amount: 33n },
      { id: "c", amount: 33n },
    ]);
  });
  it("preserves paddy and canonical aliases", () => {
    expect(canonicalCrop("Chana")).toBe("gram");
    expect(canonicalCrop("jowar")).toBe("sorghum");
    expect(canonicalCrop("paddy")).toBe("paddy");
    expect(canonicalCrop("rice")).toBe("rice");
  });
});
describe("verification authority", () => {
  const roles = ["farmer", "fpo", "buyer", "transporter", "admin"];
  const allowed: Record<string, string[]> = {
    farmer: ["transporter"],
    buyer: ["transporter"],
    fpo: ["farmer", "buyer", "transporter"],
    transporter: [],
    admin: ["farmer", "fpo", "buyer", "transporter"],
  };
  for (const issuer of roles)
    for (const subject of roles)
      it(issuer + " → " + subject, () => {
        expect(
          canVerify(
            {
              id: "issuer",
              role: issuer,
              status: "approved",
              suspended: false,
              permissions: ["verify"],
            },
            { id: "subject", role: subject },
          ),
        ).toBe(allowed[issuer].includes(subject));
      });
  it("rejects self-approval, suspension, pending and staff without grant", () => {
    const u = {
      id: "a",
      role: "fpo",
      status: "approved",
      suspended: false,
      permissions: ["verify"],
    };
    expect(canVerify(u, { id: "a", role: "farmer" })).toBe(false);
    expect(
      canVerify({ ...u, suspended: true }, { id: "b", role: "farmer" }),
    ).toBe(false);
    expect(
      canVerify({ ...u, status: "pending" }, { id: "b", role: "farmer" }),
    ).toBe(false);
    expect(
      canVerify({ ...u, permissions: [] }, { id: "b", role: "farmer" }),
    ).toBe(false);
  });
});
describe("spoilage guard", () => {
  it("rejects tomato day-7 peak after day-3 usable deadline", () => {
    const r = safeSellingDates({
      deadline: new Date("2026-09-03T23:00Z"),
      condition: "measured acceptable",
      collectionHours: 6,
      travelHours: 8,
      dates: [new Date("2026-09-02"), new Date("2026-09-07")],
    });
    expect(r.allowed).toEqual([new Date("2026-09-02")]);
  });
  it("does not wait with unknown condition", () => {
    expect(
      safeSellingDates({
        deadline: new Date(),
        collectionHours: 0,
        travelHours: 0,
        dates: [new Date()],
      }).reason,
    ).toBe("MISSING_CONDITIONS");
  });
});
