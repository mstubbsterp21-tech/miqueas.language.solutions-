create index if not exists client_feedback_assignment_id_idx
  on public.client_feedback(assignment_id)
  where assignment_id is not null;

create index if not exists interpreter_credentials_interpreter_id_idx
  on public.interpreter_credentials(interpreter_id);

create index if not exists interpreter_credentials_document_id_idx
  on public.interpreter_credentials(document_id)
  where document_id is not null;

create index if not exists invoices_assignment_id_idx
  on public.invoices(assignment_id);

create index if not exists invoices_quote_id_idx
  on public.invoices(quote_id)
  where quote_id is not null;

create index if not exists time_entries_assignment_interpreter_id_idx
  on public.time_entries(assignment_interpreter_id)
  where assignment_interpreter_id is not null;
