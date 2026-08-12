"use client";

import Rise from "@/components/marketing/Rise";
import { useMailtoSubmit } from "@/components/marketing/MailtoForm";

export default function ContactPage() {
  const { status, handleSubmit } = useMailtoSubmit(
    [{ name: "name", required: true }, { name: "email", required: true }, { name: "message", required: true }],
    (v) => ({
      subject: `[${v.topic}] Enquiry from ${v.name}`,
      body: `Name: ${v.name}\nEmail: ${v.email}\nCompany: ${v.company}\nTopic: ${v.topic}\n\nEnquiry:\n${v.message}\n`,
    })
  );

  return (
    <div className="wrap page-top">
      <Rise className="sec-head">
        <p className="eyebrow">Contact</p>
        <h2>
          Tell us what you need. <span className="soft">We&rsquo;ll come back to you.</span>
        </h2>
        <p>Questions about the product, pricing, your data, or a larger rollout — this reaches the whole team.</p>
      </Rise>

      <div className="contact-side">
        <Rise as="form" className="form-card" onSubmit={handleSubmit} noValidate>
          <p className="eyebrow">Send an enquiry</p>
          <div className="two">
            <div className="field">
              <label htmlFor="k-name">Your name</label>
              <input id="k-name" name="name" type="text" required placeholder="Your name" />
            </div>
            <div className="field">
              <label htmlFor="k-email">Email</label>
              <input id="k-email" name="email" type="email" required placeholder="you@company.com" />
            </div>
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="k-company">Company</label>
              <input id="k-company" name="company" type="text" placeholder="Optional" />
            </div>
            <div className="field">
              <label htmlFor="k-topic">What&rsquo;s it about?</label>
              <select id="k-topic" name="topic" defaultValue="Product question">
                <option>Product question</option>
                <option>Pricing</option>
                <option>Enterprise / larger team</option>
                <option>Data and security</option>
                <option>Support</option>
                <option>Partnership</option>
                <option>Something else</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="k-msg">Your enquiry</label>
            <textarea id="k-msg" name="message" required placeholder="Tell us what you're trying to do and we'll tell you whether AeroMind can help." />
          </div>
          <button className="btn btn-primary btn-lg" type="submit">
            Send enquiry
          </button>
          <p className={`status${status?.err ? " err" : ""}`} role="status">
            {status?.text}
          </p>
        </Rise>

        <Rise className="side-card">
          <h4>Email us directly</h4>
          <p>Prefer your own inbox? Send your name and your enquiry to:</p>
          <a className="mail" href="mailto:official@aeromindai.space">
            official@aeromindai.space
          </a>
          <h4 style={{ marginTop: 26 }}>Response time</h4>
          <p style={{ marginBottom: 0 }}>We answer enquiries within two working days. Support requests from paying accounts come first.</p>
        </Rise>
      </div>
    </div>
  );
}
