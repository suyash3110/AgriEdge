import { useCopy } from "./useCopy";
import type { Row } from "@/lib/portal-data";
export const s = (r: Row, key: string) =>
  r[key] == null ? "" : String(r[key]);
export const n = (r: Row, key: string) => Number(r[key] || 0);
export const date = (value: unknown) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(String(value)))
    : "Not available";
export function Badge({ value }: { value: string }) {
  const copy = useCopy();
  return (
    <span
      className={
        "badge " +
        ([
          "approved",
          "open",
          "accepted",
          "captured",
          "confirmed",
          "ready",
          "inspected",
        ].includes(value)
          ? "good"
          : ["pending", "requested", "draft", "unpaid", "assigned"].includes(
                value,
              )
            ? "warn"
            : "")
      }
    >
      {copy(value.replaceAll("_", " "))}
    </span>
  );
}
export function Empty({
  title = "No records yet",
  description = "Records will appear here when the corresponding service is used.",
}: {
  title?: string;
  description?: string;
}) {
  const copy = useCopy();
  return (
    <div className="empty">
      <strong>{copy(title)}</strong>
      <p>{copy(description)}</p>
    </div>
  );
}
export function Table({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty?: boolean;
}) {
  const copy = useCopy();
  return empty ? (
    <Empty />
  ) : (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{copy(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
