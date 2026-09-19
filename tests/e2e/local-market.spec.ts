import { test, expect } from "@playwright/test";
test("local CSV prices, cost-aware selling guidance and local assistant", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await request.get("/api/v1/market-prices");
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.count).toBeGreaterThan(20);
  expect(data.rows.some((r: { source: string }) => r.source.includes("mandi-prices.csv"))).toBeTruthy();
  await page.goto("/en/prices");
  const panel = page.getByRole("region", { name: "Crop selling recommendations" });
  await panel.getByLabel("Crop", { exact: true }).selectOption("wheat");
  await panel.getByLabel("Quantity (kg)").fill("500");
  await expect(panel.getByText(/These prices are older/)).toBeVisible();
  const firstCost = panel.getByRole("spinbutton", { name: /^Total costs/ }).first();
  await firstCost.fill("50000");
  await expect(panel.locator("tbody")).toContainText("-");
  await expect(panel).not.toContainText("NaN");
  const base = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  const answer = await request.post("/api/v1/assistant", { headers: { origin: base }, data: { question: "What is the wheat selling price?", locale: "en", stream: false } });
  expect(answer.ok()).toBeTruthy();
  const result = await answer.json();
  expect(result.data.source).toBe("local_market_data");
  expect(result.data.answer).toContain("older observations");
  for (const [locale, title] of [["hi", "फसल बिक्री सुझाव"], ["mr", "पीक विक्री शिफारसी"]]) {
    await page.goto(`/${locale}/prices`);
    await expect(page.getByRole("region", { name: title })).toBeVisible();
  }
  expect(errors).toEqual([]);
  await page.screenshot({ path: "work/local-market-verified.png", fullPage: true });
});
