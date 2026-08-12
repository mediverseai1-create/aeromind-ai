import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import {
  computeSummary,
  computeMonthlyTrend,
  rankBy,
  decliningCustomers,
  computeConcentrationRisk,
  type DatasetRow,
} from "@/lib/analytics/compute";
import RevenueTrendChart from "@/components/dashboard/RevenueTrendChart";
import RankBarChart from "@/components/dashboard/RankBarChart";

export const metadata = { title: "Dashboard — AeroMind AI" };

const ROW_LIMIT = 5000;

export default async function DashboardPage() {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  const supabase = await createClient();
  const { data: dataset } = await supabase
    .from("datasets")
    .select("*")
    .eq("org_id", current.org.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!dataset) {
    return (
      <>
        <div className="app-topbar">
          <h1>Dashboard</h1>
        </div>
        <div className="empty">
          <p style={{ fontWeight: 600, color: "var(--ink)" }}>No data available yet.</p>
          <p>Upload your sales file to get your first report, strategy and action plan.</p>
          <Link className="btn btn-primary" href="/app/upload" style={{ marginTop: 16 }}>
            Upload your first export
          </Link>
        </div>
      </>
    );
  }

  const { data: rows } = await supabase
    .from("dataset_rows")
    .select("row_date, product, customer, region, rep, quantity, unit_price, revenue")
    .eq("dataset_id", dataset.id)
    .limit(ROW_LIMIT);

  const data = (rows ?? []) as DatasetRow[];
  const summary = computeSummary(data);
  const trend = computeMonthlyTrend(data);
  const topProducts = rankBy(data, "product").slice(0, 6);
  const topCustomers = rankBy(data, "customer").slice(0, 6);
  const declining = decliningCustomers(data).slice(0, 5);
  const risk = computeConcentrationRisk(data);

  const currency = (n: number) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <>
      <div className="app-topbar">
        <h1>Dashboard</h1>
        <Link className="btn btn-ghost" href="/app/upload">
          Upload new file
        </Link>
      </div>

      {data.length >= ROW_LIMIT && (
        <p className="hint" style={{ marginBottom: 16 }}>
          Showing the first {ROW_LIMIT.toLocaleString()} rows of this dataset for the live dashboard.
        </p>
      )}

      <div className="stat-row">
        <div className="stat-card">
          <div className="label">Total revenue</div>
          <div className="value">{currency(summary.totalRevenue)}</div>
          <div className="delta">{summary.rowCount.toLocaleString()} rows analysed</div>
        </div>
        <div className="stat-card">
          <div className="label">Customers</div>
          <div className="value">{summary.customerCount.toLocaleString()}</div>
          <div className="delta">{summary.productCount.toLocaleString()} products</div>
        </div>
        <div className="stat-card">
          <div className="label">Period covered</div>
          <div className="value" style={{ fontSize: 18 }}>
            {summary.firstDate ?? "—"} → {summary.lastDate ?? "—"}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Top customer concentration</div>
          <div className="value">{Math.round(risk.topCustomerShare * 100)}%</div>
          <div className={`delta ${risk.topCustomerShare > 0.3 ? "down" : ""}`}>
            {risk.topCustomerName ? `from ${risk.topCustomerName}` : "no customer data"}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Revenue trend</h3>
        <p className="card-sub">Monthly revenue across the whole file.</p>
        {trend.length > 0 ? (
          <RevenueTrendChart data={trend} />
        ) : (
          <div className="empty">
            <p>No dated rows to chart yet — check the Date column was mapped on upload.</p>
          </div>
        )}
      </div>

      <div className="two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="card">
          <h3>Top products</h3>
          <p className="card-sub">By revenue.</p>
          {topProducts.length > 0 ? (
            <RankBarChart data={topProducts} />
          ) : (
            <div className="empty">
              <p>No product column mapped for this file.</p>
            </div>
          )}
        </div>
        <div className="card">
          <h3>Top customers</h3>
          <p className="card-sub">By revenue.</p>
          {topCustomers.length > 0 ? (
            <RankBarChart data={topCustomers} />
          ) : (
            <div className="empty">
              <p>No customer column mapped for this file.</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Declining customers</h3>
        <p className="card-sub">Revenue in the second half of the period vs. the first half.</p>
        {declining.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Earlier period</th>
                <th>Recent period</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {declining.map((d) => (
                <tr key={d.name}>
                  <td>{d.name}</td>
                  <td>{currency(d.previousRevenue)}</td>
                  <td>{currency(d.recentRevenue)}</td>
                  <td>
                    <span className="badge warn">{Math.round(d.changePct * 100)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <p>No declining customers found in this file — or not enough dated history to compare yet.</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Report, strategy &amp; action plan</h3>
        <p className="card-sub">The AI-written narrative for this run.</p>
        <div className="coming-soon">
          <b>AI analysis — coming soon.</b> The numbers above are computed live from your data. Turning them
          into a written report, strategy and action plan needs an AI provider key, which hasn&rsquo;t been
          configured for this workspace yet. See the README for how to add one.
        </div>
      </div>
    </>
  );
}
