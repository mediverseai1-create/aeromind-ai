"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { reserveCredits, commitCredits, releaseCredits, getCurrentWallet } from "@/lib/credits/wallet";
import { isAiConfigured } from "@/lib/ai/gemini";
import { analyzeConversation, generateMeetingBrief } from "@/lib/ai/conversations";

export type ActionResult<T> =
  | ({ ok: true } & T)
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "insufficient_credits"; remaining: number; resetDate: string }
  | { ok: false; reason: "failed"; message: string };

export async function analyzeConversationAction(
  conversationId: string,
  idempotencyKey: string
): Promise<ActionResult<{ conversationId: string }>> {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  const reservation = await reserveCredits(current.org.id, "conversation_analysis", idempotencyKey);
  if (!reservation.ok) {
    const wallet = await getCurrentWallet(current.org.id);
    return { ok: false, reason: "insufficient_credits", remaining: reservation.remaining, resetDate: wallet?.billing_cycle_end ?? "" };
  }

  try {
    await analyzeConversation(current.org.id, conversationId);
    await commitCredits(reservation.transactionId, conversationId);
    return { ok: true, conversationId };
  } catch (err) {
    await releaseCredits(reservation.transactionId, err instanceof Error ? err.message : "unknown_error");
    return { ok: false, reason: "failed", message: err instanceof Error ? err.message : "Analysis failed." };
  }
}

export async function generateMeetingBriefAction(
  accountId: string,
  idempotencyKey: string
): Promise<ActionResult<{ brief: string }>> {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  const reservation = await reserveCredits(current.org.id, "meeting_brief", idempotencyKey);
  if (!reservation.ok) {
    const wallet = await getCurrentWallet(current.org.id);
    return { ok: false, reason: "insufficient_credits", remaining: reservation.remaining, resetDate: wallet?.billing_cycle_end ?? "" };
  }

  try {
    const brief = await generateMeetingBrief(current.org.id, accountId);
    await commitCredits(reservation.transactionId);
    return { ok: true, brief };
  } catch (err) {
    await releaseCredits(reservation.transactionId, err instanceof Error ? err.message : "unknown_error");
    return { ok: false, reason: "failed", message: err instanceof Error ? err.message : "Couldn't generate the brief." };
  }
}

/** Free — reuses already-generated insights, no new AI call. */
export async function createFollowUpFromConversationAction(conversationId: string) {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("account_id")
    .eq("id", conversationId)
    .eq("org_id", current.org.id)
    .single();
  if (!conversation) throw new Error("Conversation not found.");

  const { data: insight } = await supabase
    .from("conversation_insights")
    .select("recommended_next_action, follow_up_date")
    .eq("conversation_id", conversationId)
    .maybeSingle();
  if (!insight) throw new Error("This conversation hasn't been analyzed yet.");

  const dueAt = insight.follow_up_date ? new Date(insight.follow_up_date) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  await supabase.from("follow_ups").insert({
    org_id: current.org.id,
    account_id: conversation.account_id,
    reason: insight.recommended_next_action ?? "Follow up on this conversation.",
    suggested_channel: "email",
    due_at: dueAt.toISOString(),
    status: "pending",
    generated_by: "ai",
  });
}
