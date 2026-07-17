import { sendGmailEmailWithAttachments } from "./gmail-attachments.js";
import { notify } from "./ops-v2-core.js";
import { loadCommunications } from "./ops-v2-communications.js";

const supportEmail = process.env.EMAIL_SUPPORT_ADDRESS || "m.stubbs@miqueaslanguagesolutions.com";
const supportPhone = process.env.EMAIL_SUPPORT_PHONE || "(321) 379-8010";
const portalBaseUrl = process.env.MLS_PORTAL_URL || "https://miqueaslanguagesolutions.com/portal";
const bucketName = "portal-communications";
const maxAttachments = 3;

function displayName(record, fallback = "MLS Portal user") {
  return record?.organization_name
    || [record?.first_name, record?.last_name].filter(Boolean).join(" ")
    || [record?.firstName, record?.lastName].filter(Boolean).join(" ")
    || record?.primary_contact_name
    || record?.email
    || fallback;
}

async function identityFor(db, user) {
  if (user.isAdmin) return { role: "admin", name: displayName(user, "MLS Admin") };
  const [clientResult, interpreterResult] = await Promise.all([
    db.from("clients").select("*").eq("clerk_user_id", user.id).maybeSingle(),
    db.from("interpreters").select("*").eq("clerk_user_id", user.id).maybeSingle(),
  ]);
  if (clientResult.error) throw clientResult.error;
  if (interpreterResult.error) throw interpreterResult.error;
  if (clientResult.data) return { role: "client", name: displayName(clientResult.data) };
  if (interpreterResult.data) return { role: "interpreter", name: displayName(interpreterResult.data) };
  return { role: user.metadataRole === "client" ? "client" : "interpreter", name: displayName(user) };
}

async function activeMembers(db, conversationId) {
  const result = await db
    .from("portal_conversation_members")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("left_at", null)
    .order("joined_at");
  if (result.error) throw result.error;
  return result.data || [];
}

function conversationLabel(conversation, members, viewerId = "") {
  const custom = String(conversation?.title || "").trim();
  if (custom) return custom;
  if (conversation?.conversation_type === "group") {
    return members.map((item) => item.display_name).filter(Boolean).slice(0, 3).join(", ") || "Group conversation";
  }
  return members.find((item) => item.clerk_user_id !== viewerId)?.display_name || "MLS conversation";
}

function sanitizeFileName(fileName) {
  return String(fileName || "attachment")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-140);
}

function normalizedAttachments(values) {
  return (Array.isArray(values) ? values : [])
    .slice(0, maxAttachments)
    .map((item) => ({
      storage_path: String(item.storagePath || ""),
      file_name: sanitizeFileName(item.fileName),
      mime_type: String(item.mimeType || "application/octet-stream"),
      file_size: Number(item.fileSize || 0),
    }))
    .filter((item) => item.storage_path && item.file_name);
}

async function emailAttachments(db, attachments) {
  const files = [];
  for (const item of attachments || []) {
    const downloaded = await db.storage.from(bucketName).download(item.storage_path);
    if (downloaded.error) continue;
    files.push({
      filename: item.file_name,
      contentType: item.mime_type || "application/octet-stream",
      content: Buffer.from(await downloaded.data.arrayBuffer()),
    });
  }
  return files;
}

function portalUrl(values = {}) {
  const url = new URL(portalBaseUrl);
  url.searchParams.set("section", "communications");
  Object.entries(values).forEach(([key, value]) => value && url.searchParams.set(key, value));
  return url.toString();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailCopy({ heading, intro, bodyText, buttonLabel, buttonUrl }) {
  const text = [
    "Hello,",
    "",
    intro,
    "",
    bodyText,
    "",
    `${buttonLabel}: ${buttonUrl}`,
    "",
    "Miqueas Language Solutions",
    supportEmail,
    supportPhone,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ef;font-family:Arial,sans-serif;color:#24130e"><div style="max-width:660px;margin:0 auto;padding:28px 14px"><div style="background:#24130e;color:#fff;padding:26px;border-radius:24px 24px 0 0"><div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#f6b34c">MLS Portal</div><h1 style="margin:10px 0 0;font-size:27px">${escapeHtml(heading)}</h1></div><div style="background:#fff;padding:28px;border-radius:0 0 24px 24px"><p style="font-size:15px;line-height:1.7;color:#51453f">${escapeHtml(intro)}</p><div style="white-space:pre-wrap;font-size:15px;line-height:1.7;background:#fffaf5;border:1px solid #eadfd8;border-radius:16px;padding:18px">${escapeHtml(bodyText)}</div><p style="text-align:center;margin:28px 0"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#721100;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:14px">${escapeHtml(buttonLabel)}</a></p><p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b625e">Miqueas Language Solutions<br>${escapeHtml(supportEmail)} · ${escapeHtml(supportPhone)}</p></div></div></body></html>`;
  return { text, html };
}

export async function loadCommunicationsWithMentions(db, user) {
  const result = await loadCommunications(db, user);
  const messageIds = (result.messages || []).map((item) => item.id);
  const mentionResult = messageIds.length
    ? await db.from("portal_message_mentions").select("*").in("direct_message_id", messageIds).order("created_at")
    : { data: [], error: null };
  if (mentionResult.error) throw mentionResult.error;
  const mentions = mentionResult.data || [];
  return {
    ...result,
    conversations: (result.conversations || []).map((conversation) => ({
      ...conversation,
      displayTitle: String(conversation.title || "").trim() || conversation.displayTitle,
    })),
    messages: (result.messages || []).map((message) => ({
      ...message,
      mentions: mentions.filter((item) => item.direct_message_id === message.id),
    })),
  };
}

export async function renamePortalConversation(db, user, payload = {}) {
  const conversationId = String(payload.conversationId || "").trim();
  const requestedTitle = String(payload.title || "").trim().replace(/\s+/g, " ");
  if (!conversationId) return { status: 400, payload: { error: "Conversation ID is required." } };
  if (requestedTitle.length > 120) return { status: 400, payload: { error: "Conversation names must be 120 characters or fewer." } };

  const conversationResult = await db.from("portal_conversations").select("*").eq("id", conversationId).maybeSingle();
  if (conversationResult.error) throw conversationResult.error;
  if (!conversationResult.data) return { status: 404, payload: { error: "Conversation not found." } };
  const members = await activeMembers(db, conversationId);
  if (!members.some((item) => item.clerk_user_id === user.id)) {
    return { status: 403, payload: { error: "You do not have access to rename that conversation." } };
  }

  const updateResult = await db
    .from("portal_conversations")
    .update({ title: requestedTitle || null, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .select()
    .single();
  if (updateResult.error) throw updateResult.error;

  const identity = await identityFor(db, user);
  const displayTitle = conversationLabel(updateResult.data, members, user.id);
  await Promise.all(members.filter((item) => item.clerk_user_id !== user.id).map((recipient) => notify(db, recipient.clerk_user_id, {
    category: "message",
    title: requestedTitle ? `Conversation renamed to ${requestedTitle}` : "Conversation name reset",
    body: `${identity.name} ${requestedTitle ? "renamed" : "reset the name of"} this conversation.`,
    section: "communications",
    relatedType: "conversation",
    relatedId: conversationId,
  })));

  return { status: 200, payload: { conversation: { ...updateResult.data, displayTitle } } };
}

export async function sendPortalMessageWithMentions(db, user, payload = {}) {
  const text = String(payload.message || payload.body || "").trim();
  const attachments = normalizedAttachments(payload.attachments);
  const submittedKey = String(payload.idempotencyKey || "").trim().slice(0, 160);
  const idempotencyKey = submittedKey ? `${user.id}:${submittedKey}` : null;
  if (!text && !attachments.length) return { status: 400, payload: { error: "Enter a message or attach a file." } };
  if (text.length > 4000) return { status: 400, payload: { error: "Messages must be 4,000 characters or fewer." } };

  const conversationResult = await db.from("portal_conversations").select("*").eq("id", payload.conversationId).maybeSingle();
  if (conversationResult.error) throw conversationResult.error;
  const conversation = conversationResult.data;
  if (!conversation) return { status: 404, payload: { error: "Conversation not found." } };

  const members = await activeMembers(db, conversation.id);
  const selfMember = members.find((item) => item.clerk_user_id === user.id);
  if (!selfMember) return { status: 403, payload: { error: "You do not have access to that conversation." } };
  const identity = await identityFor(db, user);
  if (identity.role !== selfMember.role && !user.isAdmin) {
    return { status: 403, payload: { error: "Conversation role does not match your account." } };
  }

  if (idempotencyKey) {
    const existing = await db.from("portal_direct_messages")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      if (existing.data.conversation_id !== conversation.id || existing.data.sender_clerk_user_id !== user.id) {
        return { status: 409, payload: { error: "That message submission key is already in use." } };
      }
      return { status: 200, payload: { message: existing.data, duplicate: true } };
    }
  }

  const requestedMentionIds = [...new Set((Array.isArray(payload.mentionClerkUserIds) ? payload.mentionClerkUserIds : [])
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== user.id))];
  const mentionedMembers = requestedMentionIds.map((id) => members.find((item) => item.clerk_user_id === id)).filter(Boolean);
  if (mentionedMembers.length !== requestedMentionIds.length) {
    return { status: 403, payload: { error: "You can only mention active members of this conversation." } };
  }

  const inserted = await db.from("portal_direct_messages").insert({
    conversation_id: conversation.id,
    sender_clerk_user_id: user.id,
    sender_role: identity.role,
    body: text,
    idempotency_key: idempotencyKey,
  }).select().single();
  if (inserted.error) throw inserted.error;

  if (attachments.length) {
    const attachmentResult = await db.from("portal_communication_attachments").insert(attachments.map((item) => ({
      ...item,
      direct_message_id: inserted.data.id,
      uploaded_by_clerk_user_id: user.id,
    })));
    if (attachmentResult.error) throw attachmentResult.error;
  }

  if (mentionedMembers.length) {
    const mentionResult = await db.from("portal_message_mentions").insert(mentionedMembers.map((member) => ({
      direct_message_id: inserted.data.id,
      mentioned_clerk_user_id: member.clerk_user_id,
      mentioned_display_name: member.display_name || null,
    })));
    if (mentionResult.error) throw mentionResult.error;
  }

  await db.from("portal_conversations").update({
    last_message_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", conversation.id);

  const mentionedIds = new Set(mentionedMembers.map((item) => item.clerk_user_id));
  const recipients = members.filter((item) => item.clerk_user_id !== user.id);
  const label = conversationLabel(conversation, members, user.id);
  await Promise.all(recipients.map((recipient) => notify(db, recipient.clerk_user_id, {
    category: mentionedIds.has(recipient.clerk_user_id) ? "mention" : "message",
    title: mentionedIds.has(recipient.clerk_user_id)
      ? `${identity.name} mentioned you in ${label}`
      : conversation.conversation_type === "group" || conversation.title
        ? `New message in ${label}`
        : `New message from ${identity.name}`,
    body: text || `${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`,
    section: "communications",
    relatedType: mentionedIds.has(recipient.clerk_user_id) ? "message_mention" : "direct_message",
    relatedId: conversation.id,
    key: `message:${inserted.data.id}:${recipient.clerk_user_id}`,
  })));

  const files = await emailAttachments(db, attachments);
  const deliveries = [];
  for (let index = 0; index < recipients.length; index += 5) {
    const batch = recipients.slice(index, index + 5);
    deliveries.push(...await Promise.all(batch.map(async (recipient) => {
      if (!recipient.email) return { email: "", sent: false, status: "skipped", error: "Recipient email is unavailable." };
      const wasMentioned = mentionedIds.has(recipient.clerk_user_id);
      const heading = wasMentioned
        ? `${identity.name} mentioned you in ${label}`
        : conversation.conversation_type === "group" || conversation.title
          ? `${identity.name} in ${label}`
          : `New message from ${identity.name}`;
      const copy = emailCopy({
        heading,
        intro: wasMentioned ? "You were mentioned in an MLS Portal message." : "A new message was sent through MLS Portal.",
        bodyText: text || "An attachment was added to the conversation.",
        buttonLabel: "Reply in MLS Portal",
        buttonUrl: portalUrl({ conversation: conversation.id }),
      });
      return {
        email: recipient.email,
        ...await sendGmailEmailWithAttachments(db, {
          to: recipient.email,
          subject: `MLS Portal: ${heading}`,
          ...copy,
          attachments: files,
        }),
      };
    })));
  }

  const sent = deliveries.filter((item) => item.sent);
  const failed = deliveries.filter((item) => !item.sent && item.status !== "skipped");
  const status = !deliveries.length
    ? "skipped"
    : sent.length === deliveries.length
      ? "sent"
      : sent.length
        ? "partial"
        : failed[0]?.status || "failed";
  const update = await db.from("portal_direct_messages").update({
    email_status: status,
    email_recipients: deliveries.map((item) => item.email).filter(Boolean),
    gmail_message_id: sent[0]?.messageId || null,
    gmail_thread_id: sent[0]?.threadId || null,
    email_sent_at: sent.length ? new Date().toISOString() : null,
    email_last_error: failed.map((item) => `${item.email}: ${item.error}`).join(" | ") || null,
  }).eq("id", inserted.data.id);
  if (update.error) throw update.error;

  return {
    status: 201,
    payload: {
      message: {
        ...inserted.data,
        mentions: mentionedMembers.map((member) => ({
          direct_message_id: inserted.data.id,
          mentioned_clerk_user_id: member.clerk_user_id,
          mentioned_display_name: member.display_name || null,
        })),
      },
      email: { status, sent: sent.length, total: deliveries.length },
    },
  };
}
