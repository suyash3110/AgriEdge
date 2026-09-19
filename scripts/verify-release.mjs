import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:3001";
const headers = { "content-type": "application/json", origin: base };
async function post(route, data, cookie) {
  const response = await fetch(base + route, { method: "POST", headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: JSON.stringify(data), signal: AbortSignal.timeout(150000) });
  const body = await response.json();
  assert.equal(response.ok, true, `${route}: ${response.status} ${body.error?.code || ""}`);
  return { body, response };
}
const challenge = await post("/api/v1/auth", { action: "request", phone: "9000000001" });
const signed = await post("/api/v1/auth", { action: "verify", challengeId: challenge.body.data.challengeId, code: challenge.body.data.demoCode });
const cookie = signed.response.headers.get("set-cookie").split(";")[0];
const dashboard = await fetch(base + "/en/dashboard", { headers: { cookie } });
assert.ok((await dashboard.text()).includes("Ram Prasad"));
console.log("PASS: OTP login and authenticated dashboard");
const prices = await fetch(base + "/en/prices");
assert.ok((await prices.text()).includes("₹"));
console.log("PASS: dated market observations displayed (not a live-feed assertion)");
const image = "data:image/png;base64," + (await readFile("work/inference-check/tomato.png")).toString("base64");
const quality = await post("/api/v1/quality-image", { crop: "tomato", category: "produce", image }, cookie);
assert.ok(["A", "B", "C"].includes(quality.body.data.grade));
console.log("PASS: independent Python inference returned grade " + quality.body.data.grade);
const voice = await post("/api/v1/assistant", { question: "Explain tolerance in AgriEdge.", locale: "en", stream: false });
assert.match(voice.body.data.answer, /quintal/i);
console.log("PASS: assistant answered tolerance question via " + voice.body.data.source);
