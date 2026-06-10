-- Miqueas Language Solutions interpreter portal schema
-- Run this in the Supabase SQL editor after creating your project.
-- IMPORTANT: Review policies before production. These policies are an MVP scaffold.

create extension if not exists pgcrypto;

create table if not exists public.interpreters (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  first_name text,
  last_name text,
  email text not null,
  phone text,
  city text,
  state text,
  credentials text,
  credential_status text default 'pending',
  eipa_score text,
  rid_verified boolean default false,
  state_license text,
  modalities text,
  areas_of_experience text,
  availability_morning boolean default false,
  availability_afternoon boolean default false,
  availability_evening boolean default false,
  availability_overnight boolean default false,
  onsite_rate text,
  vri_rate text,
  travel_radius text,
  insurance_status text default 'missing',
  w9_status text default 'missing',
  screening_status text default 'not_started',
  roster_status text default 'pending_profile',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interpreter_documents (
  id uuid primary key default gen_random_uuid(),
  interpreter_id uuid not null references public.interpreters(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  status text not null default 'uploaded',
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz,
  notes text
);

create index if not exists interpreters_clerk_user_id_idx on public.interpreters(clerk_user_id);
create index if not exists interpreter_documents_interpreter_id_idx on public.interpreter_documents(interpreter_id);

alter table public.interpreters enable row level security;
alter table public.interpreter_documents enable row level security;

-- The app uses Clerk for authentication. Supabase RLS cannot automatically know the Clerk user
-- unless you mint Supabase-compatible JWTs or call Supabase through a secure backend.
-- For true production security, use one of these approaches:
-- 1. Configure Clerk JWT templates for Supabase and map auth.jwt() claims to clerk_user_id.
-- 2. Move all Supabase reads/writes behind serverless API routes using a service role key.
--
-- The policies below are intentionally conservative and should be adjusted after deciding on
-- the final Clerk/Supabase integration method.

-- Example policy for future Clerk JWT template usage:
-- create policy "Interpreters can read their own profile"
-- on public.interpreters for select
-- using (clerk_user_id = auth.jwt() ->> 'sub');
--
-- create policy "Interpreters can update their own profile"
-- on public.interpreters for update
-- using (clerk_user_id = auth.jwt() ->> 'sub')
-- with check (clerk_user_id = auth.jwt() ->> 'sub');
--
-- create policy "Interpreters can insert their own profile"
-- on public.interpreters for insert
-- with check (clerk_user_id = auth.jwt() ->> 'sub');
--
-- create policy "Interpreters can read their document records"
-- on public.interpreter_documents for select
-- using (
--   interpreter_id in (
--     select id from public.interpreters where clerk_user_id = auth.jwt() ->> 'sub'
--   )
-- );
--
-- create policy "Interpreters can insert their document records"
-- on public.interpreter_documents for insert
-- with check (
--   interpreter_id in (
--     select id from public.interpreters where clerk_user_id = auth.jwt() ->> 'sub'
--   )
-- );

insert into storage.buckets (id, name, public)
values ('interpreter-documents', 'interpreter-documents', false)
on conflict (id) do nothing;

-- Storage policy examples for future Clerk JWT template usage:
-- create policy "Interpreters can upload their own files"
-- on storage.objects for insert
-- with check (
--   bucket_id = 'interpreter-documents'
--   and (storage.foldername(name))[1] in (
--     select id::text from public.interpreters where clerk_user_id = auth.jwt() ->> 'sub'
--   )
-- );
--
-- create policy "Interpreters can read their own files"
-- on storage.objects for select
-- using (
--   bucket_id = 'interpreter-documents'
--   and (storage.foldername(name))[1] in (
--     select id::text from public.interpreters where clerk_user_id = auth.jwt() ->> 'sub'
--   )
-- );
