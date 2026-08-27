import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DatasetRow } from "@/lib/analytics/compute";
import type { LifecycleStage } from "@/lib/types/database";

/**
 * Turns the customers already sitting in an uploaded dataset into real CRM
 * `accounts` rows — no manual entry required, matching "minimum input,
 * maximum action." This is plain aggregation, not an AI call, so it never
 * touches the credit ledger.
 *
 * Lifecycle inference is necessarily limited to what a sales file can prove:
 * a customer is 'customer' if they bought recently, 'dormant' if they went
 * quiet, 'previous_customer' if they stopped entirely partway through the
 * period. True 'lead'/'prospect' accounts (people who haven't bought yet)
 * can't be derived from sales history — those come from Lead Finder AI
 * later, or can be added manually today.
 */
export async function syncAccountsFromDataset(orgId: string, datasetId: string): Promise<{ synced: number }> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("dataset_rows")
    .select("row_date, customer, revenue")
    .eq("dataset_id", datasetId)
    .not("customer", "is", null)
    .limit(20000);

  const data = (rows ?? []) as Pick<DatasetRow, "row_date" | "customer" | "revenue">[];
  if (data.length === 0) return { synced: 0 };

  const byCustomer = new Map<string, { lastDate: string | null; totalRevenue: number }>();
  let globalLastDate: string | null = null;

  for (const r of data) {
    if (!r.customer) continue;
    const entry = byCustomer.get(r.customer) ?? { lastDate: null, totalRevenue: 0 };
    entry.totalRevenue += r.revenue ?? 0;
    if (r.row_date && (!entry.lastDate || r.row_date > entry.lastDate)) entry.lastDate = r.row_date;
    if (r.row_date && (!globalLastDate || r.row_date > globalLastDate)) globalLastDate = r.row_date;
    byCustomer.set(r.customer, entry);
  }

  const asOf = globalLastDate ? new Date(globalLastDate) : new Date();
  const dormantCutoff = new Date(asOf);
  dormantCutoff.setDate(dormantCutoff.getDate() - 60);
  const previousCutoff = new Date(asOf);
  previousCutoff.setDate(previousCutoff.getDate() - 180);

  const { data: existing } = await supabase.from("accounts").select("id, name").eq("org_id", orgId);
  const existingNames = new Set((existing ?? []).map((a) => a.name));

  const toInsert: {
    org_id: string;
    name: string;
    lifecycle_stage: LifecycleStage;
    source: "dataset_import";
    linked_customer_key: string;
    last_activity_at: string | null;
  }[] = [];

  for (const [name, entry] of byCustomer.entries()) {
    if (existingNames.has(name)) continue;
    let stage: LifecycleStage = "customer";
    if (entry.lastDate) {
      const last = new Date(entry.lastDate);
      if (last < previousCutoff) stage = "previous_customer";
      else if (last < dormantCutoff) stage = "dormant";
    }
    toInsert.push({
      org_id: orgId,
      name,
      lifecycle_stage: stage,
      source: "dataset_import",
      linked_customer_key: name,
      last_activity_at: entry.lastDate,
    });
  }

  if (toInsert.length > 0) {
    await supabase.from("accounts").insert(toInsert);
  }

  return { synced: toInsert.length };
}
