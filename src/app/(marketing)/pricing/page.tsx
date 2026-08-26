import Link from "next/link";
import Rise from "@/components/marketing/Rise";
import PlanButton from "@/components/marketing/PlanButton";
import { getProfessionalPaymentLink, getBusinessPaymentLink } from "@/lib/env/paymentLinks";

export const metadata = { title: "Pricing — AeroMind AI" };

export default function PricingPage() {
  const professionalLink = getProfessionalPaymentLink();
  const businessLink = getBusinessPaymentLink();

  return (
    <div className="wrap page-top">
      <Rise className="sec-head center">
        <p className="eyebrow">Pricing</p>
        <h2>
          One product. <span className="soft">Credits for how much you use it.</span>
        </h2>
        <p>
          Every plan gets the full platform — briefings, next best actions, follow-up AI, conversations and
          lead finder. The only difference is your monthly credit allowance, and credits refresh automatically
          every billing cycle.
        </p>
      </Rise>

      <Rise className="plans" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="plan">
          <h4>Free</h4>
          <div className="price">
            $0 <small>/month</small>
          </div>
          <p className="desc">Enough to see AeroMind work on your own data before you pay anything.</p>
          <ul>
            <li>200 credits every month</li>
            <li>Every module: briefing, follow-up AI, conversations, lead finder</li>
            <li>Unlimited historical data, unlimited team members</li>
            <li>No feature is locked behind a higher plan</li>
          </ul>
          <Link className="btn btn-ghost" href="/signup">
            Start free
          </Link>
        </div>
        <div className="plan feature">
          <span className="tag">Most chosen</span>
          <h4>Professional</h4>
          <div className="price">
            $47 <small>/month</small>
          </div>
          <p className="desc">For a team running AeroMind as part of the week, not the occasional check-in.</p>
          <ul>
            <li>4,000 credits every month</li>
            <li>Everything in Free, with room to run it daily</li>
            <li>Follow-up campaigns across your whole pipeline</li>
            <li>Priority support</li>
          </ul>
          <PlanButton href={professionalLink} variant="primary">
            Choose Professional
          </PlanButton>
        </div>
        <div className="plan">
          <h4>Business</h4>
          <div className="price">
            $97 <small>/month</small>
          </div>
          <p className="desc">For teams running AeroMind across every rep, every deal, every call.</p>
          <ul>
            <li>11,000 credits every month</li>
            <li>Everything in Professional, at team scale</li>
            <li>Heaviest users: daily briefings plus regular conversation analysis</li>
            <li>Priority support</li>
          </ul>
          <PlanButton href={businessLink}>Choose Business</PlanButton>
        </div>
      </Rise>

      <Rise className="faq">
        <details>
          <summary>What&rsquo;s a credit?</summary>
          <p>
            A unit of AI work. Generating a briefing, analysing a call, scoring a lead or writing a follow-up
            email each cost a small, published number of credits — normal things like viewing a saved report,
            browsing your dashboard or changing settings never cost anything.
          </p>
        </details>
        <details>
          <summary>Do credits roll over?</summary>
          <p>
            No — your allowance refreshes to the full amount at the start of each billing cycle. This keeps
            the pricing simple and predictable rather than letting balances accumulate indefinitely.
          </p>
        </details>
        <details>
          <summary>What happens when I run out?</summary>
          <p>
            AeroMind tells you before it happens, not after. Once you&rsquo;re out, AI operations pause until
            your next reset or until you upgrade — nothing is ever charged twice, and your existing reports
            and data stay fully accessible either way.
          </p>
        </details>
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
          <summary>Is my sales data used to train anything?</summary>
          <p>No. Your data is used to produce your analysis and nothing else. See the security page for the detail.</p>
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
