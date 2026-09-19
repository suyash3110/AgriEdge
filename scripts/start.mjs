import { startAssistant } from "./assistant-runtime.mjs";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
if (existsSync(".env")) process.loadEnvFile(".env");
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const root = process.cwd();
let assistantProcess;
// Voice startup must not prevent login, prices, or image inference from starting.
void startAssistant(root).then((child) => { assistantProcess = child; }).catch(() => {
  console.error("Local voice model unavailable; Gemini remains available when configured.");
});
process.on("exit", () => assistantProcess?.kill());
process.on("SIGINT", () => {
  assistantProcess?.kill();
  process.exit(0);
});
process.on("SIGTERM", () => {
  assistantProcess?.kill();
  process.exit(0);
});
process.env.ML_PROJECT_ROOT ||= root;
const localPython = path.join(
  root,
  "work",
  "ml-venv",
  process.platform === "win32" ? "Scripts" : "bin",
  process.platform === "win32" ? "python.exe" : "python",
);
if (existsSync(localPython)) process.env.ML_PYTHON ||= localPython;
const index = process.argv.indexOf("--port");
const port = index >= 0 ? process.argv[index + 1] : process.env.PORT || "3000";
if (!/^\d{2,5}$/.test(port) || Number(port) > 65535)
  throw new Error("Invalid port");
process.env.PORT = port;
process.env.HOSTNAME = "127.0.0.1";
process.env.APP_URL ||= "http://127.0.0.1:" + port;
const databaseIndex = process.argv.indexOf("--database-dir");
process.env.DATABASE_DIR ||=
  databaseIndex >= 0
    ? path.resolve(process.argv[databaseIndex + 1])
    : path.join(root, "work", "database");
process.env.PRICE_CSV_URI ||= path.join(root, "work", "dataset-review", "nagpur-public-prices.csv");
process.env.PRIVATE_FILE_DIR ||= path.join(root, "work", "private-files");
if (process.env.APP_ENV !== "production") {
  const prepared = spawnSync(process.execPath, ["scripts/run.mjs", "scripts/seed.ts"], {
    cwd: root, env: process.env, stdio: "inherit", windowsHide: true,
  });
  if (prepared.status !== 0) throw new Error("Local database and market price preparation failed.");
}
await import(
  pathToFileURL(path.join(root, ".next", "standalone", "server.js")).href
);
