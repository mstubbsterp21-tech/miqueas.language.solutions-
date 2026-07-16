create extension if not exists pgcrypto;

create table if not exists public.portal_conversations (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null unique,
  participant_one_clerk_user_id text not null,
  participant_one_role text not null check (participant_one_role in ('admin','client','interpreter')),
  participant_one_name text,
  participant_one_email text,
  participant_two_clerk_user_id text not null,
  participant_two_role text not null check (participant_two_role in ('admin','client','interpreter')),
  participant_two_name text,
  participant_two_email text,
  created_by_clerk_user_id text not null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_conversations_distinct_participants check (participant_one_clerk_user_id <> participant_two_clerk_user_id),
  constraint portal_conversations_mls_boundary check (
    participant_one_role = 'admin' or participant_two_role = 'admin'
  ),
  constraint portal_conversations_no_client_interpreter check (
    not (
      (participant_one_role = 'client' and participant_two_role = 'interpreter')
      or
      (participant_one_role = 'interpreter' and participant_two_role = 'client')
    )
  )
);

create table if not exists public.portal_direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.portal_conversations(id) on delete cascade,
  sender_clerk_user_id text not null,
  sender_role text not null check (sender_role in ('admin','client','interpreter')),
  body text not null default '',
  email_status text not null default 'not_requested' check (email_status in ('not_requested','sent','partial','failed','skipped','not_configured')),
  email_recipients text[] not null default '{}'::text[],
  gmail_message_id text,
  gmail_thread_id text,
  email_sent_at timestamptz,
  email_last_error text,
  created_at timestamptz not null default now(),
  constraint portal_direct_messages_body_length check (char_length(body) <= 4000)
);

create table if not exists public.portal_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  body text not null check (char_length(body) between 1 and 8000),
  audiences text[] not null default '{}'::text[],
  created_by_clerk_user_id text not null,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  email_status text not null default 'not_requested' check (email_status in ('not_requested','sent','partial','failed','skipped','not_configured')),
  email_recipients text[] not null default '{}'::text[],
  gmail_message_ids text[] not null default '{}'::text[],
  email_last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_announcements_audience_check check (
    audiences <@ array['admin','client','interpreter','all']::text[] and cardinality(audiences) > 0
  )
);

create table if not exists public.portal_announcement_reads (
  announcement_id uuid not null references public.portal_announcements(id) on delete cascade,
  clerk_user_id text not null,
  read_at timestamptz not null default now(),
  primary key (announcement_id, clerk_user_id)
);

create table if not exists public.portal_communication_attachments (
  id uuid primary key default gen_random_uuid(),
  direct_message_id uuid references public.portal_direct_messages(id) on delete cascade,
  announcement_id uuid references public.portal_announcements(id) on delete cascade,
  file_name text not null,
  mime_type text,
  file_size bigint,
  storage_path text not null unique,
  uploaded_by_clerk_user_id text not null,
  drive_file_id text,
  drive_file_url text,
  drive_sync_status text not null default 'not_synced' check (drive_sync_status in ('not_synced','synced','failed','not_configured')),
  drive_last_error text,
  created_at timestamptz not null default now(),
  constraint portal_communication_attachments_parent_check check (
    (direct_message_id is not null and announcement_id is null)
    or
    (direct_message_id is null and announcement_id is not null)
  ),
  constraint portal_communication_attachments_size_check check (
    file_size is null or (file_size >= 0 and file_size <= 15728640)
  )
);

create index if not exists portal_conversations_participant_one_idx
  on public.portal_conversations(participant_one_clerk_user_id, last_message_at desc);
create index if not exists portal_conversations_participant_two_idx
  on public.portal_conversations(participant_two_clerk_user_id, last_message_at desc);
create index if not exists portal_direct_messages_conversation_idx
  on public.portal_direct_messages(conversation_id, created_at);
create index if not exists portal_announcements_published_idx
  on public.portal_announcements(published_at desc);
create index if not exists portal_announcement_reads_user_idx
  on public.portal_announcement_reads(clerk_user_id, read_at desc);
create index if not exists portal_communication_attachments_message_idx
  on public.portal_communication_attachments(direct_message_id)
  where direct_message_id is not null;
create index if not exists portal_communication_attachments_announcement_idx
  on public.portal_communication_attachments(announcement_id)
  where announcement_id is not null;

alter table public.portal_conversations enable row level security;
alter table public.portal_direct_messages enable row level security;
alter table public.portal_announcements enable row level security;
alter table public.portal_announcement_reads enable row level security;
alter table public.portal_communication_attachments enable row level security;

revoke all on public.portal_conversations from anon, authenticated;
revoke all on public.portal_direct_messages from anon, authenticated;
revoke all on public.portal_announcements from anon, authenticated;
revoke all on public.portal_announcement_reads from anon, authenticated;
revoke all on public.portal_communication_attachments from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portal-communications',
  'portal-communications',
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
    'image/png',
    'image/jpeg',
    'image/webp'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
