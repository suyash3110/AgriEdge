import CopyProvider from "@/components/CopyProvider";
import { copyDictionaries } from "@/lib/copy-dictionaries";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import mr from "@/messages/mr.json";
import { isLocale } from "@/lib/locale";
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ en, hi, mr }[locale]}
      timeZone="Asia/Kolkata"
    >
      <CopyProvider dictionary={copyDictionaries[locale]}>
        <div lang={locale}>{children}</div>
      </CopyProvider>
    </NextIntlClientProvider>
  );
}
