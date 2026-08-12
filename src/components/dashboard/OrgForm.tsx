"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cadence } from "@/lib/types/database";

const CADENCES: Cadence[] = ["daily", "weekly", "biweekly", "monthly", "quarterly", "biannual", "annual"];

export default function OrgForm({
  orgId,
  canEdit,
  name: initialName,
  cadence: initialCadence,
}: {
  orgId: string;
  canEdit: boolean;
  name: string;
  cadence: Cadence;
}) {
  const supabase = createClient();
  const [name, setName] = useState(initialName);
  const [cadence, setCadence] = useState<Cadence>(initialCadence);
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setStatus(null);
    const { error } = await supabase.from("organizations").update({ name, cadence }).eq("id", orgId);
    setSaving(false);
    setStatus(error ? { text: error.message, err: true } : { text: "Saved." });
  }

  return (
    <div className="card">
      <h3>Organization</h3>
      <p className="card-sub">
        {canEdit ? "Reporting rhythm applies to future analysis runs." : "Only an owner or admin can change these."}
      </p>
      <div className="two">
        <div className="field">
          <label htmlFor="org-name">Organization name</label>
          <input id="org-name" value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="org-cadence">Reporting rhythm</label>
          <select
            id="org-cadence"
            value={cadence}
            disabled={!canEdit}
            onChange={(e) => setCadence(e.target.value as Cadence)}
          >
            {CADENCES.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {canEdit && (
        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: 20 }}>
          {saving ? "Saving…" : "Save organization"}
        </button>
      )}
      {status && <p className={`status${status.err ? " err" : ""}`}>{status.text}</p>}
    </div>
  );
}
