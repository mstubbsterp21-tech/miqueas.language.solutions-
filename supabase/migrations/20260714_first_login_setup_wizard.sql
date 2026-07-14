alter table public.clients
  add column if not exists setup_started_at timestamptz,
  add column if not exists setup_completed_at timestamptz,
  add column if not exists setup_current_step integer not null default 0,
  add column if not exists setup_version integer not null default 1;

alter table public.interpreters
  add column if not exists setup_started_at timestamptz,
  add column if not exists setup_completed_at timestamptz,
  add column if not exists setup_current_step integer not null default 0,
  add column if not exists setup_version integer not null default 1;

update public.clients
set
  setup_started_at = coalesce(setup_started_at, created_at, now()),
  setup_completed_at = coalesce(setup_completed_at, updated_at, now()),
  setup_current_step = greatest(setup_current_step, 3),
  setup_version = 1,
  onboarding_complete = true
where setup_completed_at is null
  and nullif(trim(coalesce(organization_name, '')), '') is not null
  and nullif(trim(coalesce(primary_contact_name, '')), '') is not null
  and nullif(trim(coalesce(phone, '')), '') is not null
  and nullif(trim(coalesce(billing_email, '')), '') is not null;

update public.interpreters
set
  setup_started_at = coalesce(setup_started_at, created_at, now()),
  setup_completed_at = coalesce(setup_completed_at, updated_at, now()),
  setup_current_step = greatest(setup_current_step, 4),
  setup_version = 1
where setup_completed_at is null
  and nullif(trim(coalesce(phone, '')), '') is not null
  and nullif(trim(coalesce(preferred_contact_method, '')), '') is not null
  and (
    nullif(trim(coalesce(city, '')), '') is not null
    or nullif(trim(coalesce(current_location, '')), '') is not null
  )
  and nullif(trim(coalesce(credentials, '')), '') is not null
  and nullif(trim(coalesce(years_experience, '')), '') is not null
  and nullif(trim(coalesce(modalities, '')), '') is not null
  and nullif(trim(coalesce(areas_of_experience, '')), '') is not null
  and nullif(trim(coalesce(assignment_type_preference, '')), '') is not null
  and nullif(trim(coalesce(willing_to_travel, '')), '') is not null
  and nullif(trim(coalesce(professional_liability_insurance, '')), '') is not null
  and (
    nullif(trim(coalesce(availability_sunday, '')), '') is not null
    or nullif(trim(coalesce(availability_monday, '')), '') is not null
    or nullif(trim(coalesce(availability_tuesday, '')), '') is not null
    or nullif(trim(coalesce(availability_wednesday, '')), '') is not null
    or nullif(trim(coalesce(availability_thursday, '')), '') is not null
    or nullif(trim(coalesce(availability_friday, '')), '') is not null
    or nullif(trim(coalesce(availability_saturday, '')), '') is not null
  );

create index if not exists clients_setup_completed_at_idx
  on public.clients(setup_completed_at)
  where setup_completed_at is null;

create index if not exists interpreters_setup_completed_at_idx
  on public.interpreters(setup_completed_at)
  where setup_completed_at is null;
