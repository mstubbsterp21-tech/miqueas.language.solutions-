create table if not exists public.assignment_agreements (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.assignments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  template_name text not null default 'Interpreting Services Agreement',
  terms_version text not null default '2026-07',
  status text not null default 'draft' check (status in ('draft','sent','signed','declined','expired','void')),
  document_url text,
  drive_file_id text,
  signer_name text,
  signer_email text,
  signature_acknowledgement text,
  sent_at timestamptz,
  signed_at timestamptz,
  declined_at timestamptz,
  expires_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assignment_agreements_client_idx on public.assignment_agreements(client_id, created_at desc);
create index if not exists assignment_agreements_status_idx on public.assignment_agreements(status, expires_at);

alter table public.assignment_agreements enable row level security;
revoke all on public.assignment_agreements from anon, authenticated;
