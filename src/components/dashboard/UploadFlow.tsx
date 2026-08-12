"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { parseFile, type ParsedFile } from "@/lib/csv/parse";
import { guessColumnMap, TARGET_FIELDS, TARGET_LABELS, type TargetField } from "@/lib/csv/mapping";
import { validateRows, type ValidationResult } from "@/lib/csv/validate";

type Step = "select" | "preview" | "uploading" | "done" | "error";

const BATCH_SIZE = 500;

export default function UploadFlow({
  orgId,
  userId,
  cadence,
}: {
  orgId: string;
  userId: string;
  cadence: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [map, setMap] = useState<Record<TargetField, string | null> | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleFile(f: File) {
    setError(null);
    try {
      const result = await parseFile(f);
      if (result.rows.length === 0) {
        setError("That file doesn't have any rows AeroMind can read. Check it isn't empty.");
        return;
      }
      const guessedMap = guessColumnMap(result.headers);
      setFile(f);
      setParsed(result);
      setMap(guessedMap);
      setValidation(validateRows(result.rows, guessedMap));
      setStep("preview");
    } catch {
      setError("Couldn't read that file. Make sure it's a CSV or XLSX export.");
    }
  }

  function updateMap(field: TargetField, column: string) {
    if (!parsed || !map) return;
    const nextMap = { ...map, [field]: column || null };
    setMap(nextMap);
    setValidation(validateRows(parsed.rows, nextMap));
  }

  async function confirmUpload() {
    if (!file || !parsed || !map || !validation) return;
    setStep("uploading");
    setProgress("Creating the dataset record…");

    try {
      const { data: dataset, error: dsError } = await supabase
        .from("datasets")
        .insert({
          org_id: orgId,
          uploaded_by: userId,
          file_name: file.name,
          storage_path: "",
          status: "processing",
          column_map: map,
        })
        .select()
        .single();
      if (dsError || !dataset) throw new Error(dsError?.message || "Couldn't create the dataset record.");

      const storagePath = `${orgId}/${dataset.id}/${file.name}`;
      setProgress("Uploading the file…");
      const { error: uploadError } = await supabase.storage.from("datasets").upload(storagePath, file, {
        upsert: true,
      });
      if (uploadError) throw new Error(uploadError.message);

      await supabase.from("datasets").update({ storage_path: storagePath }).eq("id", dataset.id);

      const rows = validation.rows.map((r) => ({
        dataset_id: dataset.id,
        org_id: orgId,
        row_date: r.row_date,
        product: r.product,
        customer: r.customer,
        region: r.region,
        rep: r.rep,
        quantity: r.quantity,
        unit_price: r.unit_price,
        revenue: r.revenue,
        raw: r.raw,
      }));

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        setProgress(`Storing rows ${i + 1}–${Math.min(i + BATCH_SIZE, rows.length)} of ${rows.length}…`);
        const { error: insertError } = await supabase.from("dataset_rows").insert(batch);
        if (insertError) throw new Error(insertError.message);
      }

      await supabase
        .from("datasets")
        .update({ status: "ready", row_count: rows.length })
        .eq("id", dataset.id);

      setStep("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong during upload.");
      setStep("error");
    }
  }

  if (step === "select") {
    return (
      <div className="card">
        <h3>Upload your sales file</h3>
        <p className="card-sub">CSV or XLSX. Messy columns are fine — you&rsquo;ll map them on the next screen.</p>
        <div
          className={`dropzone${dragActive ? " active" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          role="button"
          tabIndex={0}
        >
          <p style={{ fontWeight: 600, color: "var(--ink)" }}>Drag a file here, or click to browse</p>
          <p>.csv, .tsv, .xlsx or .xls — cadence is set to {cadence}</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.xls"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {error && <p className="status err">{error}</p>}
      </div>
    );
  }

  if (step === "preview" && parsed && map && validation) {
    return (
      <div className="card">
        <h3>Check the columns AeroMind read</h3>
        <p className="card-sub">
          {parsed.rows.length} rows found in {file?.name}. Fix any mapping that looks wrong before you
          continue.
        </p>
        <div className="two" style={{ marginBottom: 24 }}>
          {TARGET_FIELDS.map((field) => (
            <div className="field" key={field}>
              <label>{TARGET_LABELS[field]}</label>
              <select value={map[field] ?? ""} onChange={(e) => updateMap(field, e.target.value)}>
                <option value="">Not in this file</option>
                {parsed.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 16 }}>Preview</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {TARGET_FIELDS.map((f) => (
                  <th key={f}>{TARGET_LABELS[f]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validation.rows.slice(0, 8).map((r, i) => (
                <tr key={i}>
                  <td>{r.row_date ?? "—"}</td>
                  <td>{r.product ?? "—"}</td>
                  <td>{r.customer ?? "—"}</td>
                  <td>{r.region ?? "—"}</td>
                  <td>{r.rep ?? "—"}</td>
                  <td>{r.quantity ?? "—"}</td>
                  <td>{r.unit_price ?? "—"}</td>
                  <td>{r.revenue ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 16 }}>
          <span className={`badge ${validation.errors.length > 0 ? "warn" : "ok"}`}>
            {validation.validCount} of {validation.rows.length} rows look valid
          </span>
        </p>
        {validation.errors.length > 0 && (
          <ul className="prose" style={{ fontSize: 13.5, marginTop: 8 }}>
            {validation.errors.slice(0, 5).map((e) => (
              <li key={e.index}>{e.message}</li>
            ))}
            {validation.errors.length > 5 && <li>…and {validation.errors.length - 5} more</li>}
          </ul>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button className="btn btn-primary btn-lg" onClick={confirmUpload}>
            Confirm and import
          </button>
          <button
            className="btn btn-ghost btn-lg"
            onClick={() => {
              setStep("select");
              setFile(null);
              setParsed(null);
            }}
          >
            Choose a different file
          </button>
        </div>
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div className="card">
        <h3>
          <span className="spinner" style={{ marginRight: 10 }} />
          Importing your file
        </h3>
        <p className="card-sub">{progress}</p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="card">
        <h3>Import failed</h3>
        <p className="status err">{error}</p>
        <button className="btn btn-ghost" onClick={() => setStep("preview")}>
          Back to preview
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Import complete</h3>
      <p className="card-sub">
        Your rows are stored. AeroMind can now compute your dashboard from this data.
      </p>
      <Link className="btn btn-primary btn-lg" href="/app">
        Go to your dashboard
      </Link>
    </div>
  );
}
