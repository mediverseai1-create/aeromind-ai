"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIcpAction, addAndScoreCandidateAction, addCandidateToFollowUpAction } from "@/app/actions/leadfinder";
import type { DerivedSignals } from "@/lib/ai/leadfinder";

type Icp = {
  id: string;
  name: string;
  description: string | null;
  derived_signals: Record<string, unknown>;
};

type Candidate = {
  id: string;
  company_name: string;
  fit_score: number | null;
  fit_reasoning: string | null;
  status: string;
};

function errText(result: { ok: false; reason: string; message?: string; remaining?: number; resetDate?: string }) {
  if (result.reason === "not_configured") return "AI isn't configured for this workspace yet.";
  if (result.reason === "insufficient_credits") {
    return `You've used your monthly credits (${Math.max(0, Math.round(result.remaining ?? 0))} remaining).`;
  }
  return result.message ?? "Something went wrong.";
}

export default function IcpManager({
  icps,
  candidatesByIcp,
  aiConfigured,
}: {
  icps: Icp[];
  candidatesByIcp: Record<string, Candidate[] | undefined>;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateIcp() {
    if (!newName.trim() || !newDescription.trim()) {
      setError("Give it a name and describe who you sell to.");
      return;
    }
    setCreating(true);
    setError(null);
    const result = await createIcpAction(newName.trim(), newDescription.trim(), crypto.randomUUID());
    setCreating(false);
    if (!result.ok) {
      setError(errText(result));
      return;
    }
    setNewName("");
    setNewDescription("");
    router.refresh();
  }

  return (
    <>
      <div className="card">
        <h3>Ideal customer profile</h3>
        <p className="card-sub">
          Tell AeroMind who you sell to — it learns from your best real accounts, not a generic template.
        </p>
        {!aiConfigured ? (
          <div className="coming-soon">
            <b>Coming soon.</b> Building an ICP needs a Gemini API key configured for this workspace.
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="icp-name">Profile name</label>
              <input id="icp-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enterprise SaaS buyers" />
            </div>
            <div className="field">
              <label htmlFor="icp-desc">Who do you sell to?</label>
              <textarea
                id="icp-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="We sell accounting software to small healthcare businesses in the US."
                style={{ minHeight: 100 }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleCreateIcp} disabled={creating}>
              {creating ? "Learning from your data…" : "Build ideal customer profile"}
            </button>
            {error && <p className="status err">{error}</p>}
          </>
        )}
      </div>

      {icps.map((icp) => (
        <IcpCard key={icp.id} icp={icp} candidates={candidatesByIcp[icp.id] ?? []} aiConfigured={aiConfigured} />
      ))}
    </>
  );
}

function IcpCard({ icp, candidates, aiConfigured }: { icp: Icp; candidates: Candidate[]; aiConfigured: boolean }) {
  const router = useRouter();
  const signals = icp.derived_signals as DerivedSignals | undefined;
  const [companyName, setCompanyName] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedToFollowUp, setAddedToFollowUp] = useState<Record<string, boolean>>({});

  async function handleScore() {
    if (!companyName.trim()) {
      setError("Enter a company name.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await addAndScoreCandidateAction(icp.id, companyName.trim(), extraContext.trim(), crypto.randomUUID());
    setBusy(false);
    if (!result.ok) {
      setError(errText(result));
      return;
    }
    setCompanyName("");
    setExtraContext("");
    router.refresh();
  }

  async function handleAddToFollowUp(id: string) {
    setBusy(true);
    await addCandidateToFollowUpAction(id);
    setBusy(false);
    setAddedToFollowUp((s) => ({ ...s, [id]: true }));
  }

  return (
    <div className="card">
      <h3>{icp.name}</h3>
      <p className="card-sub">{icp.description}</p>

      {signals && (
        <div className="prose" style={{ marginBottom: 16 }}>
          <p>
            <strong>Characteristics of your best customers:</strong>{" "}
            {signals.idealCharacteristics?.join(", ") || "none derived yet"}
          </p>
          <p>
            <strong>Top products they buy:</strong> {signals.topProducts?.join(", ") || "unspecified"}
          </p>
          {signals.notes && <p>{signals.notes}</p>}
        </div>
      )}

      {aiConfigured && (
        <div className="two" style={{ alignItems: "end" }}>
          <div className="field" style={{ marginTop: 0 }}>
            <label>Company name</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Health Co." />
          </div>
          <div className="field" style={{ marginTop: 0 }}>
            <label>What do you know about them? (optional)</label>
            <input value={extraContext} onChange={(e) => setExtraContext(e.target.value)} placeholder="~40 employees, healthcare billing" />
          </div>
        </div>
      )}
      {aiConfigured && (
        <button className="btn btn-primary" onClick={handleScore} disabled={busy} style={{ marginTop: 8 }}>
          {busy ? "Scoring…" : "Score this candidate"}
        </button>
      )}
      {error && <p className="status err">{error}</p>}

      {candidates.length > 0 && (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {candidates.map((c) => (
            <div key={c.id} className="panel" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h4 style={{ margin: 0 }}>{c.company_name}</h4>
                <span className="badge ok">Fit {Math.round(c.fit_score ?? 0)}/100</span>
              </div>
              <p style={{ marginTop: 8, fontSize: 14 }}>{c.fit_reasoning}</p>
              {c.status === "candidate" ? (
                <button className="btn btn-ghost" onClick={() => handleAddToFollowUp(c.id)} disabled={busy || addedToFollowUp[c.id]} style={{ marginTop: 8 }}>
                  {addedToFollowUp[c.id] ? "Added to follow-up queue" : "Add to Follow-Up"}
                </button>
              ) : (
                <span className="badge" style={{ marginTop: 8 }}>
                  {c.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
