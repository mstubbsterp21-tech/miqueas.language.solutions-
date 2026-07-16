alter table public.clients
  alter column clerk_user_id drop not null;

alter table public.clients
  add column if not exists physical_address_text text,
  add column if not exists billing_address_text text;

create index if not exists clients_unlinked_email_idx
  on public.clients (lower(email))
  where clerk_user_id is null;

comment on column public.clients.clerk_user_id is
  'Clerk account linked to the client. Null means MLS created the client before portal activation.';

comment on column public.clients.physical_address_text is
  'Complete physical address captured by the Interpreter Request form.';

comment on column public.clients.billing_address_text is
  'Complete billing address captured by the Interpreter Request form.';
