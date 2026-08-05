-- MLS Portal pre-launch hardening
-- 1. Backfill missing profile customization rows for linked portal accounts.
-- 2. Reconcile legacy setup-complete records against the current wizard requirements.
-- 3. Keep future completion states consistent at the database boundary.
-- 4. Add the missing covering index reported by the Supabase advisor.

create or replace function public.enforce_interpreter_setup_v2()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  missing_step integer := null;
begin
  new.setup_version := greatest(coalesce(new.setup_version, 1), 2);

  if new.setup_completed_at is null then
    return new;
  end if;

  if nullif(btrim(coalesce(new.first_name, '')), '') is null
    or nullif(btrim(coalesce(new.last_name, '')), '') is null
    or nullif(btrim(coalesce(new.email, '')), '') is null
    or nullif(btrim(coalesce(new.phone, '')), '') is null
    or nullif(btrim(coalesce(new.preferred_contact_method, '')), '') is null
    or nullif(btrim(coalesce(new.address_line_1, '')), '') is null
    or nullif(btrim(coalesce(new.city, '')), '') is null
    or nullif(btrim(coalesce(new.state, '')), '') is null
    or nullif(btrim(coalesce(new.country, '')), '') is null
    or nullif(btrim(coalesce(new.postal_code, '')), '') is null then
    missing_step := 0;
  elsif nullif(btrim(coalesce(new.credentials, '')), '') is null
    or nullif(btrim(coalesce(new.years_experience, '')), '') is null then
    missing_step := 1;
  elsif nullif(btrim(coalesce(new.modalities, '')), '') is null
    or nullif(btrim(coalesce(new.areas_of_experience, '')), '') is null
    or nullif(btrim(coalesce(new.assignment_type_preference, '')), '') is null
    or nullif(btrim(coalesce(new.willing_to_travel, '')), '') is null
    or nullif(btrim(coalesce(new.technical_readiness_confirmed, '')), '') is null
    or nullif(btrim(coalesce(new.professional_liability_insurance, '')), '') is null then
    missing_step := 2;
  elsif coalesce(new.availability_status, 'contact_me') = 'scheduled'
    and nullif(btrim(coalesce(new.availability_sunday, '')), '') is null
    and nullif(btrim(coalesce(new.availability_monday, '')), '') is null
    and nullif(btrim(coalesce(new.availability_tuesday, '')), '') is null
    and nullif(btrim(coalesce(new.availability_wednesday, '')), '') is null
    and nullif(btrim(coalesce(new.availability_thursday, '')), '') is null
    and nullif(btrim(coalesce(new.availability_friday, '')), '') is null
    and nullif(btrim(coalesce(new.availability_saturday, '')), '') is null then
    missing_step := 3;
  end if;

  if missing_step is not null then
    new.setup_completed_at := null;
    new.setup_current_step := missing_step;
  end if;

  return new;
end;
$$;

comment on function public.enforce_interpreter_setup_v2() is
  'Prevents an interpreter profile from remaining setup-complete when current required onboarding fields are missing.';

drop trigger if exists enforce_interpreter_setup_v2_trigger on public.interpreters;
create trigger enforce_interpreter_setup_v2_trigger
before insert or update on public.interpreters
for each row execute function public.enforce_interpreter_setup_v2();

create or replace function public.enforce_client_setup_v2()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  missing_step integer := null;
  defaults jsonb := coalesce(new.request_defaults, '{}'::jsonb);
begin
  new.setup_version := greatest(coalesce(new.setup_version, 1), 2);

  if new.setup_completed_at is null then
    new.onboarding_complete := false;
    return new;
  end if;

  if nullif(btrim(coalesce(new.organization_name, '')), '') is null
    or nullif(btrim(coalesce(new.primary_contact_name, '')), '') is null
    or nullif(btrim(coalesce(new.phone, '')), '') is null
    or nullif(btrim(coalesce(new.preferred_contact_method, '')), '') is null then
    missing_step := 0;
  elsif nullif(btrim(coalesce(new.billing_email, '')), '') is null then
    missing_step := 1;
  elsif nullif(btrim(coalesce(defaults ->> 'serviceNeeded', '')), '') is null
    or nullif(btrim(coalesce(defaults ->> 'setting', '')), '') is null
    or (
      defaults ->> 'setting' = 'Other'
      and nullif(btrim(coalesce(defaults ->> 'settingOther', '')), '') is null
    ) then
    missing_step := 2;
  end if;

  if missing_step is not null then
    new.setup_completed_at := null;
    new.setup_current_step := missing_step;
    new.onboarding_complete := false;
  else
    new.onboarding_complete := true;
  end if;

  return new;
end;
$$;

comment on function public.enforce_client_setup_v2() is
  'Prevents a client profile from remaining setup-complete when current required onboarding fields are missing.';

drop trigger if exists enforce_client_setup_v2_trigger on public.clients;
create trigger enforce_client_setup_v2_trigger
before insert or update on public.clients
for each row execute function public.enforce_client_setup_v2();

-- Re-evaluate legacy records through the new completion guards.
update public.interpreters
set setup_version = greatest(coalesce(setup_version, 1), 2),
    updated_at = now()
where setup_completed_at is not null;

update public.clients
set setup_version = greatest(coalesce(setup_version, 1), 2),
    updated_at = now()
where setup_completed_at is not null;

-- Every linked portal account should have a safe default customization record.
insert into public.profile_customizations (
  profile_type,
  interpreter_id,
  clerk_user_id,
  display_name
)
select
  'interpreter',
  i.id,
  i.clerk_user_id,
  nullif(btrim(concat_ws(' ', i.first_name, i.last_name)), '')
from public.interpreters i
left join public.profile_customizations pc on pc.interpreter_id = i.id
where pc.id is null
  and nullif(btrim(coalesce(i.clerk_user_id, '')), '') is not null
on conflict (interpreter_id) do nothing;

insert into public.profile_customizations (
  profile_type,
  client_id,
  clerk_user_id,
  display_name
)
select
  'client',
  c.id,
  c.clerk_user_id,
  coalesce(
    nullif(btrim(coalesce(c.organization_name, '')), ''),
    nullif(btrim(coalesce(c.primary_contact_name, '')), '')
  )
from public.clients c
left join public.profile_customizations pc on pc.client_id = c.id
where pc.id is null
  and nullif(btrim(coalesce(c.clerk_user_id, '')), '') is not null
on conflict (client_id) do nothing;

create index if not exists portal_conversation_members_last_read_message_idx
  on public.portal_conversation_members (last_read_message_id);
