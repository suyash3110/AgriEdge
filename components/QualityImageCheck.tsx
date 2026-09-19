"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { local } from "@/lib/locale";
type Result = { grade: string | null; assessmentId: string };
export default function QualityImageCheck({
  cropOverride,
  category = "produce",
  onAssessed,
  onBusy,
}: {
  cropOverride?: string;
  category?: string;
  onAssessed?: (id: string | null) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const locale = useLocale(),
    t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  const [crop, setCrop] = useState(cropOverride || "tomato"),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<Result | null>(null);
  function reset() {
    setResult(null);
    setError("");
    onAssessed?.(null);
  }
  async function check() {
    reset();
    if (
      !file ||
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 5242880
    ) {
      setError(
        t(
          "Choose a JPEG or PNG up to 5 MB.",
          "5 MB तक का JPEG या PNG चुनें।",
          "5 MB पर्यंतचा JPEG किंवा PNG निवडा.",
        ),
      );
      return;
    }
    setBusy(true);
    onBusy?.(true);
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const response = await fetch("/api/v1/quality-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop: cropOverride || crop, category, image }),
        signal: AbortSignal.timeout(70000),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.code || "UNAVAILABLE");
      setResult(body.data);
      onAssessed?.(body.data.assessmentId);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setError(
        code === "INVALID_IMAGE"
          ? t(
              "This image cannot be read. Choose a clear crop photo at least 64 pixels wide and high (16 for groundnut).",
              "यह फोटो पढ़ा नहीं जा सकता। कम से कम 64 पिक्सेल का स्पष्ट फोटो चुनें (मूंगफली के लिए 16)।",
              "हा फोटो वाचता येत नाही. किमान 64 पिक्सेलचा स्पष्ट फोटो निवडा (भुईमुगासाठी 16).",
            )
          : t(
              "The image check could not finish. Sign in if needed and try again shortly.",
              "फोटो जाँच पूरी नहीं हुई। आवश्यकता हो तो प्रवेश करें और फिर कोशिश करें।",
              "फोटो तपासणी पूर्ण झाली नाही. गरज असल्यास प्रवेश करा व पुन्हा प्रयत्न करा.",
            ),
      );
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          {t(
            "Check a crop photo",
            "फसल के फोटो की जाँच",
            "पिकाच्या फोटोची तपासणी",
          )}
        </h2>
      </div>
      <div className="panel-body" aria-busy={busy}>
        <p>
          {t(
            "Upload a clear crop photo. A/B/C is a provisional appearance grade. An FPO can inspect and revise it if you disagree.",
            "फसल का स्पष्ट फोटो डालें। A/B/C बाहरी रूप का अस्थायी ग्रेड है। असहमति होने पर FPO जाँच करके इसे बदल सकता है।",
            "पिकाचा स्पष्ट फोटो द्या. A/B/C हा बाह्य स्वरूपावरचा तात्पुरता दर्जा आहे. असहमती असल्यास FPO तपासून तो बदलू शकते.",
          )}
        </p>
        {!cropOverride && (
          <>
            <label htmlFor="quality-crop">{t("Crop", "फसल", "पीक")}</label>
            <select
              id="quality-crop"
              value={crop}
              disabled={busy}
              onChange={(e) => {
                setCrop(e.target.value);
                reset();
              }}
            >
              <option value="tomato">{t("Tomato", "टमाटर", "टोमॅटो")}</option>
              <option value="potato">{t("Potato", "आलू", "बटाटा")}</option>
              <option value="rice">
                {t(
                  "Rice — milled grain",
                  "चावल — मिल किया दाना",
                  "तांदूळ — सोललेला दाणा",
                )}
              </option>
              <option value="groundnut">
                {t(
                  "Groundnut — single kernel",
                  "मूंगफली — एक दाना",
                  "भुईमूग — एक दाणा",
                )}
              </option>
            </select>
          </>
        )}
        <p className="muted">
          {["rice", "paddy"].includes(crop)
            ? t(
                "Use a close-up of one milled rice grain. This model does not assess paddy plants or whole sacks.",
                "एक मिल किए चावल के दाने का नज़दीकी फोटो दें। मॉडल धान के पौधे या बोरी की जाँच नहीं करता।",
                "एका सोललेल्या तांदळाच्या दाण्याचा जवळून फोटो द्या. मॉडेल भाताचे रोप किंवा पोते तपासत नाही.",
              )
            : crop === "groundnut"
              ? t(
                  "Crop tightly around one peanut kernel.",
                  "फोटो में केवल एक मूंगफली का दाना रखें।",
                  "फोटोमध्ये जवळून फक्त एक भुईमुगाचा दाणा ठेवा.",
                )
              : t(
                  "Keep the crop in focus with even lighting.",
                  "समान रोशनी में फसल का साफ़ फोटो लें।",
                  "समान प्रकाशात पिकाचा स्पष्ट फोटो घ्या.",
                )}
        </p>
        <label htmlFor="quality-photo">
          {t(
            "Crop photo (JPEG/PNG, up to 5 MB)",
            "फसल का फोटो (JPEG/PNG, 5 MB तक)",
            "पिकाचा फोटो (JPEG/PNG, 5 MB पर्यंत)",
          )}
        </label>
        <input
          id="quality-photo"
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png"
          disabled={busy}
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            reset();
          }}
        />
        <label
          htmlFor="quality-photo"
          className="secondary"
          style={{ display: "inline-block", cursor: "pointer", marginTop: 12 }}
        >
          {t("Choose photo", "फोटो चुनें", "फोटो निवडा")}
        </label>
        <p className="muted">
          {file?.name ||
            t("No photo selected", "फोटो नहीं चुना गया", "फोटो निवडलेला नाही")}
        </p>
        <button
          type="button"
          disabled={busy || !file}
          onClick={() => void check()}
        >
          {busy
            ? t("Checking image…", "फोटो जाँच रहा है…", "फोटो तपासत आहे…")
            : t("Check image", "फोटो जाँचें", "फोटो तपासा")}
        </button>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        {result && (
          <div role="status" className="notice info">
            <strong>
              {t("Grade", "ग्रेड", "दर्जा")}:{" "}
              {result.grade ||
                t("Pending FPO review", "FPO जाँच बाकी", "FPO तपासणी बाकी")}
            </strong>
            <p>
              {t(
                "A: best visible appearance; B: intermediate; C: visible defects. This is not a certified trade or food-safety grade. Request manual assessment if you disagree.",
                "A: अच्छा बाहरी रूप; B: मध्यम; C: दिखने वाले दोष। यह प्रमाणित व्यापार या खाद्य सुरक्षा ग्रेड नहीं है। असहमति होने पर प्रत्यक्ष जाँच माँगें।",
                "A: चांगले बाह्य स्वरूप; B: मध्यम; C: दिसणारे दोष. हा प्रमाणित व्यापार किंवा अन्नसुरक्षा दर्जा नाही. असहमती असल्यास प्रत्यक्ष तपासणी मागा.",
              )}
            </p>
          </div>
        )}
        <p className="muted">
          {t(
            "Your photo is saved privately with the assessment. Unsupported crops need FPO review.",
            "आपका फोटो जाँच के साथ निजी रूप से सहेजा जाता है। असमर्थित फसलों के लिए FPO जाँच चाहिए।",
            "तुमचा फोटो तपासणीसोबत खाजगीपणे जतन केला जातो. असमर्थित पिकांसाठी FPO तपासणी आवश्यक आहे.",
          )}
        </p>
      </div>
    </section>
  );
}
