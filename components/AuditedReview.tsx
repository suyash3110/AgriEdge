"use client";
import { useCopy, useDate } from "./useCopy";

import { useState } from "react";
import { s, Empty } from "./ui";
import type { Row } from "@/lib/portal-data";
export default function AuditedReview() {
  const copy = useCopy();
  const date = useDate();
  const [reason, setReason] = useState(""),
    [rows, setRows] = useState<Row[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function review() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/v1/investigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setRows(b.data);
    } catch {
      setError(copy("Unable to open review."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{copy("Reported message investigation")}</h2>
      </div>
      <div className="panel-body">
        <p className="notice">
          {copy(
            " Opening sensitive reported messages records your identity, reason and time in the audit history. ",
          )}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void review();
          }}
        >
          <label htmlFor="investigation-reason">
            {copy("Investigation reason")}
          </label>
          <textarea
            id="investigation-reason"
            minLength={10}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <button disabled={busy} style={{ marginTop: 16 }}>
            {copy(" Open audited review ")}
          </button>
        </form>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
      {rows &&
        (rows.length ? (
          rows.map((r) => (
            <article className="message" key={s(r, "id")}>
              <small>
                {s(r, "senderId")} · {date(r.createdAt)}
              </small>
              <p>{s(r, "body")}</p>
            </article>
          ))
        ) : (
          <Empty title={copy("No reported messages")} />
        ))}
    </section>
  );
}
