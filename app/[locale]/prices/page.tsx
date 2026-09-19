import PublicHeader from "@/components/PublicHeader";
import VoiceAssistant from "@/components/VoiceAssistant";
import { marketObservations } from "@/lib/local-market-data";
import SellingGuidance from "@/components/SellingGuidance";
import { local } from "@/lib/locale";
import PublicPriceTable from "@/components/PublicPriceTable";

export const dynamic = "force-dynamic";
export default async function PublicPricesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const observations = await marketObservations();
  const prices = observations.map((r) => ({ crop: r.crop, market: r.market, date: r.observedDate, modal: r.modalPaise, change: null, source: r.source, variety: r.variety }));
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  return <>
    <PublicHeader locale={locale} />
    <main className="public-market-page">
      <h1>{t("Nagpur market prices", "नागपुर मंडी भाव", "नागपूर बाजारभाव")}</h1>
      <p>{t("Latest listed observations across Nagpur district markets.", "नागपुर जिले की मंडियों में नवीनतम सूचीबद्ध भाव।", "नागपूर जिल्ह्यातील बाजारांमधील नवीनतम नोंदवलेले भाव.")}</p>
      <PublicPriceTable prices={prices} locale={locale} />
      <SellingGuidance prices={observations} asOf={new Date().toISOString()} />
      {!prices.length && <div className="notice">{t("No market observations are available yet.", "अभी कोई मंडी भाव उपलब्ध नहीं है।", "सध्या कोणतेही बाजारभाव उपलब्ध नाहीत.")}</div>}
    </main>
    <VoiceAssistant locale={locale} />
  </>;
}
