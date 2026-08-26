import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Server-side-only Gemini wrapper. GEMINI_API_KEY must never be prefixed
 * with NEXT_PUBLIC_ and must never be imported from a client component.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

let client: GoogleGenerativeAI | null = null;
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  if (!client) client = new GoogleGenerativeAI(apiKey);
  return client;
}

/**
 * Calls Gemini and asks for a JSON response matching the given prompt.
 * Throws on any failure (missing key, API error, non-JSON response) — the
 * caller is responsible for releasing any reserved credits on catch.
 */
export async function callGeminiJson<T>(prompt: string): Promise<T> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned a response that wasn't valid JSON.");
  }
}
