-- Safe to run any number of times. Re-creates the insert policies that let a
-- newly signed-in user create their organization and their own (owner)
-- membership during onboarding — the two things "Set up your workspace"
-- needs to write. If the original migration was interrupted partway
-- through, these may never have been created; this re-applies them
-- idempotently without touching anything else.

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

-- Belt-and-braces: make sure the trigger that creates a starter subscription
-- row when an organization is created still exists and is owned correctly
-- so it can bypass RLS (it must run before any membership row exists yet).
create or replace function public.handle_new_org()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions (org_id, plan, status) values (new.id, 'starter', 'active')
  on conflict (org_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_org_created on public.organizations;
create trigger on_org_created
  after insert on public.organizations
  for each row execute procedure public.handle_new_org();
