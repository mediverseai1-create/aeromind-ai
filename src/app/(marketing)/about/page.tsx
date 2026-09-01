import Link from "next/link";
import Rise from "@/components/marketing/Rise";

export const metadata = { title: "About — AeroMind AI" };

export default function AboutPage() {
  return (
    <div className="wrap page-top narrow">
      <Rise className="sec-head">
        <p className="eyebrow">About</p>
        <h2>
          Most sales data is stored, <span className="soft">not read.</span>
        </h2>
      </Rise>
      <Rise className="prose">
        <p>
          Almost every business already has the information it needs to grow: which customers are worth more
          attention, which products are quietly carrying the year, which accounts have started to slip.
          It&rsquo;s sitting in a spreadsheet or a CRM export that nobody has time to work through properly.
        </p>
        <p>
          AeroMind exists to close that gap. You upload the file you already have. It reads all of it — every
          product, customer, region and rep — and comes back with a report you can understand, a strategy
          built on what&rsquo;s already working for you, and a list of things to do next.
        </p>
        <p>
          We built it for the people who own the number — VPs of Sales, RevOps leaders and commercial teams
          running pipeline across dozens of reps and thousands of accounts. Building this in-house takes a
          data team most companies don&rsquo;t have budget to hire. AeroMind is that system, governed and
          ready on day one, without the build.
        </p>
        <h3 className="blk">What we believe</h3>
      </Rise>
      <Rise className="vals">
        <div className="val">
          <span className="tick" />
          <h4>Show the numbers</h4>
          <p>Every statement comes with the figures behind it. If you can&rsquo;t check it, you shouldn&rsquo;t have to trust it.</p>
        </div>
        <div className="val">
          <span className="tick" />
          <h4>Plain language wins</h4>
          <p>An insight nobody understands isn&rsquo;t an insight. We write in sentences, not chart titles.</p>
        </div>
        <div className="val">
          <span className="tick" />
          <h4>Advice needs a next step</h4>
          <p>Analysis that ends at &ldquo;revenue is down&rdquo; isn&rsquo;t finished. It ends when you know what to do on Monday.</p>
        </div>
      </Rise>
      <Rise className="hero-cta" style={{ justifyContent: "flex-start", marginTop: 44 }}>
        <Link className="btn btn-primary btn-lg" href="/signup">
          Try it with your data
        </Link>
        <Link className="btn btn-ghost btn-lg" href="/contact">
          Get in touch
        </Link>
      </Rise>
    </div>
  );
}
