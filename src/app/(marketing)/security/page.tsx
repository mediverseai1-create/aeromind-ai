import Rise from "@/components/marketing/Rise";

export const metadata = { title: "Security — AeroMind AI" };

export default function SecurityPage() {
  return (
    <div className="wrap page-top narrow">
      <Rise className="sec-head">
        <p className="eyebrow">Legal</p>
        <h2>Security</h2>
        <p>How we protect the data you upload. Last updated 9 August 2026.</p>
      </Rise>
      <Rise className="prose">
        <h3 className="blk">Encryption</h3>
        <p>
          All traffic between you and AeroMind runs over TLS 1.2 or higher. Files and analyses are encrypted
          at rest using AES-256 on managed cloud storage.
        </p>

        <h3 className="blk">Access control</h3>
        <p>
          Access to production systems is limited to staff who need it, protected by multi-factor
          authentication and reviewed regularly. Every access to customer data is logged. Inside the product,
          your data is only visible to members of your own workspace — enforced by database-level row level
          security, not just the app&rsquo;s frontend.
        </p>

        <h3 className="blk">How your data is processed</h3>
        <p>
          Your files are processed to produce your analysis and nothing else. They are not used to train
          public AI models, and they are not shared with other customers. Model processing runs under
          contracts that prohibit retention of your content for training.
        </p>

        <h3 className="blk">Infrastructure</h3>
        <p>
          AeroMind runs on established cloud infrastructure with network isolation, managed patching and
          continuous monitoring. Backups are encrypted and tested.
        </p>

        <h3 className="blk">Deletion</h3>
        <p>
          Deleting a file or an analysis removes it from live systems straight away and from backups within 30
          days. Closing your account deletes your data within 30 days, apart from records we must keep by law.
        </p>

        <h3 className="blk">Incidents</h3>
        <p>
          We have a documented incident response process. If a breach affects your data, we will notify you
          and any relevant regulator without undue delay, and tell you what happened and what we did about it.
        </p>

        <h3 className="blk">Reporting a vulnerability</h3>
        <p>
          If you believe you&rsquo;ve found a security issue, email{" "}
          <a href="mailto:official@aeromindai.space">official@aeromindai.space</a> with the details. Please
          give us reasonable time to fix it before making it public. We&rsquo;ll confirm receipt within two
          working days.
        </p>
      </Rise>
    </div>
  );
}
