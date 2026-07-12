create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  organization_name text,
  primary_contact_name text,
  email text not null,
  phone text,
  preferred_contact_method text,
  billing_email text,
  billing_phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text default 'United States',
  industry text,
  default_service_type text,
  default_delivery_mode text,
  communication_preferences text,
  billing_notes text,
  onboarding_complete boolean not null default false,
  account_status text not null default 'active' check (account_status in ('active','on_hold','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  status text not null default 'uploaded' check (status in ('requested','uploaded','under_review','approved','rejected','expired')),
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  requested_by_clerk_user_id text not null,
  service_type text not null,
  delivery_mode text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  timezone text not null default 'America/New_York',
  location_name text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  meeting_link text,
  deaf_participants integer,
  hearing_participants integer,
  language_preferences text,
  specialty text,
  team_requested boolean not null default false,
  cdi_requested boolean not null default false,
  onsite_contact_name text,
  onsite_contact_phone text,
  description text,
  preparation_materials text,
  purchase_order_number text,
  client_reference text,
  status text not null default 'pending_confirmation' check (status in ('draft','pending_confirmation','confirmed','completed','cancelled')),
  payment_status text not null default 'not_invoiced' check (payment_status in ('not_invoiced','pending_payment','paid','void')),
  confirmed_at timestamptz,
  completed_at timestamptz,
  invoice_number text,
  invoice_amount numeric(12,2),
  paid_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_requests (
  id uuid primary key default gen_random_uuid(),
  audience_type text not null check (audience_type in ('client','interpreter')),
  client_id uuid references public.clients(id) on delete cascade,
  interpreter_id uuid references public.interpreters(id) on delete cascade,
  document_type text not null,
  title text not null,
  instructions text,
  due_date date,
  status text not null default 'requested' check (status in ('requested','viewed','fulfilled','waived','overdue')),
  created_by text not null,
  fulfilled_document_id uuid,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_request_owner_check check (
    (audience_type = 'client' and client_id is not null and interpreter_id is null)
    or (audience_type = 'interpreter' and interpreter_id is not null and client_id is null)
  )
);

create table if not exists public.portal_preferences (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  default_portal text not null default 'interpreter' check (default_portal in ('admin','client','interpreter')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_clerk_user_id_idx on public.clients(clerk_user_id);
create index if not exists client_documents_client_id_idx on public.client_documents(client_id);
create unique index if not exists client_documents_current_type_idx on public.client_documents(client_id, document_type);
create index if not exists assignments_client_id_idx on public.assignments(client_id);
create index if not exists assignments_status_start_idx on public.assignments(status, start_at);
create index if not exists assignments_payment_status_idx on public.assignments(payment_status);
create index if not exists document_requests_client_id_idx on public.document_requests(client_id) where client_id is not null;
create index if not exists document_requests_interpreter_id_idx on public.document_requests(interpreter_id) where interpreter_id is not null;
create index if not exists document_requests_status_idx on public.document_requests(status, due_date);

alter table public.clients enable row level security;
alter table public.client_documents enable row level security;
alter table public.assignments enable row level security;
alter table public.document_requests enable row level security;
alter table public.portal_preferences enable row level security;

revoke all on public.clients from anon, authenticated;
revoke all on public.client_documents from anon, authenticated;
revoke all on public.assignments from anon, authenticated;
revoke all on public.document_requests from anon, authenticated;
revoke all on public.portal_preferences from anon, authenticated;
