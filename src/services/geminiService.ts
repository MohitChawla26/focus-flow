import "server-only";
import { z } from "zod";
import type { ContentAnalysis, ContentItem } from "@/types";

const analysisSchema = z.object({
  summary: z.string().min(1), category: z.string().min(1), urgency: z.number().min(0).max(100),
  keywords: z.array(z.string()), people: z.array(z.string()), organizations: z.array(z.string()),
  deadline: z.string().nullable(), eventName: z.string().nullable(), actionRequired: z.boolean(),
  suggestedPriorityReason: z.string().min(1),
});

export function fallbackAnalysis(item: ContentItem): ContentAnalysis {
  const text = `${item.title} ${item.description ?? ""} ${item.content ?? ""}`.toLowerCase();
  const urgent = /deadline|tomorrow|today|exam|submission|urgent|heavy rain|cancelled|rescheduled/.test(text);
  const actionRequired = /submit|register|deadline|assignment|exam|apply|upload|required/.test(text);
  const keywords = ["deadline","exam","submission","hackathon","internship","gemini","ai","cricket","rain"].filter((word) => text.includes(word));
  const category = item.sourceType === "college" ? "College" : item.sourceType === "sports" ? "Cricket" : item.sourceType === "research" ? "AI Research" : item.sourceType === "weather" ? "Weather" : /ai|gemini|model/.test(text) ? "Artificial Intelligence" : "Technology";
  return { summary: item.description?.slice(0, 260) || item.content?.slice(0, 260) || item.title, category, urgency: urgent ? 90 : /launch|announce|breaking/.test(text) ? 72 : 40, keywords, people: [], organizations: [], deadline: null, eventName: null, actionRequired, suggestedPriorityReason: urgent ? "Time-sensitive language was detected." : "This matches one of your followed topics." };
}

export async function analyzeContent(item: ContentItem): Promise<ContentAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackAnalysis(item);
  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Analyze this content for attention management. Return factual JSON only.\nTitle: ${item.title}\nDescription: ${item.description ?? ""}\nContent: ${(item.content ?? "").slice(0, 6000)}\nSource type: ${item.sourceType}` }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const payload = await response.json();
    const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    return analysisSchema.parse(JSON.parse(raw));
  } catch {
    return fallbackAnalysis(item);
  }
}
