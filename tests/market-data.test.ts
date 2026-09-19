import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseMandiCsv, latestMarkets } from "../lib/mandi-csv";
import { sellingGuidance } from "../lib/selling-guidance";
import { marketAnswer } from "../lib/market-answer";
const now = Date.parse("2026-09-15T12:00:00Z");
const header = " ,Market,State,District,Grade,Min Price,Max Price,Modal Price,Date,Source\n";
const line = (market: string, modal: string, date = "08-Sep-26", grade = "FAQ") => `Wheat,${market},Maharashtra,Nagpur,${grade},1000,9000,${modal},${date},data.gov.in\n`;
describe("local mandi prices", () => {
  it("reads the supplied blank crop header and dates without losing crops", () => {
    const rows = parseMandiCsv(readFileSync("data/mandi-prices.csv", "utf8"), now);
    expect(rows.length).toBeGreaterThan(450);
    expect(rows[0].observedDate).toBe("2026-09-08T00:00:00.000Z");
    expect(rows.some((r) => r.crop === "gram")).toBe(true);
    expect(rows.some((r) => r.modalPaise === "618000")).toBe(true);
  });
  it("rejects invalid, impossible, future and nonpositive observations", () => {
    for (const bad of [line("A", "0"), line("A", "3000", "31-Feb-26"), line("A", "3000", "01-Oct-26"), line("A", "9999")])
      expect(() => parseMandiCsv(header + bad, now)).toThrow();
    expect(() => parseMandiCsv("crop,price\nwheat,2000", now)).toThrow();
  });
  it("deduplicates crop/market/grade using the actual latest date", () => {
    const rows = parseMandiCsv(header + line("A", "2000", "01-Sep-26") + line("A", "2200") + line("A", "2500", "08-Sep-26", "Local"), now);
    expect(latestMarkets(rows)).toHaveLength(2);
    expect(latestMarkets(rows)[0].modalPaise).toBe("220000");
  });
  it("compares only the same date/grade and ranks net proceeds after per-market costs", () => {
    const rows = parseMandiCsv(header + line("A", "3000") + line("B", "2800") + line("C", "8000", "01-Sep-26") + line("D", "9000", "08-Sep-26", "Local"), now);
    const result = sellingGuidance(rows, "wheat", "FAQ", 500, { A: 2000, B: 500 }, now);
    expect(result.stale).toBe(true);
    expect(result.options.map((r) => r.market)).toEqual(["B", "A"]);
    expect(result.options[0].netPaise).toBe(1350000);
  });
  it("does not fabricate missing crop recommendations or accept invalid inputs", () => {
    expect(sellingGuidance([], "wheat", "FAQ", 100, {}, now).options).toEqual([]);
    expect(() => sellingGuidance([], "wheat", "FAQ", -1, {}, now)).toThrow();
    const rows = parseMandiCsv(header + line("A", "3000"), now);
    expect(() => sellingGuidance(rows, "wheat", "FAQ", 100, { A: -1 }, now)).toThrow();
  });
  it("answers crop prices locally in all languages with the original date", () => {
    const rows = parseMandiCsv(header + line("A", "3000"), now);
    expect(marketAnswer("wheat price", rows, "en", now)).toContain("older observations");
    expect(marketAnswer("गेहूँ का भाव", rows, "hi", now)).toContain("पुराने भाव");
    expect(marketAnswer("गहू विक्री दर", rows, "mr", now)).toContain("जुने भाव");
    expect(marketAnswer("tomato price", rows, "en", now)).toContain("Which crop");
    expect(marketAnswer("hello", rows, "en", now)).toBeNull();
  });
});
