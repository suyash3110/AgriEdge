export const locales = ["en", "hi", "mr"] as const;
export type Locale = (typeof locales)[number];
export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
export function local(locale: string, en: string, hi: string, mr: string) {
  return locale === "mr" ? mr : locale === "hi" ? hi : en;
}
export const languageNames = { en: "English", hi: "हिन्दी", mr: "मराठी" };
export const pilot = (locale: string) =>
  local(
    locale,
    "Nagpur, Maharashtra",
    "नागपुर, महाराष्ट्र",
    "नागपूर, महाराष्ट्र",
  );
export const services = (locale: string) =>
  local(
    locale,
    "Agriculture market services",
    "कृषि बाजार सेवाएँ",
    "कृषी बाजार सेवा",
  );
