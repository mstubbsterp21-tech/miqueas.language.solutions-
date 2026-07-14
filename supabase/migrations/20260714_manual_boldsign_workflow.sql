alter table public.assignment_agreements
  add column if not exists completed_document_id uuid references public.client_documents(id) on delete set null,
  add column if not exists audit_trail_document_id uuid references public.client_documents(id) on delete set null,
  add column if not exists internal_notes text,
  add column if not exists manual_workflow boolean not null default true,
  add column if not exists manual_status_updated_at timestamptz,
  add column if not exists manual_status_updated_by text;

alter table public.assignment_agreements
  drop constraint if exists assignment_agreements_status_check;

alter table public.assignment_agreements
  add constraint assignment_agreements_status_check check (
    status in ('draft','sent','viewed','signed','declined','expired','void','voided')
  );

alter table public.assignments
  drop constraint if exists assignments_agreement_status_check;

alter table public.assignments
  add constraint assignments_agreement_status_check check (
    agreement_status in ('not_started','draft','sent','viewed','signed','declined','expired','void','voided')
  );

update public.assignment_agreements
set manual_workflow = true,
    provider = 'boldsign'
where manual_workflow is distinct from true;

update public.integration_settings
set is_enabled = true,
    environment = 'production',
    configuration = '{"mode":"manual","source_of_truth":true,"api_required":false,"status_updates":"admin_entered"}'::jsonb,
    last_error = null,
    updated_at = now()
where integration_key = 'boldsign';

create index if not exists assignment_agreements_completed_document_id_idx
  on public.assignment_agreements(completed_document_id)
  where completed_document_id is not null;

create index if not exists assignment_agreements_audit_trail_document_id_idx
  on public.assignment_agreements(audit_trail_document_id)
  where audit_trail_document_id is not null;
