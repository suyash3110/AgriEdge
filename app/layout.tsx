import { headers } from "next/headers";
import { isLocale } from "@/lib/locale";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "AgriEdge | Agriculture market services",
  description:
    "Agriculture market services for the Nagpur pilot. An independent AgriEdge platform.",
  icons: {
    icon: "/images/agriedge-logo.jpg",
    apple: "/images/agriedge-logo.jpg",
  },
  manifest: "/manifest.webmanifest",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requested = (await headers()).get("x-agriedge-locale") || "en";
  const locale = isLocale(requested) ? requested : "en";
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
