create table if not exists public.profile_customizations (
  id uuid primary key default gen_random_uuid(),
  profile_type text not null check (profile_type in ('client', 'interpreter')),
  client_id uuid references public.clients(id) on delete cascade,
  interpreter_id uuid references public.interpreters(id) on delete cascade,
  clerk_user_id text not null,
  display_name text,
  headline text check (headline is null or char_length(headline) <= 160),
  bio text check (bio is null or char_length(bio) <= 2000),
  location_label text,
  website_url text,
  theme_primary text not null default '#721100' check (theme_primary ~ '^#[0-9A-Fa-f]{6}$'),
  theme_secondary text not null default '#24130e' check (theme_secondary ~ '^#[0-9A-Fa-f]{6}$'),
  theme_accent text not null default '#dd7d00' check (theme_accent ~ '^#[0-9A-Fa-f]{6}$'),
  background_style text not null default 'soft' check (background_style in ('soft', 'clean', 'gradient', 'dark')),
  card_style text not null default 'rounded' check (card_style in ('rounded', 'glass', 'flat')),
  section_layout jsonb not null default '[]'::jsonb,
  section_visibility jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '[]'::jsonb,
  avatar_path text,
  banner_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_customizations_owner_check check (
    (profile_type = 'client' and client_id is not null and interpreter_id is null)
    or
    (profile_type = 'interpreter' and interpreter_id is not null and client_id is null)
  ),
  constraint profile_customizations_client_unique unique (client_id),
  constraint profile_customizations_interpreter_unique unique (interpreter_id)
);

create index if not exists profile_customizations_clerk_user_idx
  on public.profile_customizations (clerk_user_id);

alter table public.profile_customizations enable row level security;
revoke all on table public.profile_customizations from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
