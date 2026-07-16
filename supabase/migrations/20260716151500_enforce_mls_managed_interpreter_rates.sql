create or replace function public.mls_protect_interpreter_rates()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if coalesce(current_setting('mls.allow_rate_change', true), '') <> 'true' then
    if tg_op = 'INSERT' then
      new.onsite_rate := null;
      new.vri_rate := null;
    else
      new.onsite_rate := old.onsite_rate;
      new.vri_rate := old.vri_rate;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists mls_protect_interpreter_rates_trigger on public.interpreters;
create trigger mls_protect_interpreter_rates_trigger
before insert or update of onsite_rate, vri_rate on public.interpreters
for each row execute function public.mls_protect_interpreter_rates();

create or replace function public.mls_admin_update_interpreter_rates(
  p_interpreter_id uuid,
  p_onsite_rate text,
  p_vri_rate text
)
returns setof public.interpreters
security definer
set search_path = public, pg_temp
language plpgsql
as $$
begin
  perform set_config('mls.allow_rate_change', 'true', true);
  return query
  update public.interpreters
  set onsite_rate = nullif(trim(p_onsite_rate), ''),
      vri_rate = nullif(trim(p_vri_rate), ''),
      updated_at = now()
  where id = p_interpreter_id
  returning *;
end;
$$;

revoke all on function public.mls_admin_update_interpreter_rates(uuid, text, text) from public, anon, authenticated;
grant execute on function public.mls_admin_update_interpreter_rates(uuid, text, text) to service_role;
