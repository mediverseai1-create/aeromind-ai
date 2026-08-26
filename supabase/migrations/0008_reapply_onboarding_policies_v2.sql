-- Safe to run any number of times. Same purpose as 0002, but keeps
-- handle_new_org() in sync with 0003's version (which also creates the
-- credit wallet, not just the legacy subscriptions row) — 0002 predates
-- credits and would silently regress wallet creation if re-run verbatim.

drop policy if exists "organizations: creator can insert" on public.organizations;
create policy "organizations: creator can insert" on public.organizations
  for insert with check (created_by = auth.uid());

drop policy if exists "memberships: owner/admin manage" on public.memberships;
create policy "memberships: owner/admin manage" on public.memberships
  for insert with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.memberships m
      where m.org_id = memberships.org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
    )
  );

create or replace function public.handle_new_org()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions (org_id, plan, status) values (new.id, 'starter', 'active')
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

-- backfill wallets for any organization that exists but has none yet
insert into public.credit_wallets (org_id, plan, monthly_allowance)
  select id, 'free', 200 from public.organizations
  on conflict (org_id) do nothing;
