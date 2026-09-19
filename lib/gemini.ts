import "server-only";

export type GeminiSource = { title: string; url: string };
export async function geminiAnswer(system: string, question: string, history: { role: string; content: string }[] = [], search = false) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_NOT_CONFIGURED");
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [...history.map((item) => ({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content }] })), { role: "user", parts: [{ text: question }] }],
      ...(search ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: { temperature: 0.2, maxOutputTokens: search ? 5000 : 1500 },
    }),
    signal: AbortSignal.timeout(45000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GEMINI_${response.status}`);
  const body = await response.json();
  const candidate = body.candidates?.[0];
  const answer = (candidate?.content?.parts || []).filter((part: { thought?: boolean }) => !part.thought).map((part: { text?: string }) => part.text || "").join("").trim();
  if (!answer) throw new Error("EMPTY_ANSWER");
  const sources: GeminiSource[] = (candidate?.groundingMetadata?.groundingChunks || []).flatMap((chunk: { web?: { uri: string; title?: string } }) => chunk.web?.uri?.startsWith("https://") ? [{ title: chunk.web.title || "Source", url: chunk.web.uri }] : []);
  return { answer, sources };
}
