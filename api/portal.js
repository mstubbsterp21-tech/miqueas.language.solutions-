import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbAdminKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const adminEmails = (process.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const interpreterDocumentBucket = "interpreter-documents";
const clientDocumentBucket = "client-documents";
const maxUploadBytes = 15 * 1024 * 1024;
const allowedFileExtensions = new Set(["pdf", "doc", "docx", "png", "jpg", "jpeg"]);
const assignmentStatuses = new Set(["draft", "pending_confirmation", "confirmed", "completed", "cancelled"]);
const paymentStatuses = new Set(["not_invoiced", "pending_payment", "paid", "void"]);

const allowedInterpreterProfileFields = [
  "first_name", "last_name", "email", "phone", "city", "state", "current_location",
  "preferred_contact_method", "credentials", "state_license", "state_license_details",
  "years_experience", "modalities", "areas_of_experience", "assignment_type_preference",
  "willing_to_travel", "technical_readiness_confirmed", "professional_liability_insurance",
  "onsite_rate", "vri_rate", "travel_radius", "roster_status", "admin_notes",
  "availability_sunday", "availability_monday", "availability_tuesday", "availability_wednesday",
  "availability_thursday", "availability_friday", "availability_saturday", "availability_morning",
  "availability_afternoon", "availability_evening", "availability_overnight",
];

const allowedClientProfileFields = [
  "organization_name", "primary_contact_name", "phone", "preferred_contact_method", "billing_email",
  "billing_phone", "address_line_1", "address_line_2", "city", "state", "postal_code", "country",
  "industry", "default_service_type", "default_delivery_mode", "communication_preferences",
  "billing_notes", "account_status",
];

const allowedAssignmentFields = [
  "service_type", "delivery_mode", "start_at", "end_at", "timezone", "location_name",
  "address_line_1", "address_line_2", "city", "state", "postal_code", "meeting_link",
  "deaf_participants", "hearing_participants", "language_preferences", "specialty",
  "team_requested", "cdi_requested", "onsite_contact_name", "onsite_contact_phone",
  "description", "preparation_materials", "purchase_order_number", "client_reference",
];

function sendJson(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [, token] = header.match(/^Bearer\s+(.+)$/i) || [];
  return token || "";
}

function getRequestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function cleanInput(input = {}, allowedFields = []) {
  return allowedFields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) result[field] = input[field];
    return result;
  }, {});
}

function decodeJwtPayload(token) {
  const encodedPayload = token.split(".")[1] || "";
  return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
}

function getClerkClient() {
  if (!clerkKey) throw new Error("Missing Clerk server key in Vercel.");
  return createClerkClient({ secretKey: clerkKey });
}

async function getSignedInUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  const clerkClient = getClerkClient();
  const claims = decodeJwtPayload(token);
  if (!claims?.sid || !claims?.sub) return null;

  const clerkSession = await clerkClient.sessions.getSession(claims.sid);
  if (clerkSession?.userId !== claims.sub) return null;

  const user = await clerkClient.users.getUser(claims.sub);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const metadataRole = String(user.publicMetadata?.portalRole || "").toLowerCase();

  return {
    id: user.id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email,
    isAdmin: adminEmails.includes(email),
    metadataRole: metadataRole === "client" || metadataRole === "interpreter" ? metadataRole : "",
    organizationName: String(user.publicMetadata?.organizationName || ""),
  };
}

function getDb() {
  if (!dbUrl || !dbAdminKey) throw new Error("Missing Supabase server settings in Vercel.");
  return createClient(dbUrl, dbAdminKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function getInterpreter(db, userId) {
  const { data, error } = await db.from("interpreters").select("*").eq("clerk_user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

async function getClient(db, userId) {
  const { data, error } = await db.from("clients").select("*").eq("clerk_user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureClient(db, user) {
  const existing = await getClient(db, user.id);
  if (existing) return existing;

  const { data, error } = await db
    .from("clients")
    .insert({
      clerk_user_id: user.id,
      email: user.email,
      primary_contact_name: [user.firstName, user.lastName].filter(Boolean).join(" "),
      organization_name: user.organizationName || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function loadInterpreterWorkspace(db, user, profile = null) {
  const interpreter = profile || (await getInterpreter(db, user.id));
  if (!interpreter) {
    return {
      profile: {
        clerk_user_id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        roster_status: "pending_profile",
        screening_status: "not_started",
      },
      documents: [],
      documentRequests: [],
    };
  }

  const [{ data: documents, error: documentError }, { data: requests, error: requestError }] = await Promise.all([
    db.from("interpreter_documents").select("*").eq("interpreter_id", interpreter.id).order("uploaded_at", { ascending: false }),
    db.from("document_requests").select("*").eq("interpreter_id", interpreter.id).order("created_at", { ascending: false }),
  ]);
  if (documentError) throw documentError;
  if (requestError) throw requestError;
  return { profile: interpreter, documents: documents || [], documentRequests: requests || [] };
}

async function loadClientWorkspace(db, user, profile = null) {
  const client = profile || (await ensureClient(db, user));
  const [documentResult, assignmentResult, requestResult] = await Promise.all([
    db.from("client_documents").select("*").eq("client_id", client.id).order("uploaded_at", { ascending: false }),
    db.from("assignments").select("*").eq("client_id", client.id).order("start_at", { ascending: false }),
    db.from("document_requests").select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
  ]);
  if (documentResult.error) throw documentResult.error;
  if (assignmentResult.error) throw assignmentResult.error;
  if (requestResult.error) throw requestResult.error;
  return {
    profile: client,
    documents: documentResult.data || [],
    assignments: assignmentResult.data || [],
    documentRequests: requestResult.data || [],
  };
}

async function loadAdminOverview(db, user) {
  if (!user.isAdmin) return null;
  const [clientResult, interpreterResult, assignmentResult, requestResult] = await Promise.all([
    db.from("clients").select("*, client_documents(*)").order("updated_at", { ascending: false }),
    db.from("interpreters").select("*, interpreter_documents(*)").order("updated_at", { ascending: false }),
    db.from("assignments").select("*, clients(organization_name, primary_contact_name, email)").order("start_at", { ascending: false }),
    db.from("document_requests").select("*").order("created_at", { ascending: false }),
  ]);
  for (const result of [clientResult, interpreterResult, assignmentResult, requestResult]) {
    if (result.error) throw result.error;
  }
  return {
    clients: clientResult.data || [],
    interpreters: interpreterResult.data || [],
    assignments: assignmentResult.data || [],
    documentRequests: requestResult.data || [],
  };
}

async function loadWorkspace(db, user) {
  const [interpreter, client, preference] = await Promise.all([
    getInterpreter(db, user.id),
    getClient(db, user.id),
    db.from("portal_preferences").select("default_portal").eq("clerk_user_id", user.id).maybeSingle(),
  ]);
  if (preference.error) throw preference.error;

  let role = user.metadataRole;
  if (!role) role = client ? "client" : "interpreter";

  let clientWorkspace = null;
  let interpreterWorkspace = null;
  if (client || role === "client") clientWorkspace = await loadClientWorkspace(db, user, client || undefined);
  if (interpreter || role === "interpreter") interpreterWorkspace = await loadInterpreterWorkspace(db, user, interpreter || undefined);

  const availablePortals = user.isAdmin
    ? ["admin", "client", "interpreter"]
    : [clientWorkspace ? "client" : null, interpreterWorkspace ? "interpreter" : null].filter(Boolean);
  const defaultPortal = user.isAdmin
    ? preference.data?.default_portal || "admin"
    : availablePortals[0] || role;

  return {
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin },
    availablePortals,
    defaultPortal,
    client: clientWorkspace,
    interpreter: interpreterWorkspace,
    admin: await loadAdminOverview(db, user),
  };
}

async function saveInterpreterProfile(db, user, body) {
  const currentProfile = await getInterpreter(db, user.id);
  const safeProfile = cleanInput(body?.profile || {}, allowedInterpreterProfileFields);
  const payload = {
    ...safeProfile,
    clerk_user_id: user.id,
    email: user.email,
    updated_at: new Date().toISOString(),
  };
  if (currentProfile?.id) payload.id = currentProfile.id;
  if (!payload.first_name && !currentProfile?.first_name) payload.first_name = user.firstName;
  if (!payload.last_name && !currentProfile?.last_name) payload.last_name = user.lastName;

  const { data, error } = await db.from("interpreters").upsert(payload, { onConflict: "clerk_user_id" }).select().single();
  if (error) throw error;
  return { profile: data };
}

async function saveClientProfile(db, user, body) {
  let client;
  if (user.isAdmin && body?.clientId) {
    const result = await db.from("clients").select("*").eq("id", body.clientId).maybeSingle();
    if (result.error) throw result.error;
    client = result.data;
  } else {
    client = await ensureClient(db, user);
  }
  if (!client) return { status: 404, payload: { error: "Client profile not found." } };

  const safeProfile = cleanInput(body?.profile || {}, allowedClientProfileFields);
  const merged = { ...client, ...safeProfile };
  const onboardingComplete = Boolean(
    merged.organization_name && merged.primary_contact_name && merged.email && merged.phone && merged.billing_email
  );
  const { data, error } = await db
    .from("clients")
    .update({ ...safeProfile, onboarding_complete: onboardingComplete, updated_at: new Date().toISOString() })
    .eq("id", client.id)
    .select()
    .single();
  if (error) throw error;
  return { status: 200, payload: { profile: data } };
}

async function createAssignment(db, user, body) {
  let client;
  if (user.isAdmin && body?.clientId) {
    const result = await db.from("clients").select("*").eq("id", body.clientId).maybeSingle();
    if (result.error) throw result.error;
    client = result.data;
  } else {
    client = await getClient(db, user.id);
  }
  if (!client) return { status: 403, payload: { error: "A client profile is required to request an interpreter." } };

  const safeAssignment = cleanInput(body?.assignment || {}, allowedAssignmentFields);
  if (!safeAssignment.service_type || !safeAssignment.delivery_mode || !safeAssignment.start_at) {
    return { status: 400, payload: { error: "Service type, delivery mode, and start time are required." } };
  }
  const { data, error } = await db
    .from("assignments")
    .insert({
      ...safeAssignment,
      client_id: client.id,
      requested_by_clerk_user_id: user.id,
      status: "pending_confirmation",
      payment_status: "not_invoiced",
    })
    .select()
    .single();
  if (error) throw error;
  return { status: 201, payload: { assignment: data } };
}

async function resolveOwner(db, user, audienceType, ownerId) {
  if (audienceType === "client") {
    if (user.isAdmin && ownerId) {
      const result = await db.from("clients").select("*").eq("id", ownerId).maybeSingle();
      if (result.error) throw result.error;
      return result.data;
    }
    return getClient(db, user.id);
  }
  if (audienceType === "interpreter") {
    if (user.isAdmin && ownerId) {
      const result = await db.from("interpreters").select("*").eq("id", ownerId).maybeSingle();
      if (result.error) throw result.error;
      return result.data;
    }
    return getInterpreter(db, user.id);
  }
  return null;
}

function sanitizeFileName(fileName) {
  return String(fileName || "document")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-120);
}

function validateUpload(fileName, fileSize) {
  const extension = sanitizeFileName(fileName).split(".").pop()?.toLowerCase();
  if (!extension || !allowedFileExtensions.has(extension)) return "Upload a PDF, DOC, DOCX, PNG, or JPG file.";
  if (Number(fileSize || 0) > maxUploadBytes) return "Files must be 15 MB or smaller.";
  return "";
}

async function createUploadUrl(db, user, body) {
  const audienceType = body?.audienceType === "client" ? "client" : "interpreter";
  const owner = await resolveOwner(db, user, audienceType, body?.ownerId);
  if (!owner) return { status: 400, payload: { error: `Save the ${audienceType} profile before uploading documents.` } };
  const validationError = validateUpload(body?.fileName, body?.fileSize);
  if (validationError) return { status: 400, payload: { error: validationError } };

  const safeType = String(body?.documentType || "other").replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  const path = `${audienceType}s/${owner.id}/${safeType}/${Date.now()}-${randomUUID()}-${sanitizeFileName(body.fileName)}`;
  const bucket = audienceType === "client" ? clientDocumentBucket : interpreterDocumentBucket;
  const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
  if (error) throw error;
  return { status: 200, payload: { bucket, path, token: data.token, signedUrl: data.signedUrl } };
}

async function recordUpload(db, user, body) {
  const audienceType = body?.audienceType === "client" ? "client" : "interpreter";
  const owner = await resolveOwner(db, user, audienceType, body?.ownerId);
  if (!owner) return { status: 400, payload: { error: "Portal profile not found." } };
  if (!body?.storagePath || !body?.fileName || !body?.documentType) {
    return { status: 400, payload: { error: "Incomplete upload details." } };
  }

  const table = audienceType === "client" ? "client_documents" : "interpreter_documents";
  const ownerColumn = audienceType === "client" ? "client_id" : "interpreter_id";
  const bucket = audienceType === "client" ? clientDocumentBucket : interpreterDocumentBucket;
  let existing = null;
  if (body?.replaceDocumentId) {
    const result = await db.from(table).select("*").eq("id", body.replaceDocumentId).eq(ownerColumn, owner.id).maybeSingle();
    if (result.error) throw result.error;
    existing = result.data;
  } else if (audienceType === "client") {
    const result = await db.from(table).select("*").eq(ownerColumn, owner.id).eq("document_type", body.documentType).maybeSingle();
    if (result.error) throw result.error;
    existing = result.data;
  }

  let document;
  if (existing) {
    const result = await db
      .from(table)
      .update({
        document_type: body.documentType,
        file_name: body.fileName,
        storage_path: body.storagePath,
        status: "uploaded",
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
        reviewed_by: null,
        reviewed_at: null,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (result.error) throw result.error;
    document = result.data;
    if (existing.storage_path && existing.storage_path !== body.storagePath) {
      await db.storage.from(bucket).remove([existing.storage_path]);
    }
  } else {
    const result = await db
      .from(table)
      .insert({
        [ownerColumn]: owner.id,
        document_type: body.documentType,
        file_name: body.fileName,
        storage_path: body.storagePath,
        status: "uploaded",
        uploaded_by: user.id,
      })
      .select()
      .single();
    if (result.error) throw result.error;
    document = result.data;
  }

  const requestQuery = db
    .from("document_requests")
    .update({ status: "fulfilled", fulfilled_document_id: document.id, fulfilled_at: new Date().toISOString() })
    .eq("audience_type", audienceType)
    .eq(audienceType === "client" ? "client_id" : "interpreter_id", owner.id)
    .eq("document_type", body.documentType)
    .in("status", ["requested", "viewed", "overdue"]);
  await requestQuery;
  return { status: 200, payload: { document } };
}

async function findOwnedDocument(db, user, body) {
  const audienceType = body?.audienceType === "client" ? "client" : "interpreter";
  const table = audienceType === "client" ? "client_documents" : "interpreter_documents";
  const ownerColumn = audienceType === "client" ? "client_id" : "interpreter_id";
  const owner = await resolveOwner(db, user, audienceType, body?.ownerId);
  if (!owner) return { audienceType, table, owner, document: null };
  const result = await db.from(table).select("*").eq("id", body?.documentId).eq(ownerColumn, owner.id).maybeSingle();
  if (result.error) throw result.error;
  return { audienceType, table, owner, document: result.data };
}

async function createDocumentOpenLink(db, user, body) {
  const result = await findOwnedDocument(db, user, body);
  if (!result.document?.storage_path) return { status: 404, payload: { error: "Uploaded file was not found." } };
  const bucket = result.audienceType === "client" ? clientDocumentBucket : interpreterDocumentBucket;
  const { data, error } = await db.storage.from(bucket).createSignedUrl(result.document.storage_path, 300);
  if (error) throw error;
  return { status: 200, payload: { url: data.signedUrl } };
}

async function deleteDocument(db, user, body) {
  const result = await findOwnedDocument(db, user, body);
  if (!result.document) return { status: 404, payload: { error: "Document not found." } };
  const bucket = result.audienceType === "client" ? clientDocumentBucket : interpreterDocumentBucket;
  const { error: storageError } = await db.storage.from(bucket).remove([result.document.storage_path]);
  if (storageError) throw storageError;
  const { error } = await db.from(result.table).delete().eq("id", result.document.id);
  if (error) throw error;
  return { status: 200, payload: { deletedId: result.document.id } };
}

async function adminUpdateAssignment(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!body?.assignmentId) return { status: 400, payload: { error: "Assignment ID is required." } };
  const updates = {};
  if (body.status) {
    if (!assignmentStatuses.has(body.status)) return { status: 400, payload: { error: "Invalid assignment status." } };
    updates.status = body.status;
    if (body.status === "confirmed") updates.confirmed_at = new Date().toISOString();
    if (body.status === "completed") updates.completed_at = new Date().toISOString();
  }
  if (body.paymentStatus) {
    if (!paymentStatuses.has(body.paymentStatus)) return { status: 400, payload: { error: "Invalid payment status." } };
    updates.payment_status = body.paymentStatus;
    if (body.paymentStatus === "paid") updates.paid_at = new Date().toISOString();
  }
  if (Object.prototype.hasOwnProperty.call(body, "invoiceNumber")) updates.invoice_number = body.invoiceNumber || null;
  if (Object.prototype.hasOwnProperty.call(body, "invoiceAmount")) updates.invoice_amount = body.invoiceAmount || null;
  if (Object.prototype.hasOwnProperty.call(body, "adminNotes")) updates.admin_notes = body.adminNotes || null;
  updates.updated_at = new Date().toISOString();
  const { data, error } = await db.from("assignments").update(updates).eq("id", body.assignmentId).select("*, clients(organization_name, primary_contact_name, email)").single();
  if (error) throw error;
  return { status: 200, payload: { assignment: data } };
}

async function adminCreateDocumentRequest(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const audienceType = body?.audienceType === "client" ? "client" : "interpreter";
  if (!body?.ownerId || !body?.documentType || !body?.title) {
    return { status: 400, payload: { error: "Recipient, document type, and title are required." } };
  }
  const payload = {
    audience_type: audienceType,
    client_id: audienceType === "client" ? body.ownerId : null,
    interpreter_id: audienceType === "interpreter" ? body.ownerId : null,
    document_type: body.documentType,
    title: body.title,
    instructions: body.instructions || null,
    due_date: body.dueDate || null,
    created_by: user.id,
  };
  const { data, error } = await db.from("document_requests").insert(payload).select().single();
  if (error) throw error;
  return { status: 201, payload: { request: data } };
}

async function savePortalPreference(db, user, body) {
  const portal = String(body?.defaultPortal || "");
  const allowed = user.isAdmin ? new Set(["admin", "client", "interpreter"]) : new Set([user.metadataRole || "interpreter"]);
  if (!allowed.has(portal)) return { status: 400, payload: { error: "That portal is not available for this account." } };
  const { data, error } = await db
    .from("portal_preferences")
    .upsert({ clerk_user_id: user.id, default_portal: portal, updated_at: new Date().toISOString() }, { onConflict: "clerk_user_id" })
    .select()
    .single();
  if (error) throw error;
  return { status: 200, payload: { preference: data } };
}

async function invitePortalUser(req, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const role = body?.role === "client" ? "client" : "interpreter";
  const emailAddress = String(body?.email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(emailAddress)) return { status: 400, payload: { error: "Enter a valid email address." } };
  const origin = String(req.headers.origin || `https://${req.headers.host || "miqueaslanguagesolutions.com"}`).replace(/\/$/, "");
  const clerkClient = getClerkClient();
  const invitation = await clerkClient.invitations.createInvitation({
    emailAddress,
    redirectUrl: `${origin}/login`,
    publicMetadata: {
      portalRole: role,
      ...(role === "client" && body?.organizationName ? { organizationName: String(body.organizationName) } : {}),
    },
    ignoreExisting: true,
  });
  return { status: 201, payload: { invitation: { id: invitation.id, emailAddress, role, status: invitation.status } } };
}

async function loadAdminRoster(db, user) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const { data, error } = await db.from("interpreters").select("*, interpreter_documents(*)").order("updated_at", { ascending: false });
  if (error) throw error;
  return { status: 200, payload: { interpreters: data || [] } };
}

async function adminUpdateInterpreterProfile(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!body?.interpreterId) return { status: 400, payload: { error: "Interpreter ID is required." } };
  const safeProfile = cleanInput(body?.profile || {}, allowedInterpreterProfileFields);
  const { data, error } = await db
    .from("interpreters")
    .update({ ...safeProfile, updated_at: new Date().toISOString() })
    .eq("id", body.interpreterId)
    .select("*, interpreter_documents(*)")
    .single();
  if (error) throw error;
  return { status: 200, payload: { interpreter: data } };
}

async function adminCreateDocumentLink(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const result = await db.from("interpreter_documents").select("*").eq("id", body?.documentId).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data?.storage_path) return { status: 404, payload: { error: "Uploaded file was not found." } };
  const { data, error } = await db.storage.from(interpreterDocumentBucket).createSignedUrl(result.data.storage_path, 300);
  if (error) throw error;
  return { status: 200, payload: { url: data.signedUrl } };
}

export default async function handler(req, res) {
  try {
    const user = await getSignedInUser(req);
    if (!user) return sendJson(res, 401, { error: "Sign in is required." });

    const db = getDb();
    const action = req.query?.action || "loadWorkspace";
    const body = req.method === "POST" ? getRequestBody(req) : {};

    if (req.method === "GET" && action === "loadWorkspace") return sendJson(res, 200, await loadWorkspace(db, user));
    if (req.method === "GET" && action === "load") return sendJson(res, 200, await loadInterpreterWorkspace(db, user));
    if (req.method === "POST" && action === "saveProfile") return sendJson(res, 200, await saveInterpreterProfile(db, user, body));
    if (req.method === "POST" && action === "saveClientProfile") {
      const result = await saveClientProfile(db, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "createAssignment") {
      const result = await createAssignment(db, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "createUploadUrl") {
      const result = await createUploadUrl(db, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "recordUpload") {
      const result = await recordUpload(db, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "createDocumentOpenLink") {
      const result = await createDocumentOpenLink(db, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "deleteDocument") {
      const result = await deleteDocument(db, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "adminUpdateAssignment") {
      const result = await adminUpdateAssignment(db, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "adminCreateDocumentRequest") {
      const result = await adminCreateDocumentRequest(db, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "savePortalPreference") {
      const result = await savePortalPreference(db, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "invitePortalUser") {
      const result = await invitePortalUser(req, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "GET" && action === "adminRoster") {
      const result = await loadAdminRoster(db, user);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "adminUpdateInterpreterProfile") {
      const result = await adminUpdateInterpreterProfile(db, user, body);
      return sendJson(res, result.status, result.payload);
    }
    if (req.method === "POST" && action === "adminCreateDocumentLink") {
      const result = await adminCreateDocumentLink(db, user, body);
      return sendJson(res, result.status, result.payload);
    }

    return sendJson(res, 400, { error: "Unsupported portal action." });
  } catch (error) {
    console.error("Portal API error", error);
    return sendJson(res, 500, { error: error.message || "Portal request failed." });
  }
}
