import { assess } from "./image-helper";
import { writeFile } from "node:fs/promises";
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

test("photo grade reaches buyer, farmer appeals, FPO revises with history", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const farmer = await browser.newContext(),
    buyer = await browser.newContext(),
    fpo = await browser.newContext();
  const fp = await farmer.newPage(),
    bp = await buyer.newPage(),
    op = await fpo.newPage();
  await signIn(fp, "9000000001");
  await signIn(bp, "9000000004");
  await signIn(op, "9000000003");
  const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  const act = async (
    context: typeof farmer,
    action: string,
    payload: unknown,
  ) =>
    context.request.post("/api/v1/actions", {
      headers: { origin },
      data: { action, payload },
    });
  const assessment = await assess(farmer.request, "tomato");
  const date = new Date().toISOString().slice(0, 10),
    deadline = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const payload = {
    title: "Photo grade review " + Date.now(),
    crop: "tomato",
    category: "produce",
    kg: "25",
    rate: "2500",
    grade: "FORGED A",
    location: "Nagpur",
    harvestDate: date,
    availableDate: date,
    deadline,
    assessmentId: assessment.assessmentId,
  };
  expect(
    (
      await act(farmer, "lot.create", { ...payload, assessmentId: undefined })
    ).status(),
  ).toBe(400);
  expect(
    (await act(farmer, "lot.create", { ...payload, crop: "wheat" })).status(),
  ).toBe(400);
  const saved = await act(farmer, "lot.create", payload);
  expect(saved.ok(), await saved.text()).toBeTruthy();
  const lot = (await saved.json()).data;
  expect(lot.grade).toBe(assessment.grade);
  expect(lot.gradeMethod).toBe("ml_provisional");
  expect((await act(farmer, "lot.create", payload)).status()).toBe(400);
  expect(
    (await act(farmer, "lot.status", { id: lot.id, status: "open" })).ok(),
  ).toBeTruthy();
  // Buyers' listings service uses /lots (the role navigation resolves the canonical route).
  await bp.goto("/en/lots");
  const card = bp.locator("section.panel").filter({
    has: bp.getByRole("heading", { name: payload.title, exact: true }),
  });
  await expect(card).toContainText("Grade: " + assessment.grade);
  await expect(card).toContainText("Provisional model grade");
  expect(
    (
      await buyer.request.get(
        "/api/v1/quality-image?id=" + assessment.assessmentId,
      )
    ).ok(),
  ).toBeTruthy();
  const bid = await act(buyer, "bid.create", {
    lotId: lot.id,
    rate: "2550",
    payer: "buyer",
    arranger: "buyer",
    terms: "Original provisional grade",
  });
  expect(bid.ok()).toBeTruthy();
  const requested = await act(farmer, "quality.request", {
    lotId: lot.id,
    reason: "I disagree with the photo grade; please inspect this crop.",
  });
  expect(requested.ok()).toBeTruthy();
  const review = (await requested.json()).data;
  const newGrade = assessment.grade === "A" ? "B" : "A";
  const correction = {
    id: review.id,
    grade: newGrade,
    measurements: "In-person inspection of representative crop sample",
    reason: "Manual inspection supports revised grade",
  };
  expect((await act(farmer, "quality.review", correction)).status()).toBe(403);
  expect(
    (await act(fpo, "quality.review", { ...correction, grade: "Z" })).status(),
  ).toBe(400);
  const corrected = await act(fpo, "quality.review", correction);
  expect(corrected.ok(), await corrected.text()).toBeTruthy();
  await bp.reload();
  await expect(card).toContainText("Grade: " + newGrade);
  await expect(card).toContainText("FPO verified");
  await expect(card).toContainText("No active bids");
  await bp.screenshot({
    path: "work/screenshots/buyer-fpo-grade.png",
    fullPage: true,
  });
  await op.goto("/en/quality");
  await expect(
    op.getByText("Manual inspection supports revised grade"),
  ).toBeVisible();
  await expect(
    op.getByText("I disagree with the photo grade; please inspect this crop."),
  ).toBeVisible();
  await farmer.close();
  await buyer.close();
  await fpo.close();
});

test("local assistant answers general and farming questions in three languages", async ({
  request, page,
}) => {
  test.setTimeout(360000);
  const answers = [];
  for (const [locale, question] of [
    ["en", "What is 12 multiplied by 8?"],
    ["hi", "पौधों को पानी सुबह देना बेहतर है या तेज दोपहर में? कारण बताएँ।"],
    ["mr", "मॉडेलने दिलेला पिकाचा दर्जा मला मान्य नसेल तर काय करावे?"],
  ]) {
    const r = await request.post("/api/v1/assistant", {
      headers: { origin: process.env.E2E_BASE_URL || "http://127.0.0.1:3000" },
      data: { locale, question, history: [] },
      timeout: 130000,
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    const answer = (await r.json()).data.answer;
    answers.push({ locale, question, answer });
    await writeFile(
      "work/assistant-answer-check.json",
      JSON.stringify(answers, null, 2),
    );
    expect(answer.length).toBeGreaterThan(1);
    expect(answer).not.toContain("Please ask about one of these services");
    if (locale === "en") expect(answer).toContain("96");
    else expect(answer).toMatch(/[\u0900-\u097F]/);
    if(locale === "hi") { expect(answer).toContain("सुबह"); expect(answer).toMatch(/वाष्प|सूख|नमी|अवशोष/); expect(answer).not.toContain("बर्फ"); }
    if (locale === "mr") expect(answer).toMatch(/FPO|एफपीओ|तपास|निरीक्षण/);
  }
  await writeFile(
    "work/assistant-answer-check.json",
    JSON.stringify(answers, null, 2),
  );
  await page.goto("/en");
  await page.getByRole("button",{name:"Voice assistance",exact:true}).click();
  await page.getByLabel("Your question").fill("What is 12 multiplied by 8?");
  const streamed=page.waitForResponse(r=>r.url().endsWith("/api/v1/assistant"));
  await page.getByRole("button",{name:"Ask",exact:true}).click();
  expect((await streamed).headers()["content-type"]).toContain("application/x-ndjson");
  await expect(page.locator(".voice-answer")).toContainText("96",{timeout:120000});
  await expect(page.getByRole("button",{name:"Ask",exact:true})).toBeEnabled({timeout:120000});
  await page.screenshot({path:"work/screenshots/assistant-conversation.png",fullPage:true});
});
