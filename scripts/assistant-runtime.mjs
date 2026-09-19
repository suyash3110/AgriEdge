import path from "node:path";
import {
  existsSync,
  openSync,
  closeSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
export async function startAssistant(root) {
  const dir = path.join(root, "work", "assistant");
  const binary = path.join(
    dir,
    "runtime",
    process.platform === "win32" ? "llama-server.exe" : "llama-server",
  );
  const model = path.join(dir, "gemma-3-4b-it-Q4_K_M.gguf");
  if (!existsSync(binary) || !existsSync(model)) return null;
  const keyFile = path.join(dir, "assistant.key");
  try {
    writeFileSync(keyFile, randomBytes(32).toString("hex"), {
      flag: "wx",
      mode: 0o600,
    });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
  process.env.ASSISTANT_API_KEY = readFileSync(keyFile, "utf8").trim();
  const healthy = async () => {
    try {
      return (
        await fetch("http://127.0.0.1:8089/health", {
          headers: { Authorization: "Bearer " + process.env.ASSISTANT_API_KEY },
          signal: AbortSignal.timeout(1000),
        })
      ).ok;
    } catch {
      return false;
    }
  };
  if (await healthy()) return null;
  const lock = path.join(dir, "starting.lock");
  let owned = false;
  try {
    writeFileSync(lock, String(process.pid), { flag: "wx" });
    owned = true;
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    const pid = Number(readFileSync(lock, "utf8"));
    if (Number.isInteger(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
      } catch (e) {
        if (e.code === "ESRCH") {
          unlinkSync(lock);
          return startAssistant(root);
        }
      }
    }
    for (let i = 0; i < 90; i++) {
      if (await healthy()) return null;
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error(
      "Another assistant startup did not finish; see work/assistant/server.log",
    );
  }
  try {
    const log = openSync(path.join(dir, "server.log"), "a");
    const child = spawn(
      binary,
      [
        "--model",
        model,
        "--host",
        "127.0.0.1",
        "--port",
        "8089",
        "--ctx-size",
        "8192",
        "--parallel",
        "1",
        "--threads",
        "6",
        "--n-gpu-layers",
        "0",
        "--reasoning",
        "off",
        "--api-key-file",
        keyFile,
        "--no-webui",
        "--no-agent",
        "--no-ui-mcp-proxy",
        "--cors-origins",
        "http://127.0.0.1:3001",
      ],
      { cwd: dir, windowsHide: true, stdio: ["ignore", log, log] },
    );
    closeSync(log);
    let failed = false;
    child.on("error", () => {
      failed = true;
    });
    for (let i = 0; i < 90; i++) {
      if (await healthy()) return child;
      if (failed || child.exitCode !== null)
        throw new Error(
          "Assistant startup failed; see work/assistant/server.log",
        );
      await new Promise((r) => setTimeout(r, 1000));
    }
    child.kill();
    throw new Error(
      "Assistant startup timed out; see work/assistant/server.log",
    );
  } finally {
    if (owned) unlinkSync(lock);
  }
}
