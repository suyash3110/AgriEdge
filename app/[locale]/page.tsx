import { isLocale } from "@/lib/locale";
import { notFound } from "next/navigation";
import Landing from "@/components/Landing";
import { publicPrices } from "@/lib/public-prices";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Landing locale={locale} prices={await publicPrices()} />;
}
