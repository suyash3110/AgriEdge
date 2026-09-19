import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/http";
import { validOrigin } from "@/lib/origin";
import { publicPrices } from "@/lib/public-prices";
import { schemeCatalogue } from "@/lib/schemes";
import { geminiAnswer } from "@/lib/gemini";
import { marketObservations } from "@/lib/local-market-data";
import { marketAnswer } from "@/lib/market-answer";
const input = z.object({
  stream: z.boolean().default(false),
  question: z.string().trim().min(1).max(1000),
  locale: z.enum(["en", "hi", "mr"]),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2500),
      }),
    )
    .max(6)
    .default([]),
});
let active = 0;
export async function POST(req: NextRequest) {
  let acquired = false;
  const reply = (body: unknown, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  try {
    if (!validOrigin(req.headers.get("origin")))
      return reply({ error: { code: "FORBIDDEN" } }, 403);
    const data = input.parse(await readJson(req, 20000));
    if (active >= (process.env.GEMINI_API_KEY ? 4 : 1)) return reply({ error: { code: "BUSY" } }, 429);
    active++;
    acquired = true;
    const q = data.question.toLowerCase();
    let context = "";
    if (/tolerance|dust|debris|धूल|कचरा|धूळ|सहनशीलता/.test(q))
      context += "AgriEdge tolerance means an agreed extra INR per quintal to compensate for dust or debris. In Transactions either buyer or seller proposes an amount and reason. The other party accepts or rejects it. Only acceptance updates the agreement rate and total. A revised allowance replaces the previous allowance, and it cannot be changed after a payment order exists. ";
    // General watering principles, not a crop-specific irrigation schedule.
    // Source: https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/gardening-in-hot-weather
    if (/water|irrigat|पानी|सिंचाई|पाणी|सिंचन/.test(q))
      context += {
        en: "Watering facts: Early morning watering reduces evaporation compared with hot midday conditions. Apply water to soil near roots, for example with drip irrigation. Amount and frequency depend on crop, soil moisture and weather; no universal schedule. ",
        hi: "सिंचाई संबंधी तथ्य: तेज दोपहर की तुलना में सुबह पानी देने से वाष्पीकरण कम होता है। पानी पत्तियों के बजाय जड़ों के पास मिट्टी में दें, जैसे टपक सिंचाई से। मात्रा और अंतराल फसल, मिट्टी की नमी और मौसम पर निर्भर हैं; एक ही समय-सारणी सभी पर लागू नहीं होती। ",
        mr: "सिंचनाची माहिती: कडक दुपारपेक्षा सकाळी पाणी दिल्यास बाष्पीभवन कमी होते. पानांऐवजी मुळांजवळील मातीत पाणी द्या, उदाहरणार्थ ठिबक सिंचनाने. पाण्याचे प्रमाण आणि अंतर पीक, जमिनीतील ओलावा आणि हवामानावर अवलंबून असते; सर्वांसाठी एकच वेळापत्रक नसते. ",
      }[data.locale];
    if (/price|rate|sell|market|भाव|दर|किंमत|बेच|बिक्री|विक्री/.test(q)) {
      const answer = marketAnswer(data.question, await marketObservations(), data.locale);
      if (answer) return reply({ data: { answer, source: "local_market_data", sources: [] } });
    }
    if (/price|rate|भाव|दर|किंमत/.test(q))
      context +=
        "Dated market observations; only call them current if the observation date is current: " +
        JSON.stringify(
          (await publicPrices()).map((p) => ({
            crop: p.crop,
            market: p.market,
            date: p.date.slice(0, 10),
            rupeesPerQuintal: Number(p.modal) / 100,
          })),
        ) +
        ".";
    if (/scheme|kisan|yojana|योजना|अनुदान/.test(q))
      context +=
        "Official schemes: " +
        JSON.stringify(
          schemeCatalogue(data.locale).map((s) => ({
            name: s.name,
            description: s.point,
            url: s.url,
          })),
        ) +
        ".";
    const language = { en: "English", hi: "Hindi", mr: "Marathi" }[data.locale];
    const instructions = `You are AgriEdge's helpful assistant in Nagpur. Answer the actual question directly in simple ${language}. Use two short sentences. Answer general questions and follow-ups, not a service menu. Use the app facts below when relevant. If information is missing, ask one specific question. Never invent live prices, weather, account records, completed actions or chemical dosages. You have no browsing or transaction tools.`;
    const facts = {
      en: "App facts: Create a listing in My Lots with crop, quantity, price, dates and photo; Check image returns a provisional A/B/C appearance grade. If you disagree, select Request FPO review on your listing and give a reason. Authorized FPO staff can inspect and revise the grade; buyers see the updated grade and source. A=best visible appearance, B=intermediate, C=visible defects; not a certified food-safety grade. Unsupported crops need FPO inspection. OTP and payments are local test simulations.",
      hi: "ऐप की जानकारी: मेरी उपज में फसल, मात्रा, भाव, तारीख और फोटो देकर सूची बनाएँ। फोटो जाँच से अस्थायी A/B/C ग्रेड मिलता है। ग्रेड से असहमत हों तो अपनी सूची पर FPO जाँच माँगें और कारण दें। अधिकृत FPO कर्मचारी प्रत्यक्ष जाँच के बाद ग्रेड बदल सकते हैं। खरीदार को नया ग्रेड और उसका स्रोत दिखता है। A अच्छा बाहरी रूप, B मध्यम, C दिखने वाले दोष है। यह खाद्य सुरक्षा प्रमाणपत्र नहीं है। असमर्थित फसलों के लिए प्रत्यक्ष जाँच चाहिए। OTP और भुगतान अभी स्थानीय परीक्षण हैं।",
      mr: "ॲपची माहिती: माझा शेतमाल येथे पीक, वजन, भाव, तारखा आणि फोटो देऊन नोंद करा. फोटो तपासल्यावर तात्पुरता A/B/C दर्जा मिळतो. दर्जा मान्य नसेल तर आपल्या शेतमालाच्या नोंदीवरील FPO तपासणी मागा हे बटण दाबून कारण द्यावे. अधिकृत FPO कर्मचारी प्रत्यक्ष तपासणीनंतर दर्जा बदलू शकतात. खरेदीदाराला सुधारित दर्जा आणि त्याचा स्रोत दिसतो. A चांगले बाह्य स्वरूप, B मध्यम, C दिसणारे दोष आहे. हे अन्नसुरक्षेचे प्रमाणपत्र नाही. असमर्थित पिकांची प्रत्यक्ष तपासणी आवश्यक आहे. OTP आणि भरणा सध्या स्थानिक चाचणी आहेत.",
    }[data.locale];
    const appQuestion =
      /grade|quality|lot|sell|agriedge|fpo|otp|payment|ग्रेड|दर्जा|गुणवत्ता|विक्री|बेच|उपज|शेतमाल|नोंद|जाँच|तपास|भुगतान|भरणा/.test(
        q,
      );
    const system =
      instructions +
      "\n" +
      (appQuestion ? facts : "") +
      "\n" +
      context;
    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await geminiAnswer(system, data.question, data.history);
        return reply({ data: { ...result, source: "gemini" } });
      } catch {
        // The independent local runtime remains available during cloud outages.
      }
    }
    const response = await fetch("http://127.0.0.1:8089/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (process.env.ASSISTANT_API_KEY || ""),
      },
      body: JSON.stringify({
        model: "agriedge-local",
        messages: [
          { role: "system", content: system },
          ...data.history,
          { role: "user", content: data.question },
        ],
        temperature: 0.2,
        top_p: 0.8,
        top_k: 20,
        presence_penalty: 0,
        repeat_penalty: 1.0,
        max_tokens: 360,
        stream: data.stream,
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw new Error("MODEL_UNAVAILABLE");
    if (data.stream && response.body) {
      acquired = false;
      const upstream = response.body.getReader(),
        encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const decoder = new TextDecoder();
          let pending = "";
          try {
            while (true) {
              const { done, value } = await upstream.read();
              if (done) break;
              pending += decoder.decode(value, { stream: true });
              const lines = pending.split("\n");
              pending = lines.pop() || "";
              for (const line of lines) {
                if (
                  !line.startsWith("data: ") ||
                  line.slice(6).trim() === "[DONE]"
                )
                  continue;
                const event = JSON.parse(line.slice(6));
                const delta = event.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta)
                  controller.enqueue(
                    encoder.encode(JSON.stringify({ delta }) + "\n"),
                  );
              }
            }
            controller.enqueue(
              encoder.encode(JSON.stringify({ done: true }) + "\n"),
            );
            controller.close();
          } catch {
            try {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ error: "ASSISTANT_UNAVAILABLE" }) + "\n",
                ),
              );
              controller.close();
            } catch {}
          } finally {
            active--;
            upstream.releaseLock();
          }
        },
        cancel() {
          void upstream.cancel();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Accel-Buffering": "no",
        },
      });
    }
    const body = await response.json();
    const answer = String(body.choices?.[0]?.message?.content || "")
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();
    if (!answer) throw new Error("EMPTY_ANSWER");
    const words = answer.split(/\s+/),
      phrases = new Map<string, number>();
    for (let i = 0; i < words.length - 4; i++) {
      const phrase = words.slice(i, i + 5).join(" ");
      const count = (phrases.get(phrase) || 0) + 1;
      if (count > 3) throw new Error("REPETITIVE_ANSWER");
      phrases.set(phrase, count);
    }
    return reply({ data: { answer, source: "local_language_model" } });
  } catch (error) {
    return reply(
      {
        error: {
          code:
            error instanceof z.ZodError
              ? "INVALID_QUESTION"
              : "ASSISTANT_UNAVAILABLE",
        },
      },
      error instanceof z.ZodError ? 400 : 503,
    );
  } finally {
    if (acquired) active--;
  }
}
