alter table public.invoices
  add column if not exists external_system text not null default 'found',
  add column if not exists found_invoice_id text,
  add column if not exists found_invoice_url text,
  add column if not exists found_status text,
  add column if not exists found_synced_at timestamptz,
  add column if not exists sync_status text not null default 'not_linked';

alter table public.invoices drop constraint if exists invoices_external_system_check;
alter table public.invoices add constraint invoices_external_system_check check (external_system in ('found','manual'));
alter table public.invoices drop constraint if exists invoices_sync_status_check;
alter table public.invoices add constraint invoices_sync_status_check check (sync_status in ('not_linked','linked','needs_review','synced','error'));

alter table public.payments
  add column if not exists found_transaction_id text,
  add column if not exists found_transaction_url text,
  add column if not exists found_synced_at timestamptz;

alter table public.assignment_interpreters
  add column if not exists found_contractor_id text,
  add column if not exists found_payment_id text,
  add column if not exists found_payment_url text,
  add column if not exists contractor_payment_status text not null default 'not_ready',
  add column if not exists contractor_payment_amount numeric(12,2),
  add column if not exists contractor_payment_due_date date,
  add column if not exists contractor_paid_at timestamptz;

alter table public.assignment_interpreters drop constraint if exists assignment_interpreters_contractor_payment_status_check;
alter table public.assignment_interpreters add constraint assignment_interpreters_contractor_payment_status_check check (
  contractor_payment_status in ('not_ready','ready','scheduled','processing','paid','failed','void')
);

alter table public.assignment_agreements
  add column if not exists provider text not null default 'boldsign',
  add column if not exists boldsign_document_id text,
  add column if not exists boldsign_template_id text,
  add column if not exists boldsign_sender_identity text,
  add column if not exists boldsign_signing_url text,
  add column if not exists boldsign_audit_trail_url text,
  add column if not exists boldsign_status text,
  add column if not exists boldsign_last_event text,
  add column if not exists boldsign_last_event_at timestamptz,
  add column if not exists provider_payload jsonb not null default '{}'::jsonb;

alter table public.assignment_agreements drop constraint if exists assignment_agreements_provider_check;
alter table public.assignment_agreements add constraint assignment_agreements_provider_check check (provider in ('boldsign','manual'));

create table if not exists public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  integration_key text not null unique check (integration_key in ('found','boldsign','google_drive')),
  is_enabled boolean not null default false,
  environment text not null default 'production' check (environment in ('sandbox','production')),
  configuration jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.integration_settings (integration_key, is_enabled, environment, configuration)
values
  ('found', true, 'production', '{"mode":"reference_and_manual_sync","source_of_truth":true}'::jsonb),
  ('boldsign', false, 'sandbox', '{"mode":"api","source_of_truth":true}'::jsonb),
  ('google_drive', false, 'production', '{"mode":"archive"}'::jsonb)
on conflict (integration_key) do nothing;

create index if not exists invoices_found_invoice_id_idx on public.invoices(found_invoice_id) where found_invoice_id is not null;
create index if not exists payments_found_transaction_id_idx on public.payments(found_transaction_id) where found_transaction_id is not null;
create index if not exists assignment_agreements_boldsign_document_id_idx on public.assignment_agreements(boldsign_document_id) where boldsign_document_id is not null;
create index if not exists assignment_interpreters_found_payment_id_idx on public.assignment_interpreters(found_payment_id) where found_payment_id is not null;

alter table public.integration_settings enable row level security;
revoke all on public.integration_settings from anon, authenticated;
