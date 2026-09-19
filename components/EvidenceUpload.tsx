"use client";
import { useCopy } from "./useCopy";

import { useState } from "react";
export default function EvidenceUpload({ contextId }: { contextId: string }) {
  const copy = useCopy();
  const [busy, setBusy] = useState(false),
    [result, setResult] = useState(""),
    [fileId, setFileId] = useState("");
  async function upload(file: File) {
    setBusy(true);
    try {
      if (file.size > 5242880) throw new Error("Maximum size is 5 MB.");
      const r = await fetch(
        "/api/v1/files?contextId=" + encodeURIComponent(contextId),
        { method: "POST", headers: { "Content-Type": file.type }, body: file },
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error.message);
      setFileId(d.data.id);
      setResult(copy("Private evidence saved. Reference:") + " " + d.data.id);
    } catch (e) {
      setResult(
        copy(
          e instanceof Error && e.message === "Maximum size is 5 MB."
            ? e.message
            : "Upload failed. Please check the file and try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details style={{ marginTop: 16 }}>
      <summary style={{ cursor: "pointer", minHeight: 44 }}>
        {copy(" Attach private evidence / प्रमाण संलग्न करें ")}
      </summary>
      <p className="muted">
        {copy(
          " JPEG, PNG or PDF, up to 5 MB. Authorized participants only. Photos do not certify quality. ",
        )}
      </p>
      <input
        aria-label={copy("Evidence file")}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {result && (
        <p role="status" className="muted">
          {result}
        </p>
      )}
      {fileId && (
        <a href={"/api/v1/files?id=" + fileId}>
          {copy("Download saved evidence")}
        </a>
      )}
    </details>
  );
}
