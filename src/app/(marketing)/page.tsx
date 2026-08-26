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
          <b>New</b> Five AI modules, one sales memory
          <span className="chev" aria-hidden="true">
            &rsaquo;
          </span>
        </Link>
        <h1>
          The <em>AI sales team</em> for teams with <em>more pipeline than time</em>
        </h1>
        <p className="sub">
          AeroMind finds who to talk to, preps you before the call, listens to what happened, chases the
          follow-up, and tells your whole team what to do next — one system with memory, not six disconnected
          tools.
        </p>
        <div className="hero-cta">
          <Link className="btn btn-primary btn-lg" href="/signup">
            Start free
          </Link>
          <Link className="btn btn-ghost btn-lg" href="/how">
            See how it works
          </Link>
        </div>
        <p className="hero-note">Sales data &middot; calls &middot; leads &middot; one workspace</p>

        <Rise className="cadence" style={{ maxWidth: 980 }}>
          <div className="cadence-card" style={{ padding: "26px 24px" }}>
            <p className="eyebrow">The loop AeroMind runs on</p>
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
              Every stage feeds the next. A prospect who says &ldquo;call me in September&rdquo; gets
              remembered, followed up automatically, and briefed back to you when it&rsquo;s time.
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
              AeroMind reads your sales data, your calls and your pipeline, and turns all of it into one
              briefing — what&rsquo;s working, what isn&rsquo;t, and what your team should do next.
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
              Not six separate tools. <span className="soft">One system that remembers everything.</span>
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
            <h2>Every conversation stays.</h2>
            <p>
              Briefings, follow-ups and conversations are saved run after run — so when a prospect says
              &ldquo;call me back in September,&rdquo; AeroMind remembers, follows up, and briefs you back in
              when it&rsquo;s time.
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
