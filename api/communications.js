import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { sendGmailEmail } from "./_shared/gmail-oauth.js";

const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbAdminKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const supportEmail = process.env.EMAIL_SUPPORT_ADDRESS || "m.stubbs@miqueaslanguagesolutions.com";
const supportPhone = process.env.EMAIL_SUPPORT_PHONE || "(321) 379-8010";
const portalBaseUrl = process.env.MLS_PORTAL_URL || "https://miqueaslanguagesolutions.com/portal";
const adminEmails = (process.env.VITE_ADMIN_EMAILS || supportEmail)
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const bucketName = "portal-communications";
const maxUploadBytes = 10 * 1024 * 1024;
const maxAttachments = 3;
const allowedExtensions = new Set(["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "png", "jpg", "jpeg", "webp"]);
const allowedAudiences = new Set(["admin", "client", "interpreter", "all"]);

function send(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

function body(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function token(req) {
  return String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1] || "";
}

function decode(jwt) {
  return JSON.parse(Buffer.from(jwt.split(".")[1] || "", "base64url").toString("utf8"));
}

function clerk() {
  if (!clerkKey) throw new Error("Missing Clerk server key in Vercel.");
  return createClerkClient({ secretKey: clerkKey });
}

async function signedInUser(req) {
  const jwt = token(req);
  if (!jwt) return null;
  const claims = decode(jwt);
  if (!claims?.sid || !claims?.sub) return null;
  const client = clerk();
  const session = await client.sessions.getSession(claims.sid);
  if (session?.userId !== claims.sub) return null;
  const record = await client.users.getUser(claims.sub);
  const email = record.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  return {
    id: record.id,
    email,
    firstName: record.firstName || "",
    lastName: record.lastName || "",
    isAdmin: adminEmails.includes(email),
  };
}

function database() {
  if (!dbUrl || !dbAdminKey) throw new Error("Missing Supabase server settings in Vercel.");
  return createClient(dbUrl, dbAdminKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function displayName(record, fallback = "MLS Portal user") {
  return record?.organization_name
    || [record?.first_name, record?.last_name].filter(Boolean).join(" ")
    || [record?.firstName, record?.lastName].filter(Boolean).join(" ")
    || record?.primary_contact_name
    || record?.email
    || fallback;
}

async function profileFor(db, user) {
  if (user.isAdmin) return { role: "admin", profile: null, name: displayName(user, "MLS Admin") };
  const [clientResult, interpreterResult] = await Promise.all([
    db.from("clients").select("*").eq("clerk_user_id", user.id).maybeSingle(),
    db.from("interpreters").select("*").eq("clerk_user_id", user.id).maybeSingle(),
  ]);
  if (clientResult.error) throw clientResult.error;
  if (interpreterResult.error) throw interpreterResult.error;
  if (clientResult.data) return { role: "client", profile: clientResult.data, name: displayName(clientResult.data) };
  if (interpreterResult.data) return { role: "interpreter", profile: interpreterResult.data, name: displayName(interpreterResult.data) };
  return { role: "interpreter", profile: null, name: displayName(user) };
}

async function adminDirectory(db) {
  const result = await db.from("staff_roles").select("clerk_user_id,role,is_active").eq("is_active", true);
  if (result.error) throw result.error;
  const client = clerk();
  const byId = new Map();
  for (const item of result.data || []) {
    try {
      const record = await client.users.getUser(item.clerk_user_id);
      const email = record.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
      byId.set(record.id, { clerkUserId: record.id, role: "admin", name: displayName(record, "MLS Admin"), email });
    } catch {
      // Ignore stale staff-role rows.
    }
  }
  try {
    const listing = await client.users.getUserList({ emailAddress: adminEmails, limit: 100 });
    for (const record of listing.data || []) {
      const email = record.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
      byId.set(record.id, { clerkUserId: record.id, role: "admin", name: displayName(record, "MLS Admin"), email });
    }
  } catch {
    // Staff-role rows remain available when email lookup is unavailable.
  }
  return [...byId.values()];
}

async function directories(db) {
  const [clients, interpreters, admins] = await Promise.all([
    db.from("clients").select("id,clerk_user_id,organization_name,primary_contact_name,email,account_status").neq("account_status", "inactive").order("organization_name"),
    db.from("interpreters").select("id,clerk_user_id,first_name,last_name,email,roster_status").neq("roster_status", "removed").order("last_name"),
    adminDirectory(db),
  ]);
  if (clients.error) throw clients.error;
  if (interpreters.error) throw interpreters.error;
  return {
    clients: (clients.data || []).filter((item) => item.clerk_user_id).map((item) => ({ clerkUserId: item.clerk_user_id, role: "client", name: displayName(item), email: item.email, profileId: item.id })),
    interpreters: (interpreters.data || []).filter((item) => item.clerk_user_id).map((item) => ({ clerkUserId: item.clerk_user_id, role: "interpreter", name: displayName(item), email: item.email, profileId: item.id })),
    admins,
  };
}

function allowedContacts(role, all, currentUserId) {
  const values = role === "admin" ? [...all.clients, ...all.interpreters, ...all.admins] : all.admins;
  return values.filter((item) => item.clerkUserId && item.clerkUserId !== currentUserId);
}

function pairKey(firstId, secondId) {
  return [String(firstId), String(secondId)].sort().join(":");
}

function participant(conversation, userId) {
  if (conversation.participant_one_clerk_user_id === userId) {
    return {
      selfRole: conversation.participant_one_role,
      otherId: conversation.participant_two_clerk_user_id,
      otherRole: conversation.participant_two_role,
      otherName: conversation.participant_two_name,
      otherEmail: conversation.participant_two_email,
    };
  }
  if (conversation.participant_two_clerk_user_id === userId) {
    return {
      selfRole: conversation.participant_two_role,
      otherId: conversation.participant_one_clerk_user_id,
      otherRole: conversation.participant_one_role,
      otherName: conversation.participant_one_name,
      otherEmail: conversation.participant_one_email,
    };
  }
  return null;
}

function portalUrl(section = "communications", values = {}) {
  const url = new URL(portalBaseUrl);
  url.searchParams.set("section", section);
  Object.entries(values).forEach(([key, value]) => value && url.searchParams.set(key, value));
  return url.toString();
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function emailCopy({ heading, intro, bodyText, buttonLabel, buttonUrl }) {
  const text = ["Hello,", "", intro, "", bodyText, "", `${buttonLabel}: ${buttonUrl}`, "", "Miqueas Language Solutions", supportEmail, supportPhone].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ef;font-family:Arial,sans-serif;color:#24130e"><div style="max-width:660px;margin:0 auto;padding:28px 14px"><div style="background:#24130e;color:#fff;padding:26px;border-radius:24px 24px 0 0"><div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#f6b34c">MLS Portal</div><h1 style="margin:10px 0 0;font-size:27px">${escapeHtml(heading)}</h1></div><div style="background:#fff;padding:28px;border-radius:0 0 24px 24px"><p style="font-size:15px;line-height:1.7;color:#51453f">${escapeHtml(intro)}</p><div style="white-space:pre-wrap;font-size:15px;line-height:1.7;background:#fffaf5;border:1px solid #eadfd8;border-radius:16px;padding:18px">${escapeHtml(bodyText)}</div><p style="text-align:center;margin:28px 0"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#721100;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:14px">${escapeHtml(buttonLabel)}</a></p><p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b625e">Miqueas Language Solutions<br>${escapeHtml(supportEmail)} · ${escapeHtml(supportPhone)}</p></div></div></body></html>`;
  return { text, html };
}

async function createNotification(db, recipient, title, message, relatedType, relatedId) {
  if (!recipient) return;
  const result = await db.from("notifications").insert({
    recipient_clerk_user_id: recipient,
    category: relatedType === "announcement" ? "announcement" : "message",
    title,
    body: String(message || "").slice(0, 240),
    section: "communications",
    related_type: relatedType,
    related_id: relatedId,
  });
  if (result.error) throw result.error;
}

function sanitizeFileName(fileName) {
  return String(fileName || "attachment")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-140);
}

function validateFile(fileName, fileSize) {
  const extension = sanitizeFileName(fileName).split(".").pop()?.toLowerCase();
  if (!extension || !allowedExtensions.has(extension)) return "Upload a PDF, Word, Excel, CSV, TXT, PNG, JPG, or WEBP file.";
  const size = Number(fileSize || 0);
  if (!Number.isFinite(size) || size < 0 || size > maxUploadBytes) return "Each attachment must be 10 MB or smaller.";
  return "";
}

function normalizedAttachments(values) {
  return (Array.isArray(values) ? values : []).slice(0, maxAttachments).map((item) => ({
    storage_path: String(item.storagePath || ""),
    file_name: sanitizeFileName(item.fileName),
    mime_type: String(item.mimeType || "application/octet-stream"),
    file_size: Number(item.fileSize || 0),
  })).filter((item) => item.storage_path && item.file_name);
}

async function emailAttachments(db, attachments) {
  const files = [];
  for (const item of attachments || []) {
    const downloaded = await db.storage.from(bucketName).download(item.storage_path);
    if (downloaded.error) continue;
    const buffer = Buffer.from(await downloaded.data.arrayBuffer());
    files.push({ filename: item.file_name, contentType: item.mime_type || "application/octet-stream", content: buffer });
  }
  return files;
}

async function loadCommunications(db, user) {
  const identity = await profileFor(db, user);
  const all = await directories(db);
  const contacts = allowedContacts(identity.role, all, user.id);
  const conversationsResult = await db.from("portal_conversations")
    .select("*")
    .or(`participant_one_clerk_user_id.eq.${user.id},participant_two_clerk_user_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (conversationsResult.error) throw conversationsResult.error;
  const conversations = conversationsResult.data || [];
  const conversationIds = conversations.map((item) => item.id);
  const messagesResult = conversationIds.length
    ? await db.from("portal_direct_messages").select("*").in("conversation_id", conversationIds).order("created_at")
    : { data: [], error: null };
  if (messagesResult.error) throw messagesResult.error;
  const messageIds = (messagesResult.data || []).map((item) => item.id);
  const messageAttachments = messageIds.length
    ? await db.from("portal_communication_attachments").select("*").in("direct_message_id", messageIds).order("created_at")
    : { data: [], error: null };
  if (messageAttachments.error) throw messageAttachments.error;

  const announcementResult = await db.from("portal_announcements").select("*").order("published_at", { ascending: false }).limit(100);
  if (announcementResult.error) throw announcementResult.error;
  const now = Date.now();
  const announcements = (announcementResult.data || []).filter((item) => {
    if (identity.role === "admin") return true;
    if (item.expires_at && new Date(item.expires_at).getTime() < now) return false;
    return item.audiences?.includes("all") || item.audiences?.includes(identity.role);
  });
  const announcementIds = announcements.map((item) => item.id);
  const [announcementAttachments, reads] = await Promise.all([
    announcementIds.length ? db.from("portal_communication_attachments").select("*").in("announcement_id", announcementIds).order("created_at") : Promise.resolve({ data: [], error: null }),
    announcementIds.length ? db.from("portal_announcement_reads").select("announcement_id,read_at").eq("clerk_user_id", user.id).in("announcement_id", announcementIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (announcementAttachments.error) throw announcementAttachments.error;
  if (reads.error) throw reads.error;
  const readMap = new Map((reads.data || []).map((item) => [item.announcement_id, item.read_at]));

  return {
    role: identity.role,
    contacts,
    conversations: conversations.map((item) => ({ ...item, participant: participant(item, user.id) })),
    messages: (messagesResult.data || []).map((message) => ({
      ...message,
      attachments: (messageAttachments.data || []).filter((item) => item.direct_message_id === message.id),
    })),
    announcements: announcements.map((announcement) => ({
      ...announcement,
      read_at: readMap.get(announcement.id) || null,
      attachments: (announcementAttachments.data || []).filter((item) => item.announcement_id === announcement.id),
    })),
    unreadAnnouncements: announcements.filter((item) => !readMap.has(item.id)).length,
  };
}

async function createConversation(db, user, payload) {
  const identity = await profileFor(db, user);
  const all = await directories(db);
  const contacts = allowedContacts(identity.role, all, user.id);
  const recipient = contacts.find((item) => item.clerkUserId === String(payload.recipientClerkUserId || ""));
  if (!recipient) return { status: 403, payload: { error: "That person is not available as a messaging contact." } };
  if (identity.role !== "admin" && recipient.role !== "admin") return { status: 403, payload: { error: "Clients and interpreters may message MLS admins only." } };
  if (identity.role === "client" && recipient.role === "interpreter") return { status: 403, payload: { error: "Clients cannot message interpreters directly." } };
  if (identity.role === "interpreter" && recipient.role === "client") return { status: 403, payload: { error: "Interpreters cannot message clients directly." } };

  const self = { clerkUserId: user.id, role: identity.role, name: identity.name, email: user.email };
  const ordered = [self, recipient].sort((a, b) => a.clerkUserId.localeCompare(b.clerkUserId));
  const result = await db.from("portal_conversations").upsert({
    pair_key: pairKey(user.id, recipient.clerkUserId),
    participant_one_clerk_user_id: ordered[0].clerkUserId,
    participant_one_role: ordered[0].role,
    participant_one_name: ordered[0].name,
    participant_one_email: ordered[0].email,
    participant_two_clerk_user_id: ordered[1].clerkUserId,
    participant_two_role: ordered[1].role,
    participant_two_name: ordered[1].name,
    participant_two_email: ordered[1].email,
    created_by_clerk_user_id: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "pair_key" }).select().single();
  if (result.error) throw result.error;
  return { status: 200, payload: { conversation: { ...result.data, participant: participant(result.data, user.id) } } };
}

async function createUploadUrl(db, user, payload) {
  const validation = validateFile(payload.fileName, payload.fileSize);
  if (validation) return { status: 400, payload: { error: validation } };
  const context = payload.context === "announcement" ? "announcements" : "messages";
  const path = `${context}/${user.id}/${Date.now()}-${randomUUID()}-${sanitizeFileName(payload.fileName)}`;
  const result = await db.storage.from(bucketName).createSignedUploadUrl(path);
  if (result.error) throw result.error;
  return { status: 200, payload: { bucket: bucketName, path, token: result.data.token, signedUrl: result.data.signedUrl } };
}

async function sendDirectMessage(db, user, payload) {
  const text = String(payload.message || payload.body || "").trim();
  const attachments = normalizedAttachments(payload.attachments);
  if (!text && !attachments.length) return { status: 400, payload: { error: "Enter a message or attach a file." } };
  if (text.length > 4000) return { status: 400, payload: { error: "Messages must be 4,000 characters or fewer." } };
  const conversationResult = await db.from("portal_conversations").select("*").eq("id", payload.conversationId).maybeSingle();
  if (conversationResult.error) throw conversationResult.error;
  const conversation = conversationResult.data;
  const access = conversation ? participant(conversation, user.id) : null;
  if (!access) return { status: 403, payload: { error: "You do not have access to that conversation." } };
  const identity = await profileFor(db, user);
  if (identity.role !== access.selfRole && !user.isAdmin) return { status: 403, payload: { error: "Conversation role does not match your account." } };

  const inserted = await db.from("portal_direct_messages").insert({
    conversation_id: conversation.id,
    sender_clerk_user_id: user.id,
    sender_role: identity.role,
    body: text,
  }).select().single();
  if (inserted.error) throw inserted.error;
  if (attachments.length) {
    const attachmentResult = await db.from("portal_communication_attachments").insert(attachments.map((item) => ({
      ...item,
      direct_message_id: inserted.data.id,
      uploaded_by_clerk_user_id: user.id,
    }))).select();
    if (attachmentResult.error) throw attachmentResult.error;
  }
  await db.from("portal_conversations").update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", conversation.id);
  await createNotification(db, access.otherId, `New message from ${identity.name}`, text || `${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`, "direct_message", conversation.id);

  const url = portalUrl("communications", { conversation: conversation.id });
  const copy = emailCopy({
    heading: `New message from ${identity.name}`,
    intro: "A new direct message was sent through MLS Portal.",
    bodyText: text || "An attachment was added to the conversation.",
    buttonLabel: "Reply in MLS Portal",
    buttonUrl: url,
  });
  const files = await emailAttachments(db, attachments);
  const delivery = access.otherEmail ? await sendGmailEmail(db, {
    to: access.otherEmail,
    subject: `New MLS Portal message from ${identity.name}`,
    ...copy,
    attachments: files,
  }) : { sent: false, status: "skipped", error: "Recipient email is unavailable." };
  const messageUpdate = await db.from("portal_direct_messages").update({
    email_status: delivery.status || (delivery.sent ? "sent" : "failed"),
    email_recipients: access.otherEmail ? [access.otherEmail] : [],
    gmail_message_id: delivery.messageId || null,
    gmail_thread_id: delivery.threadId || null,
    email_sent_at: delivery.sent ? new Date().toISOString() : null,
    email_last_error: delivery.error || null,
  }).eq("id", inserted.data.id);
  if (messageUpdate.error) throw messageUpdate.error;
  return { status: 201, payload: { message: inserted.data, email: delivery } };
}

async function recipientDirectory(db, audiences) {
  const all = await directories(db);
  const roles = new Set(audiences.includes("all") ? ["admin", "client", "interpreter"] : audiences);
  const recipients = [
    ...(roles.has("admin") ? all.admins : []),
    ...(roles.has("client") ? all.clients : []),
    ...(roles.has("interpreter") ? all.interpreters : []),
  ];
  const byId = new Map();
  recipients.forEach((item) => item.clerkUserId && byId.set(item.clerkUserId, item));
  return [...byId.values()];
}

async function publishAnnouncement(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const title = String(payload.title || "").trim();
  const text = String(payload.body || "").trim();
  const audiences = [...new Set((Array.isArray(payload.audiences) ? payload.audiences : []).filter((item) => allowedAudiences.has(item)))];
  const attachments = normalizedAttachments(payload.attachments);
  if (!title || !text) return { status: 400, payload: { error: "Announcement title and message are required." } };
  if (!audiences.length) return { status: 400, payload: { error: "Choose at least one announcement audience." } };
  const inserted = await db.from("portal_announcements").insert({
    title,
    body: text,
    audiences,
    created_by_clerk_user_id: user.id,
    expires_at: payload.expiresAt || null,
  }).select().single();
  if (inserted.error) throw inserted.error;
  if (attachments.length) {
    const attachmentResult = await db.from("portal_communication_attachments").insert(attachments.map((item) => ({
      ...item,
      announcement_id: inserted.data.id,
      uploaded_by_clerk_user_id: user.id,
    }))).select();
    if (attachmentResult.error) throw attachmentResult.error;
  }
  const recipients = await recipientDirectory(db, audiences);
  const notificationRows = recipients.filter((item) => item.clerkUserId !== user.id).map((item) => ({
    recipient_clerk_user_id: item.clerkUserId,
    category: "announcement",
    title,
    body: text.slice(0, 240),
    section: "communications",
    related_type: "announcement",
    related_id: inserted.data.id,
  }));
  if (notificationRows.length) {
    const notificationResult = await db.from("notifications").insert(notificationRows);
    if (notificationResult.error) throw notificationResult.error;
  }

  const url = portalUrl("communications", { announcement: inserted.data.id });
  const copy = emailCopy({ heading: title, intro: "Miqueas Language Solutions posted a new portal announcement.", bodyText: text, buttonLabel: "Open announcement", buttonUrl: url });
  const files = await emailAttachments(db, attachments);
  const deliveries = [];
  for (let index = 0; index < recipients.length; index += 5) {
    const batch = recipients.slice(index, index + 5);
    const results = await Promise.all(batch.map(async (recipient) => {
      if (!recipient.email) return { email: "", sent: false, status: "skipped", error: "Recipient email is unavailable." };
      const delivery = await sendGmailEmail(db, { to: recipient.email, subject: `MLS Announcement: ${title}`, ...copy, attachments: files });
      return { email: recipient.email, ...delivery };
    }));
    deliveries.push(...results);
  }
  const sent = deliveries.filter((item) => item.sent);
  const failed = deliveries.filter((item) => !item.sent && item.status !== "skipped");
  const status = !deliveries.length ? "skipped" : sent.length === deliveries.length ? "sent" : sent.length ? "partial" : failed[0]?.status || "failed";
  const update = await db.from("portal_announcements").update({
    email_status: status,
    email_recipients: deliveries.map((item) => item.email).filter(Boolean),
    gmail_message_ids: sent.map((item) => item.messageId).filter(Boolean),
    email_last_error: failed.map((item) => `${item.email}: ${item.error}`).join(" | ") || null,
    updated_at: new Date().toISOString(),
  }).eq("id", inserted.data.id);
  if (update.error) throw update.error;
  return { status: 201, payload: { announcement: inserted.data, delivery: { status, sent: sent.length, total: deliveries.length } } };
}

async function markAnnouncementRead(db, user, payload) {
  const announcement = await db.from("portal_announcements").select("*").eq("id", payload.announcementId).maybeSingle();
  if (announcement.error) throw announcement.error;
  if (!announcement.data) return { status: 404, payload: { error: "Announcement not found." } };
  const identity = await profileFor(db, user);
  const allowed = user.isAdmin || announcement.data.audiences?.includes("all") || announcement.data.audiences?.includes(identity.role);
  if (!allowed) return { status: 403, payload: { error: "You do not have access to that announcement." } };
  const result = await db.from("portal_announcement_reads").upsert({ announcement_id: payload.announcementId, clerk_user_id: user.id, read_at: new Date().toISOString() }, { onConflict: "announcement_id,clerk_user_id" }).select().single();
  if (result.error) throw result.error;
  return { status: 200, payload: { read: result.data } };
}

async function openAttachment(db, user, payload) {
  const result = await db.from("portal_communication_attachments").select("*, portal_direct_messages(*, portal_conversations(*)), portal_announcements(*)").eq("id", payload.attachmentId).maybeSingle();
  if (result.error) throw result.error;
  const attachment = result.data;
  if (!attachment) return { status: 404, payload: { error: "Attachment not found." } };
  let allowed = false;
  if (attachment.direct_message_id) {
    const conversation = attachment.portal_direct_messages?.portal_conversations;
    allowed = Boolean(conversation && participant(conversation, user.id));
  } else if (attachment.announcement_id) {
    const identity = await profileFor(db, user);
    const announcement = attachment.portal_announcements;
    allowed = Boolean(user.isAdmin || announcement?.audiences?.includes("all") || announcement?.audiences?.includes(identity.role));
  }
  if (!allowed) return { status: 403, payload: { error: "You do not have access to that attachment." } };
  const signed = await db.storage.from(bucketName).createSignedUrl(attachment.storage_path, 300);
  if (signed.error) throw signed.error;
  return { status: 200, payload: { url: signed.data.signedUrl, fileName: attachment.file_name } };
}

async function deleteAnnouncement(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const attachments = await db.from("portal_communication_attachments").select("storage_path").eq("announcement_id", payload.announcementId);
  if (attachments.error) throw attachments.error;
  const paths = (attachments.data || []).map((item) => item.storage_path).filter(Boolean);
  if (paths.length) {
    const removed = await db.storage.from(bucketName).remove(paths);
    if (removed.error) throw removed.error;
  }
  const result = await db.from("portal_announcements").delete().eq("id", payload.announcementId).select("id").maybeSingle();
  if (result.error) throw result.error;
  return { status: 200, payload: { deletedId: result.data?.id || payload.announcementId } };
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    const db = database();
    const action = String(req.query?.action || "loadCommunications");
    const payload = body(req);
    if (req.method === "GET" && action === "loadCommunications") return send(res, 200, await loadCommunications(db, user));
    if (req.method !== "POST") return send(res, 405, { error: "Use POST for this communications action." });
    let result;
    if (action === "createConversation") result = await createConversation(db, user, payload);
    else if (action === "createUploadUrl") result = await createUploadUrl(db, user, payload);
    else if (action === "sendDirectMessage") result = await sendDirectMessage(db, user, payload);
    else if (action === "publishAnnouncement") result = await publishAnnouncement(db, user, payload);
    else if (action === "markAnnouncementRead") result = await markAnnouncementRead(db, user, payload);
    else if (action === "openAttachment") result = await openAttachment(db, user, payload);
    else if (action === "deleteAnnouncement") result = await deleteAnnouncement(db, user, payload);
    else result = { status: 404, payload: { error: "Unknown communications action." } };
    return send(res, result.status, result.payload);
  } catch (error) {
    console.error("MLS communications error", error);
    return send(res, 500, { error: error.message || "Communications request failed." });
  }
}
