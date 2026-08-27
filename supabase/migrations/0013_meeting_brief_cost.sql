insert into public.ai_operation_costs (operation_key, display_name, credit_cost) values
  ('meeting_brief', 'Pre-call meeting brief', 3)
on conflict (operation_key) do nothing;
