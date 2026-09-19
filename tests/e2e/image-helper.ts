import { expect, type APIRequestContext, type Locator } from "@playwright/test";
import { readFile } from "node:fs/promises";
export async function assess(
  request: APIRequestContext,
  crop = "wheat",
  category = "produce",
) {
  const image =
    "data:image/png;base64," +
    (await readFile("work/inference-check/tomato.png")).toString("base64");
  const r = await request.post("/api/v1/quality-image", {
    headers: { origin: process.env.E2E_BASE_URL || "http://127.0.0.1:3000" },
    data: { crop, category, image },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  return (await r.json()).data;
}
export async function uploadPhoto(dialog: Locator, button = "Check image") {
  await dialog
    .locator("#quality-photo")
    .setInputFiles("work/inference-check/tomato.png");
  await dialog.getByRole("button", { name: button, exact: true }).click();
  await expect(dialog.locator('[role="status"]')).toBeVisible({
    timeout: 65000,
  });
}
