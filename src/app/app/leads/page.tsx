import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/gemini";
import IcpManager from "@/components/dashboard/IcpManager";

export const metadata = { title: "Lead Finder AI — AeroMind AI" };

export default async function LeadFinderPage() {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  const supabase = await createClient();
  const { data: icps } = await supabase
    .from("ideal_customer_profiles")
    .select("*")
    .eq("org_id", current.org.id)
    .order("created_at", { ascending: false });

  const icpIds = (icps ?? []).map((i) => i.id);
  const { data: candidates } =
    icpIds.length > 0
      ? await supabase
          .from("lead_candidates")
          .select("*")
          .in("icp_id", icpIds)
          .order("fit_score", { ascending: false })
      : { data: [] };

  type Candidate = NonNullable<typeof candidates>[number];
  const candidatesByIcp = (candidates ?? []).reduce<Record<string, Candidate[]>>((acc, c) => {
    (acc[c.icp_id ?? ""] ??= []).push(c);
    return acc;
  }, {});

  return (
    <>
      <div className="app-topbar">
        <h1>Lead Finder AI</h1>
      </div>

      <IcpManager aiConfigured={isAiConfigured()} icps={icps ?? []} candidatesByIcp={candidatesByIcp} />

      <div className="card">
        <h3>Search the web for new matches</h3>
        <div className="coming-soon">
          <b>Coming soon.</b> AeroMind can score candidates you tell it about against your Ideal Customer
          Profile today. Automatically finding new companies from the open web needs a company/contact data
          provider, which isn&rsquo;t connected yet — the AI scoring engine above is ready for it.
        </div>
      </div>
    </>
  );
}
