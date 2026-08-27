import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase's confirmation and password-reset emails redirect here with a
// `?code=` param (PKCE flow) that must be exchanged for a session before the
// user is actually signed in. Without this route, those links landed on a
// plain page with an unused `?code=` in the URL and no session — email
// confirmation succeeded on Supabase's side, but the browser was never
// logged in, so the user had to go sign in manually afterward.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=confirmation_failed`);
}
