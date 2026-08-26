import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OperationKey } from "@/lib/types/database";

/**
 * Reads the credit cost for an AI operation from ai_operation_costs — never
 * hardcode a number at a call site. Costs are configurable in the database
 * so they can change without a code deploy.
 */
export async function getOperationCost(operationKey: OperationKey): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_operation_costs")
    .select("credit_cost")
    .eq("operation_key", operationKey)
    .eq("is_active", true)
    .maybeSingle();
  return data?.credit_cost ?? null;
}
