import { schemeCatalogue } from "@/lib/schemes";
import { local } from "@/lib/locale";
export default function SchemeDirectory({ locale }: { locale: string }) {
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  return (
    <section id="schemes" className="landing-section">
      <h2>
        {t(
          "Kisan Kalyan Schemes: Government Benefits & Initiatives",
          "किसान कल्याण योजनाएँ: सरकारी लाभ और पहल",
          "शेतकरी कल्याण योजना: शासकीय लाभ आणि उपक्रम",
        )}
      </h2>
      <p className="section-intro">
        {t(
          "Explore support for agriculture. Each link opens the official portal for current eligibility and applications.",
          "कृषि सहायता देखें। हर लिंक वर्तमान पात्रता और आवेदन के लिए आधिकारिक पोर्टल खोलता है।",
          "शेतीसाठी उपलब्ध मदत पहा. प्रत्येक दुवा सध्याची पात्रता आणि अर्जासाठी अधिकृत पोर्टल उघडतो.",
        )}
      </p>
      {[false, true].map((state) => (
        <div className="scheme-group" key={String(state)}>
          <h3>
            {state
              ? t(
                  "Maharashtra schemes · Nagpur pilot",
                  "महाराष्ट्र योजनाएँ · नागपुर पायलट",
                  "महाराष्ट्र योजना · नागपूर पथदर्शी प्रकल्प",
                )
              : t("National schemes", "राष्ट्रीय योजनाएँ", "राष्ट्रीय योजना")}
          </h3>
          <div className="scheme-grid">
            {schemeCatalogue(locale)
              .filter((s) => s.state === state)
              .map((s) => (
                <article className="scheme-card" key={s.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.image}
                    alt=""
                  />
                  <div>
                    <h4>{s.name}</h4>
                    <p>{s.point}</p>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {t("View details ↗", "विवरण देखें ↗", "तपशील पहा ↗")}
                      <span className="sr-only"> — {s.name}</span>
                    </a>
                  </div>
                </article>
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}
