import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/dashboard/ProfileForm";
import OrgForm from "@/components/dashboard/OrgForm";
import PlanButton from "@/components/marketing/PlanButton";
import { signOutAction } from "@/app/actions/auth";
import { getCurrentWallet } from "@/lib/credits/wallet";
import { getProfessionalPaymentLink, getBusinessPaymentLink } from "@/lib/env/paymentLinks";

export const metadata = { title: "Settings — AeroMind AI" };

const PLAN_LABEL: Record<string, string> = {
  free: "Free — $0/month",
  professional: "Professional — $47/month",
  business: "Business — $97/month",
};

const OPERATION_LABEL: Record<string, string> = {
  sales_briefing: "Sales briefing + next best actions",
  next_best_actions: "Next best actions refresh",
  ask_aeromind: "Ask AeroMind",
  conversation_analysis: "Conversation analysis",
  follow_up_email_individual: "Individual follow-up email",
  follow_up_campaign_per_recipient: "Follow-up campaign message",
  lead_scoring: "Lead / ICP scoring",
  system: "System",
};

export default async function SettingsPage() {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: profile }, wallet, { data: history }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", current.user.id).single(),
    getCurrentWallet(current.org.id),
    supabase
      .from("credit_transactions")
      .select("id, amount, status, kind, operation_key, created_at")
      .eq("org_id", current.org.id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const professionalLink = getProfessionalPaymentLink();
  const businessLink = getBusinessPaymentLink();
  const canEdit = current.role === "owner" || current.role === "admin";
  const plan = wallet?.plan ?? "free";
  const remaining = wallet ? Math.max(0, wallet.remaining) : 0;
  const allowance = wallet?.monthly_allowance ?? 0;
  const usedPct = allowance > 0 ? Math.min(100, Math.round(((allowance - remaining) / allowance) * 100)) : 0;

  return (
    <>
      <div className="app-topbar">
        <h1>Settings</h1>
      </div>

      <ProfileForm userId={current.user.id} fullName={profile?.full_name ?? ""} email={profile?.email ?? current.user.email ?? ""} />

      <OrgForm orgId={current.org.id} canEdit={canEdit} name={current.org.name} cadence={current.org.cadence} />

      <div className="card">
        <h3>Plan &amp; billing</h3>
        <p className="card-sub">
          Current plan: <strong>{PLAN_LABEL[plan] ?? plan}</strong>
        </p>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 16 }}>
          Every plan gets full access to AeroMind &mdash; credits are the only difference between them.
          Upgrading opens payment in a new tab; your plan updates automatically once payment is confirmed.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <PlanButton href={professionalLink} variant={plan === "professional" ? "ghost" : "primary"}>
            {plan === "professional" ? "Current plan" : "Upgrade to Professional"}
          </PlanButton>
          <PlanButton href={businessLink}>{plan === "business" ? "Current plan" : "Upgrade to Business"}</PlanButton>
        </div>
      </div>

      <div className="card">
        <h3>Usage</h3>
        <p className="card-sub">
          {Math.round(remaining).toLocaleString()} / {Math.round(allowance).toLocaleString()} credits remaining
          {wallet?.billing_cycle_end ? ` · resets ${wallet.billing_cycle_end}` : ""}
        </p>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "rgba(14,27,42,.08)",
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${usedPct}%`,
              background: usedPct > 90 ? "#C2410C" : "var(--accent)",
              borderRadius: 999,
            }}
          />
        </div>

        {history && history.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Credits</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{OPERATION_LABEL[h.operation_key] ?? h.operation_key}</td>
                  <td>{h.amount}</td>
                  <td>
                    <span className={`badge ${h.status === "committed" ? "ok" : h.status === "released" ? "" : "warn"}`}>
                      {h.status}
                    </span>
                  </td>
                  <td>{new Date(h.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <p>No credit usage yet.</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Session</h3>
        <p className="card-sub">Signed in as {current.user.email}</p>
        <form action={signOutAction}>
          <button type="submit" className="btn btn-ghost">
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
