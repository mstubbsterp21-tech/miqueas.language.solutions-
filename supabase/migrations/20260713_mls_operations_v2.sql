create extension if not exists pgcrypto;

alter table public.assignments
  add column if not exists lifecycle_status text not null default 'request_received',
  add column if not exists quote_status text not null default 'not_started',
  add column if not exists agreement_status text not null default 'not_started',
  add column if not exists deposit_required boolean not null default false,
  add column if not exists deposit_amount numeric(12,2),
  add column if not exists deposit_status text not null default 'not_required',
  add column if not exists deposit_paid_at timestamptz,
  add column if not exists actual_start_at timestamptz,
  add column if not exists actual_end_at timestamptz,
  add column if not exists client_verified_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists cancellation_fee numeric(12,2),
  add column if not exists cancellation_reason text,
  add column if not exists required_interpreter_count integer not null default 1,
  add column if not exists required_cdi_count integer not null default 0,
  add column if not exists preparation_due_at timestamptz,
  add column if not exists recurring_group_id uuid,
  add column if not exists recurrence_rule text,
  add column if not exists priority text not null default 'standard';

alter table public.assignments drop constraint if exists assignments_lifecycle_status_check;
alter table public.assignments add constraint assignments_lifecycle_status_check check (
  lifecycle_status in (
    'request_received','needs_review','quote_sent','client_approved','deposit_pending',
    'staffing','interpreter_invited','interpreter_accepted','confirmed','in_progress',
    'time_submitted','client_verified','invoice_sent','paid','closed','cancelled'
  )
);
alter table public.assignments drop constraint if exists assignments_quote_status_check;
alter table public.assignments add constraint assignments_quote_status_check check (
  quote_status in ('not_started','draft','sent','approved','changes_requested','rejected','expired')
);
alter table public.assignments drop constraint if exists assignments_agreement_status_check;
alter table public.assignments add constraint assignments_agreement_status_check check (
  agreement_status in ('not_started','draft','sent','signed','declined','expired')
);
alter table public.assignments drop constraint if exists assignments_deposit_status_check;
alter table public.assignments add constraint assignments_deposit_status_check check (
  deposit_status in ('not_required','pending','partially_paid','paid','refunded','forfeited')
);
alter table public.assignments drop constraint if exists assignments_priority_check;
alter table public.assignments add constraint assignments_priority_check check (
  priority in ('standard','rush','emergency')
);
alter table public.assignments drop constraint if exists assignments_required_interpreter_count_check;
alter table public.assignments add constraint assignments_required_interpreter_count_check check (required_interpreter_count >= 1 and required_interpreter_count <= 20);
alter table public.assignments drop constraint if exists assignments_required_cdi_count_check;
alter table public.assignments add constraint assignments_required_cdi_count_check check (required_cdi_count >= 0 and required_cdi_count <= 10);

update public.assignments
set lifecycle_status = case
  when status = 'cancelled' then 'cancelled'
  when payment_status = 'paid' then 'paid'
  when status = 'completed' then 'time_submitted'
  when status = 'confirmed' then 'confirmed'
  when status = 'pending_confirmation' then 'needs_review'
  else lifecycle_status
end
where lifecycle_status = 'request_received';

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.assignments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  quote_number text not null unique,
  status text not null default 'draft' check (status in ('draft','sent','approved','changes_requested','rejected','expired','void')),
  currency text not null default 'USD',
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  expires_at timestamptz,
  terms text,
  client_note text,
  admin_note text,
  created_by text not null,
  sent_at timestamptz,
  responded_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  item_type text not null default 'service' check (item_type in ('service','minimum','differential','rush','travel','preparation','deposit','discount','other')),
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_rate numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  invoice_number text not null unique,
  status text not null default 'draft' check (status in ('draft','sent','partially_paid','paid','overdue','void','refunded')),
  currency text not null default 'USD',
  issue_date date not null default current_date,
  due_date date not null default (current_date + 30),
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  credit_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  payment_link text,
  memo text,
  sent_at timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  item_type text not null default 'service' check (item_type in ('service','minimum','differential','rush','travel','preparation','cancellation','expense','credit','other')),
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_rate numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD',
  payment_type text not null default 'invoice' check (payment_type in ('deposit','invoice','refund','credit')),
  method text,
  provider text,
  provider_reference text,
  status text not null default 'succeeded' check (status in ('pending','succeeded','failed','refunded','void')),
  paid_at timestamptz not null default now(),
  notes text,
  recorded_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  assignment_interpreter_id uuid references public.assignment_interpreters(id) on delete set null,
  interpreter_id uuid not null references public.interpreters(id) on delete cascade,
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  break_minutes integer not null default 0,
  billable_hours numeric(8,2),
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected','client_verified','paid')),
  interpreter_notes text,
  admin_notes text,
  submitted_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  client_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, interpreter_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  interpreter_id uuid not null references public.interpreters(id) on delete cascade,
  expense_type text not null check (expense_type in ('mileage','parking','toll','airfare','lodging','per_diem','rideshare','supplies','other')),
  description text,
  amount numeric(12,2) not null default 0,
  mileage numeric(10,2),
  receipt_storage_path text,
  status text not null default 'submitted' check (status in ('draft','submitted','approved','rejected','reimbursed','billed')),
  submitted_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interpreter_credentials (
  id uuid primary key default gen_random_uuid(),
  interpreter_id uuid not null references public.interpreters(id) on delete cascade,
  credential_type text not null,
  credential_name text not null,
  credential_number text,
  issuer text,
  issued_on date,
  expires_on date,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','expired','waived')),
  document_id uuid references public.interpreter_documents(id) on delete set null,
  verified_by text,
  verified_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interpreter_availability (
  id uuid primary key default gen_random_uuid(),
  interpreter_id uuid not null references public.interpreters(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  availability_type text not null default 'available' check (availability_type in ('available','preferred','unavailable','tentative')),
  recurrence_rule text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table if not exists public.interpreter_onboarding (
  id uuid primary key default gen_random_uuid(),
  interpreter_id uuid not null unique references public.interpreters(id) on delete cascade,
  stage text not null default 'application' check (stage in ('application','document_review','ethics_screening','performance_screening','interview','agreement','compliance','approved','active','on_hold','declined')),
  status text not null default 'active' check (status in ('active','waiting','completed','declined','on_hold')),
  assigned_reviewer text,
  due_date date,
  score numeric(6,2),
  recommendation text,
  notes text,
  last_contact_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_roles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  role text not null check (role in ('owner','admin','scheduler','finance','evaluator','read_only')),
  permissions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_clerk_user_id text,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assignments_lifecycle_start_idx on public.assignments(lifecycle_status, start_at);
create index if not exists quotes_status_idx on public.quotes(status, created_at desc);
create index if not exists quotes_client_idx on public.quotes(client_id, created_at desc);
create index if not exists quote_items_quote_idx on public.quote_items(quote_id, sort_order);
create index if not exists invoices_status_due_idx on public.invoices(status, due_date);
create index if not exists invoices_client_idx on public.invoices(client_id, created_at desc);
create index if not exists invoice_items_invoice_idx on public.invoice_items(invoice_id, sort_order);
create index if not exists payments_invoice_idx on public.payments(invoice_id, paid_at desc);
create index if not exists time_entries_interpreter_idx on public.time_entries(interpreter_id, status, created_at desc);
create index if not exists time_entries_assignment_idx on public.time_entries(assignment_id);
create index if not exists expenses_interpreter_idx on public.expenses(interpreter_id, status, created_at desc);
create index if not exists expenses_assignment_idx on public.expenses(assignment_id);
create index if not exists interpreter_credentials_expiry_idx on public.interpreter_credentials(expires_on, verification_status);
create index if not exists interpreter_availability_range_idx on public.interpreter_availability(interpreter_id, start_at, end_at);
create index if not exists interpreter_onboarding_stage_idx on public.interpreter_onboarding(stage, status, due_date);
create index if not exists audit_events_entity_idx on public.audit_events(entity_type, entity_id, created_at desc);
create index if not exists audit_events_actor_idx on public.audit_events(actor_clerk_user_id, created_at desc);

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.time_entries enable row level security;
alter table public.expenses enable row level security;
alter table public.interpreter_credentials enable row level security;
alter table public.interpreter_availability enable row level security;
alter table public.interpreter_onboarding enable row level security;
alter table public.staff_roles enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.quotes from anon, authenticated;
revoke all on public.quote_items from anon, authenticated;
revoke all on public.invoices from anon, authenticated;
revoke all on public.invoice_items from anon, authenticated;
revoke all on public.payments from anon, authenticated;
revoke all on public.time_entries from anon, authenticated;
revoke all on public.expenses from anon, authenticated;
revoke all on public.interpreter_credentials from anon, authenticated;
revoke all on public.interpreter_availability from anon, authenticated;
revoke all on public.interpreter_onboarding from anon, authenticated;
revoke all on public.staff_roles from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;
