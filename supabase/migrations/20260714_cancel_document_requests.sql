alter table public.document_requests
  add column if not exists cancelled_by text,
  add column if not exists cancelled_by_email text,
  add column if not exists cancelled_at timestamptz;

alter table public.document_requests
  drop constraint if exists document_requests_status_check;

alter table public.document_requests
  add constraint document_requests_status_check
  check (status in ('requested','viewed','fulfilled','waived','overdue','cancelled'));

create or replace function public.prevent_cancelled_document_request_upload()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  latest_request_status text;
begin
  if tg_table_name = 'client_documents' then
    select request.status
      into latest_request_status
      from public.document_requests request
     where request.client_id = new.client_id
       and request.document_type = new.document_type
     order by request.created_at desc
     limit 1;
  elsif tg_table_name = 'interpreter_documents' then
    select request.status
      into latest_request_status
      from public.document_requests request
     where request.interpreter_id = new.interpreter_id
       and request.document_type = new.document_type
     order by request.created_at desc
     limit 1;
  end if;

  if latest_request_status = 'cancelled' then
    raise exception 'This document request was cancelled. Ask MLS to create a new request before uploading.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_cancelled_document_request_upload() from public, anon, authenticated;

drop trigger if exists prevent_cancelled_client_document_upload on public.client_documents;
create trigger prevent_cancelled_client_document_upload
before insert or update on public.client_documents
for each row execute function public.prevent_cancelled_document_request_upload();

drop trigger if exists prevent_cancelled_interpreter_document_upload on public.interpreter_documents;
create trigger prevent_cancelled_interpreter_document_upload
before insert or update on public.interpreter_documents
for each row execute function public.prevent_cancelled_document_request_upload();
