import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbAdminKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const adminEmails = (process.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const allowedProfileFields = [
  "first_name",
  "last_name",
  "phone",
  "city",
  "state",
  "credentials",
  "modalities",
  "areas_of_experience",
  "onsite_rate",
  "vri_rate",
  "travel_radius",
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

async function getSignedInUser(req) {
  if (!clerkKey) {
    throw new Error("Missing Clerk server key in Vercel.");
  }

  const token = getBearerToken(req);
  if (!token) return null;

  const clerkClient = createClerkClient({ secretKey: clerkKey });
  const verified = await clerkClient.verifyToken(token);
  const userId = verified?.sub;

  if (!userId) return null;

  const user = await clerkClient.users.getUser(userId);
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
  if (!dbUrl || !dbAdminKey) {
    throw new Error("Missing Supabase server settings in Vercel.");
  }

  return createClient(dbUrl, dbAdminKey, {
    auth: { persistSession: false },
  });
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
    .from("interpreter_documents")
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
  if (!user.isAdmin) {
    return { status: 403, payload: { error: "Admin access required." } };
  }

  const { data, error } = await db
    .from("interpreters")
    .select("*, interpreter_documents(id, document_type, status)")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return { status: 200, payload: { interpreters: data || [] } };
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

    sendJson(res, 400, { error: "Unsupported portal action." });
  } catch (error) {
    console.error("Portal API error", error);
    sendJson(res, 500, { error: error.message || "Portal request failed." });
  }
}
