import { audit, database, readBody, send, signedInUser } from "./_shared/ops-v2-core.js";
import {
  calculateNextReminder,
  createDocumentRequestEmail,
} from "./_shared/document-request-email.js";
import { getGmailStatus, sendGmailEmail } from "./_shared/gmail-oauth.js";

async function loadRequest(db, requestId) {
  const request = await db.from("document_requests").select("*").eq("id", requestId).maybeSingle();
  if (request.error) throw request.error;
  if (!request.data) return null;

  const table = request.data.audience_type === "client" ? "clients" : "interpreters";
  const ownerId = request.data.audience_type === "client" ? request.data.client_id : request.data.interpreter_id;
  const owner = await db.from(table).select("*").eq("id", ownerId).maybeSingle();
  if (owner.error) throw owner.error;
  if (!owner.data) return null;

  const name = request.data.audience_type === "client"
    ? owner.data.primary_contact_name || owner.data.organization_name || owner.data.email
    : `${owner.data.first_name || ""} ${owner.data.last_name || ""}`.trim() || owner.data.email;

  return {
    request: request.data,
    owner: {
      ...owner.data,
      name,
      email: owner.data.email,
      clerkUserId: owner.data.clerk_user_id,
    },
  };
}

async function writeEvent(db, values) {
  const result = await db.from("document_request_email_events").insert(values);
  if (result.error) throw result.error;
}

async function deliver(db, user, requestId, eventType) {
  const loaded = await loadRequest(db, requestId);
  if (!loaded) return { status: 404, payload: { error: "Document request or recipient was not found." } };
  const { request, owner } = loaded;
  if (request.status === "cancelled") {
    return { status: 409, payload: { error: "Cancelled document requests cannot send email or reminders.", request } };
  }
  const recipientEmail = request.recipient_email || owner.email;
  const recipientName = request.recipient_name || owner.name;

  if (!recipientEmail) {
    const now = new Date().toISOString();
    await db.from("document_requests").update({
      email_status: "failed",
      email_last_attempt_at: now,
      email_last_error: "Recipient email is missing.",
      recipient_name: recipientName,
      updated_at: now,
    }).eq("id", request.id);
    await writeEvent(db, {
      document_request_id: request.id,
      event_type: eventType,
      recipient_email: "missing",
      delivery_status: "failed",
      error_message: "Recipient email is missing.",
      triggered_by: user?.id || "cron",
    });
    return { status: 400, payload: { error: "The recipient does not have an email address." } };
  }

  const email = createDocumentRequestEmail({ ...request, recipient_email: recipientEmail, recipient_name: recipientName }, owner, eventType);
  const delivery = await sendGmailEmail(db, { to: recipientEmail, ...email });
  const now = new Date().toISOString();
  const isReminder = ["due_reminder", "overdue_reminder"].includes(eventType);
  const updates = {
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    email_status: delivery.status,
    email_last_attempt_at: now,
    email_last_error: delivery.error || null,
    email_message_id: delivery.messageId || request.email_message_id || null,
    updated_at: now,
  };

  if (delivery.sent) {
    if (!request.email_sent_at) updates.email_sent_at = now;
    if (isReminder) {
      updates.reminder_count = Number(request.reminder_count || 0) + 1;
      updates.last_reminder_at = now;
      updates.next_reminder_at = calculateNextReminder(request.due_date, eventType);
    } else {
      updates.next_reminder_at = calculateNextReminder(request.due_date, "initial");
    }
  }

  const update = await db.from("document_requests").update(updates).eq("id", request.id).select().single();
  if (update.error) throw update.error;

  await writeEvent(db, {
    document_request_id: request.id,
    event_type: eventType,
    recipient_email: recipientEmail,
    delivery_status: delivery.status,
    message_id: delivery.messageId || null,
    error_message: delivery.error || null,
    triggered_by: user?.id || "cron",
  });

  await audit(db, user || { id: "cron", metadataRole: "system", isAdmin: true }, {
    action: delivery.sent ? `document_request_email.${eventType}_sent` : `document_request_email.${delivery.status}`,
    entityType: "document_request",
    entityId: request.id,
    summary: `${request.title} · ${recipientEmail}`,
    after: update.data,
  });

  const gmail = await getGmailStatus(db);
  return {
    status: 200,
    payload: {
      sent: delivery.sent,
      configured: gmail.connected,
      provider: "gmail",
      emailStatus: delivery.status,
      error: delivery.error || null,
      request: update.data,
    },
  };
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    if (!user.isAdmin) return send(res, 403, { error: "Admin access required." });
    if (req.method !== "POST") return send(res, 405, { error: "Use POST for document-request email actions." });

    const db = database();
    const body = readBody(req);
    const action = String(req.query?.action || "send");
    if (!body.requestId) return send(res, 400, { error: "Document request ID is required." });

    const eventType = action === "resend" ? "manual_resend" : "initial";
    const result = await deliver(db, user, body.requestId, eventType);
    return send(res, result.status, result.payload);
  } catch (error) {
    console.error("MLS document request email error", error);
    return send(res, 500, { error: error.message || "The document-request email could not be sent." });
  }
}

export { deliver };
