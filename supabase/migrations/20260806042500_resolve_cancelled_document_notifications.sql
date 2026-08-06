update public.notifications as notification
set
  is_read = true,
  read_at = coalesce(notification.read_at, now())
from public.document_requests as request
where notification.related_type = 'document_request'
  and notification.related_id = request.id
  and request.status = 'cancelled'
  and notification.is_read = false;
