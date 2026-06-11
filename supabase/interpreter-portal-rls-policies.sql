-- Miqueas Language Solutions interpreter portal RLS policies
-- Run this after configuring Clerk as a Supabase third-party auth provider.
-- These policies use the authenticated Clerk JWT subject as public.interpreters.clerk_user_id.

alter table public.interpreters enable row level security;
alter table public.interpreter_documents enable row level security;

-- Remove temporary/testing policies if they exist.
drop policy if exists "Temporary allow interpreter profile testing" on public.interpreters;
drop policy if exists "Temporary allow interpreter document record testing" on public.interpreter_documents;
drop policy if exists "Temporary allow interpreter document storage testing" on storage.objects;

-- Replace prior production policies if re-running this file.
drop policy if exists "Interpreters can read their own profile" on public.interpreters;
drop policy if exists "Interpreters can insert their own profile" on public.interpreters;
drop policy if exists "Interpreters can update their own profile" on public.interpreters;
drop policy if exists "Admins can read interpreter profiles" on public.interpreters;

drop policy if exists "Interpreters can read their document records" on public.interpreter_documents;
drop policy if exists "Interpreters can insert their document records" on public.interpreter_documents;
drop policy if exists "Admins can read document records" on public.interpreter_documents;

drop policy if exists "Interpreters can upload their own files" on storage.objects;
drop policy if exists "Interpreters can read their own files" on storage.objects;
drop policy if exists "Admins can read portal files" on storage.objects;

create policy "Interpreters can read their own profile"
on public.interpreters
for select
to authenticated
using (clerk_user_id = auth.jwt() ->> 'sub');

create policy "Interpreters can insert their own profile"
on public.interpreters
for insert
to authenticated
with check (clerk_user_id = auth.jwt() ->> 'sub');

create policy "Interpreters can update their own profile"
on public.interpreters
for update
to authenticated
using (clerk_user_id = auth.jwt() ->> 'sub')
with check (clerk_user_id = auth.jwt() ->> 'sub');

create policy "Admins can read interpreter profiles"
on public.interpreters
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'm.stubbs@miqueaslanguagesolutions.com');

create policy "Interpreters can read their document records"
on public.interpreter_documents
for select
to authenticated
using (
  interpreter_id in (
    select id from public.interpreters where clerk_user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Interpreters can insert their document records"
on public.interpreter_documents
for insert
to authenticated
with check (
  interpreter_id in (
    select id from public.interpreters where clerk_user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Admins can read document records"
on public.interpreter_documents
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'm.stubbs@miqueaslanguagesolutions.com');

create policy "Interpreters can upload their own files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'interpreter-documents'
  and (storage.foldername(name))[1] in (
    select id::text from public.interpreters where clerk_user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Interpreters can read their own files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'interpreter-documents'
  and (storage.foldername(name))[1] in (
    select id::text from public.interpreters where clerk_user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Admins can read portal files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'interpreter-documents'
  and (auth.jwt() ->> 'email') = 'm.stubbs@miqueaslanguagesolutions.com'
);
