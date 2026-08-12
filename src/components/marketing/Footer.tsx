import Link from "next/link";
import BrandMark from "./BrandMark";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot">
          <div className="foot-brand">
            <Link className="brand" href="/" aria-label="AeroMind AI home">
              <BrandMark />
              <span>aeromind</span>
            </Link>
            <p>Sales intelligence for teams who&rsquo;d rather act on their data than admire it.</p>
          </div>
          <div className="foot-cols">
            <div>
              <h5>Product</h5>
              <Link href="/signals">What it finds</Link>
              <Link href="/how">How it works</Link>
              <Link href="/deliverables">Deliverables</Link>
              <Link href="/pricing">Pricing</Link>
            </div>
            <div>
              <h5>Company</h5>
              <Link href="/about">About</Link>
              <Link href="/careers">Careers</Link>
              <Link href="/contact">Contact</Link>
            </div>
            <div>
              <h5>Legal</h5>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/security">Security</Link>
            </div>
          </div>
        </div>
        <div className="foot-base">
          <span>© 2026 AeroMind AI</span>
          <span>official@aeromindai.space</span>
        </div>
      </div>
    </footer>
  );
}
