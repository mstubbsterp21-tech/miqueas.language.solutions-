alter table public.interpreters
  add column if not exists availability_timezone text not null default 'America/New_York';

update public.interpreters
set availability_timezone = 'America/New_York'
where nullif(trim(coalesce(availability_timezone, '')), '') is null;
