import { createHash, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { CreditPlanId } from "@/lib/types/database";

// Selar has no direct public webhook/API for third-party integrations, but
// its Zapier "New Sale" trigger can POST here via Zapier's "Webhooks by
// Zapier" action. Configure that Zap with a custom header
// `x-aeromind-webhook-secret: <SELAR_WEBHOOK_SECRET>`.
//
// The exact payload shape (and whether Zapier distinguishes a new sale from
// a renewal or cancellation) isn't confirmed until the Zap is actually
// connected, so this handler reads defensively and never assumes a specific
// "event type" field exists.

// Map a Selar product/plan name to an AeroMind credit plan. Update these
// once the real Selar product names are known from a live payload.
const PRODUCT_NAME_TO_PLAN: Record<string, CreditPlanId> = {
  "professional plan": "professional",
  "47plan": "professional",
  "business plan": "business",
  "97plan": "business",
};

function mapProductToPlan(payload: Record<string, unknown>): CreditPlanId | null {
  const candidates = [payload.product_name, payload.plan, payload.item_name, payload.title]
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().toLowerCase());

  for (const candidate of candidates) {
    if (PRODUCT_NAME_TO_PLAN[candidate]) return PRODUCT_NAME_TO_PLAN[candidate];
  }
  return null;
}

function extractEmail(payload: Record<string, unknown>): string | null {
  const email =
    payload.email ??
    payload.buyer_email ??
    payload.customer_email ??
    (payload.customer as Record<string, unknown> | undefined)?.email;
  return typeof email === "string" ? email.toLowerCase().trim() : null;
}

function extractDedupeKey(payload: Record<string, unknown>): string {
  const explicitId = payload.sale_id ?? payload.id ?? payload.order_id ?? payload.transaction_id;
  if (typeof explicitId === "string" || typeof explicitId === "number") {
    return `selar:${explicitId}`;
  }
  return `selar:hash:${createHash("sha256").update(JSON.stringify(payload)).digest("hex")}`;
}

export async function POST(request: NextRequest) {
  const secret = process.env.SELAR_WEBHOOK_SECRET;
  const provided = request.headers.get("x-aeromind-webhook-secret") ?? "";

  const isValidSecret =
    !!secret &&
    provided.length === secret.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(secret));

  const service = createServiceClient();

  if (!isValidSecret) {
    await service.from("billing_events").insert({
      source: "selar_zapier",
      raw_payload: {},
      outcome: "invalid_signature",
    });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const dedupeKey = extractDedupeKey(payload);

  const { data: inserted } = await service
    .from("billing_events")
    .upsert(
      { source: "selar_zapier", raw_payload: payload, dedupe_key: dedupeKey, outcome: "ignored_duplicate" },
      { onConflict: "dedupe_key", ignoreDuplicates: true }
    )
    .select("id");

  if (!inserted || inserted.length === 0) {
    // conflict on dedupe_key — we've already processed this exact event
    return NextResponse.json({ ok: true, outcome: "ignored_duplicate" });
  }

  const eventId = inserted[0].id;
  const email = extractEmail(payload);
  const plan = mapProductToPlan(payload);

  if (!email || !plan) {
    await service
      .from("billing_events")
      .update({ outcome: "no_matching_org", error_detail: !email ? "no email in payload" : "unmapped product/plan" })
      .eq("id", eventId);
    return NextResponse.json({ ok: true, outcome: "no_matching_org" });
  }

  const { data: profile } = await service.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (!profile) {
    await service
      .from("billing_events")
      .update({ outcome: "no_matching_org", matched_email: email, error_detail: "no profile with this email" })
      .eq("id", eventId);
    return NextResponse.json({ ok: true, outcome: "no_matching_org" });
  }

  const { data: membership } = await service
    .from("memberships")
    .select("org_id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    await service
      .from("billing_events")
      .update({ outcome: "no_matching_org", matched_email: email, error_detail: "profile has no organization" })
      .eq("id", eventId);
    return NextResponse.json({ ok: true, outcome: "no_matching_org" });
  }

  const { data: creditPlan } = await service
    .from("credit_plans")
    .select("monthly_credits")
    .eq("id", plan)
    .maybeSingle();

  // Upsert-to-plan, not increment: applying the same plan twice (a
  // duplicate/renewal event) is a harmless no-op, and a genuine plan change
  // mid-cycle raises the ceiling without wiping usage already logged this
  // cycle — the next natural monthly reset re-syncs the allowance cleanly.
  await service.from("subscriptions").update({ plan, status: "active" }).eq("org_id", membership.org_id);
  await service
    .from("credit_wallets")
    .update({ plan, monthly_allowance: creditPlan?.monthly_credits ?? 0, subscription_status: "active" })
    .eq("org_id", membership.org_id);

  await service
    .from("billing_events")
    .update({ outcome: "applied", matched_org_id: membership.org_id, matched_email: email })
    .eq("id", eventId);

  return NextResponse.json({ ok: true, outcome: "applied" });
}
