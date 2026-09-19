"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicHeader from "./PublicHeader";
import { local } from "@/lib/locale";
export default function Login({
  locale,
  demo,
}: {
  locale: string;
  demo: boolean;
}) {
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  const router = useRouter();
  const [phone, setPhone] = useState(""),
    [code, setCode] = useState(""),
    [challenge, setChallenge] = useState(""),
    [demoCode, setDemoCode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function send(action: "request" | "verify") {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/v1/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, phone, code, challengeId: challenge }),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(
          r.status === 429
            ? t(
                "Too many requests. Please wait before trying again.",
                "बहुत अधिक अनुरोध। दोबारा कोशिश करने से पहले रुकें।",
                "खूप विनंत्या झाल्या आहेत. पुन्हा प्रयत्न करण्यापूर्वी थांबा.",
              )
            : t(
                "Check your mobile number or OTP and try again.",
                "मोबाइल नंबर या OTP जाँचकर फिर कोशिश करें।",
                "मोबाइल क्रमांक किंवा OTP तपासून पुन्हा प्रयत्न करा.",
              ),
        );
      if (action === "request") {
        setChallenge(d.data.challengeId);
        setDemoCode(d.data.demoCode || "");
        setCode("");
      } else {
        router.push("/" + locale + "/dashboard");
        router.refresh();
      }
    } catch (e) {
      setError(
        e instanceof TypeError
          ? t(
              "Connection unavailable. Please try again.",
              "कनेक्शन उपलब्ध नहीं है। फिर कोशिश करें।",
              "जोडणी उपलब्ध नाही. पुन्हा प्रयत्न करा.",
            )
          : e instanceof Error
            ? e.message
            : t(
                "Request failed",
                "अनुरोध पूरा नहीं हुआ",
                "विनंती पूर्ण झाली नाही",
              ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PublicHeader locale={locale} login />
      <main className="login-only">
        <section className="panel login-panel">
          <div className="panel-heading">
            <h1>
              {t(
                "Sign in to AgriEdge",
                "AgriEdge में प्रवेश",
                "AgriEdge मध्ये प्रवेश",
              )}
            </h1>
            <p>
              {t(
                "Access your account with a mobile OTP",
                "मोबाइल OTP से अपने खाते में प्रवेश करें",
                "मोबाइल OTP वापरून तुमच्या खात्यात प्रवेश करा",
              )}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(challenge ? "verify" : "request");
            }}
          >
            <label htmlFor="phone">
              {t("Mobile number", "मोबाइल नंबर", "मोबाइल क्रमांक")}
            </label>
            <div className="phone-input">
              <span>+91</span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setChallenge("");
                  setDemoCode("");
                  setCode("");
                }}
                required
                placeholder={t(
                  "10-digit mobile number",
                  "10 अंकों का मोबाइल नंबर",
                  "10 अंकी मोबाइल क्रमांक",
                )}
              />
            </div>
            {challenge && (
              <>
                <label htmlFor="otp">
                  {t(
                    "One-time password",
                    "एक बार का पासवर्ड",
                    "एकवेळचा पासवर्ड",
                  )}
                </label>
                <input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  pattern="[0-9]{6}"
                  required
                  maxLength={6}
                />
                {demoCode && (
                  <div className="notice">
                    <strong>
                      {t("Demo OTP inbox:", "परीक्षण OTP:", "चाचणी OTP:")}{" "}
                      {demoCode}
                    </strong>
                    <p>
                      {t(
                        "No SMS was sent. This code expires in 5 minutes.",
                        "SMS नहीं भेजा गया। यह कोड 5 मिनट में समाप्त होगा।",
                        "SMS पाठवलेला नाही. हा कोड 5 मिनिटांनी कालबाह्य होईल.",
                      )}
                    </p>
                  </div>
                )}
              </>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="full" disabled={busy}>
              {busy
                ? t("Please wait…", "कृपया प्रतीक्षा करें…", "कृपया थांबा…")
                : challenge
                  ? t(
                      "Verify & sign in",
                      "OTP सत्यापित करें",
                      "OTP तपासून प्रवेश करा",
                    )
                  : t("Get OTP", "OTP प्राप्त करें", "OTP मिळवा")}
            </button>
            {challenge && (
              <button
                type="button"
                className="secondary full"
                disabled={busy}
                onClick={() => void send("request")}
              >
                {t("Request a new OTP", "नया OTP माँगें", "नवीन OTP मागवा")}
              </button>
            )}
          </form>
          {demo && (
            <details>
              <summary>
                {t("Test accounts", "परीक्षण खाते", "चाचणी खाती")}
              </summary>
              <div className="demo-accounts">
                {[
                  t("Farmer 1", "किसान 1", "शेतकरी 1"),
                  t("Farmer 2", "किसान 2", "शेतकरी 2"),
                  "FPO",
                  t("Buyer 1", "खरीदार 1", "खरेदीदार 1"),
                  t("Buyer 2", "खरीदार 2", "खरेदीदार 2"),
                  t("Transporter", "परिवहनकर्ता", "वाहतूकदार"),
                  t("Administrator", "प्रशासक", "प्रशासक"),
                ].map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    className="account-option"
                    onClick={() => {
                      setPhone("900000000" + (i + 1));
                      setChallenge("");
                      setCode("");
                      setDemoCode("");
                    }}
                  >
                    {label}
                    <span>{"900000000" + (i + 1)}</span>
                  </button>
                ))}
              </div>
            </details>
          )}
          <Link className="login-home" prefetch={false} href={"/" + locale}>
            {t(
              "← Back to home",
              "← मुख्य पृष्ठ पर जाएँ",
              "← मुख्य पृष्ठावर जा",
            )}
          </Link>
        </section>
      </main>
    </>
  );
}
