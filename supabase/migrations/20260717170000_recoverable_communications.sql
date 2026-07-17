alter table public.portal_conversation_members
  add column if not exists cleared_at timestamptz,
  add column if not exists cleared_restore_until timestamptz,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_restore_until timestamptz;

alter table public.portal_direct_messages
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_clerk_user_id text,
  add column if not exists delete_restore_until timestamptz;

create index if not exists portal_conversation_members_visible_idx
  on public.portal_conversation_members(clerk_user_id, hidden_at, conversation_id)
  where left_at is null;

create index if not exists portal_direct_messages_visible_idx
  on public.portal_direct_messages(conversation_id, created_at)
  where deleted_at is null;
