import { marketCopy } from "@/lib/market-copy";
import Link from "next/link";
import SchemeDirectory from "./SchemeDirectory";
import { local } from "@/lib/locale";
import type { PublicPrice } from "@/lib/public-prices";
import PublicHeader from "./PublicHeader";
import VoiceAssistant from "./VoiceAssistant";
import SchemeCarousel from "./SchemeCarousel";
import MarketRefresh from "./MarketRefresh";
export default function Landing({
  locale,
  prices,
}: {
  locale: string;
  prices: PublicPrice[];
}) {
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  const names: Record<string, string> = {
    wheat: t("Wheat", "गेहूँ", "गहू"),
    mustard: t("Mustard", "सरसों", "मोहरी"),
    gram: t("Gram", "चना", "हरभरा"),
    paddy: t("Paddy", "धान", "भात"),
    tomato: t("Tomato", "टमाटर", "टोमॅटो"),
    maize: t("Maize", "मक्का", "मका"),
    onion: t("Onion", "प्याज", "कांदा"),
    potato: t("Potato", "आलू", "बटाटा"),
    sorghum: t("Sorghum", "ज्वार", "ज्वारी"),
    groundnut: t("Groundnut", "मूँगफली", "भुईमूग"),
  };
  const priceCards = prices.length
    ? prices
    : ["wheat", "mustard", "gram", "paddy"].map((crop) => ({
        crop,
        market: "",
        date: "",
        modal: "",
        change: null,
        source: "",
      }));
  const currency = (v: string) =>
    new Intl.NumberFormat(locale + "-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(v) / 100);
  return (
    <>
      <MarketRefresh />
      <PublicHeader locale={locale} />
      <main className="landing-main">
        <SchemeCarousel locale={locale} />
        <section id="market-prices" className="landing-section">
          <h1>
            {t(
              "Trending market prices · Nagpur",
              "मंडी भाव का रुझान · नागपुर",
              "बाजारभावाचा कल · नागपूर",
            )}
          </h1>
          <p className="section-intro">
            {t(
              "Latest sourced observations. Check the date on each card; older records remain visible when the live provider is unavailable.",
              "नवीनतम स्रोत-आधारित भाव। हर कार्ड की तारीख देखें; लाइव सेवा उपलब्ध न होने पर पुरानी नोंदें दिखती हैं।",
              "स्रोतातील नवीनतम भाव. प्रत्येक कार्डवरील तारीख पहा; थेट सेवा उपलब्ध नसल्यास जुन्या नोंदी दिसतात.",
            )}
          </p>
          <div className="price-card-grid">
            {priceCards.map((r) => (
              <article className="public-price-card" key={r.crop}>
                <h2>{names[r.crop] || marketCopy(locale, r.crop)}</h2>
                <p>
                  {marketCopy(locale, r.market) ||
                    t(
                      "Nagpur district markets",
                      "नागपुर जिले की मंडियाँ",
                      "नागपूर जिल्ह्यातील बाजार",
                    )}
                </p>
                <div className="public-price">
                  {r.modal
                    ? currency(r.modal) +
                      " / " +
                      t("quintal", "क्विंटल", "क्विंटल")
                    : t("Price unavailable", "मूल्य उपलब्ध नहीं", "भाव उपलब्ध नाही")}
                  {r.change !== null && (
                    <small
                      className={
                        Number(r.change) >= 0 ? "price-up" : "price-down"
                      }
                    >
                      {Number(r.change) > 0 ? "+" : ""}
                      {currency(r.change)}
                    </small>
                  )}
                </div>
                {r.date && (
                  <small>
                    {new Intl.DateTimeFormat(locale + "-IN", {
                      dateStyle: "medium",
                      timeZone: "Asia/Kolkata",
                    }).format(new Date(r.date))}
                  </small>
                )}
                <Link href={"/" + locale + "/prices"} prefetch={false}>
                  {t(
                    "View market details →",
                    "मंडी की जानकारी देखें →",
                    "बाजाराची माहिती पहा →",
                  )}
                </Link>
              </article>
            ))}
          </div>
        </section>
        <SchemeDirectory locale={locale} />
      </main>
      <VoiceAssistant locale={locale} />
    </>
  );
}
