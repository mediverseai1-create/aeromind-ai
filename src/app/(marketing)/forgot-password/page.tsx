"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordValues) {
    setStatus(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setStatus({ text: error.message, err: true });
      return;
    }
    setStatus({ text: "If an account exists for " + values.email + ", a reset link is on its way." });
  }

  return (
    <div className="wrap page-top">
      <div className="auth">
        <h2 style={{ textAlign: "center" }}>Reset your password</h2>
        <p className="sub">We&rsquo;ll email you a link to choose a new one.</p>
        <form className="form-card" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="f-email">Email</label>
            <input id="f-email" type="email" placeholder="you@company.com" {...register("email")} />
            {errors.email && <p className="error">{errors.email.message}</p>}
          </div>
          <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }} disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
          <p className={`status${status?.err ? " err" : ""}`} role="status">
            {status?.text}
          </p>
        </form>
        <p className="auth-alt">
          <Link href="/signin">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
