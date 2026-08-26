"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateNextBestActionStatusAction } from "@/app/actions/briefing";

type NextBestAction = {
  id: string;
  title: string;
  reason: string;
  priority: "low" | "medium" | "high";
  status: "open" | "dismissed" | "done";
};

export default function NextBestActionsList({ actions }: { actions: NextBestAction[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const visible = actions.filter((a) => a.status === "open" && !hidden.has(a.id));

  function resolve(id: string, status: "dismissed" | "done") {
    setHidden((prev) => new Set(prev).add(id));
    startTransition(async () => {
      await updateNextBestActionStatusAction(id, status);
      router.refresh();
    });
  }

  if (visible.length === 0) {
    return (
      <div className="card">
        <h3>Next best actions</h3>
        <p className="card-sub">What to do next, in priority order.</p>
        <div className="empty">
          <p>No open actions right now — generate or regenerate a briefing to get fresh recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Next best actions</h3>
      <p className="card-sub">What to do next, in priority order.</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0" }}>
        {visible.map((a) => (
          <li
            key={a.id}
            style={{
              padding: "14px 0",
              borderTop: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            <div>
              <span className={`badge ${a.priority === "high" ? "warn" : a.priority === "medium" ? "" : "ok"}`}>
                {a.priority}
              </span>
              <p style={{ margin: "8px 0 0", fontWeight: 600, color: "var(--ink)" }}>{a.title}</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--ink-2)" }}>{a.reason}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flex: "none" }}>
              <button className="btn btn-primary" disabled={pending} onClick={() => resolve(a.id, "done")}>
                Done
              </button>
              <button className="btn btn-ghost" disabled={pending} onClick={() => resolve(a.id, "dismissed")}>
                Dismiss
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
