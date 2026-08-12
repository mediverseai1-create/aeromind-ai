import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";

export const metadata = { title: "Ask AeroMind — AeroMind AI" };

export default async function AskPage() {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  return (
    <>
      <div className="app-topbar">
        <h1>Ask AeroMind</h1>
      </div>
      <div className="card">
        <h3>Ask a question about your data</h3>
        <p className="card-sub">Type a question the way you&rsquo;d say it out loud.</p>
        <div className="field">
          <input type="text" placeholder="Which customers are spending less than they were?" disabled />
        </div>
        <div className="coming-soon" style={{ marginTop: 16 }}>
          <b>Coming soon.</b> Answering in plain language, grounded in your own data, needs an AI provider key
          configured for this project. Once it&rsquo;s set, questions asked here are logged per workspace and
          answered with the figures behind them — see the README for setup steps.
        </div>
      </div>
    </>
  );
}
