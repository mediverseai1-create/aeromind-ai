import "server-only";
import { createClient } from "@/lib/supabase/server";
import { callGeminiJson } from "@/lib/ai/gemini";

export type DerivedSignals = {
  idealCharacteristics: string[];
  topProducts: string[];
  notes: string;
};

/**
 * Learns from the org's own best accounts (who buys, who converts, who
 * spends most) rather than requiring the user to build filters manually.
 * Grounded strictly in real account/revenue data — no invented market
 * research.
 */
export async function deriveIdealCustomerProfile(
  orgId: string,
  description: string
): Promise<DerivedSignals> {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("name, lifecycle_stage, linked_customer_key")
    .eq("org_id", orgId)
    .in("lifecycle_stage", ["customer", "previous_customer"])
    .limit(100);

  const customerKeys = (accounts ?? []).map((a) => a.linked_customer_key).filter((k): k is string => !!k);

  const revenueByCustomer = new Map<string, { total: number; products: Set<string> }>();
  if (customerKeys.length > 0) {
    const { data: rows } = await supabase
      .from("dataset_rows")
      .select("customer, revenue, product")
      .eq("org_id", orgId)
      .in("customer", customerKeys)
      .limit(20000);
    for (const r of rows ?? []) {
      if (!r.customer) continue;
      const entry = revenueByCustomer.get(r.customer) ?? { total: 0, products: new Set<string>() };
      entry.total += r.revenue ?? 0;
      if (r.product) entry.products.add(r.product);
      revenueByCustomer.set(r.customer, entry);
    }
  }

  const ranked = Array.from(revenueByCustomer.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 20)
    .map(([name, v]) => `- ${name}: $${Math.round(v.total).toLocaleString()} total, products: ${Array.from(v.products).join(", ") || "unspecified"}`);

  const prompt = `You are AeroMind, building an Ideal Customer Profile for a B2B company from their own real customer data.

The company describes their business/target this way: "${description}"

Their highest-value real accounts, by revenue:
${ranked.length > 0 ? ranked.join("\n") : "(no revenue history available yet)"}

Based ONLY on this real data and description, identify the characteristics their best customers tend to share (e.g. buying patterns, product mix, apparent scale — do not invent industries or company sizes you have no evidence for; if the data doesn't support a signal, omit it rather than guessing).

Respond with JSON only, matching exactly this shape:
{"idealCharacteristics": string[], "topProducts": string[], "notes": string}`;

  return callGeminiJson<DerivedSignals>(prompt);
}

export type CandidateScore = {
  fitScore: number;
  fitReasoning: string;
  suggestedApproach: string;
  personalizedOpening: string;
};

export async function scoreLeadCandidate(
  orgId: string,
  icpId: string,
  companyName: string,
  extraContext: string
): Promise<CandidateScore> {
  const supabase = await createClient();
  const { data: icp } = await supabase.from("ideal_customer_profiles").select("*").eq("id", icpId).eq("org_id", orgId).single();
  if (!icp) throw new Error("Ideal customer profile not found.");

  const signals = icp.derived_signals as DerivedSignals | null;

  const prompt = `You are AeroMind, scoring a potential lead against a company's Ideal Customer Profile.

ICP description: ${icp.description ?? "(none given)"}
ICP characteristics derived from real customers: ${signals?.idealCharacteristics?.join(", ") || "none derived yet"}
Top products their best customers buy: ${signals?.topProducts?.join(", ") || "unspecified"}

Candidate company: ${companyName}
Additional context provided about the candidate: ${extraContext || "(none provided)"}

Score how well this candidate fits the ICP (0-100), explain why in 1-2 sentences using only the information given (do not invent facts about the company you weren't told), suggest a brief outreach approach, and draft one personalized opening line for a first message.

Respond with JSON only, matching exactly this shape:
{"fitScore": number, "fitReasoning": string, "suggestedApproach": string, "personalizedOpening": string}`;

  return callGeminiJson<CandidateScore>(prompt);
}
