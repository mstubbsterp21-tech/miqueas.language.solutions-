create table if not exists public.portal_message_mentions (
  direct_message_id uuid not null references public.portal_direct_messages(id) on delete cascade,
  mentioned_clerk_user_id text not null,
  mentioned_display_name text,
  created_at timestamptz not null default now(),
  primary key (direct_message_id, mentioned_clerk_user_id)
);

create index if not exists portal_message_mentions_user_idx
  on public.portal_message_mentions(mentioned_clerk_user_id, created_at desc);

alter table public.portal_message_mentions enable row level security;
revoke all on public.portal_message_mentions from anon, authenticated;

comment on table public.portal_message_mentions is
  'Validated portal conversation members explicitly mentioned in a direct or group message.';
comment on column public.portal_conversations.title is
  'Optional shared conversation name. When null, the portal derives a default name from the participants.';
