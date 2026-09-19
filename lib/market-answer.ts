import type { MarketObservation } from "./mandi-csv";
import { marketCopy } from "./market-copy";
import { local } from "./locale";
export function marketAnswer(question: string, rows: MarketObservation[], locale: string, now = Date.now()): string | null {
  const q = question.toLowerCase();
  if (!/price|rate|sell|selling|market|भाव|दर|किंमत|बेच|बिक्री|विक्री/.test(q)) return null;
  const crops = [...new Set(rows.map((r) => r.crop))];
  const crop = crops.find((v) => [v, marketCopy("hi", v), marketCopy("mr", v)].some((name) => q.includes(name.toLowerCase())));
  const c = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  if (!crop) return c("Which crop would you like to compare? Open Market Prices to select a crop and grade and compare proceeds after your selling costs.", "आप किस फसल की तुलना करना चाहते हैं? मंडी भाव में फसल और ग्रेड चुनकर बिक्री खर्च के बाद की राशि की तुलना करें।", "आपल्याला कोणत्या पिकाची तुलना करायची आहे? बाजारभावात पीक व दर्जा निवडून विक्री खर्चानंतरच्या रकमेची तुलना करा.");
  const matches = rows.filter((r) => r.crop === crop).sort((a,b) => b.observedDate.localeCompare(a.observedDate));
  const date = matches[0].observedDate;
  const observations = matches.filter((r) => r.observedDate === date).slice(0, 3);
  const quoted = observations.map((r) => `${marketCopy(locale, r.market)} (${marketCopy(locale, r.variety)}): ${new Intl.NumberFormat(locale + "-IN", { style: "currency", currency: "INR" }).format(Number(r.modalPaise) / 100)}`).join("; ");
  const when = new Date(date).toLocaleDateString(locale + "-IN");
  const old = now - Date.parse(date) > 2 * 86400000;
  return `${marketCopy(locale, crop)} — ${when}: ${quoted} ${c("per quintal", "प्रति क्विंटल", "प्रति क्विंटल")}. ` +
    (old ? c("These are older observations; confirm today's quote. ", "ये पुराने भाव हैं; आज की बोली की पुष्टि करें। ", "हे जुने भाव आहेत; आजच्या भावाची खात्री करा. ") : "") +
    c("Compare the same grade after transport costs in Market Prices; these figures do not predict future prices.", "मंडी भाव में समान ग्रेड की परिवहन खर्च के बाद तुलना करें; ये भविष्य के भाव का पूर्वानुमान नहीं हैं।", "बाजारभावात समान दर्जाची वाहतूक खर्चानंतर तुलना करा; हे भविष्यातील भावाचे अंदाज नाहीत.");
}
