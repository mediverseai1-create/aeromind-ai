-- AeroMind — credit-based billing
--
-- Replaces the manual "subscriptions.plan is just intent" model with a real
-- ledger. Every AI-intensive operation reserves credits before it runs and
-- either commits them (on a durably-saved result) or releases them (on any
-- failure) — see reserve_credits/commit_credits/release_credits below.
--
-- credit_wallets deliberately has NO user-facing write RLS policy. Every
-- other table in this schema lets an owner/admin write directly; wallets do
-- not, because "prevent incorrect credit charges" has to be enforced in the
-- database, not just trusted to app code. The only ways a wallet balance
-- changes are: the three security-definer functions below, or the
-- service-role webhook/cron routes (which bypass RLS entirely by design).

-- ---------------------------------------------------------------------
-- credit_plans: global config, not org-scoped
-- ---------------------------------------------------------------------
create table public.credit_plans (
  id text primary key,
  display_name text not null,
  monthly_credits numeric(10,2) not null,
  price_usd numeric(10,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.credit_plans enable row level security;

create policy "credit_plans: any authenticated user can read" on public.credit_plans
  for select to authenticated using (true);

insert into public.credit_plans (id, display_name, monthly_credits, price_usd) values
  ('free', 'Free', 200, 0),
  ('professional', 'Professional', 4000, 47),
  ('business', 'Business', 11000, 97);

-- ---------------------------------------------------------------------
-- retire the old 4-tier plan values on subscriptions in favor of the new
-- credit plans. This project is switching pricing models entirely (not
-- running both side by side), so subscriptions.plan now tracks the same
-- id space as credit_wallets.plan/credit_plans.id.
-- ---------------------------------------------------------------------
update public.subscriptions set plan = 'free' where plan not in ('free','professional','business');
alter table public.subscriptions drop constraint subscriptions_plan_check;
alter table public.subscriptions add constraint subscriptions_plan_check
  check (plan in ('free','professional','business'));
alter table public.subscriptions alter column plan set default 'free';

-- ---------------------------------------------------------------------
-- credit_wallets: one per org
-- ---------------------------------------------------------------------
create table public.credit_wallets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations (id) on delete cascade,
  plan text not null references public.credit_plans (id) default 'free',
  billing_cycle_start date not null default current_date,
  billing_cycle_end date not null default (current_date + interval '1 month'),
  monthly_allowance numeric(12,3) not null default 200,
  allocated numeric(12,3) not null default 0,
  consumed numeric(12,3) not null default 0,
  subscription_status text not null default 'active'
    check (subscription_status in ('active','past_due','canceled')),
  updated_at timestamptz not null default now()
);

alter table public.credit_wallets enable row level security;

create policy "credit_wallets: members read" on public.credit_wallets
  for select using (public.is_org_member(org_id));

-- No insert/update/delete policy for regular users, anywhere. See header note.

-- ---------------------------------------------------------------------
-- ai_operation_costs: the configurable "operation -> credit cost" table
-- ---------------------------------------------------------------------
create table public.ai_operation_costs (
  operation_key text primary key,
  display_name text not null,
  credit_cost numeric(6,3) not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.ai_operation_costs enable row level security;

create policy "ai_operation_costs: any authenticated user can read" on public.ai_operation_costs
  for select to authenticated using (true);

insert into public.ai_operation_costs (operation_key, display_name, credit_cost) values
  ('sales_briefing', 'Sales briefing + next best actions', 8),
  ('next_best_actions', 'Next best actions (standalone refresh)', 3),
  ('ask_aeromind', 'Ask AeroMind', 1),
  ('conversation_analysis', 'Conversation analysis', 6),
  ('follow_up_email_individual', 'Individual follow-up email', 1),
  ('follow_up_campaign_per_recipient', 'Follow-up campaign (per recipient)', 0.75),
  ('lead_scoring', 'Lead / ICP scoring', 0.5),
  -- not a real AI call — used only as the operation_key FK target for
  -- system-generated ledger rows (monthly resets, manual grants/adjustments)
  ('system', 'System (grants, resets, adjustments)', 0);

-- ---------------------------------------------------------------------
-- credit_transactions: append-only ledger
-- ---------------------------------------------------------------------
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  wallet_id uuid not null references public.credit_wallets (id) on delete cascade,
  operation_key text not null references public.ai_operation_costs (operation_key),
  amount numeric(12,3) not null,
  kind text not null check (kind in ('reserve','monthly_reset','grant','adjustment')),
  status text not null default 'pending' check (status in ('pending','committed','released')),
  idempotency_key text not null,
  related_id uuid,
  created_by uuid references auth.users (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (org_id, idempotency_key)
);

create index credit_transactions_org_idx on public.credit_transactions (org_id, created_at desc);
create index credit_transactions_wallet_status_idx on public.credit_transactions (wallet_id, status);

alter table public.credit_transactions enable row level security;

create policy "credit_transactions: members read" on public.credit_transactions
  for select using (public.is_org_member(org_id));

-- No insert/update/delete policy for regular users — only the functions below
-- (security definer) and the service-role webhook/cron write here.

-- ---------------------------------------------------------------------
-- billing_events: raw audit log of every inbound webhook call
-- ---------------------------------------------------------------------
create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'selar_zapier',
  received_at timestamptz not null default now(),
  raw_payload jsonb not null,
  headers jsonb,
  matched_org_id uuid references public.organizations (id),
  matched_email text,
  outcome text not null check (outcome in ('applied','ignored_duplicate','no_matching_org','invalid_signature','error')),
  error_detail text,
  dedupe_key text unique,
  created_at timestamptz not null default now()
);

alter table public.billing_events enable row level security;
-- No policies at all: default-deny for every role except service_role, which
-- bypasses RLS. This table is never read by the app UI in this phase.

-- ---------------------------------------------------------------------
-- ledger functions
-- ---------------------------------------------------------------------
create function public.reserve_credits(
  p_org_id uuid,
  p_operation_key text,
  p_idempotency_key text
)
returns table (transaction_id uuid, reserved boolean, remaining numeric)
language plpgsql
security definer set search_path = public
as $$
declare
  v_wallet public.credit_wallets%rowtype;
  v_cost numeric(6,3);
  v_existing public.credit_transactions%rowtype;
  v_remaining numeric;
begin
  if not public.is_org_member(p_org_id) then
    raise exception 'not a member of this organization';
  end if;

  select * into v_existing from public.credit_transactions
    where org_id = p_org_id and idempotency_key = p_idempotency_key;

  if found then
    select (w.monthly_allowance - w.allocated - w.consumed) into v_remaining
      from public.credit_wallets w where w.id = v_existing.wallet_id;
    return query select v_existing.id, (v_existing.status <> 'released'), v_remaining;
    return;
  end if;

  select * into v_wallet from public.credit_wallets where org_id = p_org_id for update;
  if not found then
    raise exception 'no credit wallet for this organization';
  end if;

  select credit_cost into v_cost from public.ai_operation_costs
    where operation_key = p_operation_key and is_active = true;
  if not found then
    raise exception 'unknown or inactive operation: %', p_operation_key;
  end if;

  v_remaining := v_wallet.monthly_allowance - v_wallet.allocated - v_wallet.consumed;

  if v_remaining < v_cost then
    return query select null::uuid, false, v_remaining;
    return;
  end if;

  update public.credit_wallets set allocated = allocated + v_cost, updated_at = now()
    where id = v_wallet.id;

  insert into public.credit_transactions
    (org_id, wallet_id, operation_key, amount, kind, status, idempotency_key, created_by)
    values (p_org_id, v_wallet.id, p_operation_key, v_cost, 'reserve', 'pending', p_idempotency_key, auth.uid())
    returning id into transaction_id;

  return query select transaction_id, true, (v_remaining - v_cost);
end;
$$;

create function public.commit_credits(p_transaction_id uuid, p_related_id uuid default null)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_txn public.credit_transactions%rowtype;
begin
  select * into v_txn from public.credit_transactions where id = p_transaction_id for update;
  if not found or v_txn.status <> 'pending' then
    return;
  end if;

  update public.credit_wallets
    set allocated = allocated - v_txn.amount, consumed = consumed + v_txn.amount, updated_at = now()
    where id = v_txn.wallet_id;

  update public.credit_transactions
    set status = 'committed', related_id = p_related_id
    where id = p_transaction_id;
end;
$$;

create function public.release_credits(p_transaction_id uuid, p_reason text default null)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_txn public.credit_transactions%rowtype;
begin
  select * into v_txn from public.credit_transactions where id = p_transaction_id for update;
  if not found or v_txn.status <> 'pending' then
    return;
  end if;

  update public.credit_wallets
    set allocated = allocated - v_txn.amount, updated_at = now()
    where id = v_txn.wallet_id;

  update public.credit_transactions
    set status = 'released', metadata = metadata || jsonb_build_object('release_reason', p_reason)
    where id = p_transaction_id;
end;
$$;

create function public.run_credit_maintenance()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_wallet public.credit_wallets%rowtype;
  v_stuck public.credit_transactions%rowtype;
begin
  for v_wallet in select * from public.credit_wallets where billing_cycle_end <= now() for update loop
    insert into public.credit_transactions
      (org_id, wallet_id, operation_key, amount, kind, status, idempotency_key)
      values (
        v_wallet.org_id, v_wallet.id, 'system', v_wallet.monthly_allowance,
        'monthly_reset', 'committed',
        'monthly_reset:' || v_wallet.id || ':' || v_wallet.billing_cycle_end
      )
      on conflict (org_id, idempotency_key) do nothing;

    update public.credit_wallets
      set consumed = 0, allocated = 0,
        billing_cycle_start = v_wallet.billing_cycle_end,
        billing_cycle_end = v_wallet.billing_cycle_end + interval '1 month',
        updated_at = now()
      where id = v_wallet.id;
  end loop;

  for v_stuck in
    select * from public.credit_transactions
    where status = 'pending' and created_at < now() - interval '2 hours'
    for update
  loop
    update public.credit_wallets
      set allocated = allocated - v_stuck.amount, updated_at = now()
      where id = v_stuck.wallet_id;
    update public.credit_transactions
      set status = 'released', metadata = metadata || jsonb_build_object('release_reason', 'stuck_reservation_swept')
      where id = v_stuck.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- wire wallet creation into org creation, alongside the existing
-- subscription row
-- ---------------------------------------------------------------------
create or replace function public.handle_new_org()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions (org_id, plan, status) values (new.id, 'free', 'active')
    on conflict (org_id) do nothing;
  insert into public.credit_wallets (org_id, plan, monthly_allowance)
    values (new.id, 'free', 200)
    on conflict (org_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_org_created on public.organizations;
create trigger on_org_created
  after insert on public.organizations
  for each row execute procedure public.handle_new_org();

-- backfill wallets for any organization created before this migration
insert into public.credit_wallets (org_id, plan, monthly_allowance)
  select id, 'free', 200 from public.organizations
  on conflict (org_id) do nothing;
