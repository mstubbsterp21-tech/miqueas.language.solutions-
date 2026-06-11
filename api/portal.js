import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
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

const documentTypes = new Set([
  "resume",
  "w9",
  "credential_proof",
  "liability_insurance",
  "state_license",
  "work_sample",
]);

function json(response, status = 200) {
  return new Response(JSON.stringify(response), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const [, token] = header.match(/^Bearer\s+(.+)$/i) || [];
  return token || "";
}

function getRequestOrigin(request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

function cleanProfileInput(input = {}) {
  return allowedProfileFields.reduce((profile, field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      profile[field] = input[field];
    }
    return profile;
  }, {});
}

async function getSignedInUser(request) {
  if (!clerkSecretKey) {
    throw new Error("Missing CLERK_SECRET_KEY environment variable.");
  }

  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
  const verified = await clerkClient.verifyToken(token);
  const userId = verified?.sub;

  if (!userId) {
    return null;
  }

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

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

async function getCurrentProfile(supabase, user) {
  const { data, error } = await supabase
    .from("interpreters")
    .select("*")
    .eq("clerk_user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

async function loadPortal(supabase, user) {
  const profile = await getCurrentProfile(supabase, user);

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

  const { data: documents, error: documentsError } = await supabase
    .from("interpreter_documents")
    .select("*")
    .eq("interpreter_id", profile.id)
    .order("uploaded_at", { ascending: false });

  if (documentsError) throw documentsError;

  return { profile, documents: documents || [] };
}

async function saveProfile(supabase, user, body) {
  const currentProfile = await getCurrentProfile(supabase, user);
  const safeProfile = cleanProfileInput(body?.profile || {});

  const payload = {
    ...safeProfile,
    clerk_user_id: user.id,
    email: user.email,
    updated_at: new Date().toISOString(),
  };

  if (currentProfile?.id) {
    payload.id = currentProfile.id;
  }

  if (!payload.first_name && !currentProfile?.first_name) payload.first_name = user.firstName;
  if (!payload.last_name && !currentProfile?.last_name) payload.last_name = user.lastName;

  const { data, error } = await supabase
    .from("interpreters")
    .upsert(payload, { onConflict: "clerk_user_id" })
    .select()
    .single();

  if (error) throw error;

  return { profile: data };
}

async function createUploadUrl(supabase, user, body) {
  const profile = await getCurrentProfile(supabase, user);

  if (!profile?.id) {
    return json({ error: "Save your profile before uploading documents." }, 400);
  }

  const documentType = body?.documentType;
  const fileName = String(body?.fileName || "upload").replace(/[^a-zA-Z0-9._-]/g, "-");

  if (!documentTypes.has(documentType)) {
    return json({ error: "Invalid document type." }, 400);
  }

  const path = `${profile.id}/${documentType}/${Date.now()}-${fileName}`;
  const { data, error } = await supabase.storage
    .from("interpreter-documents")
    .createSignedUploadUrl(path);

  if (error) throw error;

  return { path, token: data.token, signedUrl: data.signedUrl };
}

async function recordUpload(supabase, user, body) {
  const profile = await getCurrentProfile(supabase, user);

  if (!profile?.id) {
    return json({ error: "Save your profile before recording documents." }, 400);
  }

  const documentType = body?.documentType;
  const fileName = String(body?.fileName || "Uploaded file");
  const storagePath = String(body?.storagePath || "");

  if (!documentTypes.has(documentType)) {
    return json({ error: "Invalid document type." }, 400);
  }

  if (!storagePath.startsWith(`${profile.id}/${documentType}/`)) {
    return json({ error: "Invalid storage path." }, 400);
  }

  const { data, error } = await supabase
    .from("interpreter_documents")
    .insert({
      interpreter_id: profile.id,
      document_type: documentType,
      file_name: fileName,
      storage_path: storagePath,
      status: "uploaded",
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  return { document: data };
}

async function loadAdminRoster(supabase, user) {
  if (!user.isAdmin) {
    return json({ error: "Admin access required." }, 403);
  }

  const { data, error } = await supabase
    .from("interpreters")
    .select("*, interpreter_documents(id, document_type, status)")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return { interpreters: data || [] };
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const user = await getSignedInUser(request);

    if (!user) {
      return json({ error: "Sign in is required." }, 401);
    }

    const supabase = getSupabaseAdmin();
    const url = new URL(request.url, getRequestOrigin(request));
    const action = url.searchParams.get("action") || "load";
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};

    if (request.method === "GET" && action === "load") {
      return json(await loadPortal(supabase, user));
    }

    if (request.method === "GET" && action === "adminRoster") {
      const response = await loadAdminRoster(supabase, user);
      return response instanceof Response ? response : json(response);
    }

    if (request.method === "POST" && action === "saveProfile") {
      return json(await saveProfile(supabase, user, body));
    }

    if (request.method === "POST" && action === "createUploadUrl") {
      const response = await createUploadUrl(supabase, user, body);
      return response instanceof Response ? response : json(response);
    }

    if (request.method === "POST" && action === "recordUpload") {
      const response = await recordUpload(supabase, user, body);
      return response instanceof Response ? response : json(response);
    }

    return json({ error: "Unsupported portal action." }, 400);
  } catch (error) {
    console.error("Portal API error", error);
    return json({ error: error.message || "Portal request failed." }, 500);
  }
}
