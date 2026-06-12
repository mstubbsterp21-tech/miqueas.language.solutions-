const fs = require('fs');

const apiPath = 'api/portal.js';
if (!fs.existsSync(apiPath)) process.exit(0);

let source = fs.readFileSync(apiPath, 'utf8');

if (!source.includes('async function adminUpdateInterpreterProfile')) {
  const adminUpdate = String.raw`
async function adminUpdateInterpreterProfile(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const interpreterId = body?.interpreterId;
  if (!interpreterId) return { status: 400, payload: { error: "Interpreter ID is required." } };
  const fields = ["first_name", "last_name", "email", "phone", "city", "state", "current_location", "preferred_contact_method", "credentials", "state_license", "state_license_details", "years_experience", "modalities", "areas_of_experience", "assignment_type_preference", "willing_to_travel", "technical_readiness_confirmed", "professional_liability_insurance", "travel_radius", "onsite_rate", "vri_rate", "roster_status", "admin_notes", "availability_sunday", "availability_monday", "availability_tuesday", "availability_wednesday", "availability_thursday", "availability_friday", "availability_saturday"];
  const incoming = body?.profile || {};
  const profile = fields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(incoming, field)) payload[field] = incoming[field];
    return payload;
  }, {});
  const allAvailability = [profile.availability_sunday, profile.availability_monday, profile.availability_tuesday, profile.availability_wednesday, profile.availability_thursday, profile.availability_friday, profile.availability_saturday].join(", ");
  profile.availability_morning = allAvailability.includes("Morning");
  profile.availability_afternoon = allAvailability.includes("Afternoon");
  profile.availability_evening = allAvailability.includes("Evening");
  profile.availability_overnight = allAvailability.includes("Overnight");
  profile.updated_at = new Date().toISOString();
  const { data, error } = await db.from("interpreters").update(profile).eq("id", interpreterId).select("*, interpreter_documents(id, document_type, status)").single();
  if (error) throw error;
  return { status: 200, payload: { interpreter: data } };
}

`;
  source = source.replace('async function loadAdminRoster', adminUpdate + 'async function loadAdminRoster');
}

if (!source.includes('action === "adminUpdateInterpreterProfile"')) {
  const branch = String.raw`
    if (req.method === "POST" && action === "adminUpdateInterpreterProfile") {
      const result = await adminUpdateInterpreterProfile(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

`;
  source = source.replace('    if (req.method === "GET" && action === "adminRoster") {', branch + '    if (req.method === "GET" && action === "adminRoster") {');
}

fs.writeFileSync(apiPath, source);
