-- Full schema — paste and run in Supabase SQL Editor

-- ─── Transcriptions ───────────────────────────────────────────────────────────
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
  created_at timestamptz default now() not null,
  deleted_at timestamptz,
  word_timestamps jsonb,
  subject_profile_id uuid  -- FK added after subject_profiles table is created below
);

alter table public.transcriptions enable row level security;

-- ─── Subscriptions ────────────────────────────────────────────────────────────
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

drop policy if exists "Users see own subscription" on public.subscriptions;
create policy "Users see own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ─── Subject profiles (people being recorded) ─────────────────────────────────
create table if not exists public.subject_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.subject_profiles enable row level security;

drop policy if exists "Users manage own subject profiles" on public.subject_profiles;
drop policy if exists "Users select own subject profiles" on public.subject_profiles;
drop policy if exists "Users insert own subject profiles" on public.subject_profiles;
drop policy if exists "Users update own subject profiles" on public.subject_profiles;
drop policy if exists "Users delete own profiles" on public.subject_profiles;

-- Split into explicit per-operation policies (avoids Supabase security advisor warning)
create policy "Users select own subject profiles"
  on public.subject_profiles for select
  using (auth.uid() = user_id);

create policy "Users insert own subject profiles"
  on public.subject_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users update own subject profiles"
  on public.subject_profiles for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own profiles"
  on public.subject_profiles for delete
  using (auth.uid() = user_id);

-- Add new columns to transcriptions if they don't exist yet
alter table public.transcriptions
  add column if not exists deleted_at timestamptz,
  add column if not exists word_timestamps jsonb,
  add column if not exists subject_profile_id uuid;

-- Add FK from transcriptions → subject_profiles now that both exist
alter table public.transcriptions
  drop constraint if exists transcriptions_subject_profile_id_fkey;
alter table public.transcriptions
  add constraint transcriptions_subject_profile_id_fkey
  foreign key (subject_profile_id) references public.subject_profiles(id) on delete set null;

-- ─── Transcription RLS ────────────────────────────────────────────────────────
drop policy if exists "Users see own transcriptions" on public.transcriptions;
drop policy if exists "Users insert own transcriptions" on public.transcriptions;
drop policy if exists "Users update own transcriptions" on public.transcriptions;
drop policy if exists "Users delete own transcriptions" on public.transcriptions;

create policy "Users see own transcriptions"
  on public.transcriptions for select
  using (auth.uid() = user_id and deleted_at is null);

create policy "Users insert own transcriptions"
  on public.transcriptions for insert
  with check (auth.uid() = user_id);

-- Explicit with check so soft-deleting (setting deleted_at) isn't blocked
-- by the SELECT policy's "deleted_at is null" condition.
create policy "Users update own transcriptions"
  on public.transcriptions for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own transcriptions"
  on public.transcriptions for delete
  using (auth.uid() = user_id);

-- ─── Storage: audio ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict do nothing;

drop policy if exists "Users upload own audio" on storage.objects;
create policy "Users upload own audio"
  on storage.objects for insert
  with check (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users read own audio" on storage.objects;
create policy "Users read own audio"
  on storage.objects for select
  using (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─── Storage: avatars ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

drop policy if exists "Users upload own avatars" on storage.objects;
create policy "Users upload own avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Public avatar read" on storage.objects;
create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');
