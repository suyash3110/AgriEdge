"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { local } from "@/lib/locale";
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export default function VoiceAssistant({ locale }: { locale: string }) {
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  const [open, setOpen] = useState(false),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState(""),
    [link, setLink] = useState(""),
    [listening, setListening] = useState(false),
    [status, setStatus] = useState(""),
    [answering, setAnswering] = useState(false);
  const history = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const request = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    recognition = useRef<Recognition | null>(null),
    speech = useRef<SpeechSynthesisUtterance | null>(null),
    speechSequence = useRef({ generation: 0 });
  useEffect(() => {
    const sequenceState = speechSequence.current;
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
    return () => {
      sequenceState.generation++;
      request.current?.abort();
      recognition.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, [open, locale]);
  async function respond(input: string) {
    if (!input.trim()) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    window.speechSynthesis?.cancel();
    setQuestion(input);
    setAnswer("");
    setLink("");
    setAnswering(true);
    setStatus(
      t(
        "Thinking about your question…",
        "आपके प्रश्न का उत्तर तैयार हो रहा है…",
        "तुमच्या प्रश्नाचे उत्तर तयार होत आहे…",
      ),
    );
    try {
      const response = await fetch("/api/v1/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          stream: true,
          locale,
          history: history.current.slice(-6),
        }),
        signal: controller.signal,
      });
      let reply = "";
      if (
        response.ok &&
        response.headers
          .get("content-type")
          ?.includes("application/x-ndjson") &&
        response.body
      ) {
        const reader = response.body.getReader(),
          decoder = new TextDecoder();
        let pending = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            pending += decoder.decode(value, { stream: true });
            const lines = pending.split("\n");
            pending = lines.pop() || "";
            for (const line of lines) {
              if (!line.trim()) continue;
              const event = JSON.parse(line);
              if (event.error) throw new Error(event.error);
              if (event.delta) {
                reply += event.delta;
                setAnswer(reply);
                setStatus("");
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.code || "UNAVAILABLE");
        reply = body.data.answer;
      }
      if (controller.signal.aborted) return;
      if (!reply.trim()) throw new Error("EMPTY_ANSWER");
      setAnswer(reply);
      setStatus("");
      history.current = [
        ...history.current,
        { role: "user", content: input },
        { role: "assistant", content: reply },
      ].slice(-6) as typeof history.current;
      void speak(reply);
    } catch (error) {
      if (controller.signal.aborted) return;
      setAnswer("");
      setStatus(
        error instanceof Error && error.message === "BUSY"
          ? t(
              "The assistant is answering another question. Please try again shortly.",
              "सहायक दूसरे प्रश्न का उत्तर दे रहा है। थोड़ी देर बाद फिर कोशिश करें।",
              "सहाय्यक दुसऱ्या प्रश्नाचे उत्तर देत आहे. थोड्या वेळाने पुन्हा प्रयत्न करा.",
            )
          : t(
              "The assistant could not connect. Please try again; your question is preserved.",
              "सहायक से संपर्क नहीं हुआ। फिर कोशिश करें; आपका प्रश्न सुरक्षित है।",
              "सहाय्यकाशी संपर्क झाला नाही. पुन्हा प्रयत्न करा; तुमचा प्रश्न जतन केला आहे.",
            ),
      );
    } finally {
      if (!controller.signal.aborted) setAnswering(false);
    }
  }
  function start() {
    const C =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;
    if (!C) {
      setStatus(
        t(
          "Voice input is unavailable in this browser. Please type your question.",
          "इस ब्राउज़र में आवाज़ से प्रश्न उपलब्ध नहीं है। कृपया प्रश्न लिखें।",
          "या ब्राउझरमध्ये आवाजाने प्रश्न विचारता येत नाही. कृपया प्रश्न लिहा.",
        ),
      );
      return;
    }
    window.speechSynthesis?.cancel();
    recognition.current?.abort();
    const r = new C();
    let received = false;
    recognition.current = r;
    r.lang = locale + "-IN";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => {
      received = true;
      setListening(false);
      respond(e.results[0][0].transcript);
    };
    r.onerror = () => {
      received = true;
      setListening(false);
      setStatus(
        t(
          "Microphone or speech service unavailable. You can type instead.",
          "माइक्रोफ़ोन या आवाज़ सेवा उपलब्ध नहीं है। आप प्रश्न लिख सकते हैं।",
          "मायक्रोफोन किंवा आवाज सेवा उपलब्ध नाही. तुम्ही प्रश्न लिहू शकता.",
        ),
      );
    };
    r.onend = () => {
      setListening(false);
      if (!received)
        setStatus(
          t(
            "No speech was heard. Try again or type your question.",
            "आवाज़ सुनाई नहीं दी। फिर कोशिश करें या प्रश्न लिखें।",
            "आवाज ऐकू आला नाही. पुन्हा प्रयत्न करा किंवा प्रश्न लिहा.",
          ),
        );
    };
    try {
      setListening(true);
      setStatus("");
      r.start();
    } catch {
      setListening(false);
      setStatus(
        t(
          "Voice input could not start. Please type your question.",
          "आवाज़ सेवा शुरू नहीं हुई। कृपया प्रश्न लिखें।",
          "आवाज सेवा सुरू झाली नाही. कृपया प्रश्न लिहा.",
        ),
      );
    }
  }
  async function speak(text = answer) {
    const synth = window.speechSynthesis;
    if (!synth) {
      setStatus(
        t(
          "Read aloud is unavailable in this browser. Your answer is shown below.",
          "इस ब्राउज़र में आवाज़ में पढ़ना उपलब्ध नहीं है। उत्तर नीचे है।",
          "या ब्राउझरमध्ये मोठ्याने वाचणे उपलब्ध नाही. उत्तर खाली दिले आहे.",
        ),
      );
      return;
    }
    const sequence = ++speechSequence.current.generation;
    synth.cancel();
    let voices = synth.getVoices();
    if (!voices.length) {
      await new Promise<void>((resolve) => {
        const finish = () => {
          clearTimeout(timer);
          synth.removeEventListener("voiceschanged", finish);
          resolve();
        };
        const timer = setTimeout(finish, 1500);
        synth.addEventListener("voiceschanged", finish);
      });
      voices = synth.getVoices();
    }
    if (sequence !== speechSequence.current.generation) return;
    const voice =
      voices.find((v) => v.lang.toLowerCase() === locale + "-in") ||
      voices.find((v) => v.lang.toLowerCase().startsWith(locale));
    if (voices.length && !voice) {
      setStatus(
        t(
          "Install an English voice on your device for spoken replies. Your answer is shown below.",
          "बोले गए उत्तर के लिए उपकरण पर हिंदी आवाज़ स्थापित करें। उत्तर नीचे है।",
          "बोलून उत्तर ऐकण्यासाठी उपकरणावर मराठी आवाज स्थापित करा. उत्तर खाली दिले आहे.",
        ),
      );
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    speech.current = utterance;
    utterance.lang = locale + "-IN";
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onstart = () =>
      setStatus(t("Speaking…", "उत्तर बोल रहा है…", "उत्तर सांगत आहे…"));
    utterance.onend = () => {
      setStatus("");
      speech.current = null;
    };
    utterance.onerror = (event) => {
      if (event.error === "canceled" || event.error === "interrupted") return;
      setStatus(
        t(
          "Audio could not play. Tap Read aloud to retry, or read the answer below.",
          "आवाज़ नहीं चली। फिर सुनने का बटन दबाएँ या नीचे उत्तर पढ़ें।",
          "आवाज वाजला नाही. पुन्हा ऐकण्याचे बटण दाबा किंवा खालील उत्तर वाचा.",
        ),
      );
    };
    synth.resume();
    synth.speak(utterance);
  }
  return (
    <>
      <button
        className="voice-launcher"
        onClick={() => {
          setAnswering(false);
          setOpen(true);
        }}
      >
        {t("Voice assistance", "आवाज़ से सहायता", "आवाजाने मदत")}
      </button>
      <dialog
        className="voice-dialog"
        ref={dialog}
        aria-labelledby="voice-title"
        onCancel={() => {
          setAnswering(false);
          setOpen(false);
        }}
      >
        <div className="panel-heading">
          <h2 id="voice-title">
            {t("Farmer assistant", "किसान सहायक", "शेतकरी सहाय्यक")}
          </h2>
          <button
            className="secondary"
            onClick={() => {
              setAnswering(false);
              setOpen(false);
            }}
          >
            {t("Close", "बंद करें", "बंद करा")}
          </button>
        </div>
        <div className="panel-body">
          <p>
            {t(
              "Ask about a service by voice or text. Voice input uses your browser’s speech service and may send audio to its provider.",
              "आवाज़ या लिखकर सेवा के बारे में पूछें। आवाज़ सेवा ब्राउज़र की है और ऑडियो उसके प्रदाता को भेज सकती है।",
              "आवाजाने किंवा लिहून सेवांबद्दल विचारा. आवाजासाठी ब्राउझरची सेवा वापरली जाते आणि ध्वनी तिच्या प्रदात्याकडे पाठवला जाऊ शकतो.",
            )}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              respond(question);
            }}
          >
            <label htmlFor="voice-question">
              {t("Your question", "आपका प्रश्न", "तुमचा प्रश्न")}
            </label>
            <input
              id="voice-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={1000}
              required
            />
            <div className="actions">
              <button disabled={answering}>
                {t("Ask", "पूछें", "विचारा")}
              </button>
              <button
                type="button"
                disabled={answering}
                className="secondary"
                onClick={() =>
                  listening ? recognition.current?.stop() : start()
                }
              >
                {listening
                  ? t("Stop listening", "सुनना रोकें", "ऐकणे थांबवा")
                  : t("Speak", "बोलें", "बोला")}
              </button>
            </div>
          </form>
          {listening && (
            <p role="status">{t("Listening…", "सुन रहा है…", "ऐकत आहे…")}</p>
          )}
          {status && (
            <p role="status" className="notice">
              {status}
            </p>
          )}
          {answer && (
            <section className="voice-answer" aria-live="polite">
              <p>{answer}</p>
              {link &&
                (link.startsWith("https:") ? (
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    {t(
                      "Open official source ↗",
                      "आधिकारिक स्रोत खोलें ↗",
                      "अधिकृत स्रोत उघडा ↗",
                    )}
                  </a>
                ) : (
                  <Link href={link} prefetch={false}>
                    {t("Open service →", "सेवा खोलें →", "सेवा उघडा →")}
                  </Link>
                ))}
              <button className="secondary small" onClick={() => void speak()}>
                {t("Read aloud", "आवाज़ में सुनें", "ऐकून घ्या")}
              </button>
            </section>
          )}
        </div>
      </dialog>
    </>
  );
}
