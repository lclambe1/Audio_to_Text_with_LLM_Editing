  -- Run in Supabase SQL Editor after 001_initial.sql

  -- Subject profiles (people being recorded, e.g. "Grandpa")
  create table if not exists public.subject_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    display_name text not null,
    avatar_url text,
    created_at timestamptz default now() not null
  );

  alter table public.subject_profiles enable row level security;

  create policy "Users manage own subject profiles"
    on public.subject_profiles for all
    using (auth.uid() = user_id);

  -- Storage bucket for avatars
  insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict do nothing;

  create policy "Users upload own avatars"
    on storage.objects for insert
    with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

  create policy "Public avatar read"
    on storage.objects for select
    using (bucket_id = 'avatars');

  -- Add new columns to transcriptions
  alter table public.transcriptions
    add column if not exists deleted_at timestamptz,
    add column if not exists word_timestamps jsonb,
    add column if not exists subject_profile_id uuid references public.subject_profiles(id) on delete set null;

  -- Update RLS to exclude soft-deleted rows
  drop policy if exists "Users see own transcriptions" on public.transcriptions;

  create policy "Users see own transcriptions"
    on public.transcriptions for select
    using (auth.uid() = user_id and deleted_at is null);

  create policy "Users insert own transcriptions"
    on public.transcriptions for insert
    with check (auth.uid() = user_id);

  create policy "Users update own transcriptions"
    on public.transcriptions for update
    using (auth.uid() = user_id);
