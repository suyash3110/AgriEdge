import { assess, uploadPhoto } from "./image-helper";
import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
const base = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
async function login(page: Page, phone: string) {
  await page.goto("/en/login");
  await page.getByLabel("Mobile number", { exact: true }).fill(phone);
  await page.getByRole("button", { name: "Get OTP", exact: true }).click();
  const inbox = page.getByText(/Demo OTP inbox:/);
  await expect(inbox).toBeVisible();
  const code = (await inbox.innerText()).match(/\d{6}/)![0];
  await page.getByLabel("One-time password").fill(code);
  await page.getByRole("button", { name: "Verify & sign in" }).click();
  await expect(page).toHaveURL(/dashboard/);
}
async function auth(request: APIRequestContext, phone: string) {
  const r = await request.post("/api/v1/auth", {
    data: { action: "request", phone },
    headers: { origin: base },
  });
  const a = await r.json();
  expect(r.ok(), JSON.stringify(a)).toBeTruthy();
  const v = await request.post("/api/v1/auth", {
    data: {
      action: "verify",
      challengeId: a.data.challengeId,
      code: a.data.demoCode,
    },
    headers: { origin: base },
  });
  expect(v.ok()).toBeTruthy();
}
async function action(
  request: APIRequestContext,
  name: string,
  payload: Record<string, unknown>,
) {
  const r = await request.post("/api/v1/actions", {
    data: { action: name, payload },
    headers: { origin: base, "idempotency-key": crypto.randomUUID() },
  });
  const b = await r.json();
  expect(r.ok(), JSON.stringify(b)).toBeTruthy();
  return b.data;
}
test("government portal, five role dashboards and Hindi 360px", async ({
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
      viewport: { width: 1366, height: 900 },
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await login(page, phone);
    await expect(page.locator(".account-info")).toContainText(
      new RegExp(role, "i"),
    );
    await expect(page.locator(".sidebar nav")).toBeVisible();
    if (role === "farmer") {
      await page.screenshot({
        path: "work/screenshots/farmer-desktop.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto("/hi/dashboard");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "डैशबोर्ड",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBeTruthy();
      await page.getByRole("button", { name: "☰ मेन्यू" }).click();
      await expect(page.locator(".sidebar nav")).toBeVisible();
      await page.screenshot({
        path: "work/screenshots/farmer-hindi-mobile.png",
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
    await context.close();
  }
});
test("individual sale through competing bids, OTP handover and mock capture", async ({
  browser,
}) => {
  const farmer = await browser.newContext(),
    buyer = await browser.newContext(),
    second = await browser.newContext(),
    transport = await browser.newContext();
  await auth(farmer.request, "9000000002");
  await auth(buyer.request, "9000000004");
  await auth(second.request, "9000000005");
  await auth(transport.request, "9000000006");
  const d = new Date(),
    future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const assessment = await assess(farmer.request);
  const lot = await action(farmer.request, "lot.create", {
    assessmentId: assessment.assessmentId,
    title: "E2E wheat " + Date.now(),
    crop: "wheat",
    category: "produce",
    kg: "500",
    rate: "2400",
    grade: "FAQ",
    location: "Nagpur",
    harvestDate: d.toISOString().slice(0, 10),
    availableDate: d.toISOString().slice(0, 10),
    deadline: future,
  });
  await action(farmer.request, "lot.status", { id: lot.id, status: "open" });
  const bid = await action(buyer.request, "bid.create", {
    lotId: lot.id,
    rate: "2450",
    payer: "buyer",
    arranger: "buyer",
    terms: "Payment after delivery inspection",
  });
  await action(second.request, "bid.create", {
    lotId: lot.id,
    rate: "2500",
    payer: "buyer",
    arranger: "buyer",
    terms: "Payment after delivery inspection",
  });
  const agreement = await action(farmer.request, "bid.accept", { id: bid.id });
  const page = await buyer.newPage();
  await page.goto("/en/transport");
  const html = await page.locator("body").innerText();
  expect(html).toContain("Transport request");
  const jobResponse = await buyer.request.get(
    "/api/v1/records?resource=transport",
  );
  expect(jobResponse.ok()).toBeTruthy();
  const jobs = (await jobResponse.json()).data;
  const job = jobs.find(
    (j: { agreementId: string }) => j.agreementId === agreement.id,
  );
  expect(job).toBeTruthy();
  const quote = await action(transport.request, "transport.quote", {
    jobId: job.id,
    vehicleId: "vehicle-1",
    amount: "700",
    terms: "Pickup tomorrow; cancel before assignment",
  });
  await action(buyer.request, "transport.assign", { id: quote.id });
  const pickup = await action(farmer.request, "checkpoint.request", {
    jobId: job.id,
    purpose: "pickup",
  });
  await action(transport.request, "checkpoint.verify", {
    jobId: job.id,
    purpose: "pickup",
    code: pickup.demoCode,
    evidence: "Test weight receipt 500 kg",
  });
  const delivery = await action(buyer.request, "checkpoint.request", {
    jobId: job.id,
    purpose: "delivery",
  });
  await action(transport.request, "checkpoint.verify", {
    jobId: job.id,
    purpose: "delivery",
    code: delivery.demoCode,
    evidence: "Delivery receipt 500 kg",
  });
  await action(buyer.request, "agreement.inspect", {
    id: agreement.id,
    reason: "Quality matches frozen terms",
  });
  const order = await action(buyer.request, "payment.order", {
    id: agreement.id,
  });
  await action(buyer.request, "payment.demo", { id: order.id });
  await action(buyer.request, "payment.demo", { id: order.id });
  await page.goto("/en/transactions");
  await expect(page.locator("body")).toContainText("captured");
  await expect(page.locator("body")).toContainText("pending");
  await page.screenshot({
    path: "work/screenshots/transaction.png",
    fullPage: true,
  });
  await Promise.all([
    farmer.close(),
    buyer.close(),
    second.close(),
    transport.close(),
  ]);
});
test("direct API blocks stranger messages and forged origin", async ({
  request,
}) => {
  await auth(request, "9000000005");
  const denied = await request.post("/api/v1/actions", {
    headers: { origin: base },
    data: {
      action: "message.send",
      payload: { threadId: "thread-1", body: "Unauthorized text" },
    },
  });
  expect(denied.status()).toBe(403);
  const csrf = await request.post("/api/v1/actions", {
    headers: { origin: "https://unrelated.example" },
    data: { action: "notification.read", payload: { id: "anything" } },
  });
  expect(csrf.status()).toBe(403);
});

test("listing form preserves input on validation failure and saves a draft", async ({
  page,
}) => {
  await login(page, "9000000001");
  await page.goto("/en/lots");
  await page.getByRole("button", { name: "＋ Create listing" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const title = "Browser draft " + Date.now();
  await dialog.getByLabel("Listing title").fill(title);
  await dialog.getByLabel("Quantity (kg)").fill("123.456");
  await dialog.getByLabel("Expected price (₹ / quintal)").fill("2500");
  await dialog.getByLabel("Category", { exact: true }).selectOption("residue");
  await uploadPhoto(dialog);
  await dialog.getByRole("button", { name: "Confirm & save" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Residue needs");
  await expect(dialog.getByLabel("Listing title")).toHaveValue(title);
  await dialog.getByLabel("Category", { exact: true }).selectOption("produce");
  await uploadPhoto(dialog);
  await dialog.getByRole("button", { name: "Confirm & save" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "work/screenshots/listing-form-result.png",
    fullPage: true,
  });
});

test("Hindi draft dialog validates, preserves user text and submits canonical values", async ({
  page,
}) => {
  await login(page, "9000000002");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/hi/lots");
  await page
    .getByRole("button", { name: "＋ उपज सूची बनाएँ", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading").first()).toHaveText(
    "उपज या अवशेष का मसौदा बनाएँ",
  );
  const title = "किसान की मूल उपज " + Date.now();
  await dialog.getByLabel("उपज का नाम", { exact: true }).fill(title);
  await dialog.getByLabel("मात्रा (किग्रा)", { exact: true }).fill("12.345");
  await dialog
    .getByLabel("अपेक्षित भाव (₹ / क्विंटल)", { exact: true })
    .fill("2500.50");
  await dialog
    .getByLabel("फसल", { exact: true })
    .selectOption({ label: "गेहूँ" });
  await dialog
    .getByLabel("श्रेणी", { exact: true })
    .selectOption({ label: "अवशेष" });
  await uploadPhoto(dialog, "फोटो जाँचें");
  await dialog
    .getByRole("button", { name: "पुष्टि करके सहेजें", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("अवशेष के लिए सामग्री");
  await expect(dialog.getByLabel("उपज का नाम", { exact: true })).toHaveValue(
    title,
  );
  expect(
    await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBeTruthy();
  await page.screenshot({
    path: "work/screenshots/hindi-service-form.png",
    fullPage: true,
  });
  await dialog
    .getByLabel("श्रेणी", { exact: true })
    .selectOption({ label: "उपज" });
  await uploadPhoto(dialog, "फोटो जाँचें");
  await dialog
    .getByRole("button", { name: "पुष्टि करके सहेजें", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  const response = await page.request.get("/api/v1/records?resource=lots");
  expect(response.ok()).toBeTruthy();
  const { data } = await response.json();
  expect(
    data.find((row: { title: string }) => row.title === title),
  ).toMatchObject({
    title,
    crop: "wheat",
    category: "produce",
    kg: "12.345",
    grade: "Pending FPO review",
    expectedRate: "250050",
  });
});
