"use client";
import { useLocale } from "next-intl";
import { useCopyDictionary } from "./CopyProvider";
import { uiCopy } from "@/lib/ui-copy";
export function useCopy() {
  const locale = useLocale();
  const dictionary = useCopyDictionary();
  return (text: string) => uiCopy(locale, text, dictionary);
}
export function useDate() {
  const locale = useLocale();
  const copy = useCopy();
  return (value: unknown) =>
    value
      ? new Intl.DateTimeFormat(locale + "-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        }).format(new Date(String(value)))
      : copy("Not available");
}
