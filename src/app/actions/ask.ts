"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { reserveCredits, commitCredits, releaseCredits, getCurrentWallet } from "@/lib/credits/wallet";
import { answerQuestion } from "@/lib/ai/ask";
import { isAiConfigured } from "@/lib/ai/gemini";

export type AskQuestionResult =
  | { ok: true; questionId: string; answer: string }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "no_dataset" }
  | { ok: false; reason: "insufficient_credits"; remaining: number; resetDate: string }
  | { ok: false; reason: "generation_failed"; message: string };

export async function askQuestionAction(question: string, idempotencyKey: string): Promise<AskQuestionResult> {
  const current = await getCurrentOrg();
  if (!current) throw new Error("Not signed in.");
  const orgId = current.org.id;

  if (!isAiConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const trimmed = question.trim();
  if (!trimmed) {
    return { ok: false, reason: "generation_failed", message: "Type a question first." };
  }

  const supabase = await createClient();
  const { data: dataset } = await supabase
    .from("datasets")
    .select("id")
    .eq("org_id", orgId)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!dataset) {
    return { ok: false, reason: "no_dataset" };
  }

  const reservation = await reserveCredits(orgId, "ask_aeromind", idempotencyKey);
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
    result = await answerQuestion(orgId, dataset.id, trimmed);
  } catch (err) {
    await releaseCredits(reservation.transactionId, err instanceof Error ? err.message : "unknown_error");
    return {
      ok: false,
      reason: "generation_failed",
      message: err instanceof Error ? err.message : "Something went wrong answering that question.",
    };
  }

  const { data: saved, error: saveError } = await supabase
    .from("questions")
    .insert({
      org_id: orgId,
      asked_by: current.user.id,
      question: trimmed,
      answer: result.answer,
      grounded_data: result.groundedData,
      status: "answered",
    })
    .select("id")
    .single();

  if (saveError || !saved) {
    await releaseCredits(reservation.transactionId, saveError?.message ?? "save_failed");
    return {
      ok: false,
      reason: "generation_failed",
      message: saveError?.message ?? "Couldn't save the answer.",
    };
  }

  await commitCredits(reservation.transactionId, saved.id);

  return { ok: true, questionId: saved.id, answer: result.answer };
}
