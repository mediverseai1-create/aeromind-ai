import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Called on a schedule by Vercel Cron (see vercel.json) — Vercel invokes
// cron routes via GET, and automatically sends
// `Authorization: Bearer ${CRON_SECRET}` when that env var is set. Resets
// any wallet past its billing_cycle_end and sweeps stuck 'pending'
// reservations older than 2 hours (crash/timeout recovery) — see
// run_credit_maintenance() in supabase/migrations/0003_credits.sql.
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  const isValid =
    !!secret && provided.length === secret.length && timingSafeEqual(Buffer.from(provided), Buffer.from(secret));

  if (!isValid) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const service = createServiceClient();
  const { error } = await service.rpc("run_credit_maintenance");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export const GET = handle;
export const POST = handle; // also allow POST for manual testing (e.g. curl)
