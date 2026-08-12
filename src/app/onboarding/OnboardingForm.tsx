"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema, type OnboardingValues } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/client";

const INDUSTRIES = [
  "Software / SaaS",
  "Professional services",
  "Manufacturing",
  "Wholesale / distribution",
  "Retail / ecommerce",
  "Healthcare",
  "Financial services",
  "Other",
];
const SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"];
const ROLES = ["Founder / CEO", "Sales leader", "Sales rep", "RevOps / sales ops", "Other"];

export default function OnboardingForm() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<{ text: string; err?: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({ resolver: zodResolver(onboardingSchema) });

  async function onSubmit(values: OnboardingValues) {
    setStatus(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus({ text: "Your session expired — please sign in again.", err: true });
      return;
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: values.organizationName,
        industry: values.industry,
        company_size: values.companySize,
        country: values.country,
        created_by: user.id,
      })
      .select()
      .single();

    if (orgError || !org) {
      setStatus({ text: orgError?.message || "Couldn't create your workspace.", err: true });
      return;
    }

    const { error: memberError } = await supabase
      .from("memberships")
      .insert({ org_id: org.id, user_id: user.id, role: "owner" });

    if (memberError) {
      setStatus({ text: memberError.message, err: true });
      return;
    }

    router.push("/app/upload");
    router.refresh();
  }

  return (
    <form className="form-card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="field">
        <label htmlFor="o-org">Company / organization name</label>
        <input id="o-org" type="text" placeholder="Acme Sales Co." {...register("organizationName")} />
        {errors.organizationName && <p className="error">{errors.organizationName.message}</p>}
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="o-industry">Industry</label>
          <select id="o-industry" defaultValue="" {...register("industry")}>
            <option value="" disabled>
              Choose one
            </option>
            {INDUSTRIES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
          {errors.industry && <p className="error">{errors.industry.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="o-size">Company size</label>
          <select id="o-size" defaultValue="" {...register("companySize")}>
            <option value="" disabled>
              Choose one
            </option>
            {SIZES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {errors.companySize && <p className="error">{errors.companySize.message}</p>}
        </div>
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="o-country">Country</label>
          <input id="o-country" type="text" placeholder="Country" {...register("country")} />
          {errors.country && <p className="error">{errors.country.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="o-role">Your role</label>
          <select id="o-role" defaultValue="" {...register("role")}>
            <option value="" disabled>
              Choose one
            </option>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          {errors.role && <p className="error">{errors.role.message}</p>}
        </div>
      </div>
      <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }} disabled={isSubmitting}>
        {isSubmitting ? "Setting up…" : "Continue to AeroMind"}
      </button>
      <p className={`status${status?.err ? " err" : ""}`} role="status">
        {status?.text}
      </p>
    </form>
  );
}
