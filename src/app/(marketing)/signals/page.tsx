import Link from "next/link";
import Rise from "@/components/marketing/Rise";

export const metadata = { title: "What AeroMind finds — AeroMind AI" };

const SIGNALS = [
  {
    n: 1,
    title: "Trends and patterns",
    lead: "Where your revenue is heading, not just where it landed.",
    items: [
      "Growth or decline over the period you choose",
      "Which months, products or accounts drove the change",
      "Repeat buying patterns worth planning around",
    ],
  },
  {
    n: 2,
    title: "High-value opportunities",
    lead: "The places where more revenue is realistically available.",
    items: [
      "Customers buying one thing who could buy more",
      "Products selling well in one region and not another",
      "Segments with the strongest return for the effort",
    ],
  },
  {
    n: 3,
    title: "Underperformance",
    lead: "What’s falling behind the pace the rest of the book is setting.",
    items: [
      "Products, customers, regions and sales reps",
      "How far behind, and since when",
      "Whether it’s a dip or a direction",
    ],
  },
  {
    n: 4,
    title: "Declining customers",
    lead: "Accounts drifting away quietly, while the total still looks fine.",
    items: [
      "Smaller orders or longer gaps between them",
      "Customers who stopped buying altogether",
      "Who to call first, and why",
    ],
  },
  {
    n: 5,
    title: "Revenue at risk",
    lead: "The exposure you’d rather find early than late.",
    items: [
      "Too much revenue sitting with too few customers",
      "Repeat business that’s slowing down",
      "Regions or products carrying more weight than they should",
    ],
  },
  {
    n: 6,
    title: "Room to grow",
    lead: "What’s already working, and how to do more of it.",
    items: [
      "Your best-performing motions, named",
      "Where the same approach could be repeated",
      "What to scale first for the biggest effect",
    ],
  },
];

export default function SignalsPage() {
  return (
    <div className="wrap page-top">
      <Rise className="sec-head">
        <p className="eyebrow">What it finds</p>
        <h2>
          Six things AeroMind looks for <span className="soft">in every file you upload.</span>
        </h2>
        <p>You don&rsquo;t tell it what to check. It reads the whole file and reports back on all six.</p>
      </Rise>

      <Rise className="deliver" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {SIGNALS.map((s) => (
          <div className="panel" key={s.n}>
            <span className="tick" />
            <h4>
              {s.n}. {s.title}
            </h4>
            <p>{s.lead}</p>
            <ul>
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </Rise>

      <Rise className="hero-cta" style={{ justifyContent: "flex-start", marginTop: 44 }}>
        <Link className="btn btn-primary btn-lg" href="/signup">
          Upload your first export
        </Link>
        <Link className="btn btn-ghost btn-lg" href="/how">
          How it works
        </Link>
      </Rise>
    </div>
  );
}
