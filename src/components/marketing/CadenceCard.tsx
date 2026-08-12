"use client";

import { useState } from "react";
import Rise from "./Rise";

const CADENCE_KEYS = ["daily", "weekly", "biweekly", "monthly", "quarterly", "biannual", "annual"] as const;
type CadenceKey = (typeof CADENCE_KEYS)[number];

const LABELS: Record<CadenceKey, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Biannual",
  annual: "Annual",
};

const COPY: Record<CadenceKey, [string, string]> = {
  daily: ["A fresh read every morning.", "Best when a week is too long to wait — you see yesterday's movement before today's calls start."],
  weekly: ["One report every week.", "The rhythm most sales teams run on: analysis on Monday, a plan for the five days ahead."],
  biweekly: ["Every other week.", "Matched to a two-week sprint, so each plan gets a full cycle before the next one lands."],
  monthly: ["A month, closed and explained.", "Full-month performance with next month's strategy attached."],
  quarterly: ["Quarter in review.", "Sized for a leadership or board conversation: what the quarter did, and where the next one should go."],
  biannual: ["Half a year, end to end.", "Long enough to tell a real trend from a good month. Built for planning cycles."],
  annual: ["The full year.", "Everything that shaped the year, and the strategy to carry into the next one."],
};

export default function CadenceCard({ compact = false }: { compact?: boolean }) {
  const [key, setKey] = useState<CadenceKey>("weekly");
  const [swap, setSwap] = useState(false);

  function select(next: CadenceKey) {
    setKey(next);
    setSwap(false);
    requestAnimationFrame(() => setSwap(true));
  }

  return (
    <Rise className="cadence" style={compact ? { margin: "20px 0 0", maxWidth: "100%" } : undefined}>
      <div className="cadence-card">
        {!compact && <p className="eyebrow">Reporting rhythm</p>}
        <div className="rail" role="tablist" aria-label="Choose how often AeroMind runs" style={compact ? { marginTop: 0 } : undefined}>
          {CADENCE_KEYS.map((k) => (
            <button key={k} role="tab" aria-selected={k === key} onClick={() => select(k)}>
              {LABELS[k]}
            </button>
          ))}
        </div>
        <div className="cadence-out" aria-live="polite">
          <h3 className={swap ? "fade-swap" : ""}>{COPY[key][0]}</h3>
          <p className={swap ? "fade-swap" : ""}>{COPY[key][1]}</p>
        </div>
      </div>
    </Rise>
  );
}
