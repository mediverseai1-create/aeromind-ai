import Link from "next/link";
import Rise from "@/components/marketing/Rise";

export const metadata = { title: "What you get — AeroMind AI" };

export default function DeliverablesPage() {
  return (
    <div className="wrap page-top">
      <Rise className="sec-head">
        <p className="eyebrow">Deliverables</p>
        <h2>
          Three things, every briefing. <span className="soft">Written to be used, not filed.</span>
        </h2>
        <p>
          The Sales Briefing module is the center of AeroMind — whatever cadence you choose, every run hands
          you the same set, and Next Best Actions turns it into a queue you can clear.
        </p>
      </Rise>

      <Rise className="deliver">
        <div className="panel">
          <span className="tick" />
          <h4>The report</h4>
          <p>What happened, in plain English.</p>
          <ul>
            <li>Performance by product, customer, region and rep</li>
            <li>What changed since last time</li>
            <li>Anything unusual worth a look</li>
            <li>The figures behind every statement</li>
          </ul>
        </div>
        <div className="panel feature">
          <span className="tick" />
          <h4>The strategy</h4>
          <p>Where to put your effort next.</p>
          <ul>
            <li>What&rsquo;s already working, named clearly</li>
            <li>How to do more of it</li>
            <li>Which customers and products to prioritise</li>
            <li>What to stop spending time on</li>
          </ul>
        </div>
        <div className="panel">
          <span className="tick" />
          <h4>The action plan</h4>
          <p>The steps, in order.</p>
          <ul>
            <li>Specific accounts to contact</li>
            <li>Who should do it and by when</li>
            <li>What &ldquo;done&rdquo; looks like for each step</li>
            <li>What to check on the next run</li>
          </ul>
        </div>
      </Rise>

      <Rise as="h3" className="blk">
        Plus, on every account
      </Rise>
      <Rise className="grid">
        <div className="cell">
          <span className="tick" />
          <h4>Plain-language questions</h4>
          <p>Ask about your data in normal words and get answers backed by your own figures.</p>
        </div>
        <div className="cell">
          <span className="tick" />
          <h4>Full history</h4>
          <p>Every past analysis, report, strategy and action plan, kept and searchable.</p>
        </div>
        <div className="cell">
          <span className="tick" />
          <h4>Your chosen rhythm</h4>
          <p>Daily through annual. Change it whenever your business changes.</p>
        </div>
      </Rise>

      <Rise className="hero-cta" style={{ justifyContent: "flex-start", marginTop: 44 }}>
        <Link className="btn btn-primary btn-lg" href="/signup">
          Upload your first export
        </Link>
        <Link className="btn btn-ghost btn-lg" href="/pricing">
          See pricing
        </Link>
      </Rise>
    </div>
  );
}
