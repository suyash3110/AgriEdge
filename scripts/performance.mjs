import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.env.E2E_BASE_URL || "http://127.0.0.1:3001";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 360, height: 800 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
try {
  const requested = await context.request.post(base + "/api/v1/auth", {
    headers: { origin: base },
    data: { action: "request", phone: process.env.PERFORMANCE_PHONE || "9000000001" },
  });
  const otp = await requested.json();
  if (!requested.ok())
    throw new Error(`Demo login unavailable for measurement (HTTP ${requested.status()}); check the test account or OTP request limit.`);
  const verified = await context.request.post(base + "/api/v1/auth", {
    headers: { origin: base },
    data: {
      action: "verify",
      challengeId: otp.data.challengeId,
      code: otp.data.demoCode,
    },
  });
  if (!verified.ok()) throw new Error(`Demo verification failed (HTTP ${verified.status()})`);
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__agriLcp = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__agriLcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 1600000 / 8,
    uploadThroughput: 750000 / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const types = new Map();
  let total = 0,
    js = 0;
  cdp.on("Network.requestWillBeSent", (e) => types.set(e.requestId, e.type));
  cdp.on("Network.loadingFinished", (e) => {
    total += e.encodedDataLength;
    if (types.get(e.requestId) === "Script") js += e.encodedDataLength;
  });
  await page.goto(base + "/en/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
  if (!new URL(page.url()).pathname.endsWith("/en/dashboard")) throw new Error("Measurement did not reach the authenticated dashboard");
  await page.waitForTimeout(1000);
  const metrics = await page.evaluate(() => ({
    lcpMs: window.__agriLcp,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    resources: performance.getEntriesByType("resource").length,
  }));
  const result = {
    measuredAt: new Date().toISOString(),
    environment:
      "Local Windows headless Edge; production Node server; cold browser cache",
    profile: {
      viewport: "360x800",
      cpuSlowdown: 4,
      latencyMs: 150,
      downloadBitsPerSecond: 1600000,
      uploadBitsPerSecond: 750000,
    },
    ...metrics,
    totalEncodedBytes: total,
    scriptEncodedBytes: js,
    budgets: { totalBytes: 500000, scriptBytes: 180000, lcpMs: 2500 },
    limitations:
      "Single local synthetic run, not an Android field measurement. Encoded transfer includes any automatic link prefetch.",
  };
  await mkdir("work", { recursive: true });
  await writeFile("work/performance.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
