import "server-only";
import { createClient } from "@/lib/supabase/server";
import { callGeminiJson } from "@/lib/ai/gemini";
import {
  computeSummary,
  computeMonthlyTrend,
  rankBy,
  decliningCustomers,
  computeConcentrationRisk,
  type DatasetRow,
} from "@/lib/analytics/compute";

const ROW_LIMIT = 5000;

export type AskResult = {
  answer: string;
  groundedData: Record<string, unknown>;
};

/**
 * Answers one plain-language question about an org's data, grounded strictly
 * in the same computed statistics the dashboard and briefing use — never
 * invented figures. Does not touch the credit ledger or save anything; the
 * caller (src/app/actions/ask.ts) owns that, same split as generateBriefing.
 */
export async function answerQuestion(orgId: string, datasetId: string, question: string): Promise<AskResult> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("dataset_rows")
    .select("row_date, product, customer, region, rep, quantity, unit_price, revenue")
    .eq("dataset_id", datasetId)
    .limit(ROW_LIMIT);

  const data = (rows ?? []) as DatasetRow[];
  if (data.length === 0) {
    throw new Error("This dataset has no rows to analyze.");
  }

  const summary = computeSummary(data);
  const trend = computeMonthlyTrend(data);
  const topProducts = rankBy(data, "product").slice(0, 10);
  const topCustomers = rankBy(data, "customer").slice(0, 10);
  const topRegions = rankBy(data, "region").slice(0, 10);
  const topReps = rankBy(data, "rep").slice(0, 10);
  const declining = decliningCustomers(data).slice(0, 15);
  const risk = computeConcentrationRisk(data);

  const groundedData = { summary, trend, topProducts, topCustomers, topRegions, topReps, declining, risk };

  const prompt = `You are AeroMind, an AI sales analyst answering one question from a user
about their own company's sales data. You are given REAL, PRE-COMPUTED
statistics below. Answer ONLY using these numbers — never invent a figure
that isn't present here. If the data doesn't contain enough information to
answer confidently, say so plainly rather than guessing.

DATA
${JSON.stringify(groundedData)}

QUESTION
${question}

Respond with ONLY valid JSON matching exactly this shape:
{ "answer": "a plain-English answer, a few sentences, citing the specific figures behind it" }`;

  const result = await callGeminiJson<{ answer: string }>(prompt);
  return { answer: result.answer, groundedData };
}
