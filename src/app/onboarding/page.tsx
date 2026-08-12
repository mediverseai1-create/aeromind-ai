import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import OnboardingForm from "./OnboardingForm";

export const metadata = { title: "Set up your workspace — AeroMind AI" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const existing = await getCurrentOrg();
  if (existing) redirect("/app");

  return (
    <div className="wrap page-top">
      <div className="bloom" aria-hidden="true" />
      <div className="auth">
        <h2 style={{ textAlign: "center" }}>Set up your workspace</h2>
        <p className="sub">A couple of details, then straight to your first upload.</p>
        <OnboardingForm />
      </div>
    </div>
  );
}
