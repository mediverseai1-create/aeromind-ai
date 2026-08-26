import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/gemini";
import AskForm from "@/components/dashboard/AskForm";

export const metadata = { title: "Ask AeroMind — AeroMind AI" };

export default async function AskPage() {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: dataset }, { data: history }] = await Promise.all([
    supabase
      .from("datasets")
      .select("id")
      .eq("org_id", current.org.id)
      .eq("status", "ready")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("questions")
      .select("id, question, answer")
      .eq("org_id", current.org.id)
      .eq("status", "answered")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <>
      <div className="app-topbar">
        <h1>Ask AeroMind</h1>
      </div>
      <div className="card">
        <h3>Ask a question about your data</h3>
        <p className="card-sub">Type a question the way you&rsquo;d say it out loud.</p>
        <AskForm
          aiConfigured={isAiConfigured()}
          hasDataset={!!dataset}
          initialHistory={(history ?? []).map((h) => ({ id: h.id, question: h.question, answer: h.answer ?? "" }))}
        />
      </div>
    </>
  );
}
