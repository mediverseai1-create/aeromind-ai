import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/dashboard/ProfileForm";
import OrgForm from "@/components/dashboard/OrgForm";
import PlanButton from "@/components/marketing/PlanButton";
import { signOutAction } from "@/app/actions/auth";

export const metadata = { title: "Settings — AeroMind AI" };

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter — Free",
  growth: "Growth — $47/month",
  scale: "Scale — $97/month",
  enterprise: "Enterprise — Custom",
};

export default async function SettingsPage() {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", current.user.id).single(),
    supabase.from("subscriptions").select("*").eq("org_id", current.org.id).maybeSingle(),
  ]);

  const growthLink = process.env.GROWTH_PAYMENT_LINK;
  const scaleLink = process.env.SCALE_PAYMENT_LINK;
  const canEdit = current.role === "owner" || current.role === "admin";
  const plan = subscription?.plan ?? "starter";

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
          AeroMind uses external payment links rather than an in-app checkout. Upgrading opens the payment
          page in a new tab; your plan on this page updates once we&rsquo;ve confirmed the payment, not
          automatically.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <PlanButton href={growthLink} variant={plan === "growth" ? "ghost" : "primary"}>
            {plan === "growth" ? "Current plan" : "Upgrade to Growth"}
          </PlanButton>
          <PlanButton href={scaleLink}>{plan === "scale" ? "Current plan" : "Upgrade to Scale"}</PlanButton>
        </div>
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
