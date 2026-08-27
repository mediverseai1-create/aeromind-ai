import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/gemini";
import FollowUpQueue from "@/components/dashboard/FollowUpQueue";
import CampaignForm from "@/components/dashboard/CampaignForm";

export const metadata = { title: "Follow-Up AI — AeroMind AI" };
// The follow-up campaign action can loop several Gemini calls (one per
// recipient) — give it more headroom than the platform's 10s default.
export const maxDuration = 60;

export default async function FollowUpsPage() {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  const supabase = await createClient();

  const [{ count: accountCount }, { data: followUps }, { data: campaigns }] = await Promise.all([
    supabase.from("accounts").select("id", { count: "exact", head: true }).eq("org_id", current.org.id),
    supabase
      .from("follow_ups")
      .select("id, reason, suggested_channel, suggested_message, due_at, status, generated_by, account_id, accounts(name, lifecycle_stage)")
      .eq("org_id", current.org.id)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(100),
    supabase
      .from("follow_up_campaigns")
      .select("id, name, status, created_at")
      .eq("org_id", current.org.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <>
      <div className="app-topbar">
        <h1>Follow-Up AI</h1>
      </div>

      <FollowUpQueue
        aiConfigured={isAiConfigured()}
        hasAccounts={(accountCount ?? 0) > 0}
        followUps={(followUps ?? []) as never}
      />

      <CampaignForm campaigns={campaigns ?? []} aiConfigured={isAiConfigured()} hasAccounts={(accountCount ?? 0) > 0} />
    </>
  );
}
