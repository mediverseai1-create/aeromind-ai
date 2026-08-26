-- AeroMind — Next Best Actions
--
-- The AI Sales Briefing itself reuses the existing `analyses` table
-- (report_md/strategy_md/action_plan_md/metrics/ai_generated already model
-- exactly what a briefing needs, and the dashboard already has the
-- placeholder this fills in). The structured "what changed / risks /
-- opportunities / accounts needing attention" data lives inside the
-- existing `metrics jsonb` column under a `briefing` key:
--
--   metrics = {
--     "briefing": {
--       "changes": [...],
--       "risks": [...],
--       "opportunities": [...],
--       "accountsNeedingAttention": [...]
--     }
--   }
--
-- `next_best_actions` is the one new table: one row per recommended action,
-- many rows per analysis run.

create table public.next_best_actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  title text not null,
  reason text not null,
  action_type text not null default 'other'
    check (action_type in ('contact_customer','follow_up_lead','re_engage_dormant','review_opportunity','address_risk','other')),
  -- loosely typed on purpose: {customer: "Acme Co"} today, becomes
  -- {account_id: uuid} once Phase 2's `accounts` table exists — no
  -- migration needed for that transition since this is jsonb.
  target_ref jsonb not null default '{}'::jsonb,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'open' check (status in ('open','dismissed','done')),
  created_at timestamptz not null default now()
);

create index next_best_actions_org_analysis_idx on public.next_best_actions (org_id, analysis_id);
create index next_best_actions_org_status_idx on public.next_best_actions (org_id, status, priority);

alter table public.next_best_actions enable row level security;

create policy "next_best_actions: members read" on public.next_best_actions
  for select using (public.is_org_member(org_id));
create policy "next_best_actions: members insert" on public.next_best_actions
  for insert with check (public.is_org_member(org_id));
-- dismiss/complete is plain CRUD and never touches the credit ledger
create policy "next_best_actions: members update" on public.next_best_actions
  for update using (public.is_org_member(org_id));
create policy "next_best_actions: members delete" on public.next_best_actions
  for delete using (public.is_org_member(org_id));
