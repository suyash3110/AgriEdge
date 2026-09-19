import { test, expect } from "@playwright/test";

test("sign in, populated public prices, and scheme photographs", async ({ page }) => {
  await page.goto("/en");
  const prices = page.locator(".public-price-card");
  await expect(prices).toHaveCount(4);
  for (const card of await prices.all()) await expect(card.locator(".public-price")).toContainText("₹");
  for (const image of await page.locator(".scheme-card img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await prices.first().getByRole("link").click();
  await expect(page).toHaveURL(/\/en\/prices/);
  await expect(page.locator("tbody tr").first()).toBeVisible();
  expect(await page.locator("tbody tr").count()).toBeGreaterThan(4);
  await page.goto("/en/login");
  await page.getByLabel("Mobile number", { exact: true }).fill("9000000001");
  await page.getByRole("button", { name: "Get OTP", exact: true }).click();
  const inbox = page.getByText(/Demo OTP inbox:/);
  await expect(inbox).toBeVisible();
  const code = (await inbox.innerText()).match(/\d{6}/)![0];
  await page.getByLabel("One-time password").fill(code);
  await page.getByRole("button", { name: "Verify & sign in" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator(".account-info")).toContainText("Ram Prasad");
  await page.reload();
  await expect(page.locator(".account-info")).toContainText("Ram Prasad");
  await page.screenshot({ path: "work/final-signin.png", fullPage: true });
});
