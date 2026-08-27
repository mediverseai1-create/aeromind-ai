"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  syncAccountsAction,
  generateQueueAction,
  generateEmailAction,
  updateFollowUpStatusAction,
} from "@/app/actions/followups";

type FollowUp = {
  id: string;
  reason: string;
  suggested_channel: "email" | "call" | "other" | null;
  suggested_message: string | null;
  due_at: string | null;
  status: "pending" | "sent" | "snoozed" | "done" | "skipped";
  generated_by: "ai" | "manual";
  account_id: string | null;
  accounts: { name: string; lifecycle_stage: string } | null;
};

function errorMessage(result: { ok: false; reason: string; message?: string; remaining?: number; resetDate?: string }) {
  if (result.reason === "not_configured") return "AI isn't configured for this workspace yet.";
  if (result.reason === "insufficient_credits") {
    return (
      `You've used your monthly credits (${Math.max(0, Math.round(result.remaining ?? 0))} remaining). ` +
      (result.resetDate ? `They refresh on ${result.resetDate}.` : "")
    );
  }
  return result.message ?? "Something went wrong.";
}

export default function FollowUpQueue({
  aiConfigured,
  hasAccounts,
  followUps,
}: {
  aiConfigured: boolean;
  hasAccounts: boolean;
  followUps: FollowUp[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const idempotencyRefs = useRef<Record<string, string>>({});

  function keyFor(id: string) {
    if (!idempotencyRefs.current[id]) idempotencyRefs.current[id] = crypto.randomUUID();
    return idempotencyRefs.current[id];
  }

  async function handleSync() {
    setBusy("sync");
    setError(null);
    const result = await syncAccountsAction();
    setBusy(null);
    if (!result.ok) {
      setError(errorMessage(result));
      return;
    }
    router.refresh();
  }

  async function handleGenerateQueue() {
    setBusy("queue");
    setError(null);
    const result = await generateQueueAction(keyFor("queue"));
    setBusy(null);
    if (!result.ok) {
      delete idempotencyRefs.current["queue"];
      setError(errorMessage(result));
      return;
    }
    delete idempotencyRefs.current["queue"];
    router.refresh();
  }

  async function handleGenerateEmail(id: string) {
    setBusy(id);
    setError(null);
    const result = await generateEmailAction(id, keyFor(id));
    setBusy(null);
    if (!result.ok) {
      delete idempotencyRefs.current[id];
      setError(errorMessage(result));
      return;
    }
    delete idempotencyRefs.current[id];
    setDrafts((d) => ({ ...d, [id]: `Subject: ${result.subject}\n\n${result.body}` }));
  }

  async function handleStatus(id: string, status: "done" | "skipped" | "snoozed") {
    setBusy(id);
    await updateFollowUpStatusAction(id, status);
    setBusy(null);
    router.refresh();
  }

  if (!hasAccounts) {
    return (
      <div className="card">
        <h3>Follow-up queue</h3>
        <p className="card-sub">AeroMind builds this from the customers already in your uploaded sales data.</p>
        <div className="empty">
          <p>No accounts yet — sync them from your uploaded sales file to get started.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSync} disabled={busy === "sync"} style={{ marginTop: 16 }}>
          {busy === "sync" ? "Syncing…" : "Sync accounts from my data"}
        </button>
        {error && <p className="status err">{error}</p>}
      </div>
    );
  }

  const pending = followUps.filter((f) => f.status === "pending" || f.status === "snoozed");
  const done = followUps.filter((f) => f.status === "done" || f.status === "skipped" || f.status === "sent");

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h3>Follow-up queue</h3>
          <p className="card-sub">Who needs a follow-up, why, and what to say.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={handleSync} disabled={busy === "sync"}>
            {busy === "sync" ? "Syncing…" : "Re-sync accounts"}
          </button>
          {aiConfigured && (
            <button className="btn btn-primary" onClick={handleGenerateQueue} disabled={busy === "queue"}>
              {busy === "queue" ? "Generating…" : "Generate queue"}
            </button>
          )}
        </div>
      </div>

      {!aiConfigured && (
        <div className="coming-soon" style={{ marginTop: 16 }}>
          <b>AI-generated follow-ups — coming soon.</b> Accounts sync from your data for free, but generating
          the prioritized queue and draft emails needs a Gemini API key configured for this workspace.
        </div>
      )}

      {error && <p className="status err">{error}</p>}

      {pending.length === 0 ? (
        <div className="empty" style={{ marginTop: 16 }}>
          <p>No open follow-ups. Generate the queue to see who needs attention.</p>
        </div>
      ) : (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {pending.map((f) => (
            <div key={f.id} className="panel" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h4 style={{ margin: 0 }}>{f.accounts?.name ?? "Unknown account"}</h4>
                  <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--ink-2)" }}>
                    {f.accounts?.lifecycle_stage ? `${f.accounts.lifecycle_stage} · ` : ""}
                    {f.due_at ? `due ${new Date(f.due_at).toLocaleDateString()}` : "no due date"}
                    {f.suggested_channel ? ` · ${f.suggested_channel}` : ""}
                  </p>
                </div>
                <span className="badge">{f.generated_by === "ai" ? "AI" : "Manual"}</span>
              </div>
              <p style={{ marginTop: 12 }}>{f.reason}</p>

              {(drafts[f.id] || f.suggested_message) && (
                <pre
                  style={{
                    marginTop: 12,
                    padding: 14,
                    background: "rgba(14,27,42,.04)",
                    borderRadius: 12,
                    fontSize: 13.5,
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--body)",
                  }}
                >
                  {drafts[f.id] ?? f.suggested_message}
                </pre>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                {aiConfigured && (
                  <button className="btn btn-ghost" onClick={() => handleGenerateEmail(f.id)} disabled={busy === f.id}>
                    {busy === f.id ? "Drafting…" : drafts[f.id] || f.suggested_message ? "Regenerate email" : "Generate email"}
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => handleStatus(f.id, "done")} disabled={busy === f.id}>
                  Mark done
                </button>
                <button className="btn btn-ghost" onClick={() => handleStatus(f.id, "snoozed")} disabled={busy === f.id}>
                  Snooze
                </button>
                <button className="btn btn-ghost" onClick={() => handleStatus(f.id, "skipped")} disabled={busy === f.id}>
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <details style={{ marginTop: 20 }}>
          <summary style={{ cursor: "pointer", fontSize: 14, color: "var(--ink-2)" }}>
            {done.length} resolved follow-up{done.length === 1 ? "" : "s"}
          </summary>
          <table className="data-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Account</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {done.map((f) => (
                <tr key={f.id}>
                  <td>{f.accounts?.name ?? "Unknown"}</td>
                  <td>
                    <span className="badge ok">{f.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
