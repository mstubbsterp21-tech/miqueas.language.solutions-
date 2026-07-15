alter table public.assignments
  add column if not exists google_calendar_event_id text,
  add column if not exists google_calendar_html_link text,
  add column if not exists calendar_sync_status text not null default 'not_synced',
  add column if not exists calendar_last_synced_at timestamptz,
  add column if not exists calendar_last_error text,
  add column if not exists drive_folder_id text,
  add column if not exists drive_folder_url text,
  add column if not exists drive_sync_status text not null default 'not_synced',
  add column if not exists drive_last_synced_at timestamptz,
  add column if not exists drive_last_error text,
  add column if not exists request_email_status text not null default 'not_sent',
  add column if not exists request_email_sent_at timestamptz,
  add column if not exists request_email_last_error text,
  add column if not exists confirmation_email_status text not null default 'not_sent',
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists confirmation_email_last_error text;

alter table public.assignments drop constraint if exists assignments_calendar_sync_status_check;
alter table public.assignments add constraint assignments_calendar_sync_status_check
  check (calendar_sync_status = any (array['not_synced'::text, 'synced'::text, 'failed'::text, 'not_configured'::text]));
alter table public.assignments drop constraint if exists assignments_drive_sync_status_check;
alter table public.assignments add constraint assignments_drive_sync_status_check
  check (drive_sync_status = any (array['not_synced'::text, 'synced'::text, 'failed'::text, 'not_configured'::text]));
alter table public.assignments drop constraint if exists assignments_request_email_status_check;
alter table public.assignments add constraint assignments_request_email_status_check
  check (request_email_status = any (array['not_sent'::text, 'sent'::text, 'partial'::text, 'failed'::text, 'skipped'::text, 'not_configured'::text]));
alter table public.assignments drop constraint if exists assignments_confirmation_email_status_check;
alter table public.assignments add constraint assignments_confirmation_email_status_check
  check (confirmation_email_status = any (array['not_sent'::text, 'sent'::text, 'partial'::text, 'failed'::text, 'skipped'::text, 'not_configured'::text]));

alter table public.assignment_messages
  add column if not exists email_status text not null default 'not_requested',
  add column if not exists email_recipients text[] not null default '{}'::text[],
  add column if not exists gmail_message_id text,
  add column if not exists gmail_thread_id text,
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_last_error text;

alter table public.assignment_messages drop constraint if exists assignment_messages_email_status_check;
alter table public.assignment_messages add constraint assignment_messages_email_status_check
  check (email_status = any (array['not_requested'::text, 'sent'::text, 'partial'::text, 'failed'::text, 'skipped'::text, 'not_configured'::text]));

alter table public.gmail_integrations
  add column if not exists calendar_id text,
  add column if not exists calendar_summary text,
  add column if not exists drive_root_folder_id text,
  add column if not exists drive_root_folder_url text,
  add column if not exists workspace_last_verified_at timestamptz;

create index if not exists assignments_google_calendar_event_id_idx
  on public.assignments (google_calendar_event_id)
  where google_calendar_event_id is not null;
create index if not exists assignments_drive_folder_id_idx
  on public.assignments (drive_folder_id)
  where drive_folder_id is not null;
create index if not exists assignment_messages_gmail_thread_id_idx
  on public.assignment_messages (gmail_thread_id)
  where gmail_thread_id is not null;
