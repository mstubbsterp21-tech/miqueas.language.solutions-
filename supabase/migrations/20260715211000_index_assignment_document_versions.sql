create index if not exists assignment_documents_supersedes_idx
  on public.assignment_documents (supersedes_document_id)
  where supersedes_document_id is not null;
