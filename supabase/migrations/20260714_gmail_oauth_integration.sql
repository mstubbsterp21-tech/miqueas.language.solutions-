create table if not exists public.gmail_integrations (
  id text primary key default 'primary' check (id = 'primary'),
  google_email text not null,
  vault_secret_id uuid not null,
  scope text,
  status text not null default 'connected' check (status in ('connected','error','disconnected')),
  connected_by_clerk_user_id text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_test_at timestamptz,
  last_error text
);

create table if not exists public.gmail_oauth_states (
  state text primary key,
  admin_clerk_user_id text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists gmail_oauth_states_expires_at_idx
  on public.gmail_oauth_states(expires_at);

alter table public.gmail_integrations enable row level security;
alter table public.gmail_oauth_states enable row level security;

revoke all on public.gmail_integrations from anon, authenticated;
revoke all on public.gmail_oauth_states from anon, authenticated;

create or replace function public.mls_store_gmail_refresh_token(
  p_refresh_token text,
  p_google_email text,
  p_scope text,
  p_connected_by text
)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  if p_refresh_token is null or length(trim(p_refresh_token)) = 0 then
    raise exception 'Refresh token is required.';
  end if;

  select vault_secret_id
    into v_secret_id
  from public.gmail_integrations
  where id = 'primary';

  if v_secret_id is null then
    v_secret_id := vault.create_secret(
      p_refresh_token,
      'mls_gmail_refresh_token',
      'Refresh token for the MLS Gmail send-only integration.',
      null
    );
  else
    perform vault.update_secret(
      v_secret_id,
      p_refresh_token,
      'mls_gmail_refresh_token',
      'Refresh token for the MLS Gmail send-only integration.',
      null
    );
  end if;

  insert into public.gmail_integrations (
    id,
    google_email,
    vault_secret_id,
    scope,
    status,
    connected_by_clerk_user_id,
    connected_at,
    updated_at,
    last_error
  ) values (
    'primary',
    lower(trim(p_google_email)),
    v_secret_id,
    p_scope,
    'connected',
    p_connected_by,
    now(),
    now(),
    null
  )
  on conflict (id) do update set
    google_email = excluded.google_email,
    vault_secret_id = excluded.vault_secret_id,
    scope = excluded.scope,
    status = 'connected',
    connected_by_clerk_user_id = excluded.connected_by_clerk_user_id,
    connected_at = now(),
    updated_at = now(),
    last_error = null;

  return v_secret_id;
end;
$$;

create or replace function public.mls_get_gmail_refresh_token()
returns text
language sql
security definer
set search_path = public, vault
stable
as $$
  select decrypted_secret
  from vault.decrypted_secrets secret
  join public.gmail_integrations integration
    on integration.vault_secret_id = secret.id
  where integration.id = 'primary'
    and integration.status = 'connected'
  limit 1;
$$;

create or replace function public.mls_delete_gmail_refresh_token()
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  select vault_secret_id
    into v_secret_id
  from public.gmail_integrations
  where id = 'primary';

  delete from public.gmail_integrations where id = 'primary';
  if v_secret_id is not null then
    delete from vault.secrets where id = v_secret_id;
  end if;
end;
$$;

revoke all on function public.mls_store_gmail_refresh_token(text,text,text,text) from public, anon, authenticated;
revoke all on function public.mls_get_gmail_refresh_token() from public, anon, authenticated;
revoke all on function public.mls_delete_gmail_refresh_token() from public, anon, authenticated;

grant execute on function public.mls_store_gmail_refresh_token(text,text,text,text) to service_role;
grant execute on function public.mls_get_gmail_refresh_token() to service_role;
grant execute on function public.mls_delete_gmail_refresh_token() to service_role;
