create table if not exists public.portal_layout_preferences (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  role text not null check (role in ('admin', 'client', 'interpreter')),
  nav_order text[] not null default '{}',
  home_order text[] not null default '{}',
  hidden_home_sections text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clerk_user_id, role)
);

alter table public.portal_layout_preferences enable row level security;
revoke all on table public.portal_layout_preferences from anon, authenticated;
grant select, insert, update, delete on table public.portal_layout_preferences to service_role;

comment on table public.portal_layout_preferences is
  'Server-managed, per-user and per-role navigation and dashboard layout preferences.';
