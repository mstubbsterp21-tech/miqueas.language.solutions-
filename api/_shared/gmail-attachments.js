import crypto from "node:crypto";
import { getGoogleWorkspaceAccessToken, gmailScope } from "./gmail-oauth.js";

const senderEmail = String(process.env.GOOGLE_GMAIL_SENDER || "").trim().toLowerCase();
const senderName = process.env.EMAIL_FROM_NAME || "Miqueas Language Solutions";
const maxAttachmentBytes = 18 * 1024 * 1024;

function encodeHeader(value) {
  const text = String(value || "");
  return /^[\x20-\x7E]*$/.test(text) ? text : `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

function wrapBase64(value) {
  return String(value || "").replace(/(.{76})/g, "$1\r\n");
}

function safeFileName(value) {
  return String(value || "attachment").replace(/[\r\n"]/g, "-").slice(0, 140);
}

function attachmentSize(attachment) {
  const content = Buffer.isBuffer(attachment?.content) ? attachment.content : Buffer.from(attachment?.content || "");
  return content.byteLength;
}

function buildRawMessage({ to, subject, text, html, attachments = [] }) {
  const messageId = `<${crypto.randomUUID()}@miqueaslanguagesolutions.com>`;
  const mixedBoundary = `mls_mixed_${crypto.randomUUID().replaceAll("-", "")}`;
  const alternativeBoundary = `mls_alt_${crypto.randomUUID().replaceAll("-", "")}`;
  const lines = [
    `From: ${encodeHeader(senderName)} <${senderEmail}>`,
    `To: ${to}`,
    `Reply-To: ${senderEmail}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    "",
    `--${alternativeBoundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text || "",
    "",
    `--${alternativeBoundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html || "",
    "",
    `--${alternativeBoundary}--`,
  ];
  attachments.forEach((attachment) => {
    const fileName = safeFileName(attachment.filename);
    const content = Buffer.isBuffer(attachment.content) ? attachment.content : Buffer.from(attachment.content || "");
    lines.push(
      `--${mixedBoundary}`,
      `Content-Type: ${attachment.contentType || "application/octet-stream"}; name="${fileName}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${fileName}"`,
      "",
      wrapBase64(content.toString("base64")),
      "",
    );
  });
  lines.push(`--${mixedBoundary}--`);
  return { raw: Buffer.from(lines.join("\r\n"), "utf8").toString("base64url"), messageId };
}

export async function sendGmailEmailWithAttachments(db, { to, subject, text, html, attachments = [], threadId = null }) {
  const recipient = String(to || "").trim().toLowerCase();
  if (!recipient) return { sent: false, status: "skipped", error: "Recipient email is unavailable." };
  if (recipient === senderEmail) return { sent: false, status: "skipped", error: "The sending admin is excluded from their own announcement email." };
  const totalAttachmentBytes = attachments.reduce((sum, attachment) => sum + attachmentSize(attachment), 0);
  if (totalAttachmentBytes > maxAttachmentBytes) {
    return { sent: false, status: "failed", error: "Email attachments must total 18 MB or less. The portal message and files are still available inside MLS Portal." };
  }
  const access = await getGoogleWorkspaceAccessToken(db, [gmailScope]);
  if (!access.accessToken) return { sent: false, status: access.status || "failed", error: access.error || "Gmail access is unavailable." };
  if (!senderEmail) return { sent: false, status: "not_configured", error: "GOOGLE_GMAIL_SENDER is not configured." };
  const message = buildRawMessage({ to: recipient, subject, text, html, attachments });
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { authorization: `Bearer ${access.accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ raw: message.raw, ...(threadId ? { threadId } : {}) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) {
    const error = data.error?.message || "Gmail could not send the message with attachments.";
    await db.from("gmail_integrations").update({ last_error: error, updated_at: new Date().toISOString() }).eq("id", "primary");
    return { sent: false, status: "failed", error };
  }
  await db.from("gmail_integrations").update({ status: "connected", last_error: null, updated_at: new Date().toISOString() }).eq("id", "primary");
  return { sent: true, status: "sent", messageId: data.id, threadId: data.threadId || null, rfcMessageId: message.messageId };
}
