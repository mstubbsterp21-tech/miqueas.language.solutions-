import crypto from "node:crypto";
import { getGoogleWorkspaceAccessToken, sendGmailEmail } from "./gmail-oauth.js";
import { sheetsReadonlyScope } from "./workspace-oauth-extension.js";

const spreadsheetId = process.env.INTERPRETER_NETWORK_SHEET_ID || "1iQa-CORVo3lsVBNW2H3xzJxyV1gbL5Wq5k-KAqXM1XE";
const deviceSecret = process.env.PORTAL_DEVICE_SECRET || process.env.CLERK_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "mls-device-security";
const trustedCookie = "mls_trusted_device";
const pendingCookie = "mls_device_pending";

function cookieMap(req) {
  const values = {};
  String(req.headers.cookie || "").split(";").forEach((part) => {
    const index = part.indexOf("=");
    if (index > 0) values[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  });
  return values;
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function codeHash(userId, token, code) {
  return hash(`${deviceSecret}:${userId}:${token}:${code}`);
}

function appendCookie(res, value) {
  const current = res.getHeader("Set-Cookie");
  const values = Array.isArray(current) ? current : current ? [current] : [];
  res.setHeader("Set-Cookie", [...values, value]);
}

function secureCookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function deviceLabel(req, supplied) {
  if (String(supplied || "").trim()) return String(supplied).trim().slice(0, 120);
  const agent = String(req.headers["user-agent"] || "New browser");
  if (/iphone|ipad/i.test(agent)) return "Apple mobile browser";
  if (/android/i.test(agent)) return "Android browser";
  if (/windows/i.test(agent)) return "Windows browser";
  if (/macintosh|mac os/i.test(agent)) return "Mac browser";
  return "Web browser";
}

export async function portalDeviceStatus(db, user, req) {
  const token = cookieMap(req)[trustedCookie];
  if (!token) return { status: 200, payload: { trusted: false, reason: "new_device" } };
  const deviceHash = hash(token);
  const result = await db.from("portal_trusted_devices").select("*").eq("clerk_user_id", user.id).eq("device_hash", deviceHash).is("revoked_at", null).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return { status: 200, payload: { trusted: false, reason: "unrecognized_device" } };
  await db.from("portal_trusted_devices").update({ last_seen_at: new Date().toISOString() }).eq("clerk_user_id", user.id).eq("device_hash", deviceHash);
  return { status: 200, payload: { trusted: true, device: { label: result.data.device_label, trustedAt: result.data.trusted_at } } };
}

export async function beginPortalDeviceVerification(db, user, req, res, payload = {}) {
  const pendingToken = crypto.randomBytes(32).toString("base64url");
  const code = String(crypto.randomInt(100000, 1000000));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  await db.from("portal_device_challenges").delete().lt("expires_at", now.toISOString());
  const inserted = await db.from("portal_device_challenges").insert({
    clerk_user_id: user.id,
    pending_device_hash: hash(pendingToken),
    code_hash: codeHash(user.id, pendingToken, code),
    expires_at: expiresAt,
  });
  if (inserted.error) throw inserted.error;
  appendCookie(res, secureCookie(pendingCookie, pendingToken, 600));
  const delivery = await sendGmailEmail(db, {
    to: user.email,
    subject: "Verify your new MLS Portal sign-in",
    text: `Your MLS Portal verification code is ${code}. It expires in 10 minutes. If you did not attempt to sign in, do not share this code and contact MLS.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px"><h1 style="color:#721100">Verify this MLS Portal sign-in</h1><p>Enter this code in MLS Portal:</p><p style="font-size:34px;font-weight:800;letter-spacing:.18em;color:#24130e">${code}</p><p>The code expires in 10 minutes.</p><p style="color:#6b625e">If you did not attempt to sign in, do not share this code and contact Miqueas Language Solutions.</p></div>`,
  });
  if (!delivery.sent) return { status: 503, payload: { error: delivery.error || "The verification email could not be sent." } };
  return { status: 200, payload: { sent: true, expiresAt, emailHint: user.email.replace(/^(.{1,2}).*(@.*)$/, "$1•••$2"), label: deviceLabel(req, payload.deviceLabel) } };
}

export async function verifyPortalDevice(db, user, req, res, payload = {}) {
  const pendingToken = cookieMap(req)[pendingCookie];
  const code = String(payload.code || "").replace(/\D/g, "").slice(0, 6);
  if (!pendingToken || code.length !== 6) return { status: 400, payload: { error: "Enter the six-digit verification code." } };
  const pendingHash = hash(pendingToken);
  const result = await db.from("portal_device_challenges").select("*").eq("clerk_user_id", user.id).eq("pending_device_hash", pendingHash).is("verified_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (result.error) throw result.error;
  const challenge = result.data;
  if (!challenge || new Date(challenge.expires_at).getTime() <= Date.now()) return { status: 410, payload: { error: "That verification code expired. Send a new code." } };
  if (challenge.attempts >= 5) return { status: 429, payload: { error: "Too many attempts. Send a new code." } };
  const expected = challenge.code_hash;
  const actual = codeHash(user.id, pendingToken, code);
  const valid = expected.length === actual.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
  if (!valid) {
    await db.from("portal_device_challenges").update({ attempts: challenge.attempts + 1 }).eq("id", challenge.id);
    return { status: 400, payload: { error: "That verification code is not correct." } };
  }
  const trustedToken = crypto.randomBytes(40).toString("base64url");
  const label = deviceLabel(req, payload.deviceLabel);
  const trusted = await db.from("portal_trusted_devices").upsert({
    clerk_user_id: user.id,
    device_hash: hash(trustedToken),
    device_label: label,
    user_agent_hash: hash(req.headers["user-agent"] || ""),
    trusted_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    revoked_at: null,
  }, { onConflict: "clerk_user_id,device_hash" });
  if (trusted.error) throw trusted.error;
  await db.from("portal_device_challenges").update({ verified_at: new Date().toISOString() }).eq("id", challenge.id);
  appendCookie(res, secureCookie(trustedCookie, trustedToken, 60 * 60 * 24 * 180));
  appendCookie(res, secureCookie(pendingCookie, "", 0));
  return { status: 200, payload: { trusted: true, device: { label } } };
}

function normalizedAvailability(value) {
  return String(value || "").replaceAll("Afternoon (1PM-5PM EST)", "Afternoon (12PM-6PM EST)").replaceAll("Evening (6PM-9PM EST)", "Evening (6PM-12AM EST)");
}

function splitName(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  return { first_name: parts.shift() || "", last_name: parts.join(" ") };
}

function mappedPrefill(headers, row) {
  const data = Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));
  const name = splitName(data["Full Name"]);
  const location = String(data["Current Location"] || "").trim();
  const locationParts = location.split(",").map((item) => item.trim()).filter(Boolean);
  const pli = String(data["Professional Liability Insurance"] || "").toLowerCase();
  const technical = String(data["Technical Readiness Confirmed"] || "").toLowerCase();
  return {
    network_submission_id: data["Interpreter ID"] || null,
    first_name: name.first_name,
    last_name: name.last_name,
    email: String(data["Email Address"] || "").trim().toLowerCase(),
    phone: data["Phone Number"] || "",
    current_location: location,
    city: locationParts[0] || "",
    state: locationParts[1] || "",
    postal_code: locationParts[2] || "",
    preferred_contact_method: data["Preferred Method of Contact"] || "",
    credentials: [data["Credentials"], data["Other Credential"] ? `Other: ${data["Other Credential"]}` : ""].filter(Boolean).join(", "),
    state_license: data["State License"] || "",
    state_license_details: data["State License Details"] || "",
    years_experience: data["Years Experience"] || "",
    education_itp: data["Education / ITP"] || "",
    modalities: [data["Primary Modalities"], data["Other Modality"]].filter(Boolean).join(", "),
    areas_of_experience: data["Areas Of Experience"] || "",
    situations_successfully_navigated: data["Situations Successfully Navigated"] || "",
    challenging_situation_description: data["Challenging Situation Description"] || "",
    assignment_type_preference: data["Assignment Type Preference"] || "",
    willing_to_travel: data["Willing To Travel"] || "",
    technical_readiness_confirmed: technical === "yes" ? "Confirmed" : data["Technical Readiness Confirmed"] || "",
    professional_liability_insurance: pli === "yes" ? "Current" : pli.includes("planning") || pli.includes("pending") ? "Pending" : pli === "no" ? "Not currently held" : data["Professional Liability Insurance"] || "",
    comfortable_with_rates: data["Comfortable With Standard Industry Rates"] || "",
    travel_radius: data["Travel Radius"] || "",
    availability_sunday: normalizedAvailability(data["Sunday Availability"]),
    availability_monday: normalizedAvailability(data["Monday Availability"]),
    availability_tuesday: normalizedAvailability(data["Tuesday Availability"]),
    availability_wednesday: normalizedAvailability(data["Wednesday Availability"]),
    availability_thursday: normalizedAvailability(data["Thursday Availability"]),
    availability_friday: normalizedAvailability(data["Friday Availability"]),
    availability_saturday: normalizedAvailability(data["Saturday Availability"]),
  };
}

function present(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

async function persistPrefill(db, user, prefill) {
  const current = await db.from("interpreters").select("*").eq("clerk_user_id", user.id).maybeSingle();
  if (current.error) throw current.error;
  const existing = current.data || {};
  const fillable = [
    "first_name", "last_name", "phone", "current_location", "city", "state", "postal_code", "preferred_contact_method",
    "credentials", "state_license", "state_license_details", "years_experience", "education_itp", "modalities", "areas_of_experience",
    "situations_successfully_navigated", "challenging_situation_description", "assignment_type_preference", "willing_to_travel",
    "technical_readiness_confirmed", "professional_liability_insurance", "comfortable_with_rates", "travel_radius",
    "availability_sunday", "availability_monday", "availability_tuesday", "availability_wednesday", "availability_thursday", "availability_friday", "availability_saturday",
  ];
  const values = fillable.reduce((result, field) => {
    if (!present(existing[field]) && present(prefill[field])) result[field] = prefill[field];
    return result;
  }, {});
  values.network_submission_id = prefill.network_submission_id || existing.network_submission_id || null;
  values.network_submission_synced_at = new Date().toISOString();
  values.clerk_user_id = user.id;
  values.email = user.email;
  values.first_name = values.first_name || existing.first_name || user.firstName || "";
  values.last_name = values.last_name || existing.last_name || user.lastName || "";
  values.country = existing.country || "United States";
  values.updated_at = new Date().toISOString();
  if (!current.data) {
    values.roster_status = "pending_profile";
    values.screening_status = "not_started";
  }
  const saved = await db.from("interpreters").upsert(values, { onConflict: "clerk_user_id" }).select().single();
  if (saved.error) throw saved.error;
  return saved.data;
}

export async function interpreterNetworkPrefill(db, user) {
  if (user.isAdmin || user.metadataRole === "client") return { status: 403, payload: { error: "Interpreter access required." } };
  const access = await getGoogleWorkspaceAccessToken(db, [sheetsReadonlyScope]);
  if (!access.accessToken) return { status: 200, payload: { matched: false, requiresWorkspaceReconnect: true, error: access.error } };
  const range = encodeURIComponent("Interpreters!A:AZ");
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}?majorDimension=ROWS`, { headers: { authorization: `Bearer ${access.accessToken}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { status: 200, payload: { matched: false, error: data.error?.message || "The Interpreter Network sheet could not be read." } };
  const rows = data.values || [];
  const headers = rows[0] || [];
  const emailIndex = headers.indexOf("Email Address");
  if (emailIndex < 0) return { status: 200, payload: { matched: false, error: "The Interpreter Network email column is unavailable." } };
  const matches = rows.slice(1).filter((row) => String(row[emailIndex] || "").trim().toLowerCase() === user.email);
  if (!matches.length) return { status: 200, payload: { matched: false } };
  const prefill = mappedPrefill(headers, matches[matches.length - 1]);
  const profile = await persistPrefill(db, user, prefill);
  return { status: 200, payload: { matched: true, source: "MLS Interpreter Network form", prefill: profile } };
}
