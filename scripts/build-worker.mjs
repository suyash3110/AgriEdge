import { build } from "esbuild";
await build({
  entryPoints: ["worker/index.ts", "scripts/seed.ts"],
  outdir: "dist",
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outExtension: { ".js": ".mjs" },
});
