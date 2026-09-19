"use client";
import { useEffect, useState } from "react";
import { schemeCatalogue } from "@/lib/schemes";
import { local } from "@/lib/locale";

export default function SchemeCarousel({ locale }: { locale: string }) {
  const schemes = schemeCatalogue(locale).slice(0, 5);
  const [active, setActive] = useState(0);
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % schemes.length),
      3000,
    );
    return () => window.clearInterval(timer);
  }, [schemes.length]);
  const move = (step: number) =>
    setActive((value) => (value + step + schemes.length) % schemes.length);
  return (
    <section className="scheme-carousel farmer-hero" aria-roledescription="carousel">
      {schemes.map((scheme, index) => (
        <article
          className={index === active ? "scheme-slide active" : "scheme-slide"}
          aria-hidden={index !== active}
          key={scheme.id}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scheme.image} alt="" />
          <div className="scheme-slide-copy">
            <span>{t("Government farmer scheme", "सरकारी किसान योजना", "शासकीय शेतकरी योजना")}</span>
            <h1>{scheme.name}</h1>
            <p>{scheme.point}</p>
            <a href={scheme.url} target="_blank" rel="noopener noreferrer">
              {t("Visit official scheme portal", "आधिकारिक योजना पोर्टल देखें", "अधिकृत योजना पोर्टल पहा")} →
            </a>
          </div>
        </article>
      ))}
      <button className="carousel-control previous" onClick={() => move(-1)} aria-label={t("Previous scheme", "पिछली योजना", "मागील योजना")}>‹</button>
      <button className="carousel-control next" onClick={() => move(1)} aria-label={t("Next scheme", "अगली योजना", "पुढील योजना")}>›</button>
      <div className="carousel-dots">
        {schemes.map((scheme, index) => (
          <button key={scheme.id} className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-label={`${t("Show", "दिखाएँ", "दाखवा")} ${scheme.name}`} />
        ))}
      </div>
    </section>
  );
}
