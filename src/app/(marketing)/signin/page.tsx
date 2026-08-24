"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInValues } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/client";

function SignInForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  async function onSubmit(values: SignInValues) {
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setStatus({ text: error.message, err: true });
      return;
    }
    // A full page load (not router.push) so the request to the protected
    // route is guaranteed to carry the just-set session cookie — a soft
    // client-side navigation can race ahead of the cookie write and bounce
    // back to /signin via the middleware's auth check.
    window.location.assign(searchParams.get("next") || "/app");
  }

  return (
    <form className="form-card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="field">
        <label htmlFor="i-email">Email</label>
        <input id="i-email" type="email" placeholder="you@company.com" {...register("email")} />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>
      <div className="field">
        <label htmlFor="i-pass">Password</label>
        <input id="i-pass" type="password" placeholder="Your password" {...register("password")} />
        {errors.password && <p className="error">{errors.password.message}</p>}
        <p className="hint">
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
      </div>
      <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }} disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      <p className={`status${status?.err ? " err" : ""}`} role="status">
        {status?.text}
      </p>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="wrap page-top">
      <div className="auth">
        <h2 style={{ textAlign: "center" }}>Sign in</h2>
        <p className="sub">Welcome back.</p>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
        <p className="auth-alt">
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
