"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { local } from "@/lib/locale";
import { sellingGuidance } from "@/lib/selling-guidance";
import type { Row } from "@/lib/portal-data";
import type { MarketObservation } from "@/lib/mandi-csv";
import { marketCopy } from "@/lib/market-copy";
import MarketRefresh from "./MarketRefresh";
import BestTimeToSellChart from "./BestTimeToSellChart";

export default function SellingGuidance({ prices, asOf }: { prices: Row[]; asOf: string }) {
  const locale = useLocale();
  const copy = (v: string) => marketCopy(locale, v);
  const c = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  const rows = prices as unknown as MarketObservation[];
  const crops = [...new Set(rows.map((r) => r.crop))].sort();
  const [selected, setSelected] = useState("");
  const crop = crops.includes(selected) ? selected : crops[0] || "";
  const varieties = [...new Set(rows.filter((r) => r.crop === crop).map((r) => r.variety))];
  const [grade, setGrade] = useState("");
  const variety = varieties.includes(grade) ? grade : varieties[0] || "";
  const [kg, setKg] = useState("100"), [costs, setCosts] = useState<Record<string, number>>({});
  const valid = Number.isFinite(Number(kg)) && Number(kg) > 0 && Number(kg) <= 100000000;
  const result = sellingGuidance(rows, crop, variety, valid ? Number(kg) : 100, costs, Date.parse(asOf));
  const money = (paise: number) => new Intl.NumberFormat(locale + "-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);
  const date = result.date ? new Date(result.date).toLocaleDateString(locale + "-IN") : "—";
  return <>
    <section className="panel" aria-label={c("Crop selling recommendations", "फसल बिक्री सुझाव", "पीक विक्री शिफारसी")}>
    <MarketRefresh />
    <div className="panel-heading"><h2>{c("Crop selling recommendations", "फसल बिक्री सुझाव", "पीक विक्री शिफारसी")}</h2></div>
    <div className="panel-body">
      <p>{c("Compare the same crop and grade on the latest available date. Enter total transport, handling and market costs for each option.", "नवीनतम उपलब्ध तारीख पर समान फसल और ग्रेड की तुलना करें। हर विकल्प के लिए कुल परिवहन, संभाल और मंडी खर्च भरें।", "नवीनतम उपलब्ध तारखेला समान पीक व दर्जाची तुलना करा. प्रत्येक पर्यायासाठी एकूण वाहतूक, हाताळणी आणि बाजार खर्च भरा.")}</p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <label>{c("Crop", "फसल", "पीक")}<select value={crop} onChange={(e) => { setSelected(e.target.value); setCosts({}); }}>{crops.map((v) => <option key={v} value={v}>{copy(v)}</option>)}</select></label>
        <label>{c("Market grade / variety", "मंडी ग्रेड / किस्म", "बाजार दर्जा / वाण")}<select value={variety} onChange={(e) => { setGrade(e.target.value); setCosts({}); }}>{varieties.map((v) => <option key={v} value={v}>{marketCopy(locale, v)}</option>)}</select></label>
        <label>{c("Quantity (kg)", "मात्रा (किलो)", "प्रमाण (किलो)")}<input type="number" min="0.01" step="0.01" value={kg} onChange={(e) => setKg(e.target.value)} /></label>
      </div>
      {!valid ? <p role="alert">{c("Enter a positive quantity.", "सही धनात्मक मात्रा भरें।", "योग्य धन संख्या भरा.")}</p> : !result.options.length ? <p>{c("No comparable observations for this crop and grade.", "इस फसल और ग्रेड के तुलनीय भाव उपलब्ध नहीं हैं।", "या पीक व दर्जासाठी तुलनायोग्य भाव उपलब्ध नाहीत.")}</p> : <>
        <p><strong>{c("Observation date", "भाव की तारीख", "भावाची तारीख")}: {date}</strong></p>
        <div style={{ overflowX: "auto" }}><table><thead><tr><th>{c("Market", "मंडी", "बाजार")}</th><th>{c("INR / quintal", "रुपये / क्विंटल", "रुपये / क्विंटल")}</th><th>{c("Total costs (INR)", "कुल खर्च (रुपये)", "एकूण खर्च (रुपये)")}</th><th>{c("Estimated net", "अनुमानित शुद्ध राशि", "अंदाजित निव्वळ रक्कम")}</th></tr></thead><tbody>{result.options.map((r) => <tr key={r.market}>
          <td>{marketCopy(locale, r.market)}</td><td>{money(Number(r.modalPaise))}</td>
          <td><input aria-label={c("Total costs", "कुल खर्च", "एकूण खर्च") + " " + marketCopy(locale, r.market)} type="number" min="0" max="1000000000" step="0.01" value={costs[r.market] ?? ""} placeholder="0" onChange={(e) => { const value = Number(e.target.value); if (Number.isFinite(value) && value >= 0 && value <= 1000000000) setCosts({ ...costs, [r.market]: value }); }} /></td><td>{money(r.netPaise)}</td>
        </tr>)}</tbody></table></div>
        <p><strong>{c("Compare first", "पहले तुलना करें", "आधी तुलना करा")}: {marketCopy(locale, result.options[0].market)}</strong> — {c("highest estimated net for the entered costs; blank costs count as zero.", "दर्ज खर्च के आधार पर सबसे अधिक अनुमानित शुद्ध राशि; खाली खर्च शून्य माना गया है।", "भरलेल्या खर्चानुसार सर्वाधिक अंदाजित निव्वळ रक्कम; रिकामा खर्च शून्य धरला आहे.")}</p>
        <p className="notice">{result.stale ? c("These prices are older than two days. Confirm today's buyer quote before deciding; this is a historical comparison.", "ये भाव दो दिन से पुराने हैं। निर्णय से पहले आज की खरीदार बोली की पुष्टि करें; यह ऐतिहासिक तुलना है।", "हे भाव दोन दिवसांपेक्षा जुने आहेत. निर्णयापूर्वी आजच्या खरेदीदाराच्या भावाची खात्री करा; ही ऐतिहासिक तुलना आहे.") : c("Confirm the buyer quote, quality and delivery costs before selling.", "बेचने से पहले खरीदार की बोली, गुणवत्ता और डिलीवरी खर्च की पुष्टि करें।", "विक्रीपूर्वी खरेदीदाराचा भाव, गुणवत्ता आणि वाहतूक खर्च तपासा.")}</p>
        <small>{c("Local calculation, not a future-price forecast. Do not delay perishable produce solely on this comparison.", "स्थानीय गणना, भविष्य के भाव का पूर्वानुमान नहीं। केवल इस तुलना पर नाशवान उपज की बिक्री न टालें।", "स्थानिक गणना, भविष्यातील भावाचा अंदाज नाही. केवळ या तुलनेवर नाशवंत मालाची विक्री पुढे ढकलू नका.")}</small>
      </>}
    </div>
  </section>
  <BestTimeToSellChart prices={rows} crop={crop} variety={variety} />
  </>;
}
