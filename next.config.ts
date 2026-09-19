import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  outputFileTracingExcludes: {
    "/*": ["./work/**/*", "./test-results/**/*", "./playwright-report/**/*"],
  },
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(self), microphone=(self)",
          },
        ],
      },
    ];
  },
};

export default createNextIntlPlugin("./i18n/request.ts")(config);
