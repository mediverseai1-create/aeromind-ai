-- AeroMind — Phase 3 schema (Conversations)
--
-- Written now for schema completeness; not yet wired into UI. Conversations
-- start as upload-after-the-call only (recording or transcript) — live
-- in-call capture is an explicit later phase, not modeled here.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  uploaded_by uuid references auth.users (id),
  source_type text not null check (source_type in ('recording','transcript')),
  storage_path text,
  transcript_text text,
  status text not null default 'uploaded' check (status in ('uploaded','processing','analyzed','error')),
  occurred_at timestamptz,
  created_at timestamptz not null default now()
);

create index conversations_org_account_idx on public.conversations (org_id, account_id);
create index conversations_org_created_idx on public.conversations (org_id, created_at desc);

alter table public.conversations enable row level security;
create policy "conversations: members read" on public.conversations for select using (public.is_org_member(org_id));
create policy "conversations: members insert" on public.conversations for insert with check (public.is_org_member(org_id) and uploaded_by = auth.uid());
create policy "conversations: members update" on public.conversations for update using (public.is_org_member(org_id));
create policy "conversations: members delete" on public.conversations for delete using (public.is_org_member(org_id));

-- separated 1:1 from conversations so a future re-analysis doesn't require
-- nulling out a dozen columns on the parent row
create table public.conversation_insights (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  summary text,
  key_topics jsonb,
  buyer_intent text check (buyer_intent in ('high','medium','low')),
  buyer_intent_evidence jsonb,
  sentiment text check (sentiment in ('positive','neutral','concerned','mixed')),
  objections jsonb,
  questions_asked jsonb,
  commitments jsonb,
  next_steps jsonb,
  follow_up_date date,
  decision_criteria jsonb,
  competitors_mentioned jsonb,
  people_mentioned jsonb,
  deal_risks jsonb,
  opportunities jsonb,
  recommended_next_action text,
  created_at timestamptz not null default now()
);

alter table public.conversation_insights enable row level security;
create policy "conversation_insights: members read" on public.conversation_insights for select using (public.is_org_member(org_id));
create policy "conversation_insights: members insert" on public.conversation_insights for insert with check (public.is_org_member(org_id));

-- new storage bucket for uploaded call recordings/transcripts, mirroring the
-- `datasets` bucket's policy pattern exactly (path convention: {org_id}/{conversation_id}/{file})
insert into storage.buckets (id, name, public)
values ('conversations', 'conversations', false)
on conflict (id) do nothing;

create policy "conversation files: members read"
  on storage.objects for select
  using (bucket_id = 'conversations' and public.is_org_member(((storage.foldername(name))[1])::uuid));

create policy "conversation files: members upload"
  on storage.objects for insert
  with check (bucket_id = 'conversations' and public.is_org_member(((storage.foldername(name))[1])::uuid));

create policy "conversation files: members delete"
  on storage.objects for delete
  using (bucket_id = 'conversations' and public.is_org_member(((storage.foldername(name))[1])::uuid));
