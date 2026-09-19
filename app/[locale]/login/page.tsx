import { isLocale } from "@/lib/locale";
import { notFound } from "next/navigation";
import Login from "@/components/Login";
import { demo } from "@/lib/db";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Login locale={locale} demo={demo} />;
}
