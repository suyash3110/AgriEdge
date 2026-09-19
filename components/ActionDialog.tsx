"use client";
import QualityImageCheck from "./QualityImageCheck";
import { useCopy } from "./useCopy";
import { formError } from "@/lib/form-copy";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
export type Field = {
  name: string;
  label: string;
  type?: string;
  value?: string | boolean;
  options?: { value: string; label: string }[];
  translateOptions?: boolean;
  required?: boolean;
  wide?: boolean;
};
export type ActionSpec = {
  title: string;
  action: string;
  fields: Field[];
  fixed?: Record<string, unknown>;
  description?: string;
  descriptionHi?: string;
  descriptionMr?: string;
  submit?: string;
};
export default function ActionDialog({
  spec,
  onClose,
  onSuccess,
}: {
  spec: ActionSpec;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const copy = useCopy();
  const description =
    locale === "mr" && spec.descriptionMr
      ? spec.descriptionMr
      : locale === "hi" && spec.descriptionHi
        ? spec.descriptionHi
        : spec.description
          ? copy(spec.description)
          : undefined;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [crop, setCrop] = useState(
    String(spec.fields.find((f) => f.name === "crop")?.value || "wheat"),
  );
  const [category, setCategory] = useState("produce");
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const key = useRef(crypto.randomUUID());
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  async function submit(form: HTMLFormElement) {
    setBusy(true);
    setError("");
    const values = new FormData(form);
    const payload: Record<string, unknown> = { ...spec.fixed };
    for (const field of spec.fields) {
      payload[field.name] =
        field.type === "checkbox"
          ? values.get(field.name) === "on"
          : values.get(field.name) || undefined;
    }
    if (spec.action === "lot.create") payload.assessmentId = assessmentId;
    try {
      const r = await fetch("/api/v1/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key.current,
        },
        body: JSON.stringify({ action: spec.action, payload }),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(
          formError(
            locale,
            d.error?.code,
            d.error?.message || "Request failed",
          ),
        );
      onSuccess(
        d.data?.demoCode
          ? locale === "mr"
            ? `चाचणी हस्तांतरण OTP: ${d.data.demoCode} — 5 मिनिटांनी कालबाह्य होईल. माल सुपूर्द करतानाच द्या.`
            : locale === "hi"
              ? `प्रदर्शन हस्तांतरण OTP: ${d.data.demoCode} — 5 मिनट में समाप्त होगा। केवल हस्तांतरण के समय साझा करें।`
              : "Demo handover OTP: " +
                d.data.demoCode +
                " — expires in 5 minutes. Share only at handover."
          : spec.action === "bid.create"
            ? copy("Bid submitted; the seller has not accepted yet.")
            : spec.action === "booking.request"
              ? copy("Booking request sent. Space is not yet confirmed.")
              : copy("Saved successfully. Records have been refreshed."),
      );
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e instanceof TypeError
            ? copy("Connection unavailable. Your input is preserved.")
            : e.message
          : copy("Connection unavailable. Your input is preserved."),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        if (busy || imageBusy) e.preventDefault();
        else onClose();
      }}
      aria-labelledby="action-title"
    >
      <h2 id="action-title">{copy(spec.title)}</h2>
      {description && <p className="notice info">{description}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(e.currentTarget);
        }}
      >
        <div className="form-grid">
          {spec.fields.map((f) => (
            <div key={f.name} className={f.wide ? "wide" : ""}>
              {f.type === "checkbox" ? (
                <label className="checkbox-label">
                  <input
                    name={f.name}
                    type="checkbox"
                    required={f.required !== false}
                    defaultChecked={f.value === true}
                  />
                  {copy(f.label)}
                </label>
              ) : (
                <>
                  <label htmlFor={"field-" + f.name}>
                    {copy(f.label)}
                    {f.required === false ? copy(" (optional)") : ""}
                  </label>
                  {f.options ? (
                    <select
                      id={"field-" + f.name}
                      name={f.name}
                      onChange={(e) => {
                        if (f.name === "crop") {
                          setCrop(e.target.value);
                          setAssessmentId(null);
                        }
                        if (f.name === "category") {
                          setCategory(e.target.value);
                          setAssessmentId(null);
                        }
                      }}
                      disabled={imageBusy}
                      required={f.required !== false}
                      defaultValue={String(f.value || "")}
                    >
                      <option value="">{copy("Select…")}</option>
                      {f.options.map((o) => (
                        <option value={o.value} key={o.value}>
                          {f.translateOptions ? copy(o.label) : o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      id={"field-" + f.name}
                      name={f.name}
                      required={f.required !== false}
                      defaultValue={String(f.value || "")}
                      maxLength={2000}
                    />
                  ) : (
                    <input
                      id={"field-" + f.name}
                      name={f.name}
                      type={f.type === "decimal" ? "text" : f.type || "text"}
                      inputMode={f.type === "decimal" ? "decimal" : undefined}
                      required={f.required !== false}
                      defaultValue={String(f.value || "")}
                      maxLength={300}
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        {spec.action === "lot.create" && (
          <QualityImageCheck
            key={crop + category}
            cropOverride={crop}
            category={category}
            onAssessed={setAssessmentId}
            onBusy={setImageBusy}
          />
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button
            type="button"
            className="secondary"
            disabled={busy || imageBusy}
            onClick={onClose}
          >
            {t("cancel")}
          </button>
          <button
            disabled={
              busy ||
              imageBusy ||
              (spec.action === "lot.create" && !assessmentId)
            }
          >
            {busy
              ? t("saving")
              : spec.submit
                ? copy(spec.submit)
                : t("confirm")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
