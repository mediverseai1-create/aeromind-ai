"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({ userId, fullName, email }: { userId: string; fullName: string; email: string }) {
  const supabase = createClient();
  const [name, setName] = useState(fullName);
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setStatus(null);
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", userId);
    setSaving(false);
    setStatus(error ? { text: error.message, err: true } : { text: "Saved." });
  }

  return (
    <div className="card">
      <h3>Your profile</h3>
      <div className="two">
        <div className="field">
          <label htmlFor="p-name">Full name</label>
          <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p-email">Email</label>
          <input id="p-email" value={email} disabled />
        </div>
      </div>
      <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: 20 }}>
        {saving ? "Saving…" : "Save profile"}
      </button>
      {status && <p className={`status${status.err ? " err" : ""}`}>{status.text}</p>}
    </div>
  );
}
