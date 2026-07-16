alter table public.assignments
  add column if not exists request_source text,
  add column if not exists request_form_version integer,
  add column if not exists request_form_data jsonb not null default '{}'::jsonb;

create index if not exists assignments_request_source_idx
  on public.assignments(request_source)
  where request_source is not null;

comment on column public.assignments.request_source is
  'Source that created the assignment request, such as public_website, client_portal, or admin_portal.';

comment on column public.assignments.request_form_version is
  'Version of the shared MLS Interpreter Request form used for this assignment.';

comment on column public.assignments.request_form_data is
  'Complete submitted Interpreter Request form payload retained for staffing, preparation, billing, and audit context.';
