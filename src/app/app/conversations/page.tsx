import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/gemini";
import ConversationUpload from "@/components/dashboard/ConversationUpload";
import MeetingBriefCard from "@/components/dashboard/MeetingBriefCard";
import ConversationList from "@/components/dashboard/ConversationList";

export const metadata = { title: "Conversations — AeroMind AI" };
// Audio analysis downloads the file server-side and sends it to Gemini —
// give it more headroom than the platform's 10s default.
export const maxDuration = 60;

export default async function ConversationsPage() {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  const supabase = await createClient();

  const [{ data: accounts }, { data: conversations }] = await Promise.all([
    supabase.from("accounts").select("id, name").eq("org_id", current.org.id).order("name"),
    supabase
      .from("conversations")
      .select("id, source_type, status, occurred_at, created_at, account_id, accounts(name)")
      .eq("org_id", current.org.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const conversationIds = (conversations ?? []).map((c) => c.id);
  const { data: insights } =
    conversationIds.length > 0
      ? await supabase.from("conversation_insights").select("*").in("conversation_id", conversationIds)
      : { data: [] };

  const insightsByConversation = new Map((insights ?? []).map((i) => [i.conversation_id, i]));

  return (
    <>
      <div className="app-topbar">
        <h1>Conversations</h1>
      </div>

      <MeetingBriefCard accounts={accounts ?? []} aiConfigured={isAiConfigured()} />

      <ConversationUpload accounts={accounts ?? []} aiConfigured={isAiConfigured()} />

      <ConversationList
        aiConfigured={isAiConfigured()}
        conversations={(conversations ?? []).map((c) => ({
          ...c,
          insight: insightsByConversation.get(c.id) ?? null,
        })) as never}
      />
    </>
  );
}
