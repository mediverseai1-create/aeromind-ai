import "server-only";
import { createClient } from "@/lib/supabase/server";
import { callGeminiJson } from "@/lib/ai/gemini";
import type { LifecycleStage } from "@/lib/types/database";

type QueueSuggestion = {
  accountName: string;
  reason: string;
  priority: "low" | "medium" | "high";
  suggestedChannel: "email" | "call" | "other";
  dueInDays: number;
};

/**
 * Analyzes the org's accounts (favoring dormant / previous / lead-stage ones
 * — the ones actually needing attention) and asks Gemini to produce a
 * prioritized follow-up queue. Grounded strictly in the account list handed
 * to it — the prompt explicitly forbids inventing accounts not in that list.
 */
export async function generateFollowUpQueue(orgId: string): Promise<{ created: number }> {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, lifecycle_stage, last_activity_at")
    .eq("org_id", orgId)
    .order("last_activity_at", { ascending: true, nullsFirst: true })
    .limit(60);

  if (!accounts || accounts.length === 0) {
    return { created: 0 };
  }

  const accountList = accounts
    .map((a) => `- ${a.name} (stage: ${a.lifecycle_stage}, last activity: ${a.last_activity_at ?? "unknown"})`)
    .join("\n");

  const prompt = `You are AeroMind, a sales operations assistant. Below is a list of a company's real accounts, with their lifecycle stage and last activity date. Identify which of THESE accounts need a follow-up soon, and why.

Rules:
- Only reference accounts from the list below. Do not invent any account.
- Prioritize dormant and previous_customer accounts (re-engagement), and lead/prospect accounts with no recent activity.
- Give a short, concrete, specific reason for each — not generic advice.
- Return at most 15 recommendations.

Accounts:
${accountList}

Respond with JSON only, matching exactly this shape:
{"recommendations": [{"accountName": string, "reason": string, "priority": "low"|"medium"|"high", "suggestedChannel": "email"|"call"|"other", "dueInDays": number}]}`;

  const result = await callGeminiJson<{ recommendations: QueueSuggestion[] }>(prompt);
  const byName = new Map(accounts.map((a) => [a.name, a]));

  const rows = result.recommendations
    .filter((r) => byName.has(r.accountName))
    .map((r) => {
      const account = byName.get(r.accountName)!;
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + Math.max(0, r.dueInDays ?? 0));
      return {
        org_id: orgId,
        account_id: account.id,
        reason: r.reason,
        suggested_channel: r.suggestedChannel,
        due_at: dueAt.toISOString(),
        status: "pending" as const,
        generated_by: "ai" as const,
      };
    });

  if (rows.length === 0) return { created: 0 };

  await supabase.from("follow_ups").insert(rows);
  return { created: rows.length };
}

type EmailDraft = { subject: string; body: string };

async function draftEmail(accountName: string, reason: string, extraContext: string): Promise<EmailDraft> {
  const prompt = `Write a short, specific follow-up email for a B2B sales rep to send to ${accountName}.

Context / reason for the follow-up: ${reason}
${extraContext}

Keep it under 150 words, professional but not stiff, one clear next step. Do not invent facts not given above — if you don't have a specific detail, keep the sentence general instead of making one up.

Respond with JSON only, matching exactly this shape:
{"subject": string, "body": string}`;

  return callGeminiJson<EmailDraft>(prompt);
}

/** Generates (and saves) a personalized follow-up email for one queue item. */
export async function generateFollowUpEmail(orgId: string, followUpId: string): Promise<EmailDraft> {
  const supabase = await createClient();

  const { data: followUp } = await supabase
    .from("follow_ups")
    .select("id, reason, account_id")
    .eq("id", followUpId)
    .eq("org_id", orgId)
    .single();
  if (!followUp) throw new Error("Follow-up not found.");
  if (!followUp.account_id) throw new Error("This follow-up has no linked account.");

  const { data: account } = await supabase
    .from("accounts")
    .select("name, lifecycle_stage, linked_customer_key")
    .eq("id", followUp.account_id)
    .maybeSingle();
  if (!account) throw new Error("Account not found.");

  let extraContext = `Relationship stage: ${account.lifecycle_stage}.`;
  if (account.linked_customer_key) {
    const { data: revenueRows } = await supabase
      .from("dataset_rows")
      .select("revenue, row_date, product")
      .eq("org_id", orgId)
      .eq("customer", account.linked_customer_key)
      .order("row_date", { ascending: false })
      .limit(5);
    if (revenueRows && revenueRows.length > 0) {
      const products = Array.from(new Set(revenueRows.map((r) => r.product).filter(Boolean)));
      extraContext += ` Past purchases include: ${products.join(", ") || "unspecified products"}. Most recent order: ${revenueRows[0].row_date ?? "unknown date"}.`;
    }
  }

  const draft = await draftEmail(account.name, followUp.reason, extraContext);
  const formatted = `Subject: ${draft.subject}\n\n${draft.body}`;

  await supabase.from("follow_ups").update({ suggested_message: formatted }).eq("id", followUpId);
  return draft;
}

export type CampaignCriteria = {
  lifecycleStages: LifecycleStage[];
  idleDays: number;
};

const CAMPAIGN_MAX_RECIPIENTS = 15;

/**
 * Finds accounts matching the campaign filter and generates one
 * individually-personalized follow-up + email per recipient — never one
 * generic message blasted to everyone. Capped to keep a single request
 * within a reasonable execution time; larger campaigns can be re-run to
 * pick up the rest.
 */
export async function matchCampaignAccounts(orgId: string, criteria: CampaignCriteria) {
  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - criteria.idleDays);

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, lifecycle_stage, last_activity_at")
    .eq("org_id", orgId)
    .in("lifecycle_stage", criteria.lifecycleStages);

  return (accounts ?? [])
    .filter((a) => !a.last_activity_at || new Date(a.last_activity_at) < cutoff)
    .slice(0, CAMPAIGN_MAX_RECIPIENTS);
}
