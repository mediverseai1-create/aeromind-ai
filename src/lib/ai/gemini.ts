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

/**
 * Same as callGeminiJson, but with an inline audio clip attached — used to
 * analyze uploaded call recordings directly (Gemini accepts audio input
 * natively). Keep clips under ~15MB; larger files should go through the
 * Files API instead, which this helper doesn't implement.
 */
export async function callGeminiJsonWithAudio<T>(prompt: string, audioBase64: string, mimeType: string): Promise<T> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent([{ text: prompt }, { inlineData: { data: audioBase64, mimeType } }]);
  const text = result.response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned a response that wasn't valid JSON.");
  }
}

/** Plain prose response (not JSON) — used for the meeting brief. */
export async function callGeminiText(prompt: string): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
