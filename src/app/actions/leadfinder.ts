"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { reserveCredits, commitCredits, releaseCredits, getCurrentWallet } from "@/lib/credits/wallet";
import { isAiConfigured } from "@/lib/ai/gemini";
import { deriveIdealCustomerProfile, scoreLeadCandidate } from "@/lib/ai/leadfinder";

export type ActionResult<T> =
  | ({ ok: true } & T)
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "insufficient_credits"; remaining: number; resetDate: string }
  | { ok: false; reason: "failed"; message: string };

export async function createIcpAction(
  name: string,
  description: string,
  idempotencyKey: string
): Promise<ActionResult<{ icpId: string }>> {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  const reservation = await reserveCredits(current.org.id, "icp_derivation", idempotencyKey);
  if (!reservation.ok) {
    const wallet = await getCurrentWallet(current.org.id);
    return { ok: false, reason: "insufficient_credits", remaining: reservation.remaining, resetDate: wallet?.billing_cycle_end ?? "" };
  }

  const supabase = await createClient();
  try {
    const signals = await deriveIdealCustomerProfile(current.org.id, description);
    const { data: icp, error } = await supabase
      .from("ideal_customer_profiles")
      .insert({ org_id: current.org.id, name, description, derived_signals: signals })
      .select("id")
      .single();
    if (error || !icp) throw new Error(error?.message ?? "Couldn't save the profile.");
    await commitCredits(reservation.transactionId, icp.id);
    return { ok: true, icpId: icp.id };
  } catch (err) {
    await releaseCredits(reservation.transactionId, err instanceof Error ? err.message : "unknown_error");
    return { ok: false, reason: "failed", message: err instanceof Error ? err.message : "Couldn't build the profile." };
  }
}

export async function addAndScoreCandidateAction(
  icpId: string,
  companyName: string,
  extraContext: string,
  idempotencyKey: string
): Promise<ActionResult<{ candidateId: string }>> {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  const reservation = await reserveCredits(current.org.id, "lead_scoring", idempotencyKey);
  if (!reservation.ok) {
    const wallet = await getCurrentWallet(current.org.id);
    return { ok: false, reason: "insufficient_credits", remaining: reservation.remaining, resetDate: wallet?.billing_cycle_end ?? "" };
  }

  const supabase = await createClient();
  try {
    const score = await scoreLeadCandidate(current.org.id, icpId, companyName, extraContext);
    const { data: candidate, error } = await supabase
      .from("lead_candidates")
      .insert({
        org_id: current.org.id,
        icp_id: icpId,
        company_name: companyName,
        source: "manual",
        fit_score: score.fitScore,
        fit_reasoning: `${score.fitReasoning} Suggested approach: ${score.suggestedApproach} Opening line: "${score.personalizedOpening}"`,
        status: "candidate",
      })
      .select("id")
      .single();
    if (error || !candidate) throw new Error(error?.message ?? "Couldn't save the candidate.");
    await commitCredits(reservation.transactionId, candidate.id);
    return { ok: true, candidateId: candidate.id };
  } catch (err) {
    await releaseCredits(reservation.transactionId, err instanceof Error ? err.message : "unknown_error");
    return { ok: false, reason: "failed", message: err instanceof Error ? err.message : "Couldn't score the candidate." };
  }
}

/** Free — converts an already-scored candidate into a real lead + a follow-up, no new AI call. */
export async function addCandidateToFollowUpAction(candidateId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from("lead_candidates")
    .select("*")
    .eq("id", candidateId)
    .eq("org_id", current.org.id)
    .single();
  if (!candidate) throw new Error("Candidate not found.");

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({ org_id: current.org.id, company_name: candidate.company_name, status: "new" })
    .select("id")
    .single();
  if (leadError || !lead) throw new Error(leadError?.message ?? "Couldn't create the lead.");

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({ org_id: current.org.id, name: candidate.company_name, lifecycle_stage: "lead", source: "lead_finder" })
    .select("id")
    .single();
  if (accountError || !account) throw new Error(accountError?.message ?? "Couldn't create the account.");

  await supabase.from("follow_ups").insert({
    org_id: current.org.id,
    account_id: account.id,
    reason: candidate.fit_reasoning ?? `New lead from Lead Finder: ${candidate.company_name}`,
    suggested_channel: "email",
    status: "pending",
    generated_by: "ai",
  });

  await supabase
    .from("lead_candidates")
    .update({ status: "converted_to_lead", converted_lead_id: lead.id })
    .eq("id", candidateId);
}
