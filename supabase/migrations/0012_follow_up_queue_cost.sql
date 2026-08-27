-- Follow-Up AI needs one more operation: generating the queue itself
-- (analyzing accounts and producing multiple follow-up recommendations),
-- distinct from the per-recipient costs already seeded in 0003_credits.sql
-- (follow_up_email_individual, follow_up_campaign_per_recipient).

insert into public.ai_operation_costs (operation_key, display_name, credit_cost) values
  ('follow_up_queue_generation', 'Follow-up queue generation', 4)
on conflict (operation_key) do nothing;
