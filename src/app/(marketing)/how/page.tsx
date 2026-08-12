import Link from "next/link";
import Rise from "@/components/marketing/Rise";
import CadenceCard from "@/components/marketing/CadenceCard";

export const metadata = { title: "How it works — AeroMind AI" };

const STEPS = [
  {
    n: "STEP 01",
    title: "Upload your sales file",
    body: "A spreadsheet (CSV or XLSX) or an export from your CRM. Messy columns are fine — AeroMind maps them and shows you what it read before it starts, so you can correct anything it got wrong.",
  },
  {
    n: "STEP 02",
    title: "AeroMind analyses it",
    body: "It works through every dimension in your file — products, customers, regions, reps, dates and values — looking for the six things on the “what it finds” page. Nothing is left out because it seemed small.",
  },
  {
    n: "STEP 03",
    title: "You get a report, a strategy and an action plan",
    body: "The report explains the period. The strategy says where to put your effort, based on what’s already working for you. The action plan turns that into ordered steps with names and priorities on them.",
  },
  {
    n: "STEP 04",
    title: "Ask it anything about your data",
    body: "Type a question the way you’d ask a colleague. You get an answer with the figures behind it, so you can check the work rather than take it on trust.",
  },
  {
    n: "STEP 05",
    title: "Pick your rhythm and repeat",
    body: "Run it daily, weekly, biweekly, monthly, quarterly, biannually or annually. Every run is saved, so you can look back at what you decided and whether it worked.",
  },
];

export default function HowPage() {
  return (
    <div className="wrap page-top">
      <Rise className="sec-head">
        <p className="eyebrow">How it works</p>
        <h2>
          Upload a file. <span className="soft">Get a plan.</span>
        </h2>
        <p>AeroMind does the reading, the maths and the writing. You make the decisions.</p>
      </Rise>

      <Rise className="steps" style={{ gridTemplateColumns: "1fr", gap: 0 }}>
        {STEPS.map((s) => (
          <div className="step" style={{ padding: "26px 0" }} key={s.n}>
            <span className="num">{s.n}</span>
            <h4>{s.title}</h4>
            <p>{s.body}</p>
          </div>
        ))}
      </Rise>

      <Rise as="h3" className="blk">
        Choose how often it runs
      </Rise>
      <CadenceCard compact />

      <Rise className="hero-cta" style={{ justifyContent: "flex-start", marginTop: 44 }}>
        <Link className="btn btn-primary btn-lg" href="/signup">
          Get started
        </Link>
        <Link className="btn btn-ghost btn-lg" href="/deliverables">
          See what you get
        </Link>
      </Rise>
    </div>
  );
}
