"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeConversationAction, createFollowUpFromConversationAction } from "@/app/actions/conversations";

type Insight = {
  summary: string | null;
  key_topics: string[] | null;
  buyer_intent: string | null;
  sentiment: string | null;
  objections: string[] | null;
  commitments: string[] | null;
  next_steps: string[] | null;
  deal_risks: string[] | null;
  opportunities: string[] | null;
  recommended_next_action: string | null;
  follow_up_date: string | null;
};

type Conversation = {
  id: string;
  source_type: "recording" | "transcript";
  status: "uploaded" | "processing" | "analyzed" | "error";
  occurred_at: string | null;
  created_at: string;
  account_id: string | null;
  accounts: { name: string } | null;
  insight: Insight | null;
};

function List({ items }: { items: string[] | null | undefined }) {
  if (!items || items.length === 0) return <span style={{ color: "var(--mute)" }}>none noted</span>;
  return <>{items.join(", ")}</>;
}

export default function ConversationList({ conversations, aiConfigured }: { conversations: Conversation[]; aiConfigured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [followUpAdded, setFollowUpAdded] = useState<Record<string, boolean>>({});

  async function handleAnalyze(id: string) {
    setBusy(id);
    await analyzeConversationAction(id, crypto.randomUUID());
    setBusy(null);
    router.refresh();
  }

  async function handleAddFollowUp(id: string) {
    setBusy(id);
    await createFollowUpFromConversationAction(id);
    setBusy(null);
    setFollowUpAdded((s) => ({ ...s, [id]: true }));
  }

  if (conversations.length === 0) {
    return (
      <div className="card">
        <h3>Past conversations</h3>
        <div className="empty">
          <p>No conversations uploaded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Past conversations</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {conversations.map((c) => (
          <div key={c.id} className="panel" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <h4 style={{ margin: 0 }}>{c.accounts?.name ?? "Unlinked call"}</h4>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="badge">{c.source_type}</span>
                <span className={`badge ${c.status === "analyzed" ? "ok" : c.status === "error" ? "warn" : ""}`}>{c.status}</span>
              </div>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--mute)" }}>
              {new Date(c.created_at).toLocaleString()}
            </p>

            {c.status !== "analyzed" && aiConfigured && (
              <button className="btn btn-ghost" onClick={() => handleAnalyze(c.id)} disabled={busy === c.id} style={{ marginTop: 12 }}>
                {busy === c.id ? "Analyzing…" : "Analyze now"}
              </button>
            )}

            {c.insight && (
              <div className="prose" style={{ marginTop: 12 }}>
                <p>{c.insight.summary}</p>
                <ul>
                  <li>
                    <strong>Buyer intent:</strong> {c.insight.buyer_intent ?? "unknown"} &middot;{" "}
                    <strong>Sentiment:</strong> {c.insight.sentiment ?? "unknown"}
                  </li>
                  <li>
                    <strong>Objections:</strong> <List items={c.insight.objections} />
                  </li>
                  <li>
                    <strong>Commitments:</strong> <List items={c.insight.commitments} />
                  </li>
                  <li>
                    <strong>Next steps:</strong> <List items={c.insight.next_steps} />
                  </li>
                  <li>
                    <strong>Deal risks:</strong> <List items={c.insight.deal_risks} />
                  </li>
                  <li>
                    <strong>Opportunities:</strong> <List items={c.insight.opportunities} />
                  </li>
                  {c.insight.recommended_next_action && (
                    <li>
                      <strong>Recommended next action:</strong> {c.insight.recommended_next_action}
                    </li>
                  )}
                </ul>
                {c.account_id && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleAddFollowUp(c.id)}
                    disabled={busy === c.id || followUpAdded[c.id]}
                    style={{ marginTop: 4 }}
                  >
                    {followUpAdded[c.id] ? "Added to follow-up queue" : "Add to follow-up queue"}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
