import { useLocale } from "next-intl";
import { local } from "@/lib/locale";
import { money } from "@/lib/domain";
import type { Row } from "@/lib/portal-data";
import type { ActionSpec } from "./ActionDialog";
import { s, Badge } from "./ui";
import { field } from "./forms";

export default function TolerancePanel({ agreement: a, proposals, uid, locked, open }: { agreement: Row; proposals: Row[]; uid: string; locked: boolean; open: (spec: ActionSpec) => void }) {
  const locale = useLocale();
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  return <section className="record-card">
    <h3>{t("Mutually agreed tolerance", "सहमत अतिरिक्त राशि", "सहमतीची अतिरिक्त रक्कम")}</h3>
    <p>{t("Dust/debris compensation", "धूल/कचरे के लिए मुआवज़ा", "धूळ/कचऱ्यासाठी भरपाई")}: <strong>{money(s(a, "tolerancePaise") || "0")}/{t("quintal", "क्विंटल", "क्विंटल")}</strong></p>
    {!locked && <button className="secondary" onClick={() => open({ title: t("Propose tolerance", "अतिरिक्त राशि का प्रस्ताव", "अतिरिक्त रकमेचा प्रस्ताव"), action: "tolerance.propose", fixed: { id: s(a, "id") }, fields: [field("amount", t("Extra ₹ per quintal", "अतिरिक्त ₹ प्रति क्विंटल", "अतिरिक्त ₹ प्रति क्विंटल"), "0", "decimal"), field("reason", t("Dust/debris allowance and reason", "धूल/कचरे की छूट और कारण", "धूळ/कचरा भत्ता आणि कारण"), "", "textarea")] })}>{t("Propose amount", "राशि प्रस्तावित करें", "रक्कम सुचवा")}</button>}
    {proposals.map((p) => <div className="record-card" key={s(p, "id")}>
      <strong>{money(s(p, "amountPaise"))}/{t("quintal", "क्विंटल", "क्विंटल")}</strong> · <Badge value={s(p, "status")} /><p>{s(p, "reason")}</p>
      {!locked && s(p, "status") === "pending" && s(p, "proposerId") !== uid && <div className="actions">{(["accepted", "rejected"] as const).map((decision) => <button className="secondary small" key={decision} onClick={() => open({ title: decision === "accepted" ? t("Accept tolerance and update total", "राशि स्वीकार करें और कुल बदलें", "रक्कम स्वीकारून एकूण बदला") : t("Reject tolerance", "प्रस्ताव अस्वीकार करें", "प्रस्ताव नाकारा"), action: "tolerance.respond", fixed: { id: s(p, "id"), decision }, fields: [] })}>{decision === "accepted" ? t("Accept", "स्वीकार", "स्वीकारा") : t("Reject", "अस्वीकार", "नाकारा")}</button>)}</div>}
    </div>)}
  </section>;
}
