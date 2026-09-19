"use client";
import { useState } from "react";
import type { PublicPrice } from "@/lib/public-prices";
import { local } from "@/lib/locale";
import { marketCopy } from "@/lib/market-copy";

export default function PublicPriceTable({ prices, locale }: { prices: PublicPrice[]; locale: string }) {
  const [search, setSearch] = useState("");
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  const money = (v: string) => new Intl.NumberFormat(`${locale}-IN`, { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(v) / 100);
  const rows = prices.filter((row) => `${row.crop} ${row.market} ${marketCopy(locale, row.crop)} ${marketCopy(locale, row.market)}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="filter-row"><input aria-label={t("Filter market observations", "मंडी भाव फ़िल्टर करें", "बाजारभाव गाळा")} placeholder={t("Filter crop or market", "फसल या मंडी खोजें", "पीक किंवा बाजार शोधा")} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    <div className="public-market-table"><table><thead><tr><th>{t("Crop", "फसल", "पीक")}</th><th>{t("Market", "मंडी", "बाजार")}</th><th>{t("Date", "तारीख", "दिनांक")}</th><th>{t("Modal price / quintal", "मॉडल भाव / क्विंटल", "प्रचलित भाव / क्विंटल")}</th></tr></thead><tbody>
      {rows.map((row, index) => <tr key={`${row.crop}-${row.market}-${index}`}><td><strong>{marketCopy(locale, row.crop)}</strong>{row.variety && <small>{marketCopy(locale, row.variety)}</small>}</td><td>{marketCopy(locale, row.market)}{row.source.startsWith("https://") ? <small><a href={row.source} target="_blank" rel="noopener noreferrer">{t("Price source", "भाव का स्रोत", "भावाचा स्रोत")}</a></small> : <small>{t("Source", "स्रोत", "स्रोत")}: {row.source}</small>}</td><td>{new Intl.DateTimeFormat(`${locale}-IN`, { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(row.date))}</td><td>{money(row.modal)}</td></tr>)}
    </tbody></table></div>
  </>;
}
