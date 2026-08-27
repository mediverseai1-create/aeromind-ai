insert into public.ai_operation_costs (operation_key, display_name, credit_cost) values
  ('icp_derivation', 'Ideal customer profile derivation', 4)
on conflict (operation_key) do nothing;
