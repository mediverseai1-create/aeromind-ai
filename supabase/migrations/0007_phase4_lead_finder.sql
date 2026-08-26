-- AeroMind — Phase 4 schema (Lead Finder AI)
--
-- Written now for schema completeness; not yet wired into UI. No external
-- company/contact data provider is connected — `lead_candidates.source`
-- reserves 'external_provider' for when one is, but only 'manual' and
-- 'dataset_seed' are usable today.

create table public.ideal_customer_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  derived_signals jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ideal_customer_profiles enable row level security;
create policy "icp: members read" on public.ideal_customer_profiles for select using (public.is_org_member(org_id));
create policy "icp: members insert" on public.ideal_customer_profiles for insert with check (public.is_org_member(org_id));
create policy "icp: members update" on public.ideal_customer_profiles for update using (public.is_org_member(org_id));
create policy "icp: members delete" on public.ideal_customer_profiles for delete using (public.is_org_member(org_id));

create table public.lead_candidates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  icp_id uuid references public.ideal_customer_profiles (id) on delete cascade,
  company_name text not null,
  source text not null default 'manual' check (source in ('manual','dataset_seed','external_provider')),
  fit_score numeric(5,2),
  fit_reasoning text,
  status text not null default 'candidate' check (status in ('candidate','contacted','converted_to_lead','dismissed')),
  converted_lead_id uuid references public.leads (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_candidates_org_icp_idx on public.lead_candidates (org_id, icp_id);

alter table public.lead_candidates enable row level security;
create policy "lead_candidates: members read" on public.lead_candidates for select using (public.is_org_member(org_id));
create policy "lead_candidates: members insert" on public.lead_candidates for insert with check (public.is_org_member(org_id));
create policy "lead_candidates: members update" on public.lead_candidates for update using (public.is_org_member(org_id));
create policy "lead_candidates: members delete" on public.lead_candidates for delete using (public.is_org_member(org_id));
