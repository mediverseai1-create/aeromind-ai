"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { analyzeConversationAction } from "@/app/actions/conversations";

const MAX_AUDIO_MB = 15;

export default function ConversationUpload({
  accounts,
  aiConfigured,
}: {
  accounts: { id: string; name: string }[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"transcript" | "recording">("transcript");
  const [transcript, setTranscript] = useState("");
  const [accountId, setAccountId] = useState("");
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(file?: File) {
    setStatus(null);
    if (mode === "transcript" && !transcript.trim()) {
      setStatus({ text: "Paste a transcript first.", err: true });
      return;
    }
    if (mode === "recording" && !file) {
      setStatus({ text: "Choose an audio file first.", err: true });
      return;
    }
    if (mode === "recording" && file && file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setStatus({ text: `That file is over ${MAX_AUDIO_MB}MB — try a shorter clip or paste a transcript instead.`, err: true });
      return;
    }

    setBusy(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus({ text: "Your session expired — please sign in again.", err: true });
      setBusy(false);
      return;
    }

    const { data: org } = await supabase.from("memberships").select("org_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (!org) {
      setStatus({ text: "Couldn't find your workspace.", err: true });
      setBusy(false);
      return;
    }

    let storagePath: string | null = null;
    if (mode === "recording" && file) {
      const conversationDraftId = crypto.randomUUID();
      storagePath = `${org.org_id}/${conversationDraftId}/${file.name}`;
      const { error: uploadError } = await supabase.storage.from("conversations").upload(storagePath, file);
      if (uploadError) {
        setStatus({ text: uploadError.message, err: true });
        setBusy(false);
        return;
      }
    }

    const { data: conversation, error: insertError } = await supabase
      .from("conversations")
      .insert({
        org_id: org.org_id,
        account_id: accountId || null,
        uploaded_by: user.id,
        source_type: mode,
        storage_path: storagePath,
        transcript_text: mode === "transcript" ? transcript.trim() : null,
        status: "uploaded",
      })
      .select("id")
      .single();

    if (insertError || !conversation) {
      setStatus({ text: insertError?.message ?? "Couldn't save the conversation.", err: true });
      setBusy(false);
      return;
    }

    if (aiConfigured) {
      setStatus({ text: "Analyzing…" });
      const result = await analyzeConversationAction(conversation.id, crypto.randomUUID());
      if (!result.ok) {
        const message =
          result.reason === "insufficient_credits"
            ? `Saved, but analysis needs credits (${Math.max(0, Math.round(result.remaining))} remaining).`
            : result.reason === "not_configured"
              ? "Saved — AI analysis isn't configured yet."
              : "reason" in result && result.reason === "failed"
                ? result.message
                : "Saved, but analysis failed.";
        setStatus({ text: message, err: true });
      } else {
        setStatus({ text: "Analyzed." });
      }
    } else {
      setStatus({ text: "Saved. AI analysis isn't configured for this workspace yet." });
    }

    setTranscript("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card">
      <h3>Upload a call</h3>
      <p className="card-sub">Paste a transcript, or upload a recording (under {MAX_AUDIO_MB}MB) — AeroMind extracts the rest.</p>

      <div className="rail" style={{ justifyContent: "flex-start", margin: "0 0 16px", display: "inline-flex" }}>
        <button role="tab" aria-selected={mode === "transcript"} onClick={() => setMode("transcript")}>
          Paste transcript
        </button>
        <button role="tab" aria-selected={mode === "recording"} onClick={() => setMode("recording")}>
          Upload recording
        </button>
      </div>

      <div className="field">
        <label htmlFor="conv-account">Link to account (optional)</label>
        <select id="conv-account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">No account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {mode === "transcript" ? (
        <div className="field">
          <label htmlFor="conv-transcript">Transcript</label>
          <textarea
            id="conv-transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the call transcript here…"
            style={{ minHeight: 180 }}
          />
        </div>
      ) : (
        <div className="field">
          <label htmlFor="conv-file">Audio file</label>
          <input ref={fileInputRef} id="conv-file" type="file" accept="audio/*" />
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={() => handleSubmit(mode === "recording" ? fileInputRef.current?.files?.[0] : undefined)}
        disabled={busy}
        style={{ marginTop: 8 }}
      >
        {busy ? "Uploading…" : "Upload and analyze"}
      </button>
      {status && <p className={`status${status.err ? " err" : ""}`}>{status.text}</p>}
    </div>
  );
}
