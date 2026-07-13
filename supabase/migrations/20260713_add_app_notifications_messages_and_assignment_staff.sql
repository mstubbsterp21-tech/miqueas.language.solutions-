create table if not exists public.assignment_interpreters (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  interpreter_id uuid not null references public.interpreters(id) on delete cascade,
  role text not null default 'interpreter' check (role in ('interpreter','team','cdi')),
  status text not null default 'assigned' check (status in ('invited','assigned','accepted','declined','completed','cancelled')),
  agreed_rate numeric,
  notes text,
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, interpreter_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_clerk_user_id text not null,
  category text not null default 'general',
  title text not null,
  body text,
  section text,
  related_type text,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.assignment_messages (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  sender_clerk_user_id text not null,
  sender_role text not null check (sender_role in ('admin','client','interpreter')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists assignment_interpreters_assignment_idx on public.assignment_interpreters(assignment_id);
create index if not exists assignment_interpreters_interpreter_idx on public.assignment_interpreters(interpreter_id);
create index if not exists notifications_recipient_idx on public.notifications(recipient_clerk_user_id, is_read, created_at desc);
create index if not exists assignment_messages_assignment_idx on public.assignment_messages(assignment_id, created_at);

alter table public.assignment_interpreters enable row level security;
alter table public.notifications enable row level security;
alter table public.assignment_messages enable row level security;

revoke all on public.assignment_interpreters from anon, authenticated;
revoke all on public.notifications from anon, authenticated;
revoke all on public.assignment_messages from anon, authenticated;
