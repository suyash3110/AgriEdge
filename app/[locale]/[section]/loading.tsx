"use client";
import { useLocale } from "next-intl";
import { local } from "@/lib/locale";
export default function Loading() {
  const locale = useLocale();
  return (
    <main className="standalone" aria-busy="true">
      <h1>AgriEdge</h1>
      <p>
        {local(
          locale,
          "Loading your records…",
          "आपकी नोंदें खुल रही हैं…",
          "तुमच्या नोंदी उघडत आहेत…",
        )}
      </p>
    </main>
  );
}
