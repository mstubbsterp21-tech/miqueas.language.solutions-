create table if not exists public.portal_feedback (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  role text not null check (role in ('admin', 'client', 'interpreter')),
  user_name text,
  user_email text,
  request_type text not null check (request_type in (
    'request_new_feature',
    'update_existing_feature',
    'remove_existing_feature'
  )),
  category text not null,
  comments text not null check (char_length(comments) between 10 and 4000),
  status text not null default 'new' check (status in (
    'new',
    'reviewing',
    'planned',
    'completed',
    'declined'
  )),
  gmail_delivery_status text not null default 'pending' check (gmail_delivery_status in (
    'pending',
    'sent',
    'sent_unfiled',
    'failed'
  )),
  gmail_message_id text,
  gmail_thread_id text,
  gmail_label_id text,
  gmail_delivery_error text,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portal_feedback_user_created_idx
  on public.portal_feedback (clerk_user_id, created_at desc);

create index if not exists portal_feedback_delivery_idx
  on public.portal_feedback (gmail_delivery_status, created_at)
  where gmail_delivery_status in ('pending', 'failed');

alter table public.portal_feedback enable row level security;
revoke all on table public.portal_feedback from anon, authenticated;
grant select, insert, update, delete on table public.portal_feedback to service_role;

comment on table public.portal_feedback is
  'Server-managed portal feature feedback with Gmail delivery tracking.';

