create table if not exists public.assignment_documents (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  interpreter_id uuid references public.interpreters(id) on delete set null,
  category text not null,
  title text not null,
  document_date date,
  file_name text not null,
  mime_type text,
  file_size bigint,
  storage_path text not null unique,
  uploaded_by_clerk_user_id text not null,
  uploaded_by_role text not null,
  visibility text not null default 'admin_only',
  record_status text not null default 'active',
  version_number integer not null default 1,
  supersedes_document_id uuid references public.assignment_documents(id) on delete set null,
  notes text,
  drive_file_id text,
  drive_file_url text,
  drive_sync_status text not null default 'not_synced',
  drive_last_synced_at timestamptz,
  drive_last_error text,
  email_status text not null default 'not_requested',
  email_recipients text[] not null default '{}'::text[],
  gmail_message_id text,
  gmail_thread_id text,
  email_sent_at timestamptz,
  email_last_error text,
  archived_at timestamptz,
  archived_by_clerk_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignment_documents_category_check check (category = any (array[
    'client_agreement'::text,
    'interpreter_agreement'::text,
    'assignment_confirmation'::text,
    'preparation_material'::text,
    'purchase_order'::text,
    'timesheet'::text,
    'communication_record'::text,
    'invoice'::text,
    'expense_receipt'::text,
    'incident_or_complaint'::text,
    'feedback'::text,
    'accessibility_plan'::text,
    'other'::text
  ])),
  constraint assignment_documents_role_check check (uploaded_by_role = any (array['admin'::text, 'client'::text, 'interpreter'::text])),
  constraint assignment_documents_visibility_check check (visibility = any (array[
    'admin_only'::text,
    'client'::text,
    'all_interpreters'::text,
    'specific_interpreter'::text,
    'client_and_interpreters'::text
  ])),
  constraint assignment_documents_record_status_check check (record_status = any (array['active'::text, 'archived'::text])),
  constraint assignment_documents_drive_status_check check (drive_sync_status = any (array['not_synced'::text, 'synced'::text, 'failed'::text, 'not_configured'::text])),
  constraint assignment_documents_email_status_check check (email_status = any (array['not_requested'::text, 'sent'::text, 'partial'::text, 'failed'::text, 'skipped'::text, 'not_configured'::text])),
  constraint assignment_documents_file_size_check check (file_size is null or (file_size >= 0 and file_size <= 15728640)),
  constraint assignment_documents_version_check check (version_number > 0),
  constraint assignment_documents_specific_interpreter_check check (visibility <> 'specific_interpreter' or interpreter_id is not null)
);

alter table public.assignment_documents enable row level security;

create index if not exists assignment_documents_assignment_active_idx
  on public.assignment_documents (assignment_id, created_at desc)
  where archived_at is null;
create index if not exists assignment_documents_interpreter_idx
  on public.assignment_documents (interpreter_id, assignment_id)
  where interpreter_id is not null and archived_at is null;
create index if not exists assignment_documents_visibility_idx
  on public.assignment_documents (visibility, assignment_id)
  where archived_at is null;
create index if not exists assignment_documents_drive_file_idx
  on public.assignment_documents (drive_file_id)
  where drive_file_id is not null;
create index if not exists assignment_documents_gmail_thread_idx
  on public.assignment_documents (gmail_thread_id)
  where gmail_thread_id is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assignment-documents',
  'assignment-documents',
  false,
  15728640,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'message/rfc822',
    'application/vnd.ms-outlook',
    'image/png',
    'image/jpeg'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
