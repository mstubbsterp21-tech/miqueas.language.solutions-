alter table public.interpreters
  add column if not exists availability_status text not null default 'contact_me';

alter table public.interpreters
  drop constraint if exists interpreters_availability_status_check;
alter table public.interpreters
  add constraint interpreters_availability_status_check
  check (availability_status in ('scheduled', 'contact_me', 'unknown', 'not_accepting'));

update public.interpreters
set availability_status = 'scheduled'
where availability_status = 'contact_me'
  and exists (
    select 1
    from unnest(array[
      availability_sunday,
      availability_monday,
      availability_tuesday,
      availability_wednesday,
      availability_thursday,
      availability_friday,
      availability_saturday
    ]) as saved_window
    where nullif(trim(coalesce(saved_window, '')), '') is not null
  );

alter table public.portal_conversation_members
  add column if not exists last_read_at timestamptz,
  add column if not exists last_read_message_id uuid references public.portal_direct_messages(id) on delete set null;

update public.portal_conversation_members
set last_read_at = coalesce(last_read_at, now())
where last_read_at is null;

create index if not exists portal_conversation_members_unread_idx
  on public.portal_conversation_members(clerk_user_id, last_read_at desc)
  where left_at is null;

alter table public.portal_direct_messages
  add column if not exists idempotency_key text;

alter table public.portal_direct_messages
  drop constraint if exists portal_direct_messages_idempotency_key_key;
alter table public.portal_direct_messages
  add constraint portal_direct_messages_idempotency_key_key unique (idempotency_key);

alter table public.notifications
  add column if not exists notification_key text;

alter table public.notifications
  drop constraint if exists notifications_notification_key_key;
alter table public.notifications
  add constraint notifications_notification_key_key unique (notification_key);

revoke execute on function public.mls_broadcast_notification_change() from public, anon, authenticated;

create or replace function public.mls_replace_weekly_availability(
  p_interpreter_id uuid,
  p_timezone text,
  p_windows jsonb
)
returns setof public.interpreter_availability
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  sunday_text text;
  monday_text text;
  tuesday_text text;
  wednesday_text text;
  thursday_text text;
  friday_text text;
  saturday_text text;
begin
  if p_interpreter_id is null or p_windows is null or jsonb_typeof(p_windows) <> 'array' then
    raise exception 'Interpreter and weekly windows are required.';
  end if;

  if jsonb_array_length(p_windows) > 56 then
    raise exception 'Too many weekly availability windows were submitted.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_windows) as item
    where (item->>'weekday')::integer not between 0 and 6
      or item->>'block' not in ('overnight', 'morning', 'afternoon', 'evening')
      or item->>'availabilityType' not in ('available', 'unavailable')
      or (item->>'endAt')::timestamptz <= (item->>'startAt')::timestamptz
  ) then
    raise exception 'One or more weekly availability selections are invalid.';
  end if;

  delete from public.interpreter_availability
  where interpreter_id = p_interpreter_id
    and recurrence_rule like '%X-MLS-BLOCK=%';

  insert into public.interpreter_availability (
    interpreter_id,
    start_at,
    end_at,
    availability_type,
    recurrence_rule,
    notes,
    updated_at
  )
  select
    p_interpreter_id,
    (item->>'startAt')::timestamptz,
    (item->>'endAt')::timestamptz,
    item->>'availabilityType',
    'FREQ=WEEKLY;BYDAY=' || (array['SU','MO','TU','WE','TH','FR','SA'])[((item->>'weekday')::integer) + 1]
      || ';X-MLS-BLOCK=' || (item->>'block') || ';X-MLS-TZID=' || p_timezone,
    case when item->>'availabilityType' = 'unavailable'
      then 'Suppress opportunity emails during this weekly window'
      else 'Weekly availability window'
    end,
    now()
  from jsonb_array_elements(p_windows) as item;

  with labels as (
    select
      (item->>'weekday')::integer as weekday,
      (case when item->>'availabilityType' = 'unavailable' then 'Unavailable' else 'Available' end)
        || ': '
        || case item->>'block'
          when 'overnight' then 'Overnight (12AM-6AM)'
          when 'morning' then 'Morning (6AM-12PM)'
          when 'afternoon' then 'Afternoon (12PM-6PM)'
          when 'evening' then 'Evening (6PM-12AM)'
        end as label
    from jsonb_array_elements(p_windows) as item
  )
  select
    string_agg(label, ', ') filter (where weekday = 0),
    string_agg(label, ', ') filter (where weekday = 1),
    string_agg(label, ', ') filter (where weekday = 2),
    string_agg(label, ', ') filter (where weekday = 3),
    string_agg(label, ', ') filter (where weekday = 4),
    string_agg(label, ', ') filter (where weekday = 5),
    string_agg(label, ', ') filter (where weekday = 6)
  into sunday_text, monday_text, tuesday_text, wednesday_text, thursday_text, friday_text, saturday_text
  from labels;

  update public.interpreters
  set
    availability_timezone = p_timezone,
    availability_status = case when jsonb_array_length(p_windows) > 0 then 'scheduled' else availability_status end,
    availability_sunday = coalesce(sunday_text, ''),
    availability_monday = coalesce(monday_text, ''),
    availability_tuesday = coalesce(tuesday_text, ''),
    availability_wednesday = coalesce(wednesday_text, ''),
    availability_thursday = coalesce(thursday_text, ''),
    availability_friday = coalesce(friday_text, ''),
    availability_saturday = coalesce(saturday_text, ''),
    availability_morning = p_windows @? '$[*] ? (@.block == "morning" && @.availabilityType == "available")',
    availability_afternoon = p_windows @? '$[*] ? (@.block == "afternoon" && @.availabilityType == "available")',
    availability_evening = p_windows @? '$[*] ? (@.block == "evening" && @.availabilityType == "available")',
    availability_overnight = p_windows @? '$[*] ? (@.block == "overnight" && @.availabilityType == "available")',
    updated_at = now()
  where id = p_interpreter_id;

  return query
  select *
  from public.interpreter_availability
  where interpreter_id = p_interpreter_id
  order by start_at;
end;
$$;

revoke all on function public.mls_replace_weekly_availability(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.mls_replace_weekly_availability(uuid, text, jsonb) to service_role;

comment on column public.interpreters.availability_status is
  'Interpreter-controlled availability posture; onboarding may finish without a weekly schedule.';
comment on column public.portal_conversation_members.last_read_at is
  'Per-member read cursor used for accurate conversation unread counts.';
comment on column public.portal_direct_messages.idempotency_key is
  'Client-generated key that prevents duplicate messages and email notifications on retry.';
