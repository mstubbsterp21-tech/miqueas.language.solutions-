create extension if not exists pgcrypto;

alter table public.portal_conversations
  add column if not exists conversation_type text not null default 'direct',
  add column if not exists title text;

alter table public.portal_conversations
  alter column pair_key drop not null,
  alter column participant_one_clerk_user_id drop not null,
  alter column participant_one_role drop not null,
  alter column participant_two_clerk_user_id drop not null,
  alter column participant_two_role drop not null;

alter table public.portal_conversations
  drop constraint if exists portal_conversations_mls_boundary,
  drop constraint if exists portal_conversations_no_client_interpreter,
  drop constraint if exists portal_conversations_distinct_participants;

alter table public.portal_conversations
  drop constraint if exists portal_conversations_conversation_type_check;
alter table public.portal_conversations
  add constraint portal_conversations_conversation_type_check
  check (conversation_type in ('direct','group'));

create table if not exists public.portal_conversation_members (
  conversation_id uuid not null references public.portal_conversations(id) on delete cascade,
  clerk_user_id text not null,
  role text not null check (role in ('admin','client','interpreter')),
  display_name text,
  email text,
  added_by_clerk_user_id text,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (conversation_id, clerk_user_id)
);

insert into public.portal_conversation_members (
  conversation_id, clerk_user_id, role, display_name, email, added_by_clerk_user_id, joined_at
)
select id, participant_one_clerk_user_id, participant_one_role, participant_one_name,
       participant_one_email, created_by_clerk_user_id, created_at
from public.portal_conversations
where participant_one_clerk_user_id is not null
on conflict (conversation_id, clerk_user_id) do nothing;

insert into public.portal_conversation_members (
  conversation_id, clerk_user_id, role, display_name, email, added_by_clerk_user_id, joined_at
)
select id, participant_two_clerk_user_id, participant_two_role, participant_two_name,
       participant_two_email, created_by_clerk_user_id, created_at
from public.portal_conversations
where participant_two_clerk_user_id is not null
on conflict (conversation_id, clerk_user_id) do nothing;

create index if not exists portal_conversation_members_user_idx
  on public.portal_conversation_members(clerk_user_id, left_at, joined_at desc);
create index if not exists portal_conversation_members_conversation_idx
  on public.portal_conversation_members(conversation_id, left_at);

alter table public.portal_conversation_members enable row level security;
revoke all on public.portal_conversation_members from anon, authenticated;

create table if not exists public.portal_realtime_channels (
  clerk_user_id text primary key,
  topic_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  role text check (role in ('admin','client','interpreter')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portal_realtime_channels enable row level security;
revoke all on public.portal_realtime_channels from anon, authenticated;

create table if not exists public.portal_trusted_devices (
  clerk_user_id text not null,
  device_hash text not null,
  device_label text,
  user_agent_hash text,
  trusted_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (clerk_user_id, device_hash)
);

create table if not exists public.portal_device_challenges (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  pending_device_hash text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists portal_device_challenges_lookup_idx
  on public.portal_device_challenges(clerk_user_id, pending_device_hash, expires_at desc);

alter table public.portal_trusted_devices enable row level security;
alter table public.portal_device_challenges enable row level security;
revoke all on public.portal_trusted_devices from anon, authenticated;
revoke all on public.portal_device_challenges from anon, authenticated;

alter table public.interpreters
  add column if not exists network_submission_id text,
  add column if not exists network_submission_synced_at timestamptz;

create or replace function public.mls_broadcast_notification_change()
returns trigger
security definer
set search_path = public, realtime, pg_temp
language plpgsql
as $$
declare
  target_user text;
  target_topic text;
  record_id uuid;
begin
  target_user := coalesce(new.recipient_clerk_user_id, old.recipient_clerk_user_id);
  record_id := coalesce(new.id, old.id);
  select 'portal-user:' || topic_token into target_topic
  from public.portal_realtime_channels
  where clerk_user_id = target_user;

  if target_topic is not null then
    perform realtime.send(
      jsonb_build_object(
        'notificationId', record_id,
        'operation', tg_op,
        'category', coalesce(new.category, old.category),
        'section', coalesce(new.section, old.section)
      ),
      'portal-update',
      target_topic,
      false
    );
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists mls_notifications_realtime_trigger on public.notifications;
create trigger mls_notifications_realtime_trigger
after insert or update or delete on public.notifications
for each row execute function public.mls_broadcast_notification_change();
