-- Run this in your Supabase SQL editor (dashboard → SQL Editor → New query)

create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  created_at timestamptz default now()
);

create table folders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table recordings (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  title text not null,
  transcript text not null,
  audio_url text,
  created_at timestamptz default now()
);

-- Storage buckets (create these in Supabase dashboard → Storage)
-- Bucket name: "profiles"   (public)
-- Bucket name: "recordings" (public)

-- Disable RLS for personal use (or add policies if you add auth later)
alter table profiles disable row level security;
alter table folders disable row level security;
alter table recordings disable row level security;
