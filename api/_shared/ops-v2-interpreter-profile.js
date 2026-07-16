import { audit } from "./ops-v2-core.js";

const editableFields = [
  "first_name", "last_name", "phone", "address_line_1", "address_line_2", "city", "state", "postal_code", "country", "current_location",
  "preferred_contact_method", "credentials", "state_license", "state_license_details", "years_experience", "education_itp",
  "modalities", "areas_of_experience", "situations_successfully_navigated", "challenging_situation_description",
  "assignment_type_preference", "willing_to_travel", "technical_readiness_confirmed", "professional_liability_insurance",
  "comfortable_with_rates", "travel_radius", "availability_sunday", "availability_monday", "availability_tuesday",
  "availability_wednesday", "availability_thursday", "availability_friday", "availability_saturday",
];

const adminFields = [...editableFields, "roster_status", "admin_notes", "screening_status", "w9_status", "insurance_status"];

function clean(input, fields) {
  return fields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(input || {}, field)) result[field] = typeof input[field] === "string" ? input[field].trim() : input[field];
    return result;
  }, {});
}

function availabilityFlags(profile) {
  const text = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => String(profile[`availability_${day}`] || "")).join(", ");
  return {
    availability_morning: text.includes("Morning"),
    availability_afternoon: text.includes("Afternoon"),
    availability_evening: text.includes("Evening"),
    availability_overnight: text.includes("Overnight"),
  };
}

export async function saveInterpreterProfileDetails(db, user, payload) {
  if (user.metadataRole === "client" && !user.isAdmin) return { status: 403, payload: { error: "Interpreter access required." } };
  const existing = await db.from("interpreters").select("*").eq("clerk_user_id", user.id).maybeSingle();
  if (existing.error) throw existing.error;
  const safe = clean(payload.profile, editableFields);
  const merged = { ...(existing.data || {}), ...safe };
  const values = {
    ...safe,
    ...availabilityFlags(merged),
    clerk_user_id: user.id,
    email: user.email,
    first_name: safe.first_name || existing.data?.first_name || user.firstName || "",
    last_name: safe.last_name || existing.data?.last_name || user.lastName || "",
    country: safe.country || existing.data?.country || "United States",
    updated_at: new Date().toISOString(),
  };
  if (!existing.data) {
    values.roster_status = "pending_profile";
    values.screening_status = "not_started";
  }
  const result = await db.from("interpreters").upsert(values, { onConflict: "clerk_user_id" }).select().single();
  if (result.error) throw result.error;
  await audit(db, user, {
    action: "interpreter.profile_updated",
    entityType: "interpreter",
    entityId: result.data.id,
    summary: "Interpreter updated profile details",
    before: existing.data || null,
    after: result.data,
  });
  return { status: 200, payload: { profile: result.data } };
}

export async function adminUpdateInterpreterProfileDetails(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.interpreterId) return { status: 400, payload: { error: "Interpreter ID is required." } };
  const existing = await db.from("interpreters").select("*").eq("id", payload.interpreterId).maybeSingle();
  if (existing.error) throw existing.error;
  if (!existing.data) return { status: 404, payload: { error: "Interpreter not found." } };
  const safe = clean(payload.profile, adminFields);
  const merged = { ...existing.data, ...safe };
  const result = await db.from("interpreters").update({ ...safe, ...availabilityFlags(merged), updated_at: new Date().toISOString() }).eq("id", payload.interpreterId).select().single();
  if (result.error) throw result.error;
  await audit(db, user, {
    action: "interpreter.profile_admin_updated",
    entityType: "interpreter",
    entityId: payload.interpreterId,
    summary: `MLS updated ${[result.data.first_name, result.data.last_name].filter(Boolean).join(" ") || result.data.email}`,
    before: existing.data,
    after: result.data,
  });
  return { status: 200, payload: { interpreter: result.data } };
}
