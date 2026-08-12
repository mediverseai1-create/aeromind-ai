-- AeroMind — initial schema
-- Multi-tenant model: every piece of business data hangs off an
-- organization; users reach organizations through memberships.
-- RLS enforces that a user can only ever see rows for orgs they belong to —
-- this is enforced in the database, not just the frontend.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles: 1:1 with auth.users, created automatically on signup
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());

-- auto-create a profile row whenever a new auth user is created
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- organizations + memberships
-- ---------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  company_size text,
  country text,
  cadence text not null default 'weekly'
    check (cadence in ('daily','weekly','biweekly','monthly','quarterly','biannual','annual')),
  plan text not null default 'starter'
    check (plan in ('starter','growth','scale','enterprise')),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;

create policy "memberships: read own" on public.memberships
  for select using (user_id = auth.uid());

create policy "organizations: members can read" on public.organizations
  for select using (
    exists (select 1 from public.memberships m where m.org_id = id and m.user_id = auth.uid())
  );

create policy "organizations: creator can insert" on public.organizations
  for insert with check (created_by = auth.uid());

create policy "organizations: owner/admin can update" on public.organizations
  for update using (
    exists (
      select 1 from public.memberships m
      where m.org_id = id and m.user_id = auth.uid() and m.role in ('owner','admin')
    )
  );

-- membership rows for an org are only manageable by owner/admin of that org,
-- with a bootstrap allowance for a user inserting their own first (owner) row
create policy "memberships: owner/admin manage" on public.memberships
  for insert with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.memberships m
      where m.org_id = memberships.org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
    )
  );

create policy "memberships: owner/admin delete" on public.memberships
  for delete using (
    exists (
      select 1 from public.memberships m
      where m.org_id = memberships.org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
    )
  );

-- ---------------------------------------------------------------------
-- helper: is the current user a member of a given org?
-- (kept as a function so every downstream policy reads the same way)
-- ---------------------------------------------------------------------
create function public.is_org_member(target_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where org_id = target_org and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- datasets: one row per uploaded sales file
-- ---------------------------------------------------------------------
create table public.datasets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  uploaded_by uuid not null references auth.users (id),
  file_name text not null,
  storage_path text not null,
  row_count integer not null default 0,
  column_map jsonb not null default '{}'::jsonb,
  status text not null default 'uploaded'
    check (status in ('uploaded','validated','processing','ready','error')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.datasets enable row level security;

create policy "datasets: members read" on public.datasets
  for select using (public.is_org_member(org_id));
create policy "datasets: members insert" on public.datasets
  for insert with check (public.is_org_member(org_id) and uploaded_by = auth.uid());
create policy "datasets: members update" on public.datasets
  for update using (public.is_org_member(org_id));
create policy "datasets: members delete" on public.datasets
  for delete using (public.is_org_member(org_id));

-- ---------------------------------------------------------------------
-- dataset_rows: parsed, structured sales rows for a dataset
-- ---------------------------------------------------------------------
create table public.dataset_rows (
  id bigint generated always as identity primary key,
  dataset_id uuid not null references public.datasets (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  row_date date,
  product text,
  customer text,
  region text,
  rep text,
  quantity numeric,
  unit_price numeric,
  revenue numeric,
  raw jsonb
);

create index dataset_rows_dataset_idx on public.dataset_rows (dataset_id);
create index dataset_rows_org_date_idx on public.dataset_rows (org_id, row_date);
create index dataset_rows_org_customer_idx on public.dataset_rows (org_id, customer);
create index dataset_rows_org_product_idx on public.dataset_rows (org_id, product);

alter table public.dataset_rows enable row level security;

create policy "dataset_rows: members read" on public.dataset_rows
  for select using (public.is_org_member(org_id));
create policy "dataset_rows: members insert" on public.dataset_rows
  for insert with check (public.is_org_member(org_id));
create policy "dataset_rows: members delete" on public.dataset_rows
  for delete using (public.is_org_member(org_id));

-- ---------------------------------------------------------------------
-- analyses: one row per analysis run (report + strategy + action plan)
-- ---------------------------------------------------------------------
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  dataset_id uuid not null references public.datasets (id) on delete cascade,
  cadence text not null,
  period_start date,
  period_end date,
  metrics jsonb not null default '{}'::jsonb,
  report_md text,
  strategy_md text,
  action_plan_md text,
  ai_generated boolean not null default false,
  status text not null default 'ready' check (status in ('processing','ready','error')),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index analyses_org_idx on public.analyses (org_id, created_at desc);

alter table public.analyses enable row level security;

create policy "analyses: members read" on public.analyses
  for select using (public.is_org_member(org_id));
create policy "analyses: members insert" on public.analyses
  for insert with check (public.is_org_member(org_id) and created_by = auth.uid());
create policy "analyses: members delete" on public.analyses
  for delete using (public.is_org_member(org_id));

-- ---------------------------------------------------------------------
-- questions: the "ask in plain language" feature, logged per org
-- ---------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  asked_by uuid not null references auth.users (id),
  question text not null,
  answer text,
  grounded_data jsonb,
  status text not null default 'answered' check (status in ('pending','answered','error')),
  created_at timestamptz not null default now()
);

create index questions_org_idx on public.questions (org_id, created_at desc);

alter table public.questions enable row level security;

create policy "questions: members read" on public.questions
  for select using (public.is_org_member(org_id));
create policy "questions: members insert" on public.questions
  for insert with check (public.is_org_member(org_id) and asked_by = auth.uid());

-- ---------------------------------------------------------------------
-- subscriptions: tracks plan intent. AeroMind uses external payment links,
-- not an integrated processor, so this table records what plan an org has
-- selected and is NOT proof of payment. There is no webhook confirming
-- payment; upgrading here is a manual step until a real processor is wired
-- up (see .env.example).
-- ---------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations (id) on delete cascade,
  plan text not null default 'starter' check (plan in ('starter','growth','scale','enterprise')),
  status text not null default 'active' check (status in ('active','pending_payment','inactive')),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: members read" on public.subscriptions
  for select using (public.is_org_member(org_id));
create policy "subscriptions: owner/admin update" on public.subscriptions
  for update using (
    exists (
      select 1 from public.memberships m
      where m.org_id = subscriptions.org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
    )
  );
create policy "subscriptions: owner/admin insert" on public.subscriptions
  for insert with check (
    exists (
      select 1 from public.memberships m
      where m.org_id = subscriptions.org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
    )
  );

-- create a starter subscription row automatically whenever an org is created
create function public.handle_new_org()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions (org_id, plan, status) values (new.id, 'starter', 'active');
  return new;
end;
$$;

create trigger on_org_created
  after insert on public.organizations
  for each row execute procedure public.handle_new_org();

-- ---------------------------------------------------------------------
-- storage: private bucket for uploaded sales files
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('datasets', 'datasets', false)
on conflict (id) do nothing;

create policy "dataset files: members read"
  on storage.objects for select
  using (
    bucket_id = 'datasets'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "dataset files: members upload"
  on storage.objects for insert
  with check (
    bucket_id = 'datasets'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "dataset files: members delete"
  on storage.objects for delete
  using (
    bucket_id = 'datasets'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

-- Storage layout convention: datasets/{org_id}/{dataset_id}/{file_name}
-- The org_id-prefixed path is what the policies above check against.
