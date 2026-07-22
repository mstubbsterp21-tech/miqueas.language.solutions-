create table if not exists public.contractor_invoices (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete restrict,
  assignment_interpreter_id uuid not null references public.assignment_interpreters(id) on delete restrict,
  interpreter_id uuid not null references public.interpreters(id) on delete restrict,
  invoice_number text not null,
  invoice_date date not null default current_date,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'submitted' check (status in ('draft','submitted','under_review','approved','scheduled_for_payment','paid','rejected','void')),
  storage_path text not null,
  file_name text not null,
  mime_type text,
  interpreter_notes text,
  admin_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  scheduled_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (interpreter_id, invoice_number)
);

create unique index if not exists contractor_invoices_assignment_interpreter_active_idx
  on public.contractor_invoices(assignment_interpreter_id)
  where status not in ('rejected', 'void');

create index if not exists contractor_invoices_assignment_idx on public.contractor_invoices(assignment_id);
create index if not exists contractor_invoices_interpreter_idx on public.contractor_invoices(interpreter_id, created_at desc);
create index if not exists contractor_invoices_status_idx on public.contractor_invoices(status, submitted_at);

alter table public.contractor_invoices enable row level security;
revoke all on public.contractor_invoices from anon, authenticated;
grant select, insert, update, delete on public.contractor_invoices to service_role;
