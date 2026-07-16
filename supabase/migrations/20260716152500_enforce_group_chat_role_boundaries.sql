alter table public.portal_conversations
  add column if not exists created_by_role text;

update public.portal_conversations
set created_by_role = case
  when participant_one_clerk_user_id = created_by_clerk_user_id then participant_one_role
  when participant_two_clerk_user_id = created_by_clerk_user_id then participant_two_role
  else created_by_role
end
where created_by_role is null;

alter table public.portal_conversations
  drop constraint if exists portal_conversations_creator_role_check;
alter table public.portal_conversations
  add constraint portal_conversations_creator_role_check
  check (created_by_role is null or created_by_role in ('admin','client','interpreter'));

create or replace function public.mls_enforce_conversation_member_boundary()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  conversation_record public.portal_conversations%rowtype;
  existing_role text;
begin
  select * into conversation_record
  from public.portal_conversations
  where id = new.conversation_id;

  if conversation_record.id is null then
    raise exception 'Conversation not found.';
  end if;

  if conversation_record.conversation_type = 'group' then
    if conversation_record.created_by_role = 'client' then
      raise exception 'Clients cannot create group conversations.';
    end if;
    if new.role = 'client' and conversation_record.created_by_role <> 'admin' then
      raise exception 'Only MLS admins may add clients to group conversations.';
    end if;
  else
    select role into existing_role
    from public.portal_conversation_members
    where conversation_id = new.conversation_id
      and clerk_user_id <> new.clerk_user_id
      and left_at is null
    limit 1;

    if existing_role is not null then
      if (new.role = 'client' and existing_role <> 'admin')
         or (existing_role = 'client' and new.role <> 'admin') then
        raise exception 'Client direct conversations must include an MLS admin.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists mls_conversation_member_boundary_trigger on public.portal_conversation_members;
create trigger mls_conversation_member_boundary_trigger
before insert or update of role, left_at on public.portal_conversation_members
for each row execute function public.mls_enforce_conversation_member_boundary();
