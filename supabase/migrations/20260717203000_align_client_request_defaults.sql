alter table public.clients
  add column if not exists request_defaults jsonb not null default '{}'::jsonb;

comment on column public.clients.request_defaults is
  'Reusable, non-confidential defaults whose keys match the public Interpreter Request Form.';

update public.clients
set request_defaults = jsonb_strip_nulls(jsonb_build_object(
  'serviceNeeded', nullif(default_service_type, ''),
  'setting', nullif(default_delivery_mode, ''),
  'communicationNotes', nullif(communication_preferences, '')
))
where request_defaults = '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clients_request_defaults_is_object'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_request_defaults_is_object
      check (jsonb_typeof(request_defaults) = 'object') not valid;
  end if;
end
$$;

alter table public.clients
  validate constraint clients_request_defaults_is_object;
