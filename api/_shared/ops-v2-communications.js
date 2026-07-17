import { createClerkClient } from "@clerk/backend";
import { randomUUID } from "node:crypto";
import { notify } from "./ops-v2-core.js";
import { sendGmailEmailWithAttachments } from "./gmail-attachments.js";

const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const supportEmail = process.env.EMAIL_SUPPORT_ADDRESS || "m.stubbs@miqueaslanguagesolutions.com";
const supportPhone = process.env.EMAIL_SUPPORT_PHONE || "(321) 379-8010";
const portalBaseUrl = process.env.MLS_PORTAL_URL || "https://miqueaslanguagesolutions.com/portal";
const adminEmails = (process.env.VITE_ADMIN_EMAILS || supportEmail).split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
const bucketName = "portal-communications";
const maxUploadBytes = 10 * 1024 * 1024;
const maxAttachments = 3;
const maxGroupMembers = 30;
const allowedExtensions = new Set(["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "png", "jpg", "jpeg", "webp"]);
const allowedAudiences = new Set(["admin", "client", "interpreter", "all"]);

function clerk() {
  if (!clerkKey) throw new Error("Missing Clerk server key in Vercel.");
  return createClerkClient({ secretKey: clerkKey });
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
  return { role: user.metadataRole === "client" ? "client" : "interpreter", profile: null, name: displayName(user) };
}

async function adminDirectory(db) {
  const roles = await db.from("staff_roles").select("clerk_user_id,is_active").eq("is_active", true);
  if (roles.error) throw roles.error;
  const ids = new Set((roles.data || []).map((item) => item.clerk_user_id).filter(Boolean));
  const client = clerk();
  try {
    const listing = await client.users.getUserList({ emailAddress: adminEmails, limit: 100 });
    (listing.data || []).forEach((record) => ids.add(record.id));
  } catch {
    // Active staff-role records remain the fallback directory.
  }
  const admins = [];
  for (const id of ids) {
    try {
      const record = await client.users.getUser(id);
      const email = record.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
      admins.push({ clerkUserId: record.id, role: "admin", name: displayName(record, "MLS Admin"), email });
    } catch {
      // Ignore stale Clerk references.
    }
  }
  return admins;
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
  const values = role === "admin"
    ? [...all.clients, ...all.interpreters, ...all.admins]
    : role === "interpreter"
      ? [...all.interpreters, ...all.admins]
      : all.admins;
  const byId = new Map();
  values.filter((item) => item.clerkUserId && item.clerkUserId !== currentUserId).forEach((item) => byId.set(item.clerkUserId, item));
  return [...byId.values()];
}

function pairKey(firstId, secondId) {
  return [String(firstId), String(secondId)].sort().join(":");
}

function portalUrl(values = {}) {
  const url = new URL(portalBaseUrl);
  url.searchParams.set("section", "communications");
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

function sanitizeFileName(fileName) {
  return String(fileName || "attachment").normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-140);
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
    files.push({
      filename: item.file_name,
      contentType: item.mime_type || "application/octet-stream",
      content: Buffer.from(await downloaded.data.arrayBuffer()),
    });
  }
  return files;
}

async function activeMembers(db, conversationIds) {
  if (!conversationIds.length) return [];
  const result = await db.from("portal_conversation_members").select("*").in("conversation_id", conversationIds).is("left_at", null).order("joined_at");
  if (result.error) throw result.error;
  return result.data || [];
}

function conversationView(conversation, allMembers, userId, allMessages = []) {
  const members = allMembers.filter((item) => item.conversation_id === conversation.id);
  const others = members.filter((item) => item.clerk_user_id !== userId);
  const self = members.find((item) => item.clerk_user_id === userId);
  const lastReadAt = self?.last_read_at ? new Date(self.last_read_at).getTime() : 0;
  const unreadCount = allMessages.filter((message) => (
    message.conversation_id === conversation.id
    && message.sender_clerk_user_id !== userId
    && new Date(message.created_at).getTime() > lastReadAt
  )).length;
  const direct = conversation.conversation_type !== "group";
  const title = direct
    ? others[0]?.display_name || "MLS conversation"
    : conversation.title || others.map((item) => item.display_name).filter(Boolean).slice(0, 3).join(", ") || "Group conversation";
  return {
    ...conversation,
    members,
    displayTitle: title,
    unreadCount,
    lastReadAt: self?.last_read_at || null,
    participant: direct && others[0] ? {
      selfRole: members.find((item) => item.clerk_user_id === userId)?.role,
      otherId: others[0].clerk_user_id,
      otherRole: others[0].role,
      otherName: others[0].display_name,
      otherEmail: others[0].email,
    } : null,
  };
}

export async function loadCommunications(db, user) {
  const identity = await profileFor(db, user);
  const all = await directories(db);
  const contacts = allowedContacts(identity.role, all, user.id);
  const membershipResult = await db.from("portal_conversation_members").select("conversation_id").eq("clerk_user_id", user.id).is("left_at", null);
  if (membershipResult.error) throw membershipResult.error;
  const conversationIds = (membershipResult.data || []).map((item) => item.conversation_id);
  const conversationResult = conversationIds.length
    ? await db.from("portal_conversations").select("*").in("id", conversationIds).order("last_message_at", { ascending: false, nullsFirst: false })
    : { data: [], error: null };
  if (conversationResult.error) throw conversationResult.error;
  const conversations = conversationResult.data || [];
  const members = await activeMembers(db, conversations.map((item) => item.id));
  const messageResult = conversationIds.length
    ? await db.from("portal_direct_messages").select("*").in("conversation_id", conversationIds).order("created_at")
    : { data: [], error: null };
  if (messageResult.error) throw messageResult.error;
  const messageIds = (messageResult.data || []).map((item) => item.id);
  const messageAttachmentResult = messageIds.length
    ? await db.from("portal_communication_attachments").select("*").in("direct_message_id", messageIds).order("created_at")
    : { data: [], error: null };
  if (messageAttachmentResult.error) throw messageAttachmentResult.error;

  const announcementResult = await db.from("portal_announcements").select("*").order("published_at", { ascending: false }).limit(100);
  if (announcementResult.error) throw announcementResult.error;
  const now = Date.now();
  const announcements = (announcementResult.data || []).filter((item) => {
    if (identity.role === "admin") return true;
    if (item.expires_at && new Date(item.expires_at).getTime() < now) return false;
    return item.audiences?.includes("all") || item.audiences?.includes(identity.role);
  });
  const announcementIds = announcements.map((item) => item.id);
  const [announcementAttachmentResult, readResult] = await Promise.all([
    announcementIds.length ? db.from("portal_communication_attachments").select("*").in("announcement_id", announcementIds).order("created_at") : Promise.resolve({ data: [], error: null }),
    announcementIds.length ? db.from("portal_announcement_reads").select("announcement_id,read_at").eq("clerk_user_id", user.id).in("announcement_id", announcementIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (announcementAttachmentResult.error) throw announcementAttachmentResult.error;
  if (readResult.error) throw readResult.error;
  const readMap = new Map((readResult.data || []).map((item) => [item.announcement_id, item.read_at]));
  return {
    role: identity.role,
    contacts,
    conversations: conversations.map((item) => conversationView(item, members, user.id, messageResult.data || [])),
    messages: (messageResult.data || []).map((message) => ({ ...message, attachments: (messageAttachmentResult.data || []).filter((item) => item.direct_message_id === message.id) })),
    announcements: announcements.map((announcement) => ({ ...announcement, read_at: readMap.get(announcement.id) || null, attachments: (announcementAttachmentResult.data || []).filter((item) => item.announcement_id === announcement.id) })),
    unreadAnnouncements: announcements.filter((item) => !readMap.has(item.id)).length,
  };
}

function validateConversation(identity, selected, isGroup) {
  if (isGroup && identity.role === "client") return "Clients can participate in MLS-created group chats but cannot create them.";
  if (identity.role === "client" && selected.some((item) => item.role !== "admin")) return "Clients may message MLS admins only.";
  if (identity.role === "interpreter" && selected.some((item) => item.role === "client")) return "Only MLS may add clients to a group chat.";
  if (!isGroup && identity.role === "interpreter" && selected[0] && !["admin", "interpreter"].includes(selected[0].role)) return "Interpreters may message MLS or other interpreters.";
  return "";
}

export async function createCommunicationConversation(db, user, payload) {
  const identity = await profileFor(db, user);
  const contacts = allowedContacts(identity.role, await directories(db), user.id);
  const requestedIds = [...new Set([
    ...(Array.isArray(payload.memberClerkUserIds) ? payload.memberClerkUserIds : []),
    payload.recipientClerkUserId,
  ].map((value) => String(value || "").trim()).filter(Boolean))].slice(0, maxGroupMembers - 1);
  const selected = requestedIds.map((id) => contacts.find((item) => item.clerkUserId === id)).filter(Boolean);
  if (!selected.length || selected.length !== requestedIds.length) return { status: 403, payload: { error: "One or more people are not available as messaging contacts." } };
  const isGroup = payload.conversationType === "group" || selected.length > 1;
  const validation = validateConversation(identity, selected, isGroup);
  if (validation) return { status: 403, payload: { error: validation } };
  const self = { clerkUserId: user.id, role: identity.role, name: identity.name, email: user.email };

  let conversation;
  if (!isGroup) {
    const recipient = selected[0];
    const key = pairKey(user.id, recipient.clerkUserId);
    const existing = await db.from("portal_conversations").select("*").eq("pair_key", key).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) conversation = existing.data;
    else {
      const ordered = [self, recipient].sort((a, b) => a.clerkUserId.localeCompare(b.clerkUserId));
      const inserted = await db.from("portal_conversations").insert({
        pair_key: key,
        conversation_type: "direct",
        participant_one_clerk_user_id: ordered[0].clerkUserId,
        participant_one_role: ordered[0].role,
        participant_one_name: ordered[0].name,
        participant_one_email: ordered[0].email,
        participant_two_clerk_user_id: ordered[1].clerkUserId,
        participant_two_role: ordered[1].role,
        participant_two_name: ordered[1].name,
        participant_two_email: ordered[1].email,
        created_by_clerk_user_id: user.id,
      }).select().single();
      if (inserted.error) throw inserted.error;
      conversation = inserted.data;
    }
  } else {
    const title = String(payload.title || "").trim().slice(0, 120) || `${identity.name} group`;
    const inserted = await db.from("portal_conversations").insert({
      pair_key: null,
      conversation_type: "group",
      title,
      created_by_clerk_user_id: user.id,
    }).select().single();
    if (inserted.error) throw inserted.error;
    conversation = inserted.data;
  }

  const memberValues = [self, ...selected].map((item) => ({
    conversation_id: conversation.id,
    clerk_user_id: item.clerkUserId,
    role: item.role,
    display_name: item.name,
    email: item.email || null,
    added_by_clerk_user_id: user.id,
    left_at: null,
  }));
  const memberResult = await db.from("portal_conversation_members").upsert(memberValues, { onConflict: "conversation_id,clerk_user_id" });
  if (memberResult.error) throw memberResult.error;
  const selfRead = await db.from("portal_conversation_members").update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversation.id)
    .eq("clerk_user_id", user.id);
  if (selfRead.error) throw selfRead.error;
  const members = await activeMembers(db, [conversation.id]);

  if (isGroup) {
    await Promise.all(selected.map((person) => notify(db, person.clerkUserId, {
      category: "message",
      title: `Added to ${conversation.title}`,
      body: `${identity.name} added you to an MLS Portal group chat.`,
      section: "communications",
      relatedType: "conversation",
      relatedId: conversation.id,
    })));
  }
  return { status: 200, payload: { conversation: conversationView(conversation, members, user.id) } };
}

export async function markPortalConversationRead(db, user, payload) {
  const conversationId = String(payload?.conversationId || "").trim();
  if (!conversationId) return { status: 400, payload: { error: "Conversation ID is required." } };

  const membership = await db.from("portal_conversation_members")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("clerk_user_id", user.id)
    .is("left_at", null)
    .maybeSingle();
  if (membership.error) throw membership.error;
  if (!membership.data) return { status: 403, payload: { error: "You do not have access to that conversation." } };

  const latest = await db.from("portal_direct_messages")
    .select("id,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest.error) throw latest.error;

  const readAt = new Date().toISOString();
  const updated = await db.from("portal_conversation_members").update({
    last_read_at: readAt,
    last_read_message_id: latest.data?.id || null,
  }).eq("conversation_id", conversationId).eq("clerk_user_id", user.id).select("conversation_id,last_read_at,last_read_message_id").single();
  if (updated.error) throw updated.error;

  const notifications = await db.from("notifications").update({ is_read: true, read_at: readAt })
    .eq("recipient_clerk_user_id", user.id)
    .eq("section", "communications")
    .eq("related_id", conversationId)
    .in("category", ["message", "mention"]);
  if (notifications.error) throw notifications.error;

  return { status: 200, payload: { read: updated.data } };
}

export async function createCommunicationUploadUrl(db, user, payload) {
  const validation = validateFile(payload.fileName, payload.fileSize);
  if (validation) return { status: 400, payload: { error: validation } };
  const context = payload.context === "announcement" ? "announcements" : "messages";
  const path = `${context}/${user.id}/${Date.now()}-${randomUUID()}-${sanitizeFileName(payload.fileName)}`;
  const result = await db.storage.from(bucketName).createSignedUploadUrl(path);
  if (result.error) throw result.error;
  return { status: 200, payload: { bucket: bucketName, path, token: result.data.token, signedUrl: result.data.signedUrl } };
}

export async function sendPortalDirectMessage(db, user, payload) {
  const text = String(payload.message || payload.body || "").trim();
  const attachments = normalizedAttachments(payload.attachments);
  if (!text && !attachments.length) return { status: 400, payload: { error: "Enter a message or attach a file." } };
  if (text.length > 4000) return { status: 400, payload: { error: "Messages must be 4,000 characters or fewer." } };
  const conversationResult = await db.from("portal_conversations").select("*").eq("id", payload.conversationId).maybeSingle();
  if (conversationResult.error) throw conversationResult.error;
  const conversation = conversationResult.data;
  if (!conversation) return { status: 404, payload: { error: "Conversation not found." } };
  const members = await activeMembers(db, [conversation.id]);
  const selfMember = members.find((item) => item.clerk_user_id === user.id);
  if (!selfMember) return { status: 403, payload: { error: "You do not have access to that conversation." } };
  const identity = await profileFor(db, user);
  if (identity.role !== selfMember.role && !user.isAdmin) return { status: 403, payload: { error: "Conversation role does not match your account." } };
  const inserted = await db.from("portal_direct_messages").insert({ conversation_id: conversation.id, sender_clerk_user_id: user.id, sender_role: identity.role, body: text }).select().single();
  if (inserted.error) throw inserted.error;
  if (attachments.length) {
    const attachmentResult = await db.from("portal_communication_attachments").insert(attachments.map((item) => ({ ...item, direct_message_id: inserted.data.id, uploaded_by_clerk_user_id: user.id })));
    if (attachmentResult.error) throw attachmentResult.error;
  }
  await db.from("portal_conversations").update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", conversation.id);
  const recipients = members.filter((item) => item.clerk_user_id !== user.id);
  await Promise.all(recipients.map((recipient) => notify(db, recipient.clerk_user_id, {
    category: "message",
    title: conversation.conversation_type === "group" ? `New message in ${conversation.title || "group chat"}` : `New message from ${identity.name}`,
    body: text || `${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`,
    section: "communications",
    relatedType: "direct_message",
    relatedId: conversation.id,
  })));

  const files = await emailAttachments(db, attachments);
  const heading = conversation.conversation_type === "group" ? `${identity.name} in ${conversation.title || "MLS group chat"}` : `New message from ${identity.name}`;
  const copy = emailCopy({ heading, intro: "A new message was sent through MLS Portal.", bodyText: text || "An attachment was added to the conversation.", buttonLabel: "Reply in MLS Portal", buttonUrl: portalUrl({ conversation: conversation.id }) });
  const deliveries = [];
  for (let index = 0; index < recipients.length; index += 5) {
    const batch = recipients.slice(index, index + 5);
    deliveries.push(...await Promise.all(batch.map(async (recipient) => recipient.email
      ? { email: recipient.email, ...await sendGmailEmailWithAttachments(db, { to: recipient.email, subject: `MLS Portal: ${heading}`, ...copy, attachments: files }) }
      : { email: "", sent: false, status: "skipped", error: "Recipient email is unavailable." })));
  }
  const sent = deliveries.filter((item) => item.sent);
  const failed = deliveries.filter((item) => !item.sent && item.status !== "skipped");
  const status = !deliveries.length ? "skipped" : sent.length === deliveries.length ? "sent" : sent.length ? "partial" : failed[0]?.status || "failed";
  const update = await db.from("portal_direct_messages").update({
    email_status: status,
    email_recipients: deliveries.map((item) => item.email).filter(Boolean),
    gmail_message_id: sent[0]?.messageId || null,
    gmail_thread_id: sent[0]?.threadId || null,
    email_sent_at: sent.length ? new Date().toISOString() : null,
    email_last_error: failed.map((item) => `${item.email}: ${item.error}`).join(" | ") || null,
  }).eq("id", inserted.data.id);
  if (update.error) throw update.error;
  return { status: 201, payload: { message: inserted.data, email: { status, sent: sent.length, total: deliveries.length } } };
}

async function announcementRecipients(db, audiences) {
  const all = await directories(db);
  const roles = new Set(audiences.includes("all") ? ["admin", "client", "interpreter"] : audiences);
  const values = [...(roles.has("admin") ? all.admins : []), ...(roles.has("client") ? all.clients : []), ...(roles.has("interpreter") ? all.interpreters : [])];
  const byId = new Map();
  values.filter((item) => item.clerkUserId).forEach((item) => byId.set(item.clerkUserId, item));
  return [...byId.values()];
}

export async function publishPortalAnnouncement(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const title = String(payload.title || "").trim();
  const text = String(payload.body || "").trim();
  const audiences = [...new Set((Array.isArray(payload.audiences) ? payload.audiences : []).filter((item) => allowedAudiences.has(item)))];
  const attachments = normalizedAttachments(payload.attachments);
  if (!title || !text) return { status: 400, payload: { error: "Announcement title and message are required." } };
  if (!audiences.length) return { status: 400, payload: { error: "Choose at least one announcement audience." } };
  const inserted = await db.from("portal_announcements").insert({ title, body: text, audiences, created_by_clerk_user_id: user.id, expires_at: payload.expiresAt || null }).select().single();
  if (inserted.error) throw inserted.error;
  if (attachments.length) {
    const attachmentResult = await db.from("portal_communication_attachments").insert(attachments.map((item) => ({ ...item, announcement_id: inserted.data.id, uploaded_by_clerk_user_id: user.id })));
    if (attachmentResult.error) throw attachmentResult.error;
  }
  const recipients = await announcementRecipients(db, audiences);
  const notificationRows = recipients.filter((item) => item.clerkUserId !== user.id).map((item) => ({ recipient_clerk_user_id: item.clerkUserId, category: "announcement", title, body: text.slice(0, 240), section: "communications", related_type: "announcement", related_id: inserted.data.id }));
  if (notificationRows.length) {
    const notificationResult = await db.from("notifications").insert(notificationRows);
    if (notificationResult.error) throw notificationResult.error;
  }
  const copy = emailCopy({ heading: title, intro: "Miqueas Language Solutions posted a new portal announcement.", bodyText: text, buttonLabel: "Open announcement", buttonUrl: portalUrl({ announcement: inserted.data.id }) });
  const files = await emailAttachments(db, attachments);
  const deliveries = [];
  for (let index = 0; index < recipients.length; index += 5) {
    const batch = recipients.slice(index, index + 5);
    deliveries.push(...await Promise.all(batch.map(async (recipient) => recipient.email
      ? { email: recipient.email, ...await sendGmailEmailWithAttachments(db, { to: recipient.email, subject: `MLS Announcement: ${title}`, ...copy, attachments: files }) }
      : { email: "", sent: false, status: "skipped", error: "Recipient email is unavailable." })));
  }
  const sent = deliveries.filter((item) => item.sent);
  const failed = deliveries.filter((item) => !item.sent && item.status !== "skipped");
  const status = !deliveries.length ? "skipped" : sent.length === deliveries.length ? "sent" : sent.length ? "partial" : failed[0]?.status || "failed";
  const update = await db.from("portal_announcements").update({ email_status: status, email_recipients: deliveries.map((item) => item.email).filter(Boolean), gmail_message_ids: sent.map((item) => item.messageId).filter(Boolean), email_last_error: failed.map((item) => `${item.email}: ${item.error}`).join(" | ") || null, updated_at: new Date().toISOString() }).eq("id", inserted.data.id);
  if (update.error) throw update.error;
  return { status: 201, payload: { announcement: inserted.data, delivery: { status, sent: sent.length, total: deliveries.length } } };
}

export async function markPortalAnnouncementRead(db, user, payload) {
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

export async function openCommunicationAttachment(db, user, payload) {
  const result = await db.from("portal_communication_attachments").select("*").eq("id", payload.attachmentId).maybeSingle();
  if (result.error) throw result.error;
  const attachment = result.data;
  if (!attachment) return { status: 404, payload: { error: "Attachment not found." } };
  let allowed = false;
  if (attachment.direct_message_id) {
    const message = await db.from("portal_direct_messages").select("conversation_id").eq("id", attachment.direct_message_id).maybeSingle();
    if (message.error) throw message.error;
    if (message.data) {
      const membership = await db.from("portal_conversation_members").select("conversation_id").eq("conversation_id", message.data.conversation_id).eq("clerk_user_id", user.id).is("left_at", null).maybeSingle();
      if (membership.error) throw membership.error;
      allowed = Boolean(membership.data);
    }
  } else if (attachment.announcement_id) {
    const announcement = await db.from("portal_announcements").select("*").eq("id", attachment.announcement_id).maybeSingle();
    if (announcement.error) throw announcement.error;
    const identity = await profileFor(db, user);
    allowed = Boolean(user.isAdmin || announcement.data?.audiences?.includes("all") || announcement.data?.audiences?.includes(identity.role));
  }
  if (!allowed) return { status: 403, payload: { error: "You do not have access to that attachment." } };
  const signed = await db.storage.from(bucketName).createSignedUrl(attachment.storage_path, 300);
  if (signed.error) throw signed.error;
  return { status: 200, payload: { url: signed.data.signedUrl, fileName: attachment.file_name } };
}

export async function deletePortalAnnouncement(db, user, payload) {
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
