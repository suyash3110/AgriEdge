import { local } from "@/lib/locale";
import type { Field } from "./ActionDialog";
import { crops } from "@/lib/domain";
import type { Row } from "@/lib/portal-data";
import { s } from "./ui";
export const field = (
  name: string,
  label: string,
  value = "",
  type = "text",
  required = true,
): Field => ({ name, label, value, type, required });
export const select = (
  name: string,
  label: string,
  options: string[],
  value = "",
  required = true,
): Field => ({
  name,
  label,
  translateOptions: true,
  options: options.map((v) => ({ value: v, label: v.replaceAll("_", " ") })),
  value,
  required,
});
export const records = (
  name: string,
  label: string,
  rows: Row[],
  labelKey: string,
): Field => ({
  name,
  label,
  options: rows.map((r) => ({
    value: s(r, "id"),
    label: s(r, labelKey) || s(r, "id"),
  })),
});
export const cropField = () =>
  select("crop", "Crop / फसल", [...crops], "wheat");
export const today = () => new Date().toISOString().slice(0, 10);
export const future = () =>
  new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
export const reason = () =>
  field("reason", "Reason / supporting evidence", "", "textarea");
export const lotFields = (locale = "en"): Field[] => [
  field("title", "Listing title / उपज का नाम"),
  cropField(),
  select("category", "Category", ["produce", "residue"], "produce"),
  field("kg", "Quantity (kg) / वजन", "", "decimal"),
  field("rate", "Expected price (₹ / quintal)", "", "decimal"),
  field(
    "location",
    "Collection area",
    local(locale, "Nagpur", "नागपुर", "नागपूर"),
  ),
  field("harvestDate", "Harvest date", today(), "date"),
  field("availableDate", "Available from", today(), "date"),
  field("deadline", "Bidding deadline", future(), "date"),
  field(
    "material",
    "Residue material (required for residue)",
    "",
    "text",
    false,
  ),
  field("form", "Residue form: loose / baled", "", "text", false),
  field("intendedUse", "Intended use (residue)", "", "text", false),
  field(
    "contamination",
    "Contamination / measured moisture information",
    "",
    "text",
    false,
  ),
];
