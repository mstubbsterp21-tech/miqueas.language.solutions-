import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbAdminKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const adminEmails = (process.env.VITE_ADMIN_EMAILS || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
const editableFields = [
  "service_type", "delivery_mode", "start_at", "end_at", "timezone", "location_name",
  "address_line_1", "address_line_2", "city", "state", "postal_code", "meeting_link",
  "deaf_participants", "hearing_participants", "language_preferences", "specialty",
  "team_requested", "cdi_requested", "onsite_contact_name", "onsite_contact_phone",
  "description", "preparation_materials", "purchase_order_number", "client_reference",
];

function send(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function bearer(req) {
  return String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1] || "";
}

function decode(token) {
  return JSON.parse(Buffer.from(token.split(".")[1] || "", "base64url").toString("utf8"));
}

async function signedInUser(req) {
  const jwt = bearer(req);
  if (!jwt || !clerkKey) return null;
  const claims = decode(jwt);
  if (!claims?.sid || !claims?.sub) return null;
  const clerk = createClerkClient({ secretKey: clerkKey });
  const session = await clerk.sessions.getSession(claims.sid);
  if (session?.userId !== claims.sub) return null;
  const record = await clerk.users.getUser(claims.sub);
  const email = record.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  return { id: record.id, email, isAdmin: adminEmails.includes(email) };
}

function database() {
  if (!dbUrl || !dbAdminKey) throw new Error("Missing Supabase server settings in Vercel.");
  return createClient(dbUrl, dbAdminKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function cleanAssignment(input = {}) {
  return editableFields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) result[field] = input[field] === "" ? null : input[field];
    return result;
  }, {});
}

async function countRows(db, table, column, value) {
  const result = await db.from(table).select("id", { count: "exact", head: true }).eq(column, value);
  if (result.error) throw result.error;
  return result.count || 0;
}

async function updateAssignment(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.assignmentId) return { status: 400, payload: { error: "Assignment is required." } };
  const updates = cleanAssignment(payload.assignment || {});
  if (!Object.keys(updates).length) return { status: 400, payload: { error: "No assignment changes were provided." } };
  if (!updates.service_type && Object.prototype.hasOwnProperty.call(updates, "service_type")) return { status: 400, payload: { error: "Service type is required." } };
  if (!updates.delivery_mode && Object.prototype.hasOwnProperty.call(updates, "delivery_mode")) return { status: 400, payload: { error: "Delivery mode is required." } };
  if (!updates.start_at && Object.prototype.hasOwnProperty.call(updates, "start_at")) return { status: 400, payload: { error: "Start time is required." } };
  const before = await db.from("assignments").select("*").eq("id", payload.assignmentId).maybeSingle();
  if (before.error) throw before.error;
  if (!before.data) return { status: 404, payload: { error: "Assignment not found." } };
  const result = await db.from("assignments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", payload.assignmentId)
    .select("*, clients(id,clerk_user_id,organization_name,primary_contact_name,email,billing_email), assignment_interpreters(*, interpreters(id,clerk_user_id,first_name,last_name,email))")
    .single();
  if (result.error) throw result.error;
  const audit = await db.from("audit_events").insert({
    actor_clerk_user_id: user.id,
    actor_role: "admin",
    action: "assignment.updated",
    entity_type: "assignment",
    entity_id: payload.assignmentId,
    summary: `Assignment updated: ${result.data.service_type}`,
    before_data: before.data,
    after_data: result.data,
  });
  if (audit.error) throw audit.error;
  return { status: 200, payload: { assignment: result.data } };
}

async function deleteAssignment(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.assignmentId) return { status: 400, payload: { error: "Assignment is required." } };
  if (payload.confirmation !== "DELETE") return { status: 400, payload: { error: "Type DELETE to confirm permanent assignment deletion." } };
  const record = await db.from("assignments").select("*, clients(organization_name,email)").eq("id", payload.assignmentId).maybeSingle();
  if (record.error) throw record.error;
  if (!record.data) return { status: 404, payload: { error: "Assignment not found." } };
  const blockers = [
    ["staffing records", await countRows(db, "assignment_interpreters", "assignment_id", payload.assignmentId)],
    ["quotes", await countRows(db, "quotes", "assignment_id", payload.assignmentId)],
    ["invoices", await countRows(db, "invoices", "assignment_id", payload.assignmentId)],
    ["agreements", await countRows(db, "assignment_agreements", "assignment_id", payload.assignmentId)],
    ["time entries", await countRows(db, "time_entries", "assignment_id", payload.assignmentId)],
    ["expenses", await countRows(db, "expenses", "assignment_id", payload.assignmentId)],
  ].filter(([, count]) => count > 0);
  if (blockers.length) {
    const details = blockers.map(([label, count]) => `${count} ${label}`).join(", ");
    return { status: 409, payload: { error: `This assignment cannot be permanently deleted because MLS must retain ${details}. Cancel or close the assignment instead.` } };
  }
  const documents = await db.from("assignment_documents").select("storage_path").eq("assignment_id", payload.assignmentId);
  if (documents.error) throw documents.error;
  const paths = (documents.data || []).map((item) => item.storage_path).filter(Boolean);
  if (paths.length) {
    const removed = await db.storage.from("assignment-documents").remove(paths);
    if (removed.error) throw removed.error;
  }
  const audit = await db.from("audit_events").insert({
    actor_clerk_user_id: user.id,
    actor_role: "admin",
    action: "assignment.deleted",
    entity_type: "assignment",
    entity_id: record.data.id,
    summary: `Assignment permanently deleted: ${record.data.service_type}`,
    before_data: record.data,
    after_data: { deleted: true },
  });
  if (audit.error) throw audit.error;
  const result = await db.from("assignments").delete().eq("id", payload.assignmentId).select("id").maybeSingle();
  if (result.error) throw result.error;
  return { status: 200, payload: { deletedId: result.data?.id || payload.assignmentId } };
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    if (req.method !== "POST") return send(res, 405, { error: "Use POST for assignment administration." });
    const db = database();
    const action = String(req.query?.action || "");
    const payload = readBody(req);
    let result;
    if (action === "update") result = await updateAssignment(db, user, payload);
    else if (action === "delete") result = await deleteAssignment(db, user, payload);
    else result = { status: 404, payload: { error: "Unknown assignment admin action." } };
    return send(res, result.status, result.payload);
  } catch (error) {
    console.error("MLS assignment admin error", error);
    return send(res, 500, { error: error.message || "Assignment administration failed." });
  }
}
