import Link from "next/link";
import Rise from "@/components/marketing/Rise";
import CadenceCard from "@/components/marketing/CadenceCard";
import AskLine from "@/components/marketing/AskLine";

export default function HomePage() {
  return (
    <div>
      <div className="wrap hero">
        <Link className="pill" href="/how">
          <b>New</b> Set your own reporting rhythm
          <span className="chev" aria-hidden="true">
            &rsaquo;
          </span>
        </Link>
        <h1>
          The <em>AI sales analyst</em> for teams with <em>more data than time</em>
        </h1>
        <p className="sub">
          Upload your sales file. AeroMind tells you what&rsquo;s working, what&rsquo;s slipping, and what
          to do next to grow the revenue you already have.
        </p>
        <div className="hero-cta">
          <Link className="btn btn-primary btn-lg" href="/signup">
            Upload your first export
          </Link>
          <Link className="btn btn-ghost btn-lg" href="/signup">
            Sign up
          </Link>
        </div>
        <p className="hero-note">CSV &middot; XLSX &middot; CRM export</p>

        <CadenceCard />
      </div>

      <section>
        <div className="wrap">
          <Rise className="sec-head center">
            <p className="eyebrow">What AeroMind looks for</p>
            <h2>
              Your numbers are already talking. <span className="soft">Most teams only hear the total.</span>
            </h2>
            <p>
              AeroMind reads your sales file, shows you what&rsquo;s working and what isn&rsquo;t, and gives
              you a plan to scale what already works.
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
            <p className="eyebrow">From file to action</p>
            <h2>
              Three steps. <span className="soft">No data project required.</span>
            </h2>
          </Rise>
          <Rise className="steps">
            <div className="step">
              <span className="num">STEP 01</span>
              <h4>Upload your file</h4>
              <p>A sales spreadsheet or a CRM export. It doesn&rsquo;t have to be tidy.</p>
            </div>
            <div className="step">
              <span className="num">STEP 02</span>
              <h4>AeroMind reads it</h4>
              <p>It checks performance, trends, opportunities and risks across the whole file.</p>
            </div>
            <div className="step">
              <span className="num">STEP 03</span>
              <h4>You get the plan</h4>
              <p>A report, a strategy to scale what&rsquo;s working, and steps to take this week.</p>
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
            <p>Every run gives you the same three things, as often as you choose.</p>
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
              <h4>The action plan</h4>
              <p>Clear steps, in the order to do them.</p>
              <ul>
                <li>Named accounts and priorities</li>
                <li>Who does it and what finished looks like</li>
                <li>What to check on the next run</li>
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
            <h2>Every analysis stays.</h2>
            <p>
              Reports, strategies and action plans are saved run after run — so you can see what you decided
              last quarter, whether it worked, and what your data says now.
            </p>
            <Link className="btn btn-primary" href="/signup">
              Start your first run
            </Link>
          </div>
        </Rise>
      </div>

      <section className="final">
        <div className="wrap">
          <Rise>
            <p className="eyebrow">Get started</p>
            <h2>
              Point it at your sales file. <span className="soft">See what you&rsquo;ve been missing.</span>
            </h2>
            <p className="sub">Upload one file and get your first report, strategy and action plan back.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" href="/signup">
                Upload your first export
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
