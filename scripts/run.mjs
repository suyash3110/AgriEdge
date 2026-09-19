import {existsSync} from 'node:fs';if(existsSync('.env'))process.loadEnvFile('.env');import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
const entry = process.argv[2];
if (!entry) throw new Error("Provide a TypeScript entry file");
await mkdir("work/runtime", { recursive: true });
const outfile = path.resolve(
  "work/runtime/" + path.basename(entry, ".ts") + ".mjs",
);
await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  sourcemap: true,
});
const child = spawn(process.execPath, [outfile, ...process.argv.slice(3)], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 1));
