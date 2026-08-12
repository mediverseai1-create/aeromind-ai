import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Loads the signed-in user's organization (AeroMind is single-org-per-user
 * for now: one membership row created during onboarding). Returns null if
 * the user hasn't completed onboarding yet.
 */
export async function getCurrentOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.org_id)
    .maybeSingle();

  if (!org) return null;

  return { user, role: membership.role, org };
}
