"use client";
import { useLocale } from "next-intl";
import { local } from "@/lib/locale";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const locale = useLocale();
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  return (
    <main className="standalone">
      <h1>
        {t(
          "We could not load this page",
          "यह पृष्ठ नहीं खुल सका",
          "हे पान उघडले नाही",
        )}
      </h1>
      <p>
        {t(
          "Your confirmed records are preserved. Check your connection and try again.",
          "आपकी पुष्ट नोंदें सुरक्षित हैं। कनेक्शन जाँचकर फिर कोशिश करें।",
          "तुमच्या पुष्टी झालेल्या नोंदी सुरक्षित आहेत. जोडणी तपासून पुन्हा प्रयत्न करा.",
        )}
      </p>
      <button onClick={reset}>
        {t("Try again", "फिर कोशिश करें", "पुन्हा प्रयत्न करा")}
      </button>
    </main>
  );
}
