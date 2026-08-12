"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordValues) {
    setStatus(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setStatus({ text: error.message, err: true });
      return;
    }
    setStatus({ text: "Password updated. Taking you to sign in…" });
    setTimeout(() => router.push("/signin"), 1200);
  }

  return (
    <div className="wrap page-top">
      <div className="auth">
        <h2 style={{ textAlign: "center" }}>Choose a new password</h2>
        <p className="sub">You&rsquo;re signed in from your reset link — set a new password below.</p>
        <form className="form-card" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="r-pass">New password</label>
            <input id="r-pass" type="password" placeholder="At least 8 characters" {...register("password")} />
            {errors.password && <p className="error">{errors.password.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="r-pass2">Confirm password</label>
            <input id="r-pass2" type="password" placeholder="Repeat your password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="error">{errors.confirmPassword.message}</p>}
          </div>
          <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save new password"}
          </button>
          <p className={`status${status?.err ? " err" : ""}`} role="status">
            {status?.text}
          </p>
        </form>
      </div>
    </div>
  );
}
