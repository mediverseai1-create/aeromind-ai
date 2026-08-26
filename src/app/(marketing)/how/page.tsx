import Link from "next/link";
import Rise from "@/components/marketing/Rise";
import CadenceCard from "@/components/marketing/CadenceCard";

export const metadata = { title: "How it works — AeroMind AI" };

const STAGES = [
  {
    n: "01 · FIND",
    title: "Lead Finder AI learns who you should be talking to",
    body: "AeroMind studies who already buys from you — which industries, which company sizes, which deals close fastest — and builds an ideal customer profile from it. Describe your ICP in plain language, or let AeroMind derive one from your best accounts, then score new candidates against it.",
  },
  {
    n: "02 · PREPARE",
    title: "Before every call, a brief — not a blank page",
    body: "Company, contact, relationship history, the open opportunity, past objections, promises already made, a suggested opening and the questions worth asking. Walk in knowing what happened last time, not scrolling for it.",
  },
  {
    n: "03 · CONVERSE",
    title: "Upload the call, get the intelligence",
    body: "Upload a recording or transcript after the call. AeroMind extracts the summary, buyer intent, sentiment, objections, commitments, competitors mentioned, decision criteria and a recommended next action — automatically, so you're not filling out a form after every conversation.",
  },
  {
    n: "04 · UNDERSTAND",
    title: "The Sales Briefing ties it all together",
    body: "What changed since last time, what's working, what's declining, revenue at risk, customers and leads needing attention, follow-ups due — written in plain English, with the figures behind every statement.",
  },
  {
    n: "05 · FOLLOW UP",
    title: "Follow-Up AI keeps nothing from slipping through",
    body: "Across leads, prospects, active opportunities, existing customers and dormant accounts, AeroMind decides who needs a follow-up, why, when, and what to say — then writes it. Ask for a campaign (\"follow up with everyone quiet for 7 days\") and every recipient gets a message grounded in their own history, not a template blast.",
  },
  {
    n: "06 · CLOSE",
    title: "Next Best Actions turn insight into a queue you can clear",
    body: "Every recommendation comes with the reason behind it and a button to act on it — contact this account, prioritise this opportunity, address this objection. Not advice to interpret. A queue to work through.",
  },
  {
    n: "07 · RETAIN & GROW",
    title: "The loop keeps running after the deal closes",
    body: "AeroMind keeps watching existing and previous customers for declining engagement, and keeps surfacing expansion opportunities in every briefing — so growth isn't a separate project, it's just what the system notices next.",
  },
];

export default function HowPage() {
  return (
    <div className="wrap page-top">
      <Rise className="sec-head">
        <p className="eyebrow">How it works</p>
        <h2>
          One loop. <span className="soft">Five modules. One memory.</span>
        </h2>
        <p>
          AeroMind does the reading, the remembering and the writing. You make the decisions — and every stage
          feeds the next, so nothing you learn on a call gets lost by the time it matters again.
        </p>
      </Rise>

      <Rise className="steps" style={{ gridTemplateColumns: "1fr", gap: 0 }}>
        {STAGES.map((s) => (
          <div className="step" style={{ padding: "26px 0" }} key={s.n}>
            <span className="num">{s.n}</span>
            <h4>{s.title}</h4>
            <p>{s.body}</p>
          </div>
        ))}
      </Rise>

      <Rise as="h3" className="blk">
        Choose how often the briefing runs
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
