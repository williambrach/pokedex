-- supabase/schema.sql
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent: safe to re-run.

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Collection table — one row per (user, pokémon).
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.collection (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  pokemon_id  integer     not null,
  card        jsonb,
  owned       boolean     not null default false,
  want        boolean     not null default false,
  note        text,
  value       text,
  condition   text,
  variant     text,
  photo_path  text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, pokemon_id)
);

alter table public.collection enable row level security;

-- Each user can see and edit only their own rows.
drop policy if exists "collection_select_own" on public.collection;
create policy "collection_select_own" on public.collection
  for select using (auth.uid() = user_id);

drop policy if exists "collection_insert_own" on public.collection;
create policy "collection_insert_own" on public.collection
  for insert with check (auth.uid() = user_id);

drop policy if exists "collection_update_own" on public.collection;
create policy "collection_update_own" on public.collection
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "collection_delete_own" on public.collection;
create policy "collection_delete_own" on public.collection
  for delete using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Private storage bucket for user card photos.
--    Objects are stored at  <user_id>/<pokemon_id>.
-- ──────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('card-photos', 'card-photos', false)
  on conflict (id) do nothing;

-- Storage RLS: a user may only touch objects inside a top-level folder named
-- after their own user id.
drop policy if exists "card_photos_select_own" on storage.objects;
create policy "card_photos_select_own" on storage.objects
  for select using (
    bucket_id = 'card-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "card_photos_insert_own" on storage.objects;
create policy "card_photos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'card-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "card_photos_update_own" on storage.objects;
create policy "card_photos_update_own" on storage.objects
  for update using (
    bucket_id = 'card-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "card_photos_delete_own" on storage.objects;
create policy "card_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'card-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
