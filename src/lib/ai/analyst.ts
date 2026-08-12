import "server-only";

/**
 * Server-side-only interface for AeroMind's AI narrative features (the
 * written report/strategy/action plan, and the "ask in plain language"
 * feature). Deliberately unimplemented: no AI provider key was configured
 * when this project was scaffolded, and instructions were explicit not to
 * fake AI output. Callers must check `isAiConfigured()` and show a
 * "coming soon" state when it's false — never invent a response.
 *
 * To wire up a real provider:
 *   1. Add AI_PROVIDER_API_KEY to your server environment (never
 *      NEXT_PUBLIC_ — it must not reach the browser).
 *   2. Implement `generateNarrative` / `answerQuestion` below using that
 *      provider's SDK, calling out to it only from server code (route
 *      handlers, server actions, or server components) — never from the
 *      browser.
 *   3. Ground every response in the computed metrics from
 *      src/lib/analytics/compute.ts — don't let the model invent figures
 *      that don't come from the org's own data.
 */

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_PROVIDER_API_KEY);
}

export type NarrativeInput = {
  orgName: string;
  cadence: string;
  metrics: Record<string, unknown>;
};

export type Narrative = {
  reportMd: string;
  strategyMd: string;
  actionPlanMd: string;
};

export async function generateNarrative(_input: NarrativeInput): Promise<Narrative> {
  if (!isAiConfigured()) {
    throw new Error("AI_PROVIDER_API_KEY is not set — AI narrative generation is not available yet.");
  }
  throw new Error("generateNarrative() has no provider implementation wired up yet.");
}

export async function answerQuestion(_orgId: string, _question: string): Promise<string> {
  if (!isAiConfigured()) {
    throw new Error("AI_PROVIDER_API_KEY is not set — the Ask feature is not available yet.");
  }
  throw new Error("answerQuestion() has no provider implementation wired up yet.");
}
