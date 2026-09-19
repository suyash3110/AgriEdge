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

test("trained image inference is connected and rejects invalid uploads", async ({
  page,
}) => {
  test.setTimeout(180000);
  const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  const anonymous = await page.request.post("/api/v1/quality-image", {
    headers: { origin },
    data: {},
  });
  expect(anonymous.status()).toBe(401);
  await signIn(page, "9000000001");
  await page.goto("/en/quality");
  await expect(
    page.getByText("Image model unavailable.", { exact: false }),
  ).toHaveCount(0);
  await expect(page.locator(".pagination span")).toHaveCount(0);
  for (const crop of ["tomato", "potato", "rice", "groundnut"]) {
    await page.locator("#quality-crop").selectOption(crop);
    await page
      .locator("#quality-photo")
      .setInputFiles("work/inference-check/" + crop + ".png");
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/quality-image") &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Check image", exact: true })
      .click();
    const result = await response;
    expect(result.ok()).toBeTruthy();
    const { data } = await result.json();
    expect(data.crop).toBe(crop);
    expect(["A", "B", "C"]).toContain(data.grade);
    expect(data.status).toBe("research_only");
    expect(data.artifact_sha256).toMatch(/^[a-f0-9]{64}$/);
    await expect(page.getByText("Grade:")).toBeVisible();
  }
  await page.screenshot({
    path: "work/screenshots/quality-connected.png",
    fullPage: true,
  });
  const bad = await page.request.post("/api/v1/quality-image", {
    headers: { origin },
    data: {
      crop: "tomato",
      image:
        "data:image/png;base64," +
        Buffer.from("not an image").toString("base64"),
    },
  });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).error.code).toBe("INVALID_IMAGE");
  const unsupported = await page.request.post("/api/v1/quality-image", {
    headers: { origin },
    data: { crop: "wheat", image: "data:image/png;base64,AAAA" },
  });
  expect(unsupported.status()).toBe(400);
  const forged = await page.request.post("/api/v1/quality-image", {
    headers: { origin: "https://invalid.example" },
    data: {},
  });
  expect(forged.status()).toBe(403);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/mr/quality");
  await page
    .locator("#quality-photo")
    .setInputFiles("work/inference-check/tomato.png");
  await page.getByRole("button", { name: "फोटो तपासा", exact: true }).click();
  await expect(page.getByText("दर्जा:")).toBeVisible({
    timeout: 60000,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: "work/screenshots/quality-marathi-mobile.png",
    fullPage: true,
  });
});

test("voice transcript triggers spoken reply after voices load", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as {
      spoken: { text: string; lang: string }[];
      recognizedLanguage: string;
    };
    state.spoken = [];
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    let ready = false;
    const target = new EventTarget();
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        cancel() {},
        resume() {},
        getVoices: () => (ready ? [{ lang: "mr-IN", name: "Marathi" }] : []),
        addEventListener: target.addEventListener.bind(target),
        removeEventListener: target.removeEventListener.bind(target),
        speak(utterance: {
          text: string;
          lang: string;
          onstart: () => void;
          onend: () => void;
        }) {
          state.spoken.push({ text: utterance.text, lang: utterance.lang });
          utterance.onstart?.();
          utterance.onend?.();
        },
      },
    });
    class Recognition {
      lang = "";
      onresult?: (e: unknown) => void;
      onend?: () => void;
      start() {
        state.recognizedLanguage = this.lang;
        setTimeout(() => {
          this.onresult?.({ results: [[{ transcript: "गुणवत्ता तपासणी" }]] });
          this.onend?.();
          setTimeout(() => {
            ready = true;
            target.dispatchEvent(new Event("voiceschanged"));
          }, 100);
        }, 10);
      }
      abort() {}
      stop() {
        this.onend?.();
      }
    }
    Object.defineProperty(window, "SpeechRecognition", { value: Recognition });
  });
  await page.route("**/api/v1/assistant", (route) =>
    route.fulfill({
      json: {
        data: {
          answer: "प्रशिक्षित मॉडेलचा निकाल पाहण्यासाठी पिकाचा फोटो द्या.",
        },
      },
    }),
  );
  await page.goto("/mr");
  await page.getByRole("button", { name: "आवाजाने मदत" }).click();
  await page.getByRole("button", { name: "बोला", exact: true }).click();
  await expect(page.locator(".voice-answer")).toContainText(
    "प्रशिक्षित मॉडेलचा निकाल",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { spoken: unknown[] }).spoken.length,
      ),
    )
    .toBe(1);
  const spoken = await page.evaluate(
    () =>
      (window as unknown as { spoken: { text: string; lang: string }[] })
        .spoken[0],
  );
  expect(spoken.lang).toBe("mr-IN");
  expect(spoken.text).toContain("प्रशिक्षित मॉडेलचा निकाल");
  await page.getByRole("button", { name: "ऐकून घ्या", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { spoken: unknown[] }).spoken.length,
      ),
    )
    .toBe(2);
});
