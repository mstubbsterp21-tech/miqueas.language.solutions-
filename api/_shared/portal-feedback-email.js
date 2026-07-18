import { brandedPortalEmail } from "./branded-email.js";
import { getGmailStatus, sendGmailEmail } from "./gmail-oauth.js";

export const portalFeedbackLabel = "MLS Portal Feedback";

const requestTypeLabels = {
  request_new_feature: "Request New Feature",
  update_existing_feature: "Update Existing Feature",
  remove_existing_feature: "Remove Existing Feature",
};

export async function deliverPortalFeedback(db, feedback) {
  const gmail = await getGmailStatus(db);
  const recipient = gmail.sender;
  if (!recipient) {
    return { sent: false, status: "failed", error: "The MLS Gmail recipient is not configured." };
  }

  const requestType = requestTypeLabels[feedback.request_type] || feedback.request_type;
  const submittedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(feedback.created_at));
  const sender = feedback.user_name || feedback.user_email || "MLS Portal user";
  const copy = brandedPortalEmail({
    heading: "New MLS Portal feedback",
    greeting: "Hello MLS Team,",
    intro: `${sender} submitted a portal product recommendation. A secure copy is also stored in MLS Portal.`,
    bodyText: feedback.comments,
    details: [
      ["Request", requestType],
      ["Category", feedback.category],
      ["Portal role", feedback.role],
      ["Submitted by", sender],
      ["User email", feedback.user_email || "Not available"],
      ["Submitted", submittedAt],
      ["Reference", feedback.id],
    ],
    buttonLabel: "Open Feedback",
    buttonUrl: "https://miqueaslanguagesolutions.com/portal?section=feedback",
    footerNote: `Filed under the ${portalFeedbackLabel} Gmail label.`,
  });
  const subject = `[MLS Portal Feedback] ${requestType} · ${feedback.category}`;
  const knownLabel = await db.from("portal_feedback")
    .select("gmail_label_id")
    .not("gmail_label_id", "is", null)
    .order("emailed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const delivery = await sendGmailEmail(db, {
    to: recipient,
    subject,
    ...copy,
    labelName: portalFeedbackLabel,
    labelIdHint: knownLabel.data?.gmail_label_id || null,
  });

  const deliveryStatus = delivery.sent
    ? (delivery.labeled ? "sent" : "sent_unfiled")
    : "failed";
  const updated = await db.from("portal_feedback").update({
    gmail_delivery_status: deliveryStatus,
    gmail_message_id: delivery.messageId || null,
    gmail_thread_id: delivery.threadId || null,
    gmail_label_id: delivery.labelId || null,
    gmail_delivery_error: delivery.error || null,
    emailed_at: delivery.sent ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", feedback.id);
  if (updated.error) throw updated.error;
  return { ...delivery, to: recipient };
}

export async function flushPendingPortalFeedback(db, limit = 25) {
  const pending = await db.from("portal_feedback")
    .select("*")
    .in("gmail_delivery_status", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(limit);
  if (pending.error) {
    if (pending.error.code === "42P01") return { delivered: 0, failed: 0 };
    throw pending.error;
  }

  let delivered = 0;
  let failed = 0;
  for (const feedback of pending.data || []) {
    try {
      const result = await deliverPortalFeedback(db, feedback);
      result.sent && result.labeled ? delivered += 1 : failed += 1;
    } catch (error) {
      failed += 1;
      await db.from("portal_feedback").update({
        gmail_delivery_status: "failed",
        gmail_delivery_error: error.message || "Gmail feedback delivery failed.",
        updated_at: new Date().toISOString(),
      }).eq("id", feedback.id);
    }
  }
  return { delivered, failed };
}
