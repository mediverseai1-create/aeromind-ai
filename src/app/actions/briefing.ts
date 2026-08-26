"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { reserveCredits, commitCredits, releaseCredits, getCurrentWallet } from "@/lib/credits/wallet";
import { generateBriefing } from "@/lib/ai/briefing";
import { isAiConfigured } from "@/lib/ai/gemini";

export type GenerateBriefingResult =
  | { ok: true; analysisId: string }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "no_dataset" }
  | { ok: false; reason: "insufficient_credits"; remaining: number; resetDate: string }
  | { ok: false; reason: "generation_failed"; message: string };

/**
 * Full credit-gated Gemini flow for one Sales Briefing + Next Best Actions
 * run. Ordering matters: credits are only committed AFTER the result is
 * durably saved, and released on any failure before that — see the plan
 * doc / src/lib/credits/wallet.ts for why.
 */
export async function generateBriefingAction(
  datasetId: string,
  idempotencyKey: string
): Promise<GenerateBriefingResult> {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  const orgId = current.org.id;

  if (!isAiConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const supabase = await createClient();
  const { data: dataset } = await supabase
    .from("datasets")
    .select("id")
    .eq("id", datasetId)
    .eq("org_id", orgId)
    .eq("status", "ready")
    .maybeSingle();
  if (!dataset) {
    return { ok: false, reason: "no_dataset" };
  }

  const reservation = await reserveCredits(orgId, "sales_briefing", idempotencyKey);
  if (!reservation.ok) {
    const wallet = await getCurrentWallet(orgId);
    return {
      ok: false,
      reason: "insufficient_credits",
      remaining: reservation.remaining,
      resetDate: wallet?.billing_cycle_end ?? "",
    };
  }

  let result;
  try {
    result = await generateBriefing(orgId, datasetId);
  } catch (err) {
    await releaseCredits(reservation.transactionId, err instanceof Error ? err.message : "unknown_error");
    return {
      ok: false,
      reason: "generation_failed",
      message: err instanceof Error ? err.message : "Something went wrong generating the briefing.",
    };
  }

  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .insert({
      org_id: orgId,
      dataset_id: datasetId,
      cadence: current.org.cadence,
      metrics: { briefing: result.briefing },
      report_md: result.reportMd,
      strategy_md: result.strategyMd,
      action_plan_md: result.actionPlanMd,
      ai_generated: true,
      status: "ready",
      created_by: current.user.id,
    })
    .select("id")
    .single();

  if (analysisError || !analysis) {
    await releaseCredits(reservation.transactionId, analysisError?.message ?? "save_failed");
    return {
      ok: false,
      reason: "generation_failed",
      message: analysisError?.message ?? "Couldn't save the briefing.",
    };
  }

  if (result.nextBestActions.length > 0) {
    await supabase.from("next_best_actions").insert(
      result.nextBestActions.map((a) => ({
        org_id: orgId,
        analysis_id: analysis.id,
        title: a.title,
        reason: a.reason,
        action_type: a.actionType,
        target_ref: a.targetRef,
        priority: a.priority,
      }))
    );
  }

  await commitCredits(reservation.transactionId, analysis.id);

  return { ok: true, analysisId: analysis.id };
}

export async function updateNextBestActionStatusAction(id: string, status: "dismissed" | "done") {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  const supabase = await createClient();
  await supabase.from("next_best_actions").update({ status }).eq("id", id).eq("org_id", current.org.id);
}
