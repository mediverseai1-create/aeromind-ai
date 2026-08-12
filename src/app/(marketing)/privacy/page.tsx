import Rise from "@/components/marketing/Rise";

export const metadata = { title: "Privacy policy — AeroMind AI" };

export default function PrivacyPage() {
  return (
    <div className="wrap page-top narrow">
      <Rise className="sec-head">
        <p className="eyebrow">Legal</p>
        <h2>Privacy policy</h2>
        <p>How AeroMind AI collects, uses and protects information. Last updated 9 August 2026.</p>
      </Rise>
      <Rise className="prose">
        <h3 className="blk">1. Who we are</h3>
        <p>
          AeroMind AI (&ldquo;AeroMind&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) provides sales analysis
          software at aeromindai.space. For anything in this policy, contact{" "}
          <a href="mailto:official@aeromindai.space">official@aeromindai.space</a>.
        </p>

        <h3 className="blk">2. What we collect</h3>
        <ul>
          <li>
            <strong>Account information</strong> — your name, email address, company name and password
            (stored hashed, never in plain text).
          </li>
          <li>
            <strong>Data you upload</strong> — the sales spreadsheets and CRM exports you choose to analyse,
            and the analyses produced from them.
          </li>
          <li>
            <strong>Usage information</strong> — pages visited, features used, and technical details such as
            browser type and approximate location from your IP address.
          </li>
          <li>
            <strong>Billing information</strong> — handled by our payment processor. We never see or store
            your full card number.
          </li>
        </ul>

        <h3 className="blk">3. Why we use it</h3>
        <ul>
          <li>To produce the reports, strategies and action plans you ask for.</li>
          <li>To create and secure your account, and to provide support.</li>
          <li>To take payment for paid plans.</li>
          <li>To improve the product — using aggregated usage patterns, not the contents of your files.</li>
          <li>To send service messages. Marketing email is opt-in and you can stop it at any time.</li>
        </ul>

        <h3 className="blk">4. Your uploaded data</h3>
        <p>
          Your sales data belongs to you. We use it to generate your analysis and for no other purpose. We do
          not sell it, we do not share it with other customers, and we do not use it to train public AI
          models. Access inside AeroMind is limited to the small number of staff who need it to run the
          service or to help you with a support request, and that access is logged.
        </p>

        <h3 className="blk">5. Who we share with</h3>
        <p>
          We use a limited set of processors to run AeroMind: cloud hosting, AI model processing, payment
          processing, email delivery and error monitoring. Each is bound by contract to protect your
          information and to use it only to provide their service to us. We also disclose information where
          the law requires it.
        </p>

        <h3 className="blk">6. How long we keep it</h3>
        <p>
          Uploaded files and their analyses are kept while your account is active. If you delete a file or an
          analysis, it is removed from live systems immediately and from backups within 30 days. If you close
          your account, we delete your data within 30 days, except records we must keep for accounting or
          legal reasons.
        </p>

        <h3 className="blk">7. Your rights</h3>
        <p>
          You can ask us to give you a copy of your data, correct it, delete it, or restrict how we use it.
          Write to <a href="mailto:official@aeromindai.space">official@aeromindai.space</a> and we will
          respond within 30 days. Depending on where you live, you may also have the right to complain to a
          data protection regulator.
        </p>

        <h3 className="blk">8. Cookies</h3>
        <p>
          We use cookies that are necessary to keep you signed in and to keep the service secure, plus basic
          analytics to understand which pages are used. You can block cookies in your browser, though the
          signed-in product will not work properly without the necessary ones.
        </p>

        <h3 className="blk">9. International transfers</h3>
        <p>
          Our infrastructure may process data in countries other than your own. Where that happens, we rely on
          recognised safeguards such as standard contractual clauses.
        </p>

        <h3 className="blk">10. Changes</h3>
        <p>
          If we change this policy in a way that materially affects you, we will email you before it takes
          effect. The date at the top always shows the current version.
        </p>
      </Rise>
    </div>
  );
}
