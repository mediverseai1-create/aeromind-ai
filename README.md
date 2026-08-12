# AeroMind — setup guide

This is a plain-language walkthrough for getting AeroMind running. No coding
knowledge assumed — just follow the steps in order.

## What this project is

AeroMind's original design (the single `aeromind-ai.html` file) has been
rebuilt as a real Next.js application with a Supabase backend, while keeping
the exact same look. Marketing pages, sign up/sign in, an onboarding flow,
a real file-upload + analytics dashboard, and settings are all wired to a
real database with row-level security, so each company's data is isolated
from every other company's.

## 1. Install the tools (one-time)

You need [Node.js](https://nodejs.org) installed (version 20 or newer).
Once installed, open a terminal in this folder and run:

```bash
npm install
```

## 2. Connect Supabase

1. Go to [supabase.com](https://supabase.com), sign in, and open your project
   (or create a new one — it's free to start).
2. In the left sidebar, go to **Settings → API**.
3. Copy the **Project URL** and the **anon public** key.
4. Open the `.env.local` file in this folder in a text editor and paste them in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Still in Supabase, go to the **SQL Editor**, open the file
   `supabase/migrations/0001_init.sql` from this project, copy its entire
   contents, paste them into the SQL editor, and click **Run**. This creates
   all the tables, security rules, and the private file-storage bucket
   AeroMind needs.

You do **not** need to paste your `service_role` secret key anywhere for the
app to work day-to-day — it's only listed in `.env.local` as a placeholder
for future admin scripts. Never share that key or commit it anywhere.

## 3. Run it locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.
You should see the AeroMind homepage, looking exactly like the original
design. Try **Get started** to create a real account (a real email +
password, stored securely by Supabase).

## 4. Optional: AI features

The written report/strategy/action plan and the "Ask AeroMind" question
feature need an AI provider key. Until you add one, those screens show a
clear "coming soon" message instead of faking a response — this is
intentional, not a bug.

To enable them later, add a key to `.env.local`:

```
AI_PROVIDER_API_KEY=your-key-here
```

...and implement the two functions in `src/lib/ai/analyst.ts` using your
chosen provider's SDK. That file explains exactly what's expected.

## 5. Optional: payment links

Pricing buttons for the Growth and Scale plans read from:

```
GROWTH_PAYMENT_LINK=https://...
SCALE_PAYMENT_LINK=https://...
```

If these are blank, the buttons show "Coming soon" instead of a broken or
fake checkout. Paste in real payment links (from Stripe Payment Links,
Lemon Squeezy, Paddle, or similar) whenever you have them — no code changes
needed.

**Important:** these are simple payment *links*, not an integrated
checkout. AeroMind does not automatically know when someone has paid — the
plan shown in Settings only changes when you (or a future integration)
update the `subscriptions` table. Don't tell customers a plan is "active"
until you've actually confirmed payment.

## 6. Deploying

This is a standard Next.js app, so it deploys well to
[Vercel](https://vercel.com) (the company behind Next.js):

1. Push this project to a GitHub repository.
2. In Vercel, "Import Project" from that repository.
3. Add the same environment variables from `.env.local` in Vercel's
   Project Settings → Environment Variables (paste real values there —
   never commit them to git).
4. Deploy.

## Project structure

- `src/app/(marketing)/` — the public site (home, pricing, about, etc.) —
  visually identical to the original `aeromind-ai.html`.
- `src/app/app/` — the authenticated dashboard (protected by middleware).
- `src/app/onboarding/` — the one-time workspace setup flow after signup.
- `src/lib/supabase/` — Supabase client setup (browser, server, middleware).
- `src/lib/analytics/compute.ts` — the deterministic statistics engine that
  powers the dashboard charts (trends, top performers, declining customers,
  revenue concentration) — all computed from real uploaded data, no
  hardcoded numbers.
- `src/lib/csv/` — file parsing, column-mapping guesses, and validation for
  the upload flow.
- `src/lib/ai/analyst.ts` — where a real AI provider gets wired in later.
- `supabase/migrations/0001_init.sql` — the full database schema, including
  row-level security policies.

## Testing checklist

- [ ] `npm run build` completes with no errors
- [ ] `npm run lint` completes with no errors
- [ ] `npm run typecheck` completes with no errors
- [ ] Sign up with a real email creates a Supabase auth user (check
      Supabase → Authentication → Users)
- [ ] Onboarding creates an `organizations` row and a `memberships` row
- [ ] Uploading a CSV creates a `datasets` row and populates `dataset_rows`
- [ ] Dashboard shows real numbers from the uploaded file, and an empty
      state before any file is uploaded
- [ ] Settings shows the real signed-in user and lets you sign out
- [ ] Visiting `/app` while signed out redirects to `/signin`
