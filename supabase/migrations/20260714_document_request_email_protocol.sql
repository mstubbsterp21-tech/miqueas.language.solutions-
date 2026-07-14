alter table public.document_requests
  add column if not exists recipient_email text,
  add column if not exists recipient_name text,
  add column if not exists email_status text not null default 'pending',
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_last_attempt_at timestamptz,
  add column if not exists email_last_error text,
  add column if not exists email_message_id text,
  add column if not exists reminder_count integer not null default 0,
  add column if not exists last_reminder_at timestamptz,
  add column if not exists next_reminder_at timestamptz;

alter table public.document_requests
  drop constraint if exists document_requests_email_status_check;

alter table public.document_requests
  add constraint document_requests_email_status_check
  check (email_status in ('pending','sent','failed','not_configured','skipped'));

create table if not exists public.document_request_email_events (
  id uuid primary key default gen_random_uuid(),
  document_request_id uuid not null references public.document_requests(id) on delete cascade,
  event_type text not null check (event_type in ('initial','manual_resend','due_reminder','overdue_reminder')),
  recipient_email text not null,
  delivery_status text not null check (delivery_status in ('sent','failed','not_configured','skipped')),
  message_id text,
  error_message text,
  triggered_by text,
  created_at timestamptz not null default now()
);

create index if not exists document_requests_next_reminder_idx
  on public.document_requests(next_reminder_at)
  where next_reminder_at is not null and status in ('requested','viewed','overdue');

create index if not exists document_request_email_events_request_idx
  on public.document_request_email_events(document_request_id, created_at desc);

alter table public.document_request_email_events enable row level security;
revoke all on public.document_request_email_events from anon, authenticated;
