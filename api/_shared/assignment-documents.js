import { randomUUID } from "node:crypto";
import { audit, notify } from "./ops-v2-core.js";
import { driveScope, getGoogleWorkspaceAccessToken, sendGmailEmail } from "./gmail-oauth.js";
import { ensureAssignmentDriveFolder } from "./assignment-automations.js";

const bucketName = "assignment-documents";
const maxUploadBytes = 15 * 1024 * 1024;
const portalBaseUrl = process.env.MLS_PORTAL_URL || "https://miqueaslanguagesolutions.com/portal";
const brandLogoUrl = process.env.EMAIL_LOGO_URL || "https://miqueaslanguagesolutions.com/logo.png";
const supportEmail = process.env.EMAIL_SUPPORT_ADDRESS || "m.stubbs@miqueaslanguagesolutions.com";
const supportPhone = process.env.EMAIL_SUPPORT_PHONE || "(321) 379-8010";
const adminEmails = (process.env.VITE_ADMIN_EMAILS || supportEmail)
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const allowedExtensions = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "eml", "png", "jpg", "jpeg",
]);

const categoryLabels = {
  client_agreement: "Client agreement",
  interpreter_agreement: "Interpreter agreement",
  assignment_confirmation: "Assignment confirmation",
  preparation_material: "Preparation material",
  purchase_order: "Purchase order",
  timesheet: "Timesheet",
  communication_record: "Communication record",
  invoice: "Invoice",
  expense_receipt: "Expense receipt",
  incident_or_complaint: "Incident or complaint record",
  feedback: "Feedback",
  accessibility_plan: "Accessibility plan",
  other: "Other assignment document",
};

const allCategories = new Set(Object.keys(categoryLabels));
const clientCategories = new Set([
  "client_agreement", "preparation_material", "purchase_order", "communication_record",
  "accessibility_plan", "other",
]);
const interpreterCategories = new Set([
  "interpreter_agreement", "timesheet", "expense_receipt", "preparation_material",
  "communication_record", "other",
]);
const clientShareableCategories = new Set([
  "preparation_material", "communication_record", "accessibility_plan", "other",
]);
const visibilityValues = new Set([
  "admin_only", "client", "all_interpreters", "specific_interpreter", "client_and_interpreters",
]);

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uniqueEmails(values) {
  return [...new Set(values
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => /^\S+@\S+\.\S+$/.test(value)))];
}

function assignmentUrl(assignmentId) {
  const url = new URL(portalBaseUrl);
  url.searchParams.set("section", "assignments");
  url.searchParams.set("assignment", assignmentId);
  return url.toString();
}

function assignmentName(assignment) {
  return assignment.clients?.organization_name
    || assignment.clients?.primary_contact_name
    || assignment.clients?.email
    || "MLS client";
}

function uploaderName(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "MLS Portal user";
}

function userAssignmentRole(user, assignment) {
  if (user.isAdmin) return { role: "admin", interpreterId: null };
  if (assignment.clients?.clerk_user_id === user.id) return { role: "client", interpreterId: null };
  const link = (assignment.assignment_interpreters || [])
    .find((item) => item.interpreters?.clerk_user_id === user.id);
  if (link) return { role: "interpreter", interpreterId: link.interpreters?.id || link.interpreter_id || null };
  return { role: "", interpreterId: null };
}

function sanitizeFileName(fileName) {
  return String(fileName || "document")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-140);
}

function safeFolderName(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|#%{}[\]~]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function validateFile(fileName, fileSize) {
  const extension = sanitizeFileName(fileName).split(".").pop()?.toLowerCase();
  if (!extension || !allowedExtensions.has(extension)) {
    return "Upload a PDF, Word, Excel, CSV, TXT, EML, PNG, or JPG file.";
  }
  const size = Number(fileSize || 0);
  if (!Number.isFinite(size) || size < 0 || size > maxUploadBytes) {
    return "Files must be 15 MB or smaller.";
  }
  return "";
}

function canSeeDocument(access, document) {
  if (access.role === "admin") return true;
  if (access.role === "client") {
    return document.visibility === "client" || document.visibility === "client_and_interpreters";
  }
  if (access.role === "interpreter") {
    if (["all_interpreters", "client_and_interpreters"].includes(document.visibility)) return true;
    return document.visibility === "specific_interpreter" && document.interpreter_id === access.interpreterId;
  }
  return false;
}

function allowedCategory(role, category) {
  if (role === "admin") return allCategories.has(category);
  if (role === "client") return clientCategories.has(category);
  if (role === "interpreter") return interpreterCategories.has(category);
  return false;
}

function assignedInterpreter(assignment, interpreterId) {
  return (assignment.assignment_interpreters || [])
    .some((link) => (link.interpreters?.id || link.interpreter_id) === interpreterId);
}

function resolvedVisibility(access, assignment, body, existing = null) {
  if (existing) {
    return { visibility: existing.visibility, interpreterId: existing.interpreter_id || null };
  }
  if (access.role === "admin") {
    const visibility = visibilityValues.has(body.visibility) ? body.visibility : "admin_only";
    const interpreterId = visibility === "specific_interpreter" ? String(body.interpreterId || "") : null;
    if (visibility === "specific_interpreter" && !assignedInterpreter(assignment, interpreterId)) {
      throw new Error("Choose an interpreter assigned to this assignment.");
    }
    return { visibility, interpreterId };
  }
  if (access.role === "client") {
    const shared = Boolean(body.shareWithInterpreters) && clientShareableCategories.has(body.category);
    return { visibility: shared ? "client_and_interpreters" : "client", interpreterId: null };
  }
  if (access.role === "interpreter") {
    if (!access.interpreterId) throw new Error("Your interpreter profile is not linked to this assignment.");
    return { visibility: "specific_interpreter", interpreterId: access.interpreterId };
  }
  throw new Error("Assignment access is required.");
}

async function documentFor(db, assignmentId, documentId) {
  const result = await db.from("assignment_documents")
    .select("*")
    .eq("id", documentId)
    .eq("assignment_id", assignmentId)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function googleJson(accessToken, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `Google Drive request failed (${response.status}).`);
  return data;
}

async function ensureCategoryFolder(accessToken, assignmentFolderId, category) {
  const params = new URLSearchParams({
    q: `'${assignmentFolderId}' in parents and appProperties has { key='mlsDocumentCategory' and value='${category}' } and trashed = false`,
    spaces: "drive",
    fields: "files(id,name,webViewLink)",
    pageSize: "10",
  });
  const listed = await googleJson(accessToken, `https://www.googleapis.com/drive/v3/files?${params}`);
  if (listed.files?.[0]) return listed.files[0];
  return googleJson(accessToken, "https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink", {
    method: "POST",
    body: JSON.stringify({
      name: safeFolderName(categoryLabels[category] || "Other"),
      mimeType: "application/vnd.google-apps.folder",
      parents: [assignmentFolderId],
      appProperties: { mlsDocumentCategory: category, mlsManaged: "true" },
    }),
  });
}

async function uploadToDrive(accessToken, folderId, document, fileBlob) {
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({
    name: document.file_name,
    parents: [folderId],
    appProperties: {
      mlsAssignmentId: document.assignment_id,
      mlsAssignmentDocumentId: document.id,
      mlsDocumentCategory: document.category,
      mlsVisibility: document.visibility,
    },
  })], { type: "application/json" }));
  form.append("file", fileBlob, document.file_name);
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) throw new Error(data.error?.message || "Google Drive could not store the assignment document.");
  return data;
}

async function mirrorDocumentToDrive(db, assignment, document) {
  const access = await getGoogleWorkspaceAccessToken(db, [driveScope]);
  if (!access.accessToken) {
    await db.from("assignment_documents").update({
      drive_sync_status: "not_configured",
      drive_last_error: access.error || "Drive access is not configured.",
      updated_at: new Date().toISOString(),
    }).eq("id", document.id);
    return { status: "not_configured", error: access.error };
  }
  try {
    const assignmentFolder = await ensureAssignmentDriveFolder(db, assignment);
    if (assignmentFolder.status !== "synced" || !assignmentFolder.folderId) {
      throw new Error(assignmentFolder.error || "The assignment Drive folder is unavailable.");
    }
    const categoryFolder = await ensureCategoryFolder(access.accessToken, assignmentFolder.folderId, document.category);
    const downloaded = await db.storage.from(bucketName).download(document.storage_path);
    if (downloaded.error) throw downloaded.error;
    const driveFile = await uploadToDrive(access.accessToken, categoryFolder.id, document, downloaded.data);
    const url = driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`;
    await db.from("assignment_documents").update({
      drive_file_id: driveFile.id,
      drive_file_url: url,
      drive_sync_status: "synced",
      drive_last_synced_at: new Date().toISOString(),
      drive_last_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", document.id);
    return { status: "synced", fileId: driveFile.id, fileUrl: url, folderId: categoryFolder.id };
  } catch (error) {
    await db.from("assignment_documents").update({
      drive_sync_status: "failed",
      drive_last_error: error.message,
      updated_at: new Date().toISOString(),
    }).eq("id", document.id);
    return { status: "failed", error: error.message };
  }
}

function emailRecipients(assignment, document, sender) {
  const clientEmails = [assignment.clients?.email, assignment.clients?.billing_email];
  const interpreterLinks = assignment.assignment_interpreters || [];
  const allInterpreterEmails = interpreterLinks
    .filter((link) => !["declined", "cancelled"].includes(link.status))
    .map((link) => link.interpreters?.email);
  const specificInterpreterEmail = interpreterLinks
    .find((link) => (link.interpreters?.id || link.interpreter_id) === document.interpreter_id)
    ?.interpreters?.email;
  const recipients = [];
  if (!sender.isAdmin) recipients.push(...adminEmails);
  if (["client", "client_and_interpreters"].includes(document.visibility)) recipients.push(...clientEmails);
  if (["all_interpreters", "client_and_interpreters"].includes(document.visibility)) recipients.push(...allInterpreterEmails);
  if (document.visibility === "specific_interpreter") recipients.push(specificInterpreterEmail);
  return uniqueEmails(recipients).filter((email) => email !== String(sender.email || "").toLowerCase());
}

function documentEmail(assignment, document, sender) {
  const portalUrl = assignmentUrl(assignment.id);
  const label = categoryLabels[document.category] || "Assignment document";
  const senderLabel = uploaderName(sender);
  const text = [
    "Hello,",
    "",
    `${senderLabel} added or shared an assignment document in MLS Portal.`,
    "",
    `Assignment: ${assignment.service_type}`,
    `Client: ${assignmentName(assignment)}`,
    `Document: ${document.title}`,
    `Category: ${label}`,
    `File: ${document.file_name}`,
    "",
    `Open the secure assignment record: ${portalUrl}`,
    "",
    "The document is not attached to this email. Sign in to MLS Portal to view it securely.",
    "",
    "Miqueas Language Solutions",
    supportEmail,
    supportPhone,
  ].join("\n");
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f7f3ef;font-family:Arial,sans-serif;color:#24130e"><div style="max-width:660px;margin:0 auto;padding:28px 14px"><div style="background:#fff;border-radius:24px 24px 0 0;padding:22px 26px"><table role="presentation" width="100%"><tr><td><img src="${escapeHtml(brandLogoUrl)}" alt="Miqueas Language Solutions" width="205" style="display:block;max-width:100%;height:auto"></td><td align="right" style="font-size:12px;line-height:1.6;color:#51453f"><strong style="color:#721100">MLS Portal Support</strong><br>${escapeHtml(supportEmail)}<br>${escapeHtml(supportPhone)}</td></tr></table></div><div style="background:#24130e;color:#fff;padding:24px 28px"><div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#f6b34c">Secure assignment document</div><h1 style="margin:10px 0 0;font-size:28px;line-height:1.25">${escapeHtml(document.title)}</h1></div><div style="background:#fff;border-radius:0 0 24px 24px;padding:28px;box-shadow:0 12px 40px rgba(36,19,14,.10)"><p style="font-size:15px;line-height:1.7;color:#51453f">${escapeHtml(senderLabel)} added or shared a document for <strong>${escapeHtml(assignment.service_type)}</strong>.</p><table role="presentation" width="100%" style="margin:22px 0;padding:14px 18px;border:1px solid #eadfd8;border-radius:18px;background:#fffaf5"><tr><td style="padding:8px 12px 8px 0;font-size:13px;font-weight:700;color:#721100">Client</td><td style="padding:8px 0;font-size:13px;color:#51453f">${escapeHtml(assignmentName(assignment))}</td></tr><tr><td style="padding:8px 12px 8px 0;font-size:13px;font-weight:700;color:#721100">Category</td><td style="padding:8px 0;font-size:13px;color:#51453f">${escapeHtml(label)}</td></tr><tr><td style="padding:8px 12px 8px 0;font-size:13px;font-weight:700;color:#721100">File</td><td style="padding:8px 0;font-size:13px;color:#51453f">${escapeHtml(document.file_name)}</td></tr></table><p style="text-align:center;margin:28px 0"><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#721100;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:14px">Open secure document center</a></p><p style="font-size:13px;line-height:1.6;color:#6b625e;background:#f7f3ef;padding:14px 16px;border-radius:14px">The document is intentionally not attached to this email. Sign in to MLS Portal so access remains limited to the appropriate assignment participants.</p></div></div></body></html>`;
  return { text, html };
}

async function sendDocumentEmails(db, assignment, document, sender) {
  const recipients = emailRecipients(assignment, document, sender);
  if (!recipients.length) {
    await db.from("assignment_documents").update({
      email_status: "skipped",
      email_recipients: [],
      email_last_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", document.id);
    return { status: "skipped", recipients: [] };
  }
  const copy = documentEmail(assignment, document, sender);
  const deliveries = [];
  for (const email of recipients) {
    const result = await sendGmailEmail(db, {
      to: email,
      subject: `MLS assignment document | ${document.title}`,
      ...copy,
    });
    deliveries.push({ email, ...result });
  }
  const sent = deliveries.filter((item) => item.sent);
  const failed = deliveries.filter((item) => !item.sent);
  const status = sent.length === deliveries.length ? "sent" : sent.length ? "partial" : (failed[0]?.status || "failed");
  const error = failed.map((item) => `${item.email}: ${item.error}`).join(" | ") || null;
  await db.from("assignment_documents").update({
    email_status: status,
    email_recipients: recipients,
    gmail_message_id: sent[0]?.messageId || null,
    gmail_thread_id: sent[0]?.threadId || null,
    email_sent_at: ["sent", "partial"].includes(status) ? new Date().toISOString() : null,
    email_last_error: error,
    updated_at: new Date().toISOString(),
  }).eq("id", document.id);
  return { status, recipients, deliveries, error };
}

async function createPortalNotifications(db, assignment, document, sender) {
  const recipients = [];
  if (["client", "client_and_interpreters"].includes(document.visibility)) {
    recipients.push(assignment.clients?.clerk_user_id);
  }
  if (["all_interpreters", "client_and_interpreters"].includes(document.visibility)) {
    recipients.push(...(assignment.assignment_interpreters || []).map((link) => link.interpreters?.clerk_user_id));
  }
  if (document.visibility === "specific_interpreter") {
    const link = (assignment.assignment_interpreters || [])
      .find((item) => (item.interpreters?.id || item.interpreter_id) === document.interpreter_id);
    recipients.push(link?.interpreters?.clerk_user_id);
  }
  const uniqueRecipients = [...new Set(recipients.filter(Boolean))].filter((id) => id !== sender.id);
  await Promise.all(uniqueRecipients.map((recipient) => notify(db, recipient, {
    category: "document",
    title: "New assignment document",
    body: document.title,
    section: "assignments",
    relatedType: "assignment",
    relatedId: assignment.id,
  })));
}

export async function listAssignmentDocuments(db, user, assignment) {
  const access = userAssignmentRole(user, assignment);
  if (!access.role) return { status: 403, payload: { error: "Assignment access is required." } };
  const result = await db.from("assignment_documents")
    .select("*")
    .eq("assignment_id", assignment.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (result.error) throw result.error;
  return {
    status: 200,
    payload: {
      documents: (result.data || []).filter((document) => canSeeDocument(access, document)),
      role: access.role,
      uploadLimitBytes: maxUploadBytes,
    },
  };
}

export async function createAssignmentDocumentUploadUrl(db, user, assignment, body) {
  const access = userAssignmentRole(user, assignment);
  const category = String(body.category || "");
  if (!access.role) return { status: 403, payload: { error: "Assignment access is required." } };
  if (!allowedCategory(access.role, category)) {
    return { status: 403, payload: { error: "That document category is not available for your portal role." } };
  }
  const validationError = validateFile(body.fileName, body.fileSize);
  if (validationError) return { status: 400, payload: { error: validationError } };
  const path = `assignments/${assignment.id}/${category}/${Date.now()}-${randomUUID()}-${sanitizeFileName(body.fileName)}`;
  const signed = await db.storage.from(bucketName).createSignedUploadUrl(path);
  if (signed.error) throw signed.error;
  return { status: 200, payload: { bucket: bucketName, path, token: signed.data.token, signedUrl: signed.data.signedUrl } };
}

export async function recordAssignmentDocumentUpload(db, user, assignment, body) {
  const access = userAssignmentRole(user, assignment);
  if (!access.role) return { status: 403, payload: { error: "Assignment access is required." } };
  let existing = null;
  if (body.supersedesDocumentId) {
    existing = await documentFor(db, assignment.id, body.supersedesDocumentId);
    if (!existing || existing.archived_at) return { status: 404, payload: { error: "The document being replaced was not found." } };
    if (!user.isAdmin && existing.uploaded_by_clerk_user_id !== user.id) {
      return { status: 403, payload: { error: "Only MLS or the original uploader can replace this document." } };
    }
  }
  const category = existing?.category || String(body.category || "");
  if (!allowedCategory(access.role, category) && !user.isAdmin) {
    return { status: 403, payload: { error: "That document category is not available for your portal role." } };
  }
  const validationError = validateFile(body.fileName, body.fileSize);
  if (validationError) return { status: 400, payload: { error: validationError } };
  const expectedPrefix = `assignments/${assignment.id}/${category}/`;
  if (!String(body.storagePath || "").startsWith(expectedPrefix)) {
    return { status: 400, payload: { error: "The uploaded file does not match this assignment record." } };
  }
  const visibility = resolvedVisibility(access, assignment, { ...body, category }, existing);
  const now = new Date().toISOString();
  const insert = await db.from("assignment_documents").insert({
    assignment_id: assignment.id,
    interpreter_id: visibility.interpreterId,
    category,
    title: existing?.title || String(body.title || categoryLabels[category] || body.fileName || "Assignment document").trim().slice(0, 220),
    document_date: body.documentDate || null,
    file_name: String(body.fileName || "document").slice(0, 240),
    mime_type: body.mimeType || null,
    file_size: Number(body.fileSize || 0),
    storage_path: body.storagePath,
    uploaded_by_clerk_user_id: user.id,
    uploaded_by_role: access.role,
    visibility: visibility.visibility,
    version_number: existing ? Number(existing.version_number || 1) + 1 : 1,
    supersedes_document_id: existing?.id || null,
    notes: body.notes || null,
  }).select().single();
  if (insert.error) throw insert.error;
  if (existing) {
    const archived = await db.from("assignment_documents").update({
      record_status: "archived",
      archived_at: now,
      archived_by_clerk_user_id: user.id,
      updated_at: now,
    }).eq("id", existing.id);
    if (archived.error) throw archived.error;
  }
  await audit(db, user, {
    action: existing ? "assignment.document_replaced" : "assignment.document_uploaded",
    entityType: "assignment_document",
    entityId: insert.data.id,
    summary: `${categoryLabels[category] || category} uploaded for assignment`,
    before: existing,
    after: insert.data,
  });
  await createPortalNotifications(db, assignment, insert.data, user);
  const [drive, email] = await Promise.all([
    mirrorDocumentToDrive(db, assignment, insert.data),
    sendDocumentEmails(db, assignment, insert.data, user),
  ]);
  const refreshed = await documentFor(db, assignment.id, insert.data.id);
  return { status: 201, payload: { document: refreshed || insert.data, automation: { drive, email } } };
}

export async function openAssignmentDocument(db, user, assignment, body) {
  const access = userAssignmentRole(user, assignment);
  const document = await documentFor(db, assignment.id, body.documentId);
  if (!document || document.archived_at || !canSeeDocument(access, document)) {
    return { status: 404, payload: { error: "Document not found or not available to your portal role." } };
  }
  const signed = await db.storage.from(bucketName).createSignedUrl(document.storage_path, 300, { download: document.file_name });
  if (signed.error) throw signed.error;
  await audit(db, user, {
    action: "assignment.document_opened",
    entityType: "assignment_document",
    entityId: document.id,
    summary: `Opened ${document.title}`,
  });
  return { status: 200, payload: { url: signed.data.signedUrl } };
}

export async function archiveAssignmentDocument(db, user, assignment, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access is required to archive assignment records." } };
  const document = await documentFor(db, assignment.id, body.documentId);
  if (!document || document.archived_at) return { status: 404, payload: { error: "Document not found." } };
  const now = new Date().toISOString();
  const updated = await db.from("assignment_documents").update({
    record_status: "archived",
    archived_at: now,
    archived_by_clerk_user_id: user.id,
    updated_at: now,
  }).eq("id", document.id).select().single();
  if (updated.error) throw updated.error;
  await audit(db, user, {
    action: "assignment.document_archived",
    entityType: "assignment_document",
    entityId: document.id,
    summary: `Archived ${document.title}`,
    before: document,
    after: updated.data,
  });
  return { status: 200, payload: { document: updated.data } };
}

export async function updateAssignmentDocumentVisibility(db, user, assignment, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access is required to change document access." } };
  const document = await documentFor(db, assignment.id, body.documentId);
  if (!document || document.archived_at) return { status: 404, payload: { error: "Document not found." } };
  const visibility = visibilityValues.has(body.visibility) ? body.visibility : "admin_only";
  const interpreterId = visibility === "specific_interpreter" ? String(body.interpreterId || "") : null;
  if (visibility === "specific_interpreter" && !assignedInterpreter(assignment, interpreterId)) {
    return { status: 400, payload: { error: "Choose an interpreter assigned to this assignment." } };
  }
  const updated = await db.from("assignment_documents").update({
    visibility,
    interpreter_id: interpreterId,
    updated_at: new Date().toISOString(),
  }).eq("id", document.id).select().single();
  if (updated.error) throw updated.error;
  await audit(db, user, {
    action: "assignment.document_visibility_updated",
    entityType: "assignment_document",
    entityId: document.id,
    summary: `Document access changed to ${visibility}`,
    before: document,
    after: updated.data,
  });
  await createPortalNotifications(db, assignment, updated.data, user);
  const email = await sendDocumentEmails(db, assignment, updated.data, user);
  const refreshed = await documentFor(db, assignment.id, document.id);
  return { status: 200, payload: { document: refreshed || updated.data, automation: { email } } };
}
