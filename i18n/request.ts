import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { isLocale } from "@/lib/locale";
import en from "../messages/en.json";
import hi from "../messages/hi.json";
import mr from "../messages/mr.json";
export default getRequestConfig(async () => {
  const value = (await headers()).get("x-agriedge-locale") || "en";
  const locale = isLocale(value) ? value : "en";
  return { locale, messages: { en, hi, mr }[locale], timeZone: "Asia/Kolkata" };
});
