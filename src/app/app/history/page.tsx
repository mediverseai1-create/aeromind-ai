import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "History — AeroMind AI" };

export default async function HistoryPage() {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  const supabase = await createClient();
  const { data: datasets } = await supabase
    .from("datasets")
    .select("id, file_name, row_count, status, created_at")
    .eq("org_id", current.org.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="app-topbar">
        <h1>History</h1>
      </div>
      <div className="card">
        <h3>Uploaded files</h3>
        <p className="card-sub">Every dataset you&rsquo;ve brought into AeroMind, kept and searchable.</p>
        {datasets && datasets.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Rows</th>
                <th>Status</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id}>
                  <td>{d.file_name}</td>
                  <td>{d.row_count.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${d.status === "ready" ? "ok" : d.status === "error" ? "warn" : ""}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>{new Date(d.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <p>No files uploaded yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
