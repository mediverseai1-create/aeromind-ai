-- Fixes a bug present since 0001_init.sql: the "members can read" and
-- "owner/admin can update" policies on organizations wrote a bare `id` in a
-- correlated subquery against memberships. Since memberships has its own
-- `id` column, Postgres silently resolved the bare `id` to memberships.id
-- (the innermost scope) instead of organizations.id (the row being
-- checked) — so the condition was effectively `m.org_id = m.id`, which is
-- never true. Both policies always evaluated false.
--
-- This is why organization inserts with `.select().single()` failed with a
-- generic "row-level security policy" error even though the insert's own
-- WITH CHECK was correct: Postgres has to re-SELECT the just-inserted row
-- to return it, that SELECT went through the broken read policy, and the
-- whole insert rolled back.
--
-- Fixed by using the existing is_org_member() helper (already used
-- everywhere else in the schema) instead of an inline EXISTS — no ambiguity
-- possible since it takes an explicit parameter.

drop policy if exists "organizations: members can read" on public.organizations;
create policy "organizations: members can read" on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists "organizations: owner/admin can update" on public.organizations;
create policy "organizations: owner/admin can update" on public.organizations
  for update using (
    exists (
      select 1 from public.memberships m
      where m.org_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );
