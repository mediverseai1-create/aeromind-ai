"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { generateBriefingAction } from "@/app/actions/briefing";

type Analysis = {
  id: string;
  report_md: string | null;
  strategy_md: string | null;
  action_plan_md: string | null;
  created_at: string;
};

export default function BriefingPanel({
  datasetId,
  initialAnalysis,
  aiConfigured,
}: {
  datasetId: string;
  initialAnalysis: Analysis | null;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const idempotencyKeyRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }
    setStatus("loading");
    setError(null);

    const result = await generateBriefingAction(datasetId, idempotencyKeyRef.current);

    if (!result.ok) {
      idempotencyKeyRef.current = null; // free to mint a fresh attempt next click
      if (result.reason === "insufficient_credits") {
        setError(
          `You've used your monthly credits (${Math.max(0, Math.round(result.remaining))} remaining). ` +
            (result.resetDate ? `They refresh on ${result.resetDate}, ` : "") +
            "or upgrade for a higher monthly allowance."
        );
      } else if (result.reason === "not_configured") {
        setError("AI isn't configured for this workspace yet.");
      } else if (result.reason === "no_dataset") {
        setError("No ready dataset found to analyze.");
      } else {
        setError(result.message);
      }
      setStatus("error");
      return;
    }

    setStatus("idle");
    idempotencyKeyRef.current = null;
    router.refresh();
  }

  if (!aiConfigured) {
    return (
      <div className="card">
        <h3>Report, strategy &amp; action plan</h3>
        <p className="card-sub">The AI-written narrative for this run.</p>
        <div className="coming-soon">
          <b>AI analysis — coming soon.</b> The numbers above are computed live from your data. Turning them
          into a written briefing needs a Gemini API key, which hasn&rsquo;t been configured for this
          workspace yet. See the README for how to add one.
        </div>
      </div>
    );
  }

  if (!initialAnalysis) {
    return (
      <div className="card">
        <h3>Sales briefing</h3>
        <p className="card-sub">What changed, what&rsquo;s working, what needs attention — written for you.</p>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={status === "loading"}>
          {status === "loading" ? (
            <>
              <span className="spinner" style={{ marginRight: 8 }} />
              Generating…
            </>
          ) : (
            "Generate briefing"
          )}
        </button>
        {status === "error" && error && <p className="status err">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h3>Sales briefing</h3>
          <p className="card-sub">Generated {new Date(initialAnalysis.created_at).toLocaleString()}</p>
        </div>
        <button className="btn btn-ghost" onClick={handleGenerate} disabled={status === "loading"}>
          {status === "loading" ? "Regenerating…" : "Regenerate"}
        </button>
      </div>
      {status === "error" && error && <p className="status err">{error}</p>}
      <div className="prose">
        <h3 className="blk" style={{ fontSize: 17, margin: "20px 0 0" }}>
          Report
        </h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{initialAnalysis.report_md}</p>
        <h3 className="blk" style={{ fontSize: 17, margin: "20px 0 0" }}>
          Strategy
        </h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{initialAnalysis.strategy_md}</p>
        <h3 className="blk" style={{ fontSize: 17, margin: "20px 0 0" }}>
          Action plan
        </h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{initialAnalysis.action_plan_md}</p>
      </div>
    </div>
  );
}
