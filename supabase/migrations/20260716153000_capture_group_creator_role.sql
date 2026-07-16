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

  if conversation_record.created_by_role is null
     and new.clerk_user_id = conversation_record.created_by_clerk_user_id then
    update public.portal_conversations
    set created_by_role = new.role,
        updated_at = now()
    where id = conversation_record.id;
    conversation_record.created_by_role := new.role;
  end if;

  if conversation_record.conversation_type = 'group' then
    if conversation_record.created_by_role = 'client' then
      raise exception 'Clients cannot create group conversations.';
    end if;
    if new.role = 'client' and conversation_record.created_by_role <> 'admin' then
      raise exception 'Only MLS admins may add clients to group conversations.';
    end if;
    if new.clerk_user_id = conversation_record.created_by_clerk_user_id
       and new.role = 'interpreter'
       and exists (
         select 1 from public.portal_conversation_members
         where conversation_id = new.conversation_id
           and role = 'client'
           and left_at is null
       ) then
      raise exception 'Interpreter-created groups cannot contain clients.';
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
