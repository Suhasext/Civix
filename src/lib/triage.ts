import { GoogleGenAI, type Schema } from "@google/genai";
import responseSchema from "./schema.json";
import SYSTEM_PROMPT from "./system-prompt.txt?raw";
import { fallback } from "./fallback";
import { DEPARTMENT_BY_CATEGORY, SEVERITY_RANK, type Category, type Severity, type Ticket } from "./ticket";

function parse(text: string) {
  const data = JSON.parse(text);
  const nonempty = (value: unknown): value is string => typeof value === "string" && !!value.trim();
  if (!data || !Object.hasOwn(DEPARTMENT_BY_CATEGORY, data.category) || !Object.hasOwn(SEVERITY_RANK, data.severity)
    || !Object.values(DEPARTMENT_BY_CATEGORY).includes(data.department)
    || ![data.detectedLanguage, data.englishSummary, data.severityReason].every(nonempty)
    || data.englishSummary.trim().split(/\s+/).length > 25 || data.severityReason.trim().split(/\s+/).length > 20
    || typeof data.needsManualReview !== "boolean" || (data.photoObservation != null && !nonempty(data.photoObservation))) {
    throw Error("Invalid triage response");
  }
  const category = data.category as Category;
  return { detectedLanguage: data.detectedLanguage, englishSummary: data.englishSummary, category,
    severity: data.severity as Severity, severityReason: data.severityReason, department: DEPARTMENT_BY_CATEGORY[category],
    needsManualReview: data.needsManualReview, photoObservation: data.photoObservation ?? undefined, source: "ai" as const };
}

export async function triage(originalText: string, photoDataUrl?: string): Promise<Ticket> {
  const base = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), originalText, photoDataUrl };
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { retryOptions: { attempts: 1 } } });
    const parts = [{ text: `Citizen complaint:\n"""${originalText}"""` },
      ...(photoDataUrl ? [{ inlineData: { mimeType: "image/jpeg", data: photoDataUrl.split(",")[1] } }] : [])];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash", contents: [{ role: "user", parts }],
          config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: "application/json", responseSchema: responseSchema as Schema,
            temperature: 0.2, abortSignal: AbortSignal.timeout(15000), httpOptions: { timeout: 15000 } },
        });
        return { ...base, ...parse(response.text ?? "") };
      } catch { /* Retry once before switching to manual-review triage. */ }
    }
  }
  return { ...base, ...fallback(originalText) };
}
