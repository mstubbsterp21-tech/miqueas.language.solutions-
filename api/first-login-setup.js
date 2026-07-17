import { createClerkClient } from "@clerk/backend";
import {
  audit,
  clientFor,
  database,
  interpreterFor,
  readBody,
  send,
  signedInUser,
} from "./_shared/ops-v2-core.js";

const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const allowedRoles = new Set(["client", "interpreter"]);

const clientFields = [
  "organization_name",
  "primary_contact_name",
  "phone",
  "preferred_contact_method",
  "billing_email",
  "billing_phone",
  "address_line_1",
  "address_line_2",
  "city",
  "state",
  "postal_code",
  "country",
  "industry",
  "default_service_type",
  "default_delivery_mode",
  "communication_preferences",
];

const interpreterFields = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "address_line_1",
  "address_line_2",
  "city",
  "state",
  "postal_code",
  "country",
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
  "availability_status",
  "availability_timezone",
  "availability_sunday",
  "availability_monday",
  "availability_tuesday",
  "availability_wednesday",
  "availability_thursday",
  "availability_friday",
  "availability_saturday",
];

const dayFields = [
  "availability_sunday",
  "availability_monday",
  "availability_tuesday",
  "availability_wednesday",
  "availability_thursday",
  "availability_friday",
  "availability_saturday",
];
const availabilityStatuses = new Set(["scheduled", "contact_me", "unknown", "not_accepting"]);
const portalTimeZones = new Set([
  "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix",
  "America/Los_Angeles", "America/Anchorage", "America/Adak", "Pacific/Honolulu",
  "America/Puerto_Rico", "Pacific/Pago_Pago", "Pacific/Guam",
]);

function clean(input, fields) {
  return fields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(input || {}, field)) {
      result[field] = typeof input[field] === "string" ? input[field].trim() : input[field];
    }
    return result;
  }, {});
}

function present(value) {
  return Boolean(String(value || "").trim());
}

function validEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || "").trim());
}

function validTimeZone(value) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

async function savePortalTimeZone(db, user, role, value) {
  const timeZone = String(value || "America/New_York").trim();
  if (!portalTimeZones.has(timeZone)) return { error: "Choose a supported United States time zone." };
  const result = await db.from("portal_preferences").upsert({
    clerk_user_id: user.id,
    default_portal: role,
    time_zone: timeZone,
    updated_at: new Date().toISOString(),
  }, { onConflict: "clerk_user_id" });
  if (result.error) throw result.error;
  return { timeZone };
}

function clientMissing(profile) {
  const required = [
    ["organization_name", "Organization name"],
    ["primary_contact_name", "Primary contact"],
    ["phone", "Phone number"],
    ["preferred_contact_method", "Preferred contact method"],
    ["billing_email", "Billing email"],
  ];
  return required.filter(([field]) => !present(profile[field])).map(([, label]) => label);
}

function interpreterMissing(profile) {
  const required = [
    ["first_name", "First name"],
    ["last_name", "Last name"],
    ["email", "Email"],
    ["phone", "Phone number"],
    ["preferred_contact_method", "Preferred contact method"],
    ["address_line_1", "Address line 1"],
    ["city", "City"],
    ["state", "State"],
    ["country", "Country"],
    ["postal_code", "ZIP code"],
    ["credentials", "Credentials"],
    ["years_experience", "Years of experience"],
    ["modalities", "Modalities"],
    ["areas_of_experience", "Areas of experience"],
    ["assignment_type_preference", "Assignment preference"],
    ["willing_to_travel", "Travel preference"],
    ["technical_readiness_confirmed", "VRI readiness"],
    ["professional_liability_insurance", "Professional liability insurance status"],
  ];
  const missing = required.filter(([field]) => !present(profile[field])).map(([, label]) => label);
  return missing;
}

function availabilityFlags(profile) {
  const text = dayFields.map((field) => String(profile[field] || "")).join(", ");
  return {
    availability_morning: text.includes("Morning"),
    availability_afternoon: text.includes("Afternoon"),
    availability_evening: text.includes("Evening"),
    availability_overnight: text.includes("Overnight"),
  };
}

function resolvedRole(user, client, interpreter) {
  if (client && !interpreter) return "client";
  if (interpreter && !client) return "interpreter";
  if (allowedRoles.has(user.metadataRole)) return user.metadataRole;
  return "";
}

async function roleStatus(db, user) {
  if (user.isAdmin) {
    return { role: "admin", selectionRequired: false, locked: true };
  }
  const [client, interpreter] = await Promise.all([
    clientFor(db, user.id),
    interpreterFor(db, user.id),
  ]);
  const role = resolvedRole(user, client, interpreter);
  return {
    role: role || null,
    selectionRequired: !role && !client && !interpreter,
    locked: Boolean(role || client || interpreter),
  };
}

async function selectRole(db, user, body) {
  if (user.isAdmin) {
    return {
      status: 403,
      payload: { error: "Administrator accounts do not choose a client or interpreter role." },
    };
  }

  const requestedRole = String(body.role || "").trim().toLowerCase();
  if (!allowedRoles.has(requestedRole)) {
    return { status: 400, payload: { error: "Choose either Client or Interpreter." } };
  }
  if (!clerkKey) {
    return { status: 500, payload: { error: "Clerk server settings are incomplete." } };
  }

  const [client, interpreter] = await Promise.all([
    clientFor(db, user.id),
    interpreterFor(db, user.id),
  ]);
  const role = resolvedRole(user, client, interpreter);

  if (client && requestedRole !== "client") {
    return {
      status: 409,
      payload: { error: "This account already has a client profile. Contact MLS Portal Support to change the account type." },
    };
  }
  if (interpreter && requestedRole !== "interpreter") {
    return {
      status: 409,
      payload: { error: "This account already has an interpreter profile. Contact MLS Portal Support to change the account type." },
    };
  }
  if (role && role !== requestedRole) {
    return {
      status: 409,
      payload: { error: `This account is already registered as ${role}. Contact MLS Portal Support to change it.` },
    };
  }

  const clerk = createClerkClient({ secretKey: clerkKey });
  await clerk.users.updateUserMetadata(user.id, {
    publicMetadata: { portalRole: requestedRole },
  });

  const preference = await db.from("portal_preferences").upsert({
    clerk_user_id: user.id,
    default_portal: requestedRole,
    updated_at: new Date().toISOString(),
  }, { onConflict: "clerk_user_id" });
  if (preference.error) throw preference.error;

  if (requestedRole === "client" && !client) {
    const existingByEmail = await db.from("clients").select("id").eq("email", user.email).is("clerk_user_id", null).maybeSingle();
    if (existingByEmail.error) throw existingByEmail.error;
    const starter = { clerk_user_id: user.id, email: user.email, primary_contact_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null, setup_started_at: new Date().toISOString(), setup_current_step: 0 };
    const created = existingByEmail.data
      ? await db.from("clients").update(starter).eq("id", existingByEmail.data.id)
      : await db.from("clients").insert(starter);
    if (created.error) throw created.error;
  }
  if (requestedRole === "interpreter" && !interpreter) {
    const existingByEmail = await db.from("interpreters").select("id").eq("email", user.email).is("clerk_user_id", null).maybeSingle();
    if (existingByEmail.error) throw existingByEmail.error;
    const starter = { clerk_user_id: user.id, email: user.email, first_name: user.firstName || "", last_name: user.lastName || "", country: "United States", roster_status: "pending_profile", screening_status: "not_started", setup_started_at: new Date().toISOString(), setup_current_step: 0 };
    const created = existingByEmail.data
      ? await db.from("interpreters").update(starter).eq("id", existingByEmail.data.id)
      : await db.from("interpreters").insert(starter);
    if (created.error) throw created.error;
  }

  await audit(db, { ...user, metadataRole: requestedRole }, {
    action: "portal.role_selected",
    entityType: "portal_user",
    summary: `Selected ${requestedRole} portal`,
    after: { role: requestedRole, source: "first_login" },
  });

  return {
    status: 200,
    payload: { role: requestedRole, selectionRequired: false, locked: true },
  };
}

async function ensureClient(db, user, profile) {
  const existing = await clientFor(db, user.id);
  if (existing) return existing;

  const result = await db.from("clients").insert({
    clerk_user_id: user.id,
    email: user.email,
    organization_name: profile.organization_name || null,
    primary_contact_name: profile.primary_contact_name || [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
  }).select().single();
  if (result.error) throw result.error;
  return result.data;
}

async function saveClientSetup(db, user, body) {
  if (!portalTimeZones.has(String(body.timeZone || "America/New_York"))) {
    return { status: 400, payload: { error: "Choose a supported United States time zone." } };
  }
  const incoming = clean(body.profile, clientFields);
  const current = await ensureClient(db, user, incoming);
  const merged = { ...current, ...incoming, email: user.email };
  const complete = Boolean(body.complete);
  const missing = complete ? clientMissing(merged) : [];

  if (missing.length) {
    return {
      status: 400,
      payload: {
        error: `Complete these fields before finishing: ${missing.join(", ")}.`,
        missing,
      },
    };
  }

  const now = new Date().toISOString();
  const updates = {
    ...incoming,
    email: user.email,
    setup_started_at: current.setup_started_at || now,
    setup_current_step: Math.max(0, Number(body.step || 0)),
    setup_version: 1,
    updated_at: now,
  };

  if (complete) {
    updates.setup_completed_at = now;
    updates.setup_current_step = 3;
    updates.onboarding_complete = true;
  }

  const result = await db.from("clients").update(updates).eq("id", current.id).select().single();
  if (result.error) throw result.error;
  const preference = await savePortalTimeZone(db, user, "client", body.timeZone);
  if (preference.error) return { status: 400, payload: { error: preference.error } };

  await audit(db, user, {
    action: complete ? "setup.client_completed" : "setup.client_progress_saved",
    entityType: "client",
    entityId: current.id,
    summary: complete ? "First-login setup completed" : `Saved step ${updates.setup_current_step + 1}`,
    after: result.data,
  });

  return { status: 200, payload: { profile: result.data, complete } };
}

async function saveInterpreterSetup(db, user, body) {
  const incoming = clean(body.profile, interpreterFields);
  const current = await interpreterFor(db, user.id);
  const now = new Date().toISOString();
  const base = current || {
    clerk_user_id: user.id,
    email: user.email,
    first_name: user.firstName || "",
    last_name: user.lastName || "",
    country: "United States",
    roster_status: "pending_profile",
    screening_status: "not_started",
  };

  const submittedEmail = Object.prototype.hasOwnProperty.call(incoming, "email")
    ? incoming.email
    : base.email || user.email;
  const merged = {
    ...base,
    ...incoming,
    email: String(submittedEmail || "").trim().toLowerCase(),
    country: incoming.country || base.country || "United States",
    first_name: incoming.first_name || base.first_name || user.firstName || "",
    last_name: incoming.last_name || base.last_name || user.lastName || "",
  };

  if (present(merged.email) && !validEmail(merged.email)) {
    return { status: 400, payload: { error: "Enter a valid email address." } };
  }
  if (!availabilityStatuses.has(merged.availability_status || "contact_me")) {
    return { status: 400, payload: { error: "Choose a valid availability preference." } };
  }
  if (!validTimeZone(merged.availability_timezone || "America/New_York")) {
    return { status: 400, payload: { error: "Enter a valid IANA time zone, such as America/New_York." } };
  }
  if (!portalTimeZones.has(String(body.timeZone || merged.availability_timezone || "America/New_York"))) {
    return { status: 400, payload: { error: "Choose a supported United States time zone." } };
  }
  if (Boolean(body.complete) && merged.availability_status === "scheduled" && !dayFields.some((field) => present(merged[field]))) {
    return { status: 400, payload: { error: "Choose at least one weekly window or select a different availability preference." } };
  }

  const complete = Boolean(body.complete);
  const missing = complete ? interpreterMissing(merged) : [];
  if (missing.length) {
    return {
      status: 400,
      payload: {
        error: `Complete these fields before finishing: ${missing.join(", ")}.`,
        missing,
      },
    };
  }

  const payload = {
    ...incoming,
    ...availabilityFlags(merged),
    clerk_user_id: user.id,
    email: merged.email,
    country: merged.country,
    first_name: merged.first_name,
    last_name: merged.last_name,
    setup_started_at: base.setup_started_at || now,
    setup_current_step: Math.max(0, Number(body.step || 0)),
    setup_version: 1,
    updated_at: now,
  };

  if (current?.id) payload.id = current.id;
  if (!current) {
    payload.roster_status = "pending_profile";
    payload.screening_status = "not_started";
  }
  if (complete) {
    payload.setup_completed_at = now;
    payload.setup_current_step = 4;
  }

  const result = await db.from("interpreters")
    .upsert(payload, { onConflict: "clerk_user_id" })
    .select()
    .single();
  if (result.error) throw result.error;
  await savePortalTimeZone(db, user, "interpreter", body.timeZone || merged.availability_timezone);

  await audit(db, user, {
    action: complete ? "setup.interpreter_completed" : "setup.interpreter_progress_saved",
    entityType: "interpreter",
    entityId: result.data.id,
    summary: complete ? "First-login setup completed" : `Saved step ${payload.setup_current_step + 1}`,
    after: result.data,
  });

  return { status: 200, payload: { profile: result.data, complete } };
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });

    const db = database();
    const action = String(req.query?.action || "");

    if (req.method === "GET" && action === "roleStatus") {
      return send(res, 200, await roleStatus(db, user));
    }
    if (req.method === "POST" && action === "selectRole") {
      const result = await selectRole(db, user, readBody(req));
      return send(res, result.status, result.payload);
    }
    if (req.method !== "POST") {
      return send(res, 405, { error: "Use POST for setup changes." });
    }

    const body = readBody(req);
    const requestedRole = body.role === "client" ? "client" : "interpreter";
    const [client, interpreter] = await Promise.all([
      clientFor(db, user.id),
      interpreterFor(db, user.id),
    ]);

    const matchingProfile = requestedRole === "client" ? client : interpreter;

    // Admins normally skip first-login setup, but MLS uses linked test profiles
    // to verify the client and interpreter experiences. A profile linked to this
    // exact Clerk user is sufficient authorization to save that profile only.
    if (user.isAdmin && !matchingProfile) {
      return send(res, 403, { error: "Administrator accounts do not use first-login setup." });
    }

    const actualRole = matchingProfile
      ? requestedRole
      : resolvedRole(user, client, interpreter);

    if (!actualRole) {
      return send(res, 409, { error: "Choose your account role before continuing setup." });
    }
    if (requestedRole !== actualRole) {
      return send(res, 403, { error: "This setup wizard does not match your account role." });
    }

    const result = requestedRole === "client"
      ? await saveClientSetup(db, user, body)
      : await saveInterpreterSetup(db, user, body);
    return send(res, result.status, result.payload);
  } catch (error) {
    console.error("MLS first-login setup error", error);
    return send(res, 500, { error: error.message || "Setup could not be saved." });
  }
}
