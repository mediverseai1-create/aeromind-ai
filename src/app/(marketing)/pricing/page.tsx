import Link from "next/link";
import Rise from "@/components/marketing/Rise";
import PlanButton from "@/components/marketing/PlanButton";

export const metadata = { title: "Pricing — AeroMind AI" };

export default function PricingPage() {
  const growthLink = process.env.GROWTH_PAYMENT_LINK;
  const scaleLink = process.env.SCALE_PAYMENT_LINK;

  return (
    <div className="wrap page-top">
      <Rise className="sec-head center">
        <p className="eyebrow">Pricing</p>
        <h2>
          Pay for the rhythm you need. <span className="soft">Change it any time.</span>
        </h2>
        <p>
          Every plan includes the report, the strategy and the action plan. The difference is how often you
          can run them and how much data you bring.
        </p>
      </Rise>

      <Rise className="plans">
        <div className="plan">
          <h4>Starter</h4>
          <div className="price">Free</div>
          <p className="desc">One file, one full analysis. See what it finds before you pay anything.</p>
          <ul>
            <li>1 analysis</li>
            <li>Up to 1,000 rows</li>
            <li>Report, strategy and action plan</li>
            <li>10 questions about your data</li>
          </ul>
          <Link className="btn btn-ghost" href="/signup">
            Start free
          </Link>
        </div>
        <div className="plan feature">
          <span className="tag">Most chosen</span>
          <h4>Growth</h4>
          <div className="price">
            $47 <small>/month</small>
          </div>
          <p className="desc">For a team running a weekly or monthly sales rhythm.</p>
          <ul>
            <li>Weekly, biweekly, monthly, quarterly, biannual and annual runs</li>
            <li>Up to 50,000 rows per file</li>
            <li>Unlimited questions</li>
            <li>Full analysis history</li>
            <li>3 team members</li>
          </ul>
          <PlanButton href={growthLink} variant="primary">
            Choose Growth
          </PlanButton>
        </div>
        <div className="plan">
          <h4>Scale</h4>
          <div className="price">
            $97 <small>/month</small>
          </div>
          <p className="desc">For teams who want a read every morning, not every Monday.</p>
          <ul>
            <li>Everything in Growth, plus daily runs</li>
            <li>Up to 500,000 rows per file</li>
            <li>Multiple data sets side by side</li>
            <li>10 team members</li>
            <li>Priority support</li>
          </ul>
          <PlanButton href={scaleLink}>Choose Scale</PlanButton>
        </div>
        <div className="plan">
          <h4>Enterprise</h4>
          <div className="price">Custom</div>
          <p className="desc">For larger sales organisations with their own requirements.</p>
          <ul>
            <li>Unlimited rows and team members</li>
            <li>Custom analysis rules</li>
            <li>Single sign-on</li>
            <li>Dedicated support</li>
          </ul>
          <Link className="btn btn-ghost" href="/contact">
            Talk to us
          </Link>
        </div>
      </Rise>

      <Rise className="faq">
        <details>
          <summary>Do I need my data in a particular format?</summary>
          <p>
            No. Upload a CSV, an XLSX or an export from your CRM. AeroMind maps your columns and shows you
            what it read before it runs, so you can fix anything it misread.
          </p>
        </details>
        <details>
          <summary>Can I change plans later?</summary>
          <p>Yes, at any time. Moving up takes effect immediately; moving down takes effect at your next billing date.</p>
        </details>
        <details>
          <summary>What happens to my past reports if I cancel?</summary>
          <p>You can export everything before your account closes. After that, your data is deleted according to the schedule on the privacy page.</p>
        </details>
        <details>
          <summary>Is my sales data used to train anything?</summary>
          <p>No. Your data is used to produce your analysis and nothing else. See the security page for the detail.</p>
        </details>
        <details>
          <summary>Can I run more than one business or dataset?</summary>
          <p>Yes on Scale and Enterprise. Starter and Growth cover one data set at a time.</p>
        </details>
      </Rise>

      <Rise className="hero-cta" style={{ marginTop: 48 }}>
        <Link className="btn btn-primary btn-lg" href="/signup">
          Start free
        </Link>
      </Rise>
    </div>
  );
}
