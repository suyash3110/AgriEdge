import { useLocale } from "next-intl";
import { local } from "@/lib/locale";
import evidence from "@/lib/model-evidence.json";
export default function ModelEvidence() {
  const locale = useLocale();
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  const number = (n: number) =>
    new Intl.NumberFormat(locale + "-IN", { maximumFractionDigits: 3 }).format(
      n,
    );
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          {t(
            "Model evaluation records",
            "मॉडल मूल्यांकन रिकॉर्ड",
            "मॉडेल मूल्यमापन नोंदी",
          )}
        </h2>
      </div>
      <div className="panel-body">
        <p className="notice">
          {t(
            "Research candidates are trained. They are not approved for automated sale grades or production recommendations. Manual FPO assessment remains available.",
            "अनुसंधान मॉडल प्रशिक्षित हैं। स्वचालित बिक्री श्रेणी या उत्पादन सलाह के लिए स्वीकृत नहीं हैं। संगठन की प्रत्यक्ष जाँच उपलब्ध है।",
            "संशोधन मॉडेल प्रशिक्षित आहेत. स्वयंचलित विक्री दर्जा किंवा प्रत्यक्ष वापरातील सल्ल्यासाठी मंजूर नाहीत. संस्थेची प्रत्यक्ष तपासणी उपलब्ध आहे.",
          )}
        </p>
        {evidence.imageCandidates.map((model) => (
          <article className="record-card" key={model.crop}>
            <h3>
              {model.crop === "tomato" ? t("Tomato appearance", "टमाटर की बाहरी स्थिति", "टोमॅटोची बाह्य स्थिती") : model.crop === "potato" ? t("Potato visible freshness", "आलू की दिखने वाली ताज़गी", "बटाट्याचा दिसणारा ताजेपणा") : model.crop === "rice" ? t("Milled rice: single-grain appearance", "मिल के चावल: एक दाने की स्थिति", "गिरणीतील तांदूळ: एका दाण्याची स्थिती") : t("Groundnut: annotated individual peanut crops", "मूँगफली: चिह्नित एकल दाने की तस्वीर", "भुईमूग: चिन्हांकित एका शेंगेतील दाण्याचे छायाचित्र")}</h3>
            <p>
              {t(
                "Held-out macro F1",
                "स्वतंत्र परीक्षण मैक्रो एफ१",
                "स्वतंत्र चाचणी मॅक्रो एफ१",
              )}
              : <strong>{number(model.macroF1)}</strong> ·{" "}
              {number(model.testImages)}{" "}
              {t("test images", "परीक्षण तस्वीरें", "चाचणी छायाचित्रे")}
            </p>
            <p>
              {t(
                "No external Nagpur holdout or calibrated image-suitability detection. Photos cannot certify moisture, chemical residues or food safety.",
                "नागपुर का बाहरी परीक्षण या मान्य तस्वीर उपयुक्तता जाँच नहीं हुई है। तस्वीरें नमी, रासायनिक अवशेष या खाद्य सुरक्षा प्रमाणित नहीं करतीं।",
                "नागपूरची बाह्य चाचणी किंवा प्रमाणित छायाचित्र उपयुक्तता तपासणी झालेली नाही. छायाचित्रे ओलावा, रासायनिक अवशेष किंवा अन्नसुरक्षा प्रमाणित करत नाहीत.",
              )}
            </p>
          </article>
        ))}
        <article className="record-card">
          <h3>
            {t(
              "Nagpur price forecasting",
              "नागपुर भाव पूर्वानुमान",
              "नागपूर भावाचा अंदाज",
            )}
          </h3>
          <p>
            {number(evidence.priceCandidates)} /{" "}
            {number(evidence.priceSeriesReviewed)}{" "}
            {t(
              "series beat the persistence baseline on a chronological evaluation split.",
              "श्रृंखलाएँ समयानुसार परीक्षण में पिछले भाव वाले आधार से बेहतर रहीं।",
              "मालिका कालानुक्रमिक चाचणीत मागील भावाच्या आधारापेक्षा चांगल्या ठरल्या.",
            )}
          </p>
          <p>
            {number(evidence.observations)}{" "}
            {t(
              "historical observations; January 2024–April 2026. These records cannot support a current-price claim.",
              "ऐतिहासिक भाव; जनवरी २०२४–अप्रैल २०२६। ये रिकॉर्ड वर्तमान भाव की पुष्टि नहीं करते।",
              "ऐतिहासिक भाव; जानेवारी २०२४–एप्रिल २०२६. या नोंदी सध्याच्या भावाची पुष्टी करत नाहीत.",
            )}
          </p>
        </article>
        <article className="record-card">
          <h3>{t("Other crops", "अन्य फसलें", "इतर पिके")}</h3>
          <p>
            {t(
              "Unlabelled rice photos, plant-disease datasets and crop-identity datasets cannot establish harvested-produce quality. Their dataset review is recorded; suitable annotations or replacement sources are required.",
              "बिना लेबल की चावल तस्वीरें, पौध रोग और फसल पहचान डेटा से कटाई के बाद गुणवत्ता तय नहीं की जा सकती। डेटा समीक्षा दर्ज है; उपयुक्त लेबल या वैकल्पिक स्रोत आवश्यक हैं।",
              "लेबल नसलेली तांदळाची छायाचित्रे, वनस्पती रोग आणि पीक ओळख डेटा यांवरून कापणीनंतरचा दर्जा ठरवता येत नाही. डेटा पुनरावलोकन नोंदवले आहे; योग्य लेबल किंवा पर्यायी स्रोत आवश्यक आहेत.",
            )}
          </p>
        </article>
      </div>
    </section>
  );
}
