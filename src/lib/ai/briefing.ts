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
import type { NextBestActionPriority, NextBestActionType } from "@/lib/types/database";

const ROW_LIMIT = 5000;

export type BriefingResult = {
  reportMd: string;
  strategyMd: string;
  actionPlanMd: string;
  briefing: {
    changes: string[];
    risks: string[];
    opportunities: string[];
    accountsNeedingAttention: string[];
  };
  nextBestActions: {
    title: string;
    reason: string;
    actionType: NextBestActionType;
    targetRef: Record<string, unknown>;
    priority: NextBestActionPriority;
  }[];
};

/**
 * Generates a Sales Briefing + Next Best Actions in a single Gemini call,
 * grounded strictly in the org's own computed numbers (never invented
 * figures — same principle the rest of this project follows for AI output).
 * Does NOT touch the credit ledger or save anything — that's the caller's
 * job (src/app/actions/briefing.ts), so this stays a pure "fetch, compute,
 * ask Gemini, return" function that's easy to test and to release credits
 * around if it throws.
 */
export async function generateBriefing(orgId: string, datasetId: string): Promise<BriefingResult> {
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

  const { data: priorAnalyses } = await supabase
    .from("analyses")
    .select("report_md, created_at")
    .eq("org_id", orgId)
    .eq("dataset_id", datasetId)
    .order("created_at", { ascending: false })
    .limit(1);

  const summary = computeSummary(data);
  const trend = computeMonthlyTrend(data);
  const topProducts = rankBy(data, "product").slice(0, 8);
  const topCustomers = rankBy(data, "customer").slice(0, 8);
  const declining = decliningCustomers(data).slice(0, 10);
  const risk = computeConcentrationRisk(data);
  const previousReport = priorAnalyses?.[0]?.report_md ?? null;

  const prompt = `You are AeroMind, an AI sales analyst. You are given REAL, PRE-COMPUTED
statistics from a company's sales data. Do not invent any numbers that are
not present below. Every claim in your output must be traceable to this
data. Write in plain English, not chart-title language.

SUMMARY
- Total revenue: ${summary.totalRevenue}
- Rows analyzed: ${summary.rowCount}
- Period: ${summary.firstDate ?? "unknown"} to ${summary.lastDate ?? "unknown"}
- Distinct customers: ${summary.customerCount}
- Distinct products: ${summary.productCount}
- Top customer revenue concentration: ${Math.round(risk.topCustomerShare * 100)}% (${risk.topCustomerName ?? "n/a"})
- Top 3 customers concentration: ${Math.round(risk.top3CustomerShare * 100)}%

MONTHLY REVENUE TREND
${JSON.stringify(trend)}

TOP PRODUCTS BY REVENUE
${JSON.stringify(topProducts)}

TOP CUSTOMERS BY REVENUE
${JSON.stringify(topCustomers)}

CUSTOMERS WITH DECLINING REVENUE (second half of period vs first half)
${JSON.stringify(declining)}

${previousReport ? `PREVIOUS BRIEFING FOR THIS DATASET (for "what changed" comparison):\n${previousReport}\n` : "No previous briefing exists for this dataset — this is the first run."}

Respond with ONLY valid JSON matching exactly this shape:
{
  "reportMd": "markdown report of what happened this period",
  "strategyMd": "markdown strategy for where to focus, grounded in what's already working",
  "actionPlanMd": "markdown ordered list of concrete steps",
  "briefing": {
    "changes": ["short bullet strings describing what changed"],
    "risks": ["short bullet strings describing revenue risks"],
    "opportunities": ["short bullet strings describing opportunities"],
    "accountsNeedingAttention": ["short bullet strings naming accounts and why"]
  },
  "nextBestActions": [
    {
      "title": "short imperative action, e.g. 'Contact Acme Co'",
      "reason": "one sentence grounded in the data above",
      "actionType": "contact_customer" | "follow_up_lead" | "re_engage_dormant" | "review_opportunity" | "address_risk" | "other",
      "targetRef": { "customer": "the customer or account name if applicable" },
      "priority": "low" | "medium" | "high"
    }
  ]
}
Produce between 3 and 8 next best actions, ordered by priority (high first).`;

  return callGeminiJson<BriefingResult>(prompt);
}
