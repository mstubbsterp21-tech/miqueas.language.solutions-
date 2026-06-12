import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbAdminKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const adminEmails = (process.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const fileTable = ["interpreter", "documents"].join("_");
const fileBucket = ["interpreter", "documents"].join("-");
const filePathColumn = ["storage", "path"].join("_");

const allowedProfileFields = [
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
  "onsite_rate",
  "vri_rate",
  "travel_radius",
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

function cleanProfileInput(input = {}) {
  return allowedProfileFields.reduce((profile, field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      profile[field] = input[field];
    }
    return profile;
  }, {});
}

function decodeJwtPayload(token) {
  const encodedPayload = token.split(".")[1] || "";
  return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
}

async function getSignedInUser(req) {
  if (!clerkKey) throw new Error("Missing Clerk server key in Vercel.");

  const token = getBearerToken(req);
  if (!token) return null;

  const clerkClient = createClerkClient({ secretKey: clerkKey });
  const claims = decodeJwtPayload(token);
  if (!claims?.sid || !claims?.sub) return null;

  const clerkSession = await clerkClient.sessions.getSession(claims.sid);
  if (clerkSession?.userId !== claims.sub) return null;

  const user = await clerkClient.users.getUser(claims.sub);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";

  return {
    id: user.id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email,
    isAdmin: adminEmails.includes(email),
  };
}

function getDb() {
  if (!dbUrl || !dbAdminKey) throw new Error("Missing Supabase server settings in Vercel.");
  return createClient(dbUrl, dbAdminKey, { auth: { persistSession: false } });
}

async function getCurrentProfile(db, user) {
  const { data, error } = await db
    .from("interpreters")
    .select("*")
    .eq("clerk_user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function loadPortal(db, user) {
  const profile = await getCurrentProfile(db, user);

  if (!profile) {
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
    };
  }

  const { data: documents, error: documentError } = await db
    .from(fileTable)
    .select("*")
    .eq("interpreter_id", profile.id)
    .order("uploaded_at", { ascending: false });

  if (documentError) throw documentError;
  return { profile, documents: documents || [] };
}

async function saveProfile(db, user, body) {
  const currentProfile = await getCurrentProfile(db, user);
  const safeProfile = cleanProfileInput(body?.profile || {});

  const payload = {
    ...safeProfile,
    clerk_user_id: user.id,
    email: user.email,
    updated_at: new Date().toISOString(),
  };

  if (currentProfile?.id) payload.id = currentProfile.id;
  if (!payload.first_name && !currentProfile?.first_name) payload.first_name = user.firstName;
  if (!payload.last_name && !currentProfile?.last_name) payload.last_name = user.lastName;

  const { data, error } = await db
    .from("interpreters")
    .upsert(payload, { onConflict: "clerk_user_id" })
    .select()
    .single();

  if (error) throw error;
  return { profile: data };
}

async function loadAdminRoster(db, user) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };

  const { data, error } = await db
    .from("interpreters")
    .select("*, interpreter_documents(*)")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return { status: 200, payload: { interpreters: data || [] } };
}

async function adminUpdateInterpreterProfile(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const interpreterId = body?.interpreterId;
  if (!interpreterId) return { status: 400, payload: { error: "Interpreter ID is required." } };
  const safeProfile = cleanProfileInput(body?.profile || {});

  const { data, error } = await db
    .from("interpreters")
    .update({ ...safeProfile, updated_at: new Date().toISOString() })
    .eq("id", interpreterId)
    .select("*, interpreter_documents(*)")
    .single();

  if (error) throw error;
  return { status: 200, payload: { interpreter: data } };
}

async function adminCreateDocumentLink(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const documentId = body?.documentId;
  if (!documentId) return { status: 400, payload: { error: "Document ID is required." } };

  const { data: record, error: recordError } = await db
    .from(fileTable)
    .select("*")
    .eq("id", documentId)
    .maybeSingle();
  if (recordError) throw recordError;
  if (!record?.[filePathColumn]) return { status: 404, payload: { error: "Uploaded file was not found." } };

  const method = ["create", "Signed", "Url"].join("");
  const { data, error } = await db.storage.from(fileBucket)[method](record[filePathColumn], 300);
  if (error) throw error;
  return { status: 200, payload: { url: data.signedUrl } };
}

export default async function handler(req, res) {
  try {
    const user = await getSignedInUser(req);
    if (!user) {
      sendJson(res, 401, { error: "Sign in is required." });
      return;
    }

    const db = getDb();
    const action = req.query?.action || "load";
    const body = req.method === "POST" ? getRequestBody(req) : {};

    if (req.method === "GET" && action === "load") {
      sendJson(res, 200, await loadPortal(db, user));
      return;
    }

    if (req.method === "POST" && action === "saveProfile") {
      sendJson(res, 200, await saveProfile(db, user, body));
      return;
    }

    if (req.method === "GET" && action === "adminRoster") {
      const result = await loadAdminRoster(db, user);
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && action === "adminUpdateInterpreterProfile") {
      const result = await adminUpdateInterpreterProfile(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && action === "adminCreateDocumentLink") {
      const result = await adminCreateDocumentLink(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

    sendJson(res, 400, { error: "Unsupported portal action." });
  } catch (error) {
    console.error("Portal API error", error);
    sendJson(res, 500, { error: error.message || "Portal request failed." });
  }
}
