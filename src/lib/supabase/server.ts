import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

// Server-side Supabase client for use in Server Components, Route Handlers
// and Server Actions. Uses the anon key + the caller's session cookie, so it
// is bound by the same Row Level Security policies as the browser client —
// it does NOT bypass RLS. Never import the service role key here.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component during render, where
            // cookies can't be mutated. Safe to ignore — middleware refreshes
            // the session on every request instead.
          }
        },
      },
    }
  );
}
