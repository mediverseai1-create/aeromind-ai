"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpValues } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const supabase = createClient();
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  async function onSubmit(values: SignUpValues) {
    setStatus(null);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName, company: values.company || null },
      },
    });

    if (error) {
      setStatus({ text: error.message, err: true });
      return;
    }

    if (data.session) {
      // Full page load, not router.push — see the note in signin/page.tsx.
      window.location.assign("/onboarding");
      return;
    }

    setStatus({
      text: "Check your inbox — we've sent a confirmation link to " + values.email + ".",
    });
  }

  return (
    <div className="wrap page-top">
      <div className="auth">
        <h2 style={{ textAlign: "center" }}>Create your account</h2>
        <p className="sub">Start free with one file. No card needed.</p>
        <form className="form-card" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="s-name">Full name</label>
            <input id="s-name" type="text" placeholder="Your name" {...register("fullName")} />
            {errors.fullName && <p className="error">{errors.fullName.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="s-email">Work email</label>
            <input id="s-email" type="email" placeholder="you@company.com" {...register("email")} />
            {errors.email && <p className="error">{errors.email.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="s-company">Company</label>
            <input id="s-company" type="text" placeholder="Optional" {...register("company")} />
          </div>
          <div className="field">
            <label htmlFor="s-pass">Password</label>
            <input id="s-pass" type="password" placeholder="At least 8 characters" {...register("password")} />
            {errors.password ? <p className="error">{errors.password.message}</p> : <p className="hint">Use 8 characters or more.</p>}
          </div>
          <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }} disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
          <p className={`status${status?.err ? " err" : ""}`} role="status">
            {status?.text}
          </p>
        </form>
        <p className="auth-alt">
          Already have an account? <Link href="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
