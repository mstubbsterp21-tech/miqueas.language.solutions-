create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  last_used_at timestamptz,
  last_error text,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_active_idx
  on public.push_subscriptions (clerk_user_id, is_active)
  where is_active = true;

alter table public.push_subscriptions enable row level security;

revoke all on table public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on table public.push_subscriptions to service_role;

comment on table public.push_subscriptions is
  'Server-managed Web Push subscriptions for MLS portal users. Endpoint keys are never exposed through the client Data API.';

create table if not exists public.push_configuration (
  id boolean primary key default true check (id = true),
  public_key text not null,
  private_key text not null,
  subject text not null default 'mailto:m.stubbs@miqueaslanguagesolutions.com',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_configuration enable row level security;
revoke all on table public.push_configuration from anon, authenticated;
grant select, insert, update, delete on table public.push_configuration to service_role;

comment on table public.push_configuration is
  'Server-only VAPID credentials. Private keys must never be returned to portal clients.';
