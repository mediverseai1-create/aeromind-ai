"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaignAction } from "@/app/actions/followups";
import type { LifecycleStage } from "@/lib/types/database";

const STAGE_OPTIONS: { value: LifecycleStage; label: string }[] = [
  { value: "lead", label: "Leads" },
  { value: "prospect", label: "Prospects" },
  { value: "customer", label: "Existing customers" },
  { value: "previous_customer", label: "Previous customers" },
  { value: "dormant", label: "Dormant accounts" },
];

type Campaign = { id: string; name: string; status: string; created_at: string };

export default function CampaignForm({
  campaigns,
  aiConfigured,
  hasAccounts,
}: {
  campaigns: Campaign[];
  aiConfigured: boolean;
  hasAccounts: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [stages, setStages] = useState<LifecycleStage[]>(["dormant"]);
  const [idleDays, setIdleDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);

  function toggleStage(stage: LifecycleStage) {
    setStages((s) => (s.includes(stage) ? s.filter((x) => x !== stage) : [...s, stage]));
  }

  async function handleCreate() {
    if (!name.trim() || stages.length === 0) {
      setStatus({ text: "Give the campaign a name and pick at least one stage.", err: true });
      return;
    }
    setBusy(true);
    setStatus(null);
    const result = await createCampaignAction(name.trim(), { lifecycleStages: stages, idleDays });
    setBusy(false);
    if (!result.ok) {
      setStatus({ text: "message" in result ? result.message ?? "Something went wrong." : "Something went wrong.", err: true });
      return;
    }
    setStatus({
      text: `Generated ${result.generated} personalized follow-up${result.generated === 1 ? "" : "s"}.` +
        (result.skippedForCredits > 0 ? ` ${result.skippedForCredits} skipped — out of credits.` : ""),
    });
    setName("");
    router.refresh();
  }

  if (!hasAccounts) return null;

  return (
    <div className="card">
      <h3>Follow-up campaign</h3>
      <p className="card-sub">
        Follow up with everyone matching a filter — each recipient gets their own personalized message, not one
        generic template.
      </p>

      {!aiConfigured ? (
        <div className="coming-soon">
          <b>Coming soon.</b> Campaigns need a Gemini API key configured for this workspace.
        </div>
      ) : (
        <>
          <div className="field">
            <label htmlFor="campaign-name">Campaign name</label>
            <input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Re-engage dormant accounts"
            />
          </div>
          <div className="field">
            <label>Which accounts</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              {STAGE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    border: "1px solid var(--line)",
                    borderRadius: 999,
                    padding: "6px 12px",
                    cursor: "pointer",
                    background: stages.includes(opt.value) ? "rgba(46,91,255,.08)" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={stages.includes(opt.value)}
                    onChange={() => toggleStage(opt.value)}
                    style={{ width: "auto" }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="field" style={{ maxWidth: 220 }}>
            <label htmlFor="idle-days">Idle for at least (days)</label>
            <input
              id="idle-days"
              type="number"
              min={0}
              value={idleDays}
              onChange={(e) => setIdleDays(Number(e.target.value))}
            />
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={busy} style={{ marginTop: 8 }}>
            {busy ? "Generating personalized follow-ups…" : "Generate campaign"}
          </button>
          {status && <p className={`status${status.err ? " err" : ""}`}>{status.text}</p>}
        </>
      )}

      {campaigns.length > 0 && (
        <table className="data-table" style={{ marginTop: 24 }}>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>
                  <span className={`badge ${c.status === "completed" ? "ok" : ""}`}>{c.status}</span>
                </td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
