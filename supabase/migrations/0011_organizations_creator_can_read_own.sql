-- Fixes a chicken-and-egg gap in onboarding: the flow creates the
-- organization row, reads it back via .select(), and only THEN creates the
-- membership row. The existing "members can read" policy requires a
-- membership to already exist, which it doesn't yet at that exact moment —
-- so the read-back after insert always failed regardless of the id/m.id
-- typo fixed in 0009. Adding this as a second, additive SELECT policy is
-- safe: Postgres combines multiple permissive policies for the same
-- command with OR, so this only ever adds access, never removes it.

create policy "organizations: creator can read own" on public.organizations
  for select using (created_by = auth.uid());
