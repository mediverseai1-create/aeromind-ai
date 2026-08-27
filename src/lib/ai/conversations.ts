import "server-only";
import { createClient } from "@/lib/supabase/server";
import { callGeminiJson, callGeminiJsonWithAudio, callGeminiText } from "@/lib/ai/gemini";

const INSIGHT_SHAPE = `{
  "summary": string,
  "keyTopics": string[],
  "buyerIntent": "high" | "medium" | "low",
  "buyerIntentEvidence": string[],
  "sentiment": "positive" | "neutral" | "concerned" | "mixed",
  "objections": string[],
  "questionsAsked": string[],
  "commitments": string[],
  "nextSteps": string[],
  "followUpDate": string | null,
  "decisionCriteria": string[],
  "competitorsMentioned": string[],
  "peopleMentioned": string[],
  "dealRisks": string[],
  "opportunities": string[],
  "recommendedNextAction": string
}`;

export type ConversationInsights = {
  summary: string;
  keyTopics: string[];
  buyerIntent: "high" | "medium" | "low";
  buyerIntentEvidence: string[];
  sentiment: "positive" | "neutral" | "concerned" | "mixed";
  objections: string[];
  questionsAsked: string[];
  commitments: string[];
  nextSteps: string[];
  followUpDate: string | null;
  decisionCriteria: string[];
  competitorsMentioned: string[];
  peopleMentioned: string[];
  dealRisks: string[];
  opportunities: string[];
  recommendedNextAction: string;
};

const BASE_PROMPT = `You are AeroMind, extracting structured sales intelligence from a real sales call or meeting. Only report what is actually said or reasonably implied by the conversation — never invent names, numbers, dates or facts that aren't there. Use "mixed" sentiment or lower-confidence values rather than guessing when the signal is ambiguous. followUpDate should be an ISO date (YYYY-MM-DD) only if a specific date or clear relative date ("next Tuesday", "in September") was mentioned — otherwise null.

Respond with JSON only, matching exactly this shape:
${INSIGHT_SHAPE}`;

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

/** Runs the full post-call analysis on a conversation and saves the result. */
export async function analyzeConversation(orgId: string, conversationId: string): Promise<ConversationInsights> {
  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("org_id", orgId)
    .single();
  if (!conversation) throw new Error("Conversation not found.");

  let insights: ConversationInsights;

  if (conversation.source_type === "transcript") {
    if (!conversation.transcript_text) throw new Error("No transcript text to analyze.");
    insights = await callGeminiJson<ConversationInsights>(`${BASE_PROMPT}\n\nTranscript:\n${conversation.transcript_text}`);
  } else {
    if (!conversation.storage_path) throw new Error("No audio file to analyze.");
    const { data: file, error } = await supabase.storage.from("conversations").download(conversation.storage_path);
    if (error || !file) throw new Error("Couldn't load the audio file from storage.");
    if (file.size > MAX_AUDIO_BYTES) {
      throw new Error("This recording is too large to analyze directly (max 15MB) — try a shorter clip or paste a transcript instead.");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    insights = await callGeminiJsonWithAudio<ConversationInsights>(BASE_PROMPT, base64, file.type || "audio/mpeg");
  }

  await supabase.from("conversation_insights").insert({
    conversation_id: conversationId,
    org_id: orgId,
    summary: insights.summary,
    key_topics: insights.keyTopics,
    buyer_intent: insights.buyerIntent,
    buyer_intent_evidence: insights.buyerIntentEvidence,
    sentiment: insights.sentiment,
    objections: insights.objections,
    questions_asked: insights.questionsAsked,
    commitments: insights.commitments,
    next_steps: insights.nextSteps,
    follow_up_date: insights.followUpDate,
    decision_criteria: insights.decisionCriteria,
    competitors_mentioned: insights.competitorsMentioned,
    people_mentioned: insights.peopleMentioned,
    deal_risks: insights.dealRisks,
    opportunities: insights.opportunities,
    recommended_next_action: insights.recommendedNextAction,
  });

  await supabase.from("conversations").update({ status: "analyzed" }).eq("id", conversationId);

  return insights;
}

/**
 * Prepares a rep for an upcoming call, grounded in the account's real
 * revenue history, past analyzed conversations, and any open follow-ups —
 * never invented. If there's nothing on file, the brief says so plainly.
 */
export async function generateMeetingBrief(orgId: string, accountId: string): Promise<string> {
  const supabase = await createClient();
  const { data: account } = await supabase.from("accounts").select("*").eq("id", accountId).eq("org_id", orgId).single();
  if (!account) throw new Error("Account not found.");

  let context = `Account: ${account.name}. Relationship stage: ${account.lifecycle_stage}.`;

  if (account.linked_customer_key) {
    const { data: rows } = await supabase
      .from("dataset_rows")
      .select("revenue, row_date, product")
      .eq("org_id", orgId)
      .eq("customer", account.linked_customer_key)
      .order("row_date", { ascending: false })
      .limit(10);
    if (rows && rows.length > 0) {
      const total = rows.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
      context += ` Recent orders: ${rows
        .map((r) => `${r.row_date ?? "unknown date"} — ${r.product ?? "item"} ($${r.revenue ?? 0})`)
        .join("; ")}. Recent total: $${total.toLocaleString()}.`;
    } else {
      context += " No purchase history on file yet.";
    }
  }

  const { data: pastConversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("org_id", orgId)
    .eq("account_id", accountId)
    .eq("status", "analyzed")
    .order("created_at", { ascending: false })
    .limit(3);

  if (pastConversations && pastConversations.length > 0) {
    const { data: insights } = await supabase
      .from("conversation_insights")
      .select("summary, objections, commitments, next_steps, recommended_next_action")
      .in("conversation_id", pastConversations.map((c) => c.id));
    if (insights && insights.length > 0) {
      context += `\n\nPast conversations (most recent first):\n${insights
        .map(
          (i, idx) =>
            `${idx + 1}. ${i.summary} Objections: ${((i.objections as string[] | null) ?? []).join(", ") || "none noted"}. Commitments: ${
              ((i.commitments as string[] | null) ?? []).join(", ") || "none noted"
            }. Next steps: ${((i.next_steps as string[] | null) ?? []).join(", ") || "none noted"}.`
        )
        .join("\n")}`;
    }
  } else {
    context += "\n\nNo past analyzed conversations on file.";
  }

  const { data: openFollowUps } = await supabase
    .from("follow_ups")
    .select("reason")
    .eq("org_id", orgId)
    .eq("account_id", accountId)
    .eq("status", "pending");
  if (openFollowUps && openFollowUps.length > 0) {
    context += `\n\nOpen follow-ups: ${openFollowUps.map((f) => f.reason).join("; ")}`;
  }

  const prompt = `You are preparing a sales rep for an upcoming call with this account. Using ONLY the real context below, write a concise meeting brief: relationship history, known objections, previous promises, a suggested opening line, 3-4 questions to ask, and the likely desired outcome for this call. Where information isn't available, say so plainly instead of inventing it.

${context}

Write it as clear, well-organized plain text (short headed sections are fine), under 300 words.`;

  return callGeminiText(prompt);
}
