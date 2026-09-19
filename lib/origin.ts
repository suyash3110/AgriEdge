export function validOrigin(origin: string | null) {
  if (!origin) return false;
  const configured = process.env.APP_URL || "http://127.0.0.1:3000";
  const allowed = new Set([new URL(configured).origin]);
  if (process.env.APP_ENV !== "production") {
    const local = new URL(configured);
    if (["localhost", "127.0.0.1"].includes(local.hostname)) {
      local.hostname = local.hostname === "localhost" ? "127.0.0.1" : "localhost";
      allowed.add(local.origin);
    }
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }
  return allowed.has(origin);
}
