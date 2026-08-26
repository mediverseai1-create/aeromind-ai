"use client";

import { useRef, useState } from "react";
import { askQuestionAction } from "@/app/actions/ask";

type Answered = { id: string; question: string; answer: string };

export default function AskForm({
  aiConfigured,
  hasDataset,
  initialHistory,
}: {
  aiConfigured: boolean;
  hasDataset: boolean;
  initialHistory: Answered[];
}) {
  const idempotencyKeyRef = useRef<string | null>(null);
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Answered[]>(initialHistory);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || status === "loading") return;
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();

    setStatus("loading");
    setError(null);

    const result = await askQuestionAction(question.trim(), idempotencyKeyRef.current);

    if (!result.ok) {
      idempotencyKeyRef.current = null;
      if (result.reason === "insufficient_credits") {
        setError(
          `You've used your monthly credits (${Math.max(0, Math.round(result.remaining))} remaining). ` +
            (result.resetDate ? `They refresh on ${result.resetDate}, ` : "") +
            "or upgrade for a higher monthly allowance."
        );
      } else if (result.reason === "not_configured") {
        setError("AI isn't configured for this workspace yet.");
      } else if (result.reason === "no_dataset") {
        setError("Upload a sales file first — there's no data to ask about yet.");
      } else {
        setError(result.message);
      }
      setStatus("error");
      return;
    }

    setHistory((prev) => [{ id: result.questionId, question: question.trim(), answer: result.answer }, ...prev]);
    setQuestion("");
    idempotencyKeyRef.current = null;
    setStatus("idle");
  }

  if (!aiConfigured) {
    return (
      <div className="coming-soon" style={{ marginTop: 16 }}>
        <b>Coming soon.</b> Answering in plain language, grounded in your own data, needs a Gemini API key
        configured for this project. Once it&rsquo;s set, questions asked here are logged per workspace and
        answered with the figures behind them — see the README for setup steps.
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <input
            type="text"
            placeholder="Which customers are spending less than they were?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={status === "loading" || !hasDataset}
          />
        </div>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={status === "loading" || !question.trim() || !hasDataset}
          style={{ marginTop: 12 }}
        >
          {status === "loading" ? (
            <>
              <span className="spinner" style={{ marginRight: 8 }} />
              Thinking…
            </>
          ) : (
            "Ask"
          )}
        </button>
        {!hasDataset && (
          <p className="hint" style={{ marginTop: 8 }}>
            Upload a sales file first — there&rsquo;s no data to ask about yet.
          </p>
        )}
        {status === "error" && error && <p className="status err">{error}</p>}
      </form>

      {history.length > 0 && (
        <div style={{ marginTop: 28 }}>
          {history.map((h) => (
            <div key={h.id} style={{ padding: "16px 0", borderTop: "1px solid var(--line)" }}>
              <p style={{ fontWeight: 600, color: "var(--ink)", margin: 0 }}>{h.question}</p>
              <p style={{ margin: "8px 0 0", color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{h.answer}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
