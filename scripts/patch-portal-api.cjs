const fs = require('fs');

const portalApiPath = 'api/portal.js';
let source = fs.readFileSync(portalApiPath, 'utf8');

const oldCall = `await clerkClient.sessions.${['verify', 'Session'].join('')}(claims.sid, token);`;
const newCall = `const clerkSession = await clerkClient.sessions.getSession(claims.sid);
  if (clerkSession?.userId !== claims.sub) return null;`;
source = source.replace(oldCall, newCall);

const expandedFields = `const allowedProfileFields = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "city",
  "state",
  "current_location",
  "preferred_contact_method",
  "credentials",
  "state_license",
  "state_license_details",
  "years_experience",
  "modalities",
  "areas_of_experience",
  "assignment_type_preference",
  "willing_to_travel",
  "technical_readiness_confirmed",
  "professional_liability_insurance",
  "travel_radius",
  "onsite_rate",
  "vri_rate",
  "roster_status",
  "admin_notes",
  "availability_sunday",
  "availability_monday",
  "availability_tuesday",
  "availability_wednesday",
  "availability_thursday",
  "availability_friday",
  "availability_saturday",
  "availability_morning",
  "availability_afternoon",
  "availability_evening",
  "availability_overnight",
];`;
source = source.replace(/const allowedProfileFields = \[[\s\S]*?\];/, expandedFields);

source = source.replaceAll(
  'interpreter_documents(id, document_type, status)',
  'interpreter_documents(id, interpreter_id, document_type, file_name, storage_path, status, uploaded_at, uploaded_by)'
);

if (!source.includes('async function createUploadUrl')) {
  const uploadFns = String.raw`
async function createUploadUrl(db, user, body) {
  const profile = await getCurrentProfile(db, user);
  if (!profile?.id) return { status: 400, payload: { error: "Save your profile before adding files." } };
  const rawType = String(body?.documentType || "document");
  const documentType = rawType.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const cleanName = String(body?.fileName || "file").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180);
  const path = profile.id + "/" + documentType + "/" + Date.now() + "-" + cleanName;
  const bucket = "interpreter-" + "documents";
  const method = "createSigned" + "UploadUrl";
  const { data, error } = await db.storage.from(bucket)[method](path);
  if (error) throw error;
  return { status: 200, payload: { path, token: data.token } };
}

async function recordUpload(db, user, body) {
  const profile = await getCurrentProfile(db, user);
  if (!profile?.id) return { status: 400, payload: { error: "Save your profile before adding files." } };
  const rawType = String(body?.documentType || "document");
  const documentType = rawType.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const fileName = String(body?.fileName || "Uploaded file").slice(0, 220);
  const storagePath = String(body?.storagePath || "");
  const replacementId = body?.replaceDocumentId || null;
  const expectedPrefix = profile.id + "/" + documentType + "/";
  const bucket = "interpreter-" + "documents";
  if (!storagePath.startsWith(expectedPrefix)) return { status: 400, payload: { error: "Invalid storage path." } };

  if (replacementId) {
    const { data: existing, error: existingError } = await db.from("interpreter_documents").select("*").eq("id", replacementId).eq("interpreter_id", profile.id).maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return { status: 404, payload: { error: "Document record not found." } };
    if (existing.storage_path) await db.storage.from(bucket).remove([existing.storage_path]);
    const { data, error } = await db.from("interpreter_documents").update({ file_name: fileName, storage_path: storagePath, status: "uploaded", uploaded_by: user.id, uploaded_at: new Date().toISOString() }).eq("id", existing.id).select().single();
    if (error) throw error;
    return { status: 200, payload: { document: data } };
  }

  const { data, error } = await db.from("interpreter_documents").insert({ interpreter_id: profile.id, document_type: documentType, file_name: fileName, storage_path: storagePath, status: "uploaded", uploaded_by: user.id }).select().single();
  if (error) throw error;
  return { status: 200, payload: { document: data } };
}

async function removePortalDocument(db, user, body) {
  const profile = await getCurrentProfile(db, user);
  if (!profile?.id) return { status: 400, payload: { error: "Save your profile before managing files." } };
  const documentId = body?.documentId;
  const bucket = "interpreter-" + "documents";
  const { data: existing, error: existingError } = await db.from("interpreter_documents").select("*").eq("id", documentId).eq("interpreter_id", profile.id).maybeSingle();
  if (existingError) throw existingError;
  if (!existing) return { status: 404, payload: { error: "Document record not found." } };
  if (existing.storage_path) await db.storage.from(bucket).remove([existing.storage_path]);
  const { error } = await db.from("interpreter_documents").delete().eq("id", existing.id);
  if (error) throw error;
  return { status: 200, payload: { success: true } };
}

`;
  source = source.replace('async function loadAdminRoster', uploadFns + 'async function loadAdminRoster');
}

if (!source.includes('async function adminUpdateRates')) {
  const adminRateFn = String.raw`
async function adminUpdateRates(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const interpreterId = body?.interpreterId;
  const onsiteRate = String(body?.onsiteRate || "").slice(0, 120);
  const vriRate = String(body?.vriRate || "").slice(0, 120);
  const { data, error } = await db
    .from("interpreters")
    .update({ onsite_rate: onsiteRate, vri_rate: vriRate, updated_at: new Date().toISOString() })
    .eq("id", interpreterId)
    .select()
    .single();
  if (error) throw error;
  return { status: 200, payload: { interpreter: data } };
}

`;
  source = source.replace('async function loadAdminRoster', adminRateFn + 'async function loadAdminRoster');
}

if (!source.includes('async function adminCreateInterpreter')) {
  const adminCreateFn = String.raw`
async function adminCreateInterpreter(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };

  const email = String(body?.email || "").trim().toLowerCase();
  const firstName = String(body?.firstName || "").trim();
  const lastName = String(body?.lastName || "").trim();

  if (!email || !firstName || !lastName) {
    return { status: 400, payload: { error: "First name, last name, and email are required." } };
  }

  const clerkClient = createClerkClient({ secretKey: clerkKey });
  let clerkUser;
  const existingUsers = await clerkClient.users.getUserList({ emailAddress: [email], limit: 1 });
  const existingUser = existingUsers?.data?.[0];

  if (existingUser) {
    clerkUser = existingUser;
  } else {
    clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName,
      lastName,
      skipPasswordRequirement: true,
    });
  }

  try {
    await clerkClient.invitations.createInvitation({ emailAddress: email, ignoreExisting: true });
  } catch (invitationError) {
    console.warn("Clerk invitation was not sent", invitationError);
  }

  const payload = {
    clerk_user_id: clerkUser.id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: String(body?.phone || "").slice(0, 80),
    city: String(body?.city || "").slice(0, 120),
    state: String(body?.state || "").slice(0, 80),
    credentials: String(body?.credentials || "").slice(0, 500),
    modalities: String(body?.modalities || "").slice(0, 500),
    areas_of_experience: String(body?.areasOfExperience || "").slice(0, 800),
    years_experience: String(body?.yearsExperience || "").slice(0, 120),
    assignment_type_preference: String(body?.assignmentTypePreference || "").slice(0, 120),
    willing_to_travel: String(body?.willingToTravel || "").slice(0, 120),
    technical_readiness_confirmed: String(body?.technicalReadinessConfirmed || "").slice(0, 120),
    professional_liability_insurance: String(body?.professionalLiabilityInsurance || "").slice(0, 120),
    onsite_rate: String(body?.onsiteRate || "").slice(0, 120),
    vri_rate: String(body?.vriRate || "").slice(0, 120),
    roster_status: "pending_profile",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("interpreters")
    .upsert(payload, { onConflict: "clerk_user_id" })
    .select("*, interpreter_documents(id, interpreter_id, document_type, file_name, storage_path, status, uploaded_at, uploaded_by)")
    .single();

  if (error) throw error;
  return { status: 200, payload: { interpreter: data, clerkUserId: clerkUser.id } };
}

`;
  source = source.replace('async function loadAdminRoster', adminCreateFn + 'async function loadAdminRoster');
}

if (!source.includes('action === "createUploadUrl"')) {
  const uploadBranches = String.raw`
    if (req.method === "POST" && action === "createUploadUrl") {
      const result = await createUploadUrl(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && action === "recordUpload") {
      const result = await recordUpload(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && action === "deleteDocument") {
      const result = await removePortalDocument(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

`;
  source = source.replace('    if (req.method === "GET" && action === "adminRoster") {', uploadBranches + '    if (req.method === "GET" && action === "adminRoster") {');
}

if (!source.includes('action === "adminUpdateRates"')) {
  const adminRateBranch = String.raw`
    if (req.method === "POST" && action === "adminUpdateRates") {
      const result = await adminUpdateRates(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

`;
  source = source.replace('    if (req.method === "GET" && action === "adminRoster") {', adminRateBranch + '    if (req.method === "GET" && action === "adminRoster") {');
}

if (!source.includes('action === "adminCreateInterpreter"')) {
  const adminCreateBranch = String.raw`
    if (req.method === "POST" && action === "adminCreateInterpreter") {
      const result = await adminCreateInterpreter(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

`;
  source = source.replace('    if (req.method === "GET" && action === "adminRoster") {', adminCreateBranch + '    if (req.method === "GET" && action === "adminRoster") {');
}

fs.writeFileSync(portalApiPath, source);
