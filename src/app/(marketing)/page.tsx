import Link from "next/link";
import Rise from "@/components/marketing/Rise";
import CadenceCard from "@/components/marketing/CadenceCard";
import AskLine from "@/components/marketing/AskLine";

const LOOP = ["Find", "Prepare", "Converse", "Understand", "Follow Up", "Close", "Retain", "Grow"];

export default function HomePage() {
  return (
    <div>
      <div className="wrap hero">
        <Link className="pill" href="/how">
          <b>Platform</b> One system of record for revenue, not six disconnected tools
          <span className="chev" aria-hidden="true">
            &rsaquo;
          </span>
        </Link>
        <h1>
          The <em>AI revenue platform</em> built for teams that can&rsquo;t afford to <em>lose a deal to disorganization</em>
        </h1>
        <p className="sub">
          AeroMind unifies your pipeline, every call, and every follow-up into a single governed system of
          record — surfacing what&rsquo;s working, what&rsquo;s at risk, and exactly what your team should do
          next, account by account, rep by rep.
        </p>
        <div className="hero-cta">
          <Link className="btn btn-primary btn-lg" href="/signup">
            Start free
          </Link>
          <Link className="btn btn-ghost btn-lg" href="/how">
            See how it works
          </Link>
        </div>
        <p className="hero-note">Structured pipeline data &middot; call intelligence &middot; workspace-level security</p>

        <Rise className="cadence" style={{ maxWidth: 980 }}>
          <div className="cadence-card" style={{ padding: "26px 24px" }}>
            <p className="eyebrow">The AeroMind operating model</p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
                marginTop: 18,
              }}
            >
              {LOOP.map((stage, i) => (
                <span key={stage} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="pill" style={{ cursor: "default" }}>
                    {stage}
                  </span>
                  {i < LOOP.length - 1 && (
                    <span aria-hidden="true" style={{ color: "var(--mute)" }}>
                      &rarr;
                    </span>
                  )}
                </span>
              ))}
            </div>
            <p style={{ textAlign: "center", marginTop: 18, color: "var(--ink-2)", fontSize: 15.5 }}>
              Every stage feeds the next automatically. A prospect who says &ldquo;call me back in
              September&rdquo; is remembered without a spreadsheet, followed up on schedule, and briefed back
              to your team the moment it matters.
            </p>
          </div>
        </Rise>

        <CadenceCard />
      </div>

      <section>
        <div className="wrap">
          <Rise className="sec-head center">
            <p className="eyebrow">What AeroMind looks for</p>
            <h2>
              Your pipeline is already talking. <span className="soft">Most teams only hear the total.</span>
            </h2>
            <p>
              AeroMind reads your sales data, every call, and your entire pipeline, and turns it into one
              governed briefing — what&rsquo;s working, what isn&rsquo;t, and exactly what your team should do
              next.
            </p>
          </Rise>
          <Rise className="grid">
            <div className="cell">
              <span className="tick" />
              <h4>Trends and patterns</h4>
              <p>How your revenue is moving over time, and which changes are real.</p>
            </div>
            <div className="cell">
              <span className="tick" />
              <h4>High-value opportunities</h4>
              <p>The accounts, products and segments with the most room left in them.</p>
            </div>
            <div className="cell">
              <span className="tick" />
              <h4>Underperformance</h4>
              <p>Products, customers, regions and reps falling behind the rest.</p>
            </div>
            <div className="cell">
              <span className="tick" />
              <h4>Declining customers</h4>
              <p>Accounts buying less, or less often, before they say anything.</p>
            </div>
            <div className="cell">
              <span className="tick" />
              <h4>Revenue at risk</h4>
              <p>The exposure hiding behind a total that still looks healthy.</p>
            </div>
            <div className="cell">
              <span className="tick" />
              <h4>Room to grow</h4>
              <p>What&rsquo;s already working — and where you can do more of it.</p>
            </div>
          </Rise>
          <Rise className="hero-cta" style={{ marginTop: 36 }}>
            <Link className="btn btn-ghost" href="/signals">
              See everything it finds
            </Link>
          </Rise>
        </div>
      </section>

      <section>
        <div className="wrap">
          <Rise className="sec-head">
            <p className="eyebrow">Five modules, one memory</p>
            <h2>
              Not six disconnected tools. <span className="soft">One system built to run your revenue motion.</span>
            </h2>
          </Rise>
          <Rise className="steps">
            <div className="step">
              <span className="num">01 &middot; UNDERSTAND</span>
              <h4>Sales Briefing</h4>
              <p>What changed, what&rsquo;s working, what&rsquo;s at risk — written for you, not buried in a dashboard.</p>
            </div>
            <div className="step">
              <span className="num">02 &middot; CLOSE</span>
              <h4>Next Best Actions</h4>
              <p>Every insight resolves to a concrete action, with the reason attached and a button to take it.</p>
            </div>
            <div className="step">
              <span className="num">03 &middot; FOLLOW UP</span>
              <h4>Follow-Up AI</h4>
              <p>Who needs a follow-up, why, when, and what to say — from first lead to dormant account.</p>
            </div>
            <div className="step">
              <span className="num">04 &middot; CONVERSE</span>
              <h4>Conversations</h4>
              <p>Upload a call recording or transcript and get a full breakdown: objections, intent, next steps.</p>
            </div>
            <div className="step">
              <span className="num">05 &middot; FIND</span>
              <h4>Lead Finder AI</h4>
              <p>Learns your ideal customer from who already buys, and scores new candidates against it.</p>
            </div>
          </Rise>
          <Rise className="hero-cta" style={{ marginTop: 36, justifyContent: "flex-start" }}>
            <Link className="btn btn-ghost" href="/how">
              See how it works
            </Link>
          </Rise>
        </div>
      </section>

      <section>
        <div className="wrap">
          <Rise className="sec-head">
            <p className="eyebrow">Built for teams that can&rsquo;t get this wrong</p>
            <h2>
              Governed by design. <span className="soft">Not bolted on afterward.</span>
            </h2>
            <p>Every workspace is isolated at the database level — not just hidden behind a screen.</p>
          </Rise>
          <Rise className="vals">
            <div className="val">
              <span className="tick" />
              <h4>Workspace isolation, enforced in the database</h4>
              <p>Row-level security scopes every query to your organization — access control isn&rsquo;t a frontend check that can be bypassed.</p>
            </div>
            <div className="val">
              <span className="tick" />
              <h4>Role-based access for the whole team</h4>
              <p>Owners, admins and members see the same system — with the right level of control for each.</p>
            </div>
            <div className="val">
              <span className="tick" />
              <h4>Your data stays yours</h4>
              <p>Uploaded files, calls and conversations are used to run your workspace and nothing else — never to train shared models.</p>
            </div>
          </Rise>
        </div>
      </section>

      <section>
        <div className="wrap">
          <Rise className="sec-head">
            <p className="eyebrow">What you get back</p>
            <h2>
              Not a dashboard to figure out. <span className="soft">A plan you can act on.</span>
            </h2>
            <p>Every briefing gives you the same three things, as often as you choose.</p>
          </Rise>
          <Rise className="deliver">
            <div className="panel">
              <span className="tick" />
              <h4>The report</h4>
              <p>A plain-English read of the period.</p>
              <ul>
                <li>How products, customers, regions and reps performed</li>
                <li>What went up, what went down, and by how much</li>
                <li>Anything unusual worth a second look</li>
              </ul>
            </div>
            <div className="panel">
              <span className="tick" />
              <h4>The strategy</h4>
              <p>Built from your own wins, not generic advice.</p>
              <ul>
                <li>Where to do more of what&rsquo;s already working</li>
                <li>Which customers and products to push</li>
                <li>The revenue reason behind each suggestion</li>
              </ul>
            </div>
            <div className="panel">
              <span className="tick" />
              <h4>Next best actions</h4>
              <p>Not advice — a queue you can clear.</p>
              <ul>
                <li>Named accounts and priorities</li>
                <li>The reason behind every recommendation</li>
                <li>One click to mark it done</li>
              </ul>
            </div>
          </Rise>

          <Rise className="ask">
            <p className="eyebrow">Ask in plain language</p>
            <div className="ask-line">
              <span className="ask-mark" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M4 25.5 16 5.5l12 20"
                    stroke="#fff"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <AskLine />
            </div>
            <p className="ask-foot">
              Ask a question the way you&rsquo;d say it out loud. The answer comes back with the numbers it
              came from.
            </p>
          </Rise>
        </div>
      </section>

      <div className="wrap">
        <Rise className="band">
          <div className="inner">
            <p className="eyebrow">Your record</p>
            <h2>Nothing about your pipeline gets lost.</h2>
            <p>
              Briefings, follow-ups and conversations are saved run after run, visible to your whole team — so
              when a prospect says &ldquo;call me back in September,&rdquo; AeroMind remembers, follows up, and
              briefs the right person back in when it&rsquo;s time.
            </p>
            <Link className="btn btn-primary" href="/signup">
              Start free
            </Link>
          </div>
        </Rise>
      </div>

      <section className="final">
        <div className="wrap">
          <Rise>
            <p className="eyebrow">Get started</p>
            <h2>
              Minimum input. <span className="soft">Maximum action.</span>
            </h2>
            <p className="sub">Upload your sales data and get your first briefing and next best actions back.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" href="/signup">
                Start free
              </Link>
              <Link className="btn btn-ghost btn-lg" href="/pricing">
                See pricing
              </Link>
            </div>
          </Rise>
        </div>
      </section>
    </div>
  );
}
