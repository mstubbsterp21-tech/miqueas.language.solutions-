alter table public.portal_preferences
  add column if not exists time_zone text not null default 'America/New_York';

alter table public.portal_preferences
  drop constraint if exists portal_preferences_time_zone_check;

alter table public.portal_preferences
  add constraint portal_preferences_time_zone_check
  check (time_zone in (
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Phoenix',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Adak',
    'Pacific/Honolulu',
    'America/Puerto_Rico',
    'Pacific/Pago_Pago',
    'Pacific/Guam'
  ));

update public.interpreters as interpreter
set areas_of_experience = (
      select string_agg(value, ', ' order by first_position)
      from (
        select trim(raw_value) as value, min(position) as first_position
        from unnest(string_to_array(replace(interpreter.areas_of_experience, 'Community / Freelance', 'General / Community'), ',')) with ordinality as item(raw_value, position)
        where nullif(trim(raw_value), '') is not null
        group by trim(raw_value)
      ) as deduplicated
    ),
    updated_at = now()
where interpreter.areas_of_experience like '%Community / Freelance%';

comment on column public.portal_preferences.time_zone is
  'User-selected IANA time zone used to display and enter dates throughout every MLS portal.';
