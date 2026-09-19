import { marketCopy } from "./market-copy";
export function uiCopy(
  locale: string,
  text: string,
  dictionary: Record<string, string> = {},
): string {
  const key = text.replace(/\s+/g, " ").trim();
  const translated = dictionary[key] ?? marketCopy(locale, key);
  return (
    (text.startsWith(" ") ? " " : "") +
    translated +
    (text.endsWith(" ") ? " " : "")
  );
}
