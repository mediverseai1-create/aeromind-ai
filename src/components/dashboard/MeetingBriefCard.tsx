"use client";

import { useState } from "react";
import { generateMeetingBriefAction } from "@/app/actions/conversations";

export default function MeetingBriefCard({
  accounts,
  aiConfigured,
}: {
  accounts: { id: string; name: string }[];
  aiConfigured: boolean;
}) {
  const [accountId, setAccountId] = useState("");
  const [brief, setBrief] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleGenerate() {
    if (!accountId) {
      setStatus({ text: "Pick an account first.", err: true });
      return;
    }
    setBusy(true);
    setStatus(null);
    setBrief(null);
    const result = await generateMeetingBriefAction(accountId, crypto.randomUUID());
    setBusy(false);
    if (!result.ok) {
      if (result.reason === "insufficient_credits") {
        setStatus({
          text: `You've used your monthly credits (${Math.max(0, Math.round(result.remaining))} remaining). They refresh on ${result.resetDate || "your next cycle"}.`,
          err: true,
        });
      } else if (result.reason === "not_configured") {
        setStatus({ text: "AI isn't configured for this workspace yet.", err: true });
      } else {
        setStatus({ text: result.message, err: true });
      }
      return;
    }
    setBrief(result.brief);
  }

  if (accounts.length === 0) return null;

  return (
    <div className="card">
      <h3>Meeting brief</h3>
      <p className="card-sub">Before your next call — relationship history, objections, a suggested opening.</p>

      {!aiConfigured ? (
        <div className="coming-soon">
          <b>Coming soon.</b> Meeting briefs need a Gemini API key configured for this workspace.
        </div>
      ) : (
        <>
          <div className="two" style={{ alignItems: "end" }}>
            <div className="field" style={{ marginTop: 0 }}>
              <label htmlFor="brief-account">Account</label>
              <select id="brief-account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Choose an account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={busy} style={{ marginBottom: 20 }}>
              {busy ? "Preparing…" : "Get meeting brief"}
            </button>
          </div>
          {status && <p className={`status${status.err ? " err" : ""}`}>{status.text}</p>}
          {brief && (
            <pre
              style={{
                marginTop: 4,
                padding: 16,
                background: "rgba(14,27,42,.04)",
                borderRadius: 12,
                fontSize: 14,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--body)",
              }}
            >
              {brief}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
