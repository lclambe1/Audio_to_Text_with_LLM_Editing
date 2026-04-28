-- Run this in: Supabase Dashboard → SQL Editor

-- Transcriptions
create table if not exists public.transcriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  audio_url text not null,
  raw_text text,
  grammar_text text,
  ai_text text,
  status text not null default 'pending'
    check (status in ('pending','transcribing','editing','done','error')),
  duration_seconds numeric,
  created_at timestamptz default now() not null
);

-- Row-level security: users can only see their own rows
alter table public.transcriptions enable row level security;

create policy "Users see own transcriptions"
  on public.transcriptions for all
  using (auth.uid() = user_id);

-- Subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'active'
    check (status in ('active','canceled','past_due','trialing')),
  current_period_end timestamptz
);

alter table public.subscriptions enable row level security;

create policy "Users see own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Storage bucket for audio files
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict do nothing;

create policy "Users upload own audio"
  on storage.objects for insert
  with check (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users read own audio"
  on storage.objects for select
  using (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);
