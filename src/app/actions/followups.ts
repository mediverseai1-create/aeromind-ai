"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { reserveCredits, commitCredits, releaseCredits, getCurrentWallet } from "@/lib/credits/wallet";
import { isAiConfigured } from "@/lib/ai/gemini";
import { syncAccountsFromDataset } from "@/lib/accounts/sync";
import { generateFollowUpQueue, generateFollowUpEmail, matchCampaignAccounts, type CampaignCriteria } from "@/lib/ai/followups";

export type ActionResult<T> =
  | ({ ok: true } & T)
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "insufficient_credits"; remaining: number; resetDate: string }
  | { ok: false; reason: "failed"; message: string };

/** Plain aggregation over already-uploaded data — never charges credits. */
export async function syncAccountsAction(): Promise<ActionResult<{ synced: number }>> {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");

  const supabase = await createClient();
  const { data: dataset } = await supabase
    .from("datasets")
    .select("id")
    .eq("org_id", current.org.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!dataset) return { ok: false, reason: "failed", message: "Upload a sales file first." };

  try {
    const result = await syncAccountsFromDataset(current.org.id, dataset.id);
    return { ok: true, synced: result.synced };
  } catch (err) {
    return { ok: false, reason: "failed", message: err instanceof Error ? err.message : "Sync failed." };
  }
}

export async function generateQueueAction(idempotencyKey: string): Promise<ActionResult<{ created: number }>> {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  const reservation = await reserveCredits(current.org.id, "follow_up_queue_generation", idempotencyKey);
  if (!reservation.ok) {
    const wallet = await getCurrentWallet(current.org.id);
    return { ok: false, reason: "insufficient_credits", remaining: reservation.remaining, resetDate: wallet?.billing_cycle_end ?? "" };
  }

  try {
    const result = await generateFollowUpQueue(current.org.id);
    await commitCredits(reservation.transactionId);
    return { ok: true, created: result.created };
  } catch (err) {
    await releaseCredits(reservation.transactionId, err instanceof Error ? err.message : "unknown_error");
    return { ok: false, reason: "failed", message: err instanceof Error ? err.message : "Couldn't generate the queue." };
  }
}

export async function generateEmailAction(
  followUpId: string,
  idempotencyKey: string
): Promise<ActionResult<{ subject: string; body: string }>> {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  const reservation = await reserveCredits(current.org.id, "follow_up_email_individual", idempotencyKey);
  if (!reservation.ok) {
    const wallet = await getCurrentWallet(current.org.id);
    return { ok: false, reason: "insufficient_credits", remaining: reservation.remaining, resetDate: wallet?.billing_cycle_end ?? "" };
  }

  try {
    const draft = await generateFollowUpEmail(current.org.id, followUpId);
    await commitCredits(reservation.transactionId, followUpId);
    return { ok: true, subject: draft.subject, body: draft.body };
  } catch (err) {
    await releaseCredits(reservation.transactionId, err instanceof Error ? err.message : "unknown_error");
    return { ok: false, reason: "failed", message: err instanceof Error ? err.message : "Couldn't draft the email." };
  }
}

export async function updateFollowUpStatusAction(id: string, status: "sent" | "snoozed" | "done" | "skipped") {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  const supabase = await createClient();
  await supabase.from("follow_ups").update({ status }).eq("id", id).eq("org_id", current.org.id);
}

export type CampaignResult = ActionResult<{ campaignId: string; generated: number; skippedForCredits: number }>;

export async function createCampaignAction(name: string, criteria: CampaignCriteria): Promise<CampaignResult> {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  const supabase = await createClient();
  const candidates = await matchCampaignAccounts(current.org.id, criteria);
  if (candidates.length === 0) {
    return { ok: false, reason: "failed", message: "No accounts match that filter right now." };
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("follow_up_campaigns")
    .insert({ org_id: current.org.id, name, filter_criteria: criteria, status: "running", created_by: current.user.id })
    .select("id")
    .single();
  if (campaignError || !campaign) {
    return { ok: false, reason: "failed", message: campaignError?.message ?? "Couldn't create the campaign." };
  }

  let generated = 0;
  let skippedForCredits = 0;

  for (const account of candidates) {
    const idempotencyKey = `campaign:${campaign.id}:${account.id}`;
    const reservation = await reserveCredits(current.org.id, "follow_up_campaign_per_recipient", idempotencyKey);
    if (!reservation.ok) {
      skippedForCredits++;
      continue;
    }

    try {
      const { data: followUp, error: followUpError } = await supabase
        .from("follow_ups")
        .insert({
          org_id: current.org.id,
          account_id: account.id,
          campaign_id: campaign.id,
          reason: `Part of campaign "${name}": ${criteria.lifecycleStages.join(", ")} accounts idle ${criteria.idleDays}+ days.`,
          suggested_channel: "email",
          status: "pending",
          generated_by: "ai",
        })
        .select("id")
        .single();
      if (followUpError || !followUp) throw new Error(followUpError?.message ?? "Couldn't create follow-up row.");

      await generateFollowUpEmail(current.org.id, followUp.id);
      await commitCredits(reservation.transactionId, followUp.id);
      generated++;
    } catch (err) {
      await releaseCredits(reservation.transactionId, err instanceof Error ? err.message : "unknown_error");
      skippedForCredits++;
    }
  }

  await supabase.from("follow_up_campaigns").update({ status: "completed" }).eq("id", campaign.id);

  return { ok: true, campaignId: campaign.id, generated, skippedForCredits };
}
