import { useCopy } from "./useCopy";
import SellingGuidance from "./SellingGuidance";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { PortalData } from "@/lib/portal-data";
import { s, Badge, Empty } from "./ui";
import { money } from "@/lib/domain";
import { local } from "@/lib/locale";
import { roleName } from "@/lib/navigation-copy";
export default function Dashboard({
  data,
  locale,
}: {
  data: PortalData;
  locale: string;
}) {
  const copy = useCopy();
  const t = useTranslations("common"),
    c = (en: string, hi: string, mr: string) => local(locale, en, hi, mr),
    base = "/" + locale + "/",
    role = s(data.user, "role");
  const values = [
    [
      c("Visible lots", "मेरी उपज", "माझा शेतमाल"),
      data.counts.lots,
      t("lotsDetail"),
    ],
    [
      c("Active offers", "सक्रिय बोलियाँ", "सक्रिय बोली"),
      data.counts.bids,
      t("bidsDetail"),
    ],
    [t("transactions"), data.counts.agreements, t("agreementsDetail")],
    [t("unreadNotices"), data.counts.notifications, t("noticesDetail")],
  ];
  const quick =
    role === "admin"
      ? [
          [
            "users",
            "✓",
            c("Verify accounts", "खातों का सत्यापन", "खाते सत्यापन"),
            c("Review participants", "प्रतिभागियों की समीक्षा", "सहभागी तपासा"),
          ],
          [
            "imports",
            "≡",
            c("Market imports", "मंडी डेटा आयात", "बाजार माहिती आयात"),
            c("Review CSV source", "CSV स्रोत देखें", "CSV स्रोत पहा"),
          ],
          [
            "disputes",
            "!",
            c("Resolve disputes", "विवाद समाधान", "तक्रार निवारण"),
            c("Review reported issues", "शिकायतें देखें", "तक्रारी पहा"),
          ],
        ]
      : role === "transporter"
        ? [
            [
              "transport",
              "▱",
              c("Available jobs", "उपलब्ध काम", "उपलब्ध कामे"),
              c(
                "Find and quote for transport",
                "परिवहन काम खोजें और प्रस्ताव दें",
                "वाहतुकीचे काम शोधा आणि प्रस्ताव द्या",
              ),
            ],
            [
              "vehicles",
              "▤",
              c("My vehicles", "मेरे वाहन", "माझी वाहने"),
              c(
                "Manage carrying capacity",
                "वाहन क्षमता प्रबंधन",
                "वाहन क्षमता व्यवस्थापन",
              ),
            ],
            [
              "earnings",
              "₹",
              c("Earnings", "कमाई", "कमाई"),
              c(
                "Quoted and pending amounts",
                "प्रस्तावित और लंबित राशि",
                "प्रस्तावित आणि प्रलंबित रक्कम",
              ),
            ],
          ]
        : role === "buyer"
          ? [
              [
                "lots",
                "▤",
                c("Discover produce", "उपज खोजें", "शेतमाल शोधा"),
                c(
                  "Compare full-lot listings",
                  "पूरी उपज की सूचियों की तुलना",
                  "संपूर्ण शेतमाल नोंदींची तुलना",
                ),
              ],
              [
                "demand",
                "＋",
                c("Post demand", "माँग दर्ज करें", "मागणी नोंदवा"),
                c(
                  "Find compatible supply",
                  "उपयुक्त आपूर्ति खोजें",
                  "योग्य पुरवठा शोधा",
                ),
              ],
              [
                "transactions",
                "⇄",
                c("My purchases", "मेरी खरीद", "माझी खरेदी"),
                c(
                  "Follow accepted agreements",
                  "स्वीकृत समझौते देखें",
                  "स्वीकारलेले करार पहा",
                ),
              ],
            ]
          : [
              ["lots", "▤", t("produceService"), t("produceDetail")],
              ["circles", "◎", t("circleService"), t("circleDetail")],
              ["warehouse", "▥", t("storageService"), t("storageDetail")],
            ];
  return (
    <>
      <div className="stats">
        {values.map(([label, value, detail]) => (
          <article className="stat" key={String(label)}>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <div>
          <section className="panel">
            <div className="panel-heading">
              <h2>
                {c(
                  "Your attention is needed",
                  "आपके ध्यान की आवश्यकता",
                  "तुमचे लक्ष आवश्यक आहे",
                )}
              </h2>
              <Link prefetch={false} href={base + "notifications"}>
                {t("viewInbox")}
              </Link>
            </div>
            {data.notifications.length ? (
              data.notifications.slice(0, 3).map((r, i) => (
                <article className="action-item" key={s(r, "id")}>
                  <div className="action-icon">{i === 0 ? "!" : "↗"}</div>
                  <div>
                    <h3>
                      {locale === "en"
                        ? s(r, "title")
                        : c(
                            "Record update available",
                            "रिकॉर्ड का नया विवरण उपलब्ध है",
                            "नोंदीचे अद्यतन उपलब्ध आहे",
                          )}
                    </h3>
                    <p>
                      {r.read
                        ? c("Read notice", "पढ़ी गई सूचना", "वाचलेली सूचना")
                        : c(
                            "Unread notice",
                            "नई सूचना",
                            "न वाचलेली सूचना",
                          )}{" "}
                      ·{" "}
                      {c(
                        "Check the linked record for its current status.",
                        "वर्तमान स्थिति के लिए संबंधित रिकॉर्ड देखें।",
                        "सध्याच्या स्थितीसाठी संबंधित नोंद पहा.",
                      )}
                    </p>
                  </div>
                  <Link prefetch={false} href={base + s(r, "href")}>
                    {t("review")}
                  </Link>
                </article>
              ))
            ) : (
              <Empty
                title={t("noNotices")}
                description={t("noNoticesDetail")}
              />
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>{c("Quick services", "मेरी सेवाएँ", "त्वरित सेवा")}</h2>
            </div>
            <div className="panel-body service-grid">
              {quick.map(([href, icon, label, detail]) => (
                <Link
                  prefetch={false}
                  className="service-card"
                  href={base + href}
                  key={href}
                >
                  <b aria-hidden="true">{icon}</b>
                  <strong>{label}</strong>
                  <span>{detail}</span>
                </Link>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>
                {role === "transporter"
                  ? c(
                      "Your transport service",
                      "आपकी परिवहन सेवा",
                      "तुमची वाहतूक सेवा",
                    )
                  : c("Produce overview", "उपज का अवलोकन", "शेतमालाचा आढावा")}
              </h2>
              <Link
                prefetch={false}
                href={base + (role === "transporter" ? "jobs" : "lots")}
              >
                {t("viewRecords")}
              </Link>
            </div>
            {role === "transporter" ? (
              <div className="panel-body">
                <p>
                  {roleName(locale, role)} · {data.jobs.length}{" "}
                  {c("jobs", "काम", "कामे")}
                </p>
              </div>
            ) : data.lots.length ? (
              data.lots.slice(0, 3).map((l) => (
                <article className="action-item" key={s(l, "id")}>
                  <div className="action-icon">▤</div>
                  <div>
                    <h3>{copy(s(l, "title"))}</h3>
                    <p>
                      {s(l, "kg")} {c("kg", "किग्रा", "किलो")} ·{" "}
                      {copy(s(l, "location"))} · {copy(s(l, "grade"))}
                    </p>
                  </div>
                  <Badge value={s(l, "status")} />
                </article>
              ))
            ) : (
              <Empty
                title={c(
                  "No produce records",
                  "उपज का रिकॉर्ड नहीं है",
                  "शेतमालाच्या नोंदी नाहीत",
                )}
                description={c(
                  "Your available listings will appear here.",
                  "आपकी उपलब्ध उपज यहाँ दिखेगी।",
                  "तुमचा उपलब्ध शेतमाल येथे दिसेल.",
                )}
              />
            )}
          </section>
        </div>
        <aside>
          <section className="panel">
            <div className="panel-heading">
              <h2>{c("Market observations", "मंडी भाव", "बाजारभाव")}</h2>
              {role === "farmer" && (
                <Link prefetch={false} href={base + "prices"}>
                  {t("viewAll")}
                </Link>
              )}
            </div>
            {data.prices.length ? (
              <div className="panel-body">
                <p className="muted">{t("samplePrices")}</p>
                {data.prices.slice(0, 3).map((r) => (
                  <div className="record-top" key={s(r, "id")}>
                    <span>{copy(s(r, "crop"))}</span>
                    <strong>
                      {copy(money(s(r, "modalPaise")))}
                      <small> /{c("quintal", "क्विंटल", "क्विंटल")}</small>
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title={c(
                  "Observations unavailable",
                  "भाव उपलब्ध नहीं हैं",
                  "भाव उपलब्ध नाहीत",
                )}
                description={c(
                  "Awaiting the configured CSV source.",
                  "निर्धारित CSV स्रोत की प्रतीक्षा है।",
                  "निर्धारित CSV स्रोताची प्रतीक्षा आहे.",
                )}
              />
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>
                {c(
                  "Plan a safe sale",
                  "सुरक्षित बिक्री",
                  "सुरक्षित विक्रीचे नियोजन",
                )}
              </h2>
            </div>
            <div className="panel-body">
              <a href={base + "prices"}>{c("Compare crop selling options", "फसल बिक्री विकल्पों की तुलना करें", "पीक विक्री पर्यायांची तुलना करा")}</a>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>
                {c(
                  "Service information",
                  "सेवा संबंधी जानकारी",
                  "सेवांची माहिती",
                )}
              </h2>
            </div>
            <div className="panel-body">
              <p className="muted">{t("verifyInfo")}</p>
              <p className="muted">{t("paymentInfo")}</p>
            </div>
          </section>
        </aside>
      </div>
      {role === "farmer" && <SellingGuidance prices={data.prices} asOf={data.asOf} />}
    </>
  );
}
