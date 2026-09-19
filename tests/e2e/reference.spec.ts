import { uploadPhoto } from "./image-helper";
import { test, expect, type Page } from "@playwright/test";
async function signIn(page: Page, phone: string) {
  const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  const challenge = await page.request.post("/api/v1/auth", {
    headers: { origin },
    data: { action: "request", phone },
  });
  expect(challenge.ok()).toBeTruthy();
  const { data } = await challenge.json();
  const verify = await page.request.post("/api/v1/auth", {
    headers: { origin },
    data: {
      action: "verify",
      challengeId: data.challengeId,
      code: data.demoCode,
    },
  });
  expect(verify.ok()).toBeTruthy();
}
test("SIH landing order, scheme links and isolated login in three languages", async ({
  page,
}) => {
  for (const locale of ["en", "hi", "mr"]) {
    await page.goto("/" + locale);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    const hero = await page.locator(".farmer-hero").boundingBox(),
      prices = await page.locator("#market-prices").boundingBox(),
      schemes = await page.locator("#schemes").boundingBox();
    expect(hero!.y).toBeLessThan(prices!.y);
    expect(prices!.y).toBeLessThan(schemes!.y);
    await expect(page.locator(".public-price-card")).toHaveCount(4);
    await expect(page.locator(".scheme-card")).toHaveCount(8);
    for (const link of await page.locator(".scheme-card a").all()) {
      expect(await link.getAttribute("href")).toMatch(
        /^https:\/\/(pmkisan.gov.in|pmfby.gov.in|soilhealth.dac.gov.in|enam.gov.in|mnre.gov.in|mahadbt.maharashtra.gov.in)/,
      );
    }
    await expect(page.locator("footer")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(
      /hackathon|Rewa|cmhelpline\.mp/i,
    );
    await page.screenshot({
      path: `work/screenshots/landing-${locale}.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/" + locale + "/login");
    await expect(page.locator(".farmer-hero")).toHaveCount(0);
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `work/screenshots/login-${locale}-mobile.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 1366, height: 900 });
  }
});
test("five roles preserve their dashboard when switching into Marathi", async ({
  browser,
}) => {
  for (const [phone, role] of [
    ["9000000001", "farmer"],
    ["9000000003", "fpo"],
    ["9000000004", "buyer"],
    ["9000000006", "transporter"],
    ["9000000007", "admin"],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 360, height: 800 },
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await signIn(page, phone);
    await page.goto("/en/dashboard");
    await page
      .locator(".language-switch")
      .getByRole("link", { name: "मराठी", exact: true })
      .click();
    await expect(page).toHaveURL(/\/mr\/dashboard$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "mr");
    await expect(page.locator("h1")).not.toHaveText(/Dashboard|Overview/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.getByRole("button", { name: "☰ मेनू", exact: true }).click();
    await expect(page.locator(".sidebar nav")).toBeVisible();
    await page.screenshot({
      path: `work/screenshots/${role}-marathi-mobile.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
    await context.close();
  }
});
test("Marathi voice assistant uses mr-IN and recovers after denied speech", async ({
  page,
}) => {
  await page.addInitScript(() => {
    class MockRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult?: (e: unknown) => void;
      onerror?: (e: unknown) => void;
      onend?: () => void;
      start() {
        (window as unknown as { speechLanguage: string }).speechLanguage =
          this.lang;
        this.onerror?.({ error: "not-allowed" });
        this.onend?.();
      }
      abort() {
        this.onend?.();
      }
      stop() {
        this.onend?.();
      }
    }
    Object.defineProperty(window, "SpeechRecognition", {
      value: MockRecognition,
      configurable: true,
    });
  });
  await page.route("**/api/v1/assistant", (route) =>
    route.fulfill({
      json: {
        data: {
          answer: "महाराष्ट्राच्या योजना पाहण्यासाठी योजनांची यादी उघडा.",
        },
      },
    }),
  );
  await page.goto("/mr");
  await page.getByRole("button", { name: "आवाजाने मदत", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "बोला", exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { speechLanguage: string }).speechLanguage,
    ),
  ).toBe("mr-IN");
  await expect(dialog).toContainText("मायक्रोफोन किंवा आवाज सेवा उपलब्ध नाही");
  await dialog.getByLabel("तुमचा प्रश्न").fill("योजना");
  await dialog.getByRole("button", { name: "विचारा", exact: true }).click();
  await expect(dialog.locator(".voice-answer")).toContainText(
    "महाराष्ट्राच्या योजना",
  );
  await expect(dialog.locator(".voice-answer")).not.toContainText(
    /[A-Za-z]{3}/,
  );
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBeTruthy();
  await page.screenshot({
    path: "work/screenshots/voice-marathi.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
test("Marathi listing saves canonical crop codes and original farmer text", async ({
  page,
}) => {
  await signIn(page, "9000000002");
  await page.goto("/mr/lots");
  await page
    .locator(".workspace button")
    .filter({ hasText: "＋" })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const title = "नागपूर गहू " + Date.now();
  await dialog.locator('[name="title"]').fill(title);
  await dialog.locator('[name="kg"]').fill("25.500");
  await dialog.locator('[name="rate"]').fill("2450");
  await dialog.locator('[name="crop"]').selectOption("wheat");
  await expect(dialog.locator('[name="crop"] option:checked')).toHaveText(
    "गहू",
  );
  await uploadPhoto(dialog, "फोटो तपासा");
  await dialog
    .getByRole("button", { name: "पुष्टी करून जतन करा", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const result = await page.request.get("/api/v1/records?resource=lots");
  const { data } = await result.json();
  expect(data.find((r: { title: string }) => r.title === title)).toMatchObject({
    crop: "wheat",
    kg: "25.5",
    expectedRate: "245000",
  });
  await page.goto("/mr/prices");
  await page.locator(".filter-row input").fill("बटाटा");
  await expect(page.locator("tbody tr").first()).toBeVisible();
  for (const row of await page.locator("tbody tr").all())
    await expect(row).toContainText("बटाटा");
  await expect(page.locator("body")).not.toContainText(
    "हे भाव काल्पनिक नमुने आहेत.",
  );
});
