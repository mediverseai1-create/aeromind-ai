"use client";

import Rise from "@/components/marketing/Rise";
import { useMailtoSubmit } from "@/components/marketing/MailtoForm";

export default function CareersPage() {
  const { status, handleSubmit } = useMailtoSubmit(
    [{ name: "name", required: true }, { name: "email", required: true }, { name: "work", required: true }],
    (v) => ({
      subject: `Application — ${v.role} — ${v.name}`,
      body:
        `Name: ${v.name}\nEmail: ${v.email}\nExpertise: ${v.role}\n` +
        `Experience: ${v.years} years\nBased in: ${v.location}\nLink: ${v.link}\n\n` +
        `Best thing built or sold:\n${v.work}\n\nWhy AeroMind:\n${v.why}\n`,
    })
  );

  return (
    <div className="wrap page-top narrow">
      <Rise className="sec-head">
        <p className="eyebrow">Careers</p>
        <h2>
          We hire for the work, <span className="soft">not the CV.</span>
        </h2>
        <p>
          We&rsquo;re a small team. Rather than posting roles we may fill in three months, we keep this form
          open — tell us what you&rsquo;re good at and what you&rsquo;d want to own here.
        </p>
      </Rise>

      <Rise className="prose">
        <p>
          We&rsquo;re usually interested in people who work on: <strong>applied AI and data analysis</strong>,{" "}
          <strong>full-stack product engineering</strong>, <strong>product design</strong>,{" "}
          <strong>sales and growth</strong>, and <strong>customer support</strong>. If your work sits somewhere
          near those and you can show it, send it over.
        </p>
      </Rise>

      <Rise as="form" className="form-card" onSubmit={handleSubmit} noValidate>
        <p className="eyebrow">Application</p>
        <div className="two">
          <div className="field">
            <label htmlFor="c-name">Full name</label>
            <input id="c-name" name="name" type="text" required placeholder="Your name" />
          </div>
          <div className="field">
            <label htmlFor="c-email">Email</label>
            <input id="c-email" name="email" type="email" required placeholder="you@email.com" />
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="c-role">Area of expertise</label>
            <select id="c-role" name="role" defaultValue="AI / data analysis">
              <option>AI / data analysis</option>
              <option>Software engineering</option>
              <option>Product design</option>
              <option>Sales and growth</option>
              <option>Customer support</option>
              <option>Marketing and content</option>
              <option>Something else</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="c-years">Years of experience</label>
            <select id="c-years" name="years" defaultValue="Under 2">
              <option>Under 2</option>
              <option>2–4</option>
              <option>5–8</option>
              <option>9+</option>
            </select>
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="c-loc">Where you&rsquo;re based</label>
            <input id="c-loc" name="location" type="text" placeholder="City, country" />
          </div>
          <div className="field">
            <label htmlFor="c-link">Portfolio, GitHub or LinkedIn</label>
            <input id="c-link" name="link" type="url" placeholder="https://" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="c-work">What&rsquo;s the best thing you&rsquo;ve built or sold, and what was your part in it?</label>
          <textarea id="c-work" name="work" required placeholder="Keep it specific — what you did, and what happened as a result." />
        </div>
        <div className="field">
          <label htmlFor="c-why">Why AeroMind, and what would you want to own?</label>
          <textarea id="c-why" name="why" placeholder="A few sentences is plenty." />
        </div>
        <button className="btn btn-primary btn-lg" type="submit">
          Send application
        </button>
        <p className={`status${status?.err ? " err" : ""}`} role="status">
          {status?.text}
        </p>
        <p className="field hint" style={{ marginTop: 4 }}>
          Your application opens in your email app addressed to official@aeromindai.space, so you can attach a
          CV before sending.
        </p>
      </Rise>
    </div>
  );
}
