-- Fixes a regression introduced by 0008: that migration recreated
-- handle_new_org() using the pre-credits 'starter' subscription plan value,
-- but 0003_credits.sql had already narrowed subscriptions_plan_check to only
-- accept 'free' | 'professional' | 'business'. Every org creation since 0008
-- ran has been failing this check constraint. This restores the correct
-- 'free' value (matching 0003's version) while keeping 0008's credit_wallet
-- creation and the organizations/memberships RLS fixes intact.

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
