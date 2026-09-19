import { spawn } from "node:child_process";
import { openSync, mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
mkdirSync(path.join(root, "work", "service"), { recursive: true });
const pidFile = path.join(root, "work", "service", "supervisor.pid");
if (existsSync(pidFile)) {
  const old = Number(readFileSync(pidFile, "utf8"));
  try { process.kill(old, 0); process.exit(0); } catch {}
}
writeFileSync(pidFile, String(process.pid));
let child;
let stopping = false;
const log = openSync(path.join(root, "work", "service", "app.log"), "a");
function start() {
  child = spawn(process.execPath, ["scripts/start.mjs", "--port", "3001"], {
    cwd: root, windowsHide: true, stdio: ["ignore", log, log],
    env: { ...process.env, APP_ENV: "demo", DATABASE_URL: "", DATABASE_DIR: path.join(root, "work", "nagpur-preview"), APP_URL: "http://127.0.0.1:3001", PORT: "3001", PRICE_CSV_URI: path.join(root, "work", "dataset-review", "nagpur-public-prices.csv") },
  });
  child.on("exit", () => { if (!stopping) setTimeout(start, 5000); });
}
function stop() { stopping = true; child?.kill(); try { unlinkSync(pidFile); } catch {} process.exit(0); }
process.on("SIGINT", stop); process.on("SIGTERM", stop);
start();
