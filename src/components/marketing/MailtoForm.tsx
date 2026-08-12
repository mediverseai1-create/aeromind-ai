"use client";

import { useState, type FormEvent } from "react";

const MAIL = "official@aeromindai.space";

type Field = { name: string; required?: boolean };

/**
 * AeroMind has no backend email provider configured yet, so these forms do
 * the same real thing the original static site did: build a pre-filled
 * mailto: link and hand off to the visitor's own email client. That's a
 * genuine send (through their inbox), not a fake submission — there is no
 * pretend "message sent to our servers" state.
 */
export function useMailtoSubmit(fields: Field[], buildMessage: (v: Record<string, string>) => { subject: string; body: string }) {
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values: Record<string, string> = {};
    for (const el of Array.from(form.elements)) {
      const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (input.name) values[input.name] = input.value.trim();
    }

    for (const f of fields) {
      if (f.required && !values[f.name]) {
        const el = form.elements.namedItem(f.name) as HTMLElement | null;
        el?.focus();
        setStatus({ text: "Please fill in every required field.", err: true });
        return;
      }
    }

    const { subject, body } = buildMessage(values);
    setStatus({ text: "Opening your email app to send this to " + MAIL + "." });
    window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return { status, handleSubmit };
}
