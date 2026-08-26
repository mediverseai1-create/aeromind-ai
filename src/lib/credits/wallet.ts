import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OperationKey } from "@/lib/types/database";

export type ReserveResult =
  | { ok: true; transactionId: string; remaining: number }
  | { ok: false; reason: "insufficient_credits"; remaining: number }
  | { ok: false; reason: "already_settled"; transactionId: string; remaining: number };

/**
 * Reserves credits for an AI operation via the reserve_credits() Postgres
 * function (security definer — enforces membership, locks the wallet row,
 * and is the single source of truth for whether a reservation succeeds).
 *
 * `idempotencyKey` should be minted once per user-initiated attempt
 * (crypto.randomUUID(), held in a ref on the client so a re-render or
 * accidental double-submit reuses it) — reusing the key on retry returns the
 * prior outcome instead of reserving twice.
 */
export async function reserveCredits(
  orgId: string,
  operationKey: OperationKey,
  idempotencyKey: string
): Promise<ReserveResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reserve_credits", {
    p_org_id: orgId,
    p_operation_key: operationKey,
    p_idempotency_key: idempotencyKey,
  });

  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) throw new Error("reserve_credits returned no row");

  if (!row.reserved) {
    if (row.transaction_id) {
      // an idempotency-key hit whose prior attempt was released (e.g. the
      // last try failed) reports reserved=false too — treat it as
      // insufficient/retryable rather than a hard error.
      return { ok: false, reason: "insufficient_credits", remaining: row.remaining };
    }
    return { ok: false, reason: "insufficient_credits", remaining: row.remaining };
  }

  return { ok: true, transactionId: row.transaction_id!, remaining: row.remaining };
}

export async function commitCredits(transactionId: string, relatedId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("commit_credits", {
    p_transaction_id: transactionId,
    p_related_id: relatedId ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function releaseCredits(transactionId: string, reason?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("release_credits", {
    p_transaction_id: transactionId,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function getCurrentWallet(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("credit_wallets").select("*").eq("org_id", orgId).maybeSingle();
  if (!data) return null;
  return {
    ...data,
    remaining: data.monthly_allowance - data.allocated - data.consumed,
  };
}
