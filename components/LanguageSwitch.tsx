"use client";
import { usePathname } from "next/navigation";
import { languageNames, locales, local } from "@/lib/locale";
export default function LanguageSwitch({ locale }: { locale: string }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(en|hi|mr)(?=\/|$)/, "");
  return (
    <nav
      className="language-switch"
      aria-label={local(locale, "Language", "भाषा", "भाषा")}
    >
      {locales.map((l) => (
        <a
          key={l}
          href={"/" + l + rest}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
        >
          {languageNames[l]}
        </a>
      ))}
    </nav>
  );
}
