-- AeroMind — Phase 2 schema (Follow-Up AI)
--
-- Written now for schema completeness (per the v2 architecture plan) but not
-- yet wired into any UI or server action. Safe to apply — these tables sit
-- unused until Phase 2 implementation begins.

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  lifecycle_stage text not null default 'lead'
    check (lifecycle_stage in ('lead','prospect','opportunity','customer','previous_customer','dormant')),
  source text check (source in ('dataset_import','manual','lead_finder')),
  primary_contact_name text,
  primary_contact_email text,
  -- bridges a CRM account back to the raw uploaded sales rows for that
  -- customer, so revenue history isn't duplicated into this table
  linked_customer_key text,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_org_stage_idx on public.accounts (org_id, lifecycle_stage);
create index accounts_org_customer_key_idx on public.accounts (org_id, linked_customer_key);

alter table public.accounts enable row level security;
create policy "accounts: members read" on public.accounts for select using (public.is_org_member(org_id));
create policy "accounts: members insert" on public.accounts for insert with check (public.is_org_member(org_id));
create policy "accounts: members update" on public.accounts for update using (public.is_org_member(org_id));
create policy "accounts: members delete" on public.accounts for delete using (public.is_org_member(org_id));

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  company_name text not null,
  contact_name text,
  contact_email text,
  status text not null default 'new' check (status in ('new','qualified','disqualified','converted')),
  qualification_notes text,
  converted_account_id uuid references public.accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_org_status_idx on public.leads (org_id, status);

alter table public.leads enable row level security;
create policy "leads: members read" on public.leads for select using (public.is_org_member(org_id));
create policy "leads: members insert" on public.leads for insert with check (public.is_org_member(org_id));
create policy "leads: members update" on public.leads for update using (public.is_org_member(org_id));
create policy "leads: members delete" on public.leads for delete using (public.is_org_member(org_id));

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  stage text not null default 'qualifying'
    check (stage in ('qualifying','proposal','negotiation','won','lost')),
  value numeric(12,2),
  expected_close_date date,
  risk_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index opportunities_org_account_idx on public.opportunities (org_id, account_id);
create index opportunities_org_stage_idx on public.opportunities (org_id, stage);

alter table public.opportunities enable row level security;
create policy "opportunities: members read" on public.opportunities for select using (public.is_org_member(org_id));
create policy "opportunities: members insert" on public.opportunities for insert with check (public.is_org_member(org_id));
create policy "opportunities: members update" on public.opportunities for update using (public.is_org_member(org_id));
create policy "opportunities: members delete" on public.opportunities for delete using (public.is_org_member(org_id));

create table public.follow_up_campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  filter_criteria jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','running','completed','failed')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.follow_up_campaigns enable row level security;
create policy "follow_up_campaigns: members read" on public.follow_up_campaigns for select using (public.is_org_member(org_id));
create policy "follow_up_campaigns: members insert" on public.follow_up_campaigns for insert with check (public.is_org_member(org_id));
create policy "follow_up_campaigns: members update" on public.follow_up_campaigns for update using (public.is_org_member(org_id));

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  campaign_id uuid references public.follow_up_campaigns (id) on delete set null,
  reason text not null,
  suggested_channel text check (suggested_channel in ('email','call','other')),
  suggested_message text,
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending','sent','snoozed','done','skipped')),
  generated_by text not null default 'ai' check (generated_by in ('ai','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index follow_ups_org_status_due_idx on public.follow_ups (org_id, status, due_at);
create index follow_ups_org_account_idx on public.follow_ups (org_id, account_id);

alter table public.follow_ups enable row level security;
create policy "follow_ups: members read" on public.follow_ups for select using (public.is_org_member(org_id));
create policy "follow_ups: members insert" on public.follow_ups for insert with check (public.is_org_member(org_id));
create policy "follow_ups: members update" on public.follow_ups for update using (public.is_org_member(org_id));
create policy "follow_ups: members delete" on public.follow_ups for delete using (public.is_org_member(org_id));
