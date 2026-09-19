"use client";
import { useCopy } from "./useCopy";
import { sectionAllowed } from "@/lib/access";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { PortalData } from "@/lib/portal-data";
import { navigation } from "@/lib/navigation";
import { navName, roleName } from "@/lib/navigation-copy";
import { local, pilot, services } from "@/lib/locale";
import { s, Badge } from "./ui";
import dynamic from "next/dynamic";
import type { ActionSpec } from "./ActionDialog";
import Dashboard from "./Dashboard";
import LanguageSwitch from "./LanguageSwitch";
import VoiceAssistant from "./VoiceAssistant";
const ActionDialog = dynamic(() => import("./ActionDialog"));
const ModuleView = dynamic(() => import("./ModuleView"));
export default function Portal({
  data,
  locale,
  section,
  page,
}: {
  data: PortalData;
  locale: string;
  section: string;
  page: number;
}) {
  const copy = useCopy();
  const t = useTranslations("common");
  const c = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  const router = useRouter(),
    role = s(data.user, "role");
  const [menu, setMenu] = useState(false),
    [offline, setOffline] = useState(false),
    [spec, setSpec] = useState<ActionSpec | null>(null),
    [notice, setNotice] = useState("");
  const nav = (navigation[role] || []).filter((x) =>
    sectionAllowed(
      {
        role,
        permissions: Array.isArray(data.user.permissions)
          ? (data.user.permissions as string[])
          : [],
      },
      x[0],
    ),
  );
  const entry = nav.find((x) => x[0] === section);
  const title = entry
    ? navName(locale, ...entry)
    : c("Service unavailable", "सेवा उपलब्ध नहीं है", "सेवा उपलब्ध नाही");
  const base = "/" + locale + "/";
  useEffect(() => {
    const change = () => setOffline(!navigator.onLine);
    change();
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    const poll = setInterval(() => {
      if (
        !document.hidden &&
        navigator.onLine &&
        !document.querySelector("dialog[open]")
      )
        router.refresh();
    }, 30000);
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
      clearInterval(poll);
    };
  }, [router]);
  async function logout() {
    await fetch("/api/v1/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push(base + "login");
    router.refresh();
  }
  return (
    <>
      <a href="#main" className="skip-link">
        {t("skip")}
      </a>
      <div className="utility">
        <span>
          {pilot(locale)} · {services(locale)}
        </span>
        <LanguageSwitch locale={locale} />
      </div>
      <header className="brand">
        <Link href={"/" + locale} prefetch={false}>
          <Image
            className="new-logo"
            src="/images/agriedge-logo.jpg"
            alt="AgriEdge"
            width={52}
            height={57}
            priority
          />
        </Link>
        <div>
          <strong>AgriEdge</strong>
          <p>{services(locale)}</p>
        </div>
        <div className="account-info">
          <strong>{copy(s(data.user, "name"))}</strong>
          <p>
            {roleName(locale, role)} · <Badge value={s(data.user, "status")} />
          </p>
        </div>
      </header>
      <div className="portal-hero" aria-hidden="true">
        <Image src="/images/firstpage.png" alt="" width={1600} height={360} priority />
      </div>
      <div className="nav-band">
        <div>
          {c(
            "AGRICULTURE SERVICES PORTAL",
            "कृषि सेवा पोर्टल",
            "कृषी सेवा पोर्टल",
          )}
        </div>
        <span>
          {c(
            "NAGPUR PILOT · MAHARASHTRA",
            "नागपुर पायलट · महाराष्ट्र",
            "नागपूर पथदर्शी प्रकल्प · महाराष्ट्र",
          )}
        </span>
        <button
          className="mobile-menu"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? t("closeMenu") : "☰ " + t("menu")}
        </button>
      </div>
      <div className="reference-divider" />
      {offline && (
        <div className="offline" role="status">
          {c(
            "Offline — reconnect before submitting changes.",
            "ऑफ़लाइन — बदलाव भेजने से पहले कनेक्शन जोड़ें।",
            "ऑफलाइन — बदल पाठवण्यापूर्वी जोडणी करा.",
          )}
        </div>
      )}
      <div className="workspace">
        <aside className={"sidebar " + (menu ? "open" : "")}>
          <p className="sidebar-label">{t("services")}</p>
          <nav
            aria-label={c(
              "Service navigation",
              "सेवा नेविगेशन",
              "सेवा मार्गदर्शन",
            )}
          >
            {nav.map(([key, en, hi], i) => (
              <Link
                prefetch={false}
                href={base + key}
                key={key}
                className={section === key ? "active" : ""}
                aria-current={section === key ? "page" : undefined}
              >
                <span className="nav-mark" aria-hidden="true">
                  {["▦", "♙", "≡", "▤", "↗", "◎", "✓", "▥", "⇄", "▱"][i % 10]}
                </span>
                {navName(locale, key, en, hi)}
                {key === "notifications" && data.counts.notifications > 0 && <span className="unread-count">{data.counts.notifications > 99 ? "99+" : data.counts.notifications}</span>}
                {key === "messages" && data.counts.messages > 0 && <span className="unread-count">{data.counts.messages > 99 ? "99+" : data.counts.messages}</span>}
              </Link>
            ))}
          </nav>
          <div className="support" id="help">
            <strong>{t("support")}</strong>
            <p>{t("supportText")}</p>
            <button className="secondary small" onClick={() => void logout()}>
              {t("signOut")}
            </button>
          </div>
        </aside>
        <main className="content" id="main" lang={locale}>
          <div className="breadcrumb">
            AgriEdge <span>›</span> {roleName(locale, role)} <span>›</span>{" "}
            {title}
          </div>
          <div className="page-heading">
            <div>
              <h1>{title}</h1>
              <p>
                {section === "dashboard"
                  ? c(
                      "Your produce, opportunities and pending actions at a glance.",
                      "आपकी उपज और सेवाओं का एक साथ अवलोकन।",
                      "तुमचा शेतमाल, संधी आणि प्रलंबित कृती एकाच ठिकाणी.",
                    )
                  : c(
                      "Review your records and take the next step.",
                      "अपने रिकॉर्ड देखें और अगला कदम लें।",
                      "तुमच्या नोंदी पाहून पुढचे पाऊल उचला.",
                    )}
              </p>
            </div>
            <div className="actions">
              {section === "dashboard" && ["farmer", "fpo"].includes(role) && (
                <Link
                  prefetch={false}
                  className="service-card"
                  href={base + "lots"}
                >
                  ＋ {c("Sell produce", "उपज बेचें", "शेतमाल विका")}
                </Link>
              )}
              <button
                className="secondary small"
                onClick={() => router.refresh()}
              >
                {t("refresh")}
              </button>
            </div>
          </div>
          {notice && (
            <div className="success" role="status">
              {notice}
            </div>
          )}
          {s(data.user, "status") !== "approved" && (
            <div className="notice">
              {c(
                "Account verification is pending. Trading requires approval.",
                "खाते का सत्यापन बाकी है। व्यापार के लिए स्वीकृति आवश्यक है।",
                "खाते सत्यापन बाकी आहे. व्यापारासाठी मंजुरी आवश्यक आहे.",
              )}
            </div>
          )}
          {!entry ? (
            <div className="notice">
              {c(
                "Your role cannot access this service.",
                "आपकी भूमिका को इस सेवा की अनुमति नहीं है।",
                "तुमच्या भूमिकेला या सेवेची परवानगी नाही.",
              )}
            </div>
          ) : section === "dashboard" ? (
            <Dashboard data={data} locale={locale} />
          ) : (
            <ModuleView
              data={data}
              section={section}
              locale={locale}
              open={setSpec}
              notify={setNotice}
            />
          )}
          <div className="pagination">
            {page > 1 && (
              <Link
                prefetch={false}
                href={base + section + "?page=" + (page - 1)}
              >
                {c("← Previous", "← पिछला", "← मागील")}
              </Link>
            )}
            {section === "lots" && data.counts.lots > page * 20 && (
              <Link
                prefetch={false}
                href={base + section + "?page=" + (page + 1)}
              >
                {c("Next →", "अगला →", "पुढील →")}
              </Link>
            )}
          </div>
        </main>
      </div>
      <VoiceAssistant locale={locale} />
      {spec && (
        <ActionDialog
          spec={spec}
          onClose={() => setSpec(null)}
          onSuccess={(m) => {
            setNotice(m);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
