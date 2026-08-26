import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Service-role Supabase client — BYPASSES Row Level Security entirely.
 *
 * Use this ONLY from the two places in this codebase that structurally
 * cannot have an authenticated user session: the Selar/Zapier webhook
 * (src/app/api/webhooks/selar) and the credit-reset cron
 * (src/app/api/cron/reset-credits). Every other server-side data access in
 * this project goes through src/lib/supabase/server.ts's RLS-respecting
 * client on purpose — do not reach for this client to "make an RLS problem
 * go away" anywhere else.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured — this route cannot run without it.");
  }
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
