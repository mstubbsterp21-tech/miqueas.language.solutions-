alter table public.portal_communication_attachments
  drop constraint if exists portal_communication_attachments_uploader_path_check;

alter table public.portal_communication_attachments
  add constraint portal_communication_attachments_uploader_path_check check (
    split_part(storage_path, '/', 2) = uploaded_by_clerk_user_id
    and (
      (direct_message_id is not null and split_part(storage_path, '/', 1) = 'messages')
      or
      (announcement_id is not null and split_part(storage_path, '/', 1) = 'announcements')
    )
  );
