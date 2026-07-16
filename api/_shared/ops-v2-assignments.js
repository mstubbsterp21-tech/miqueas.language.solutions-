import { audit } from "./ops-v2-core.js";
import { removeAssignmentWorkspaceRecords, syncAssignmentWorkspaceRecord } from "./assignment-workspace-records.js";

const editableFields = [
  "service_type", "delivery_mode", "start_at", "end_at", "timezone", "location_name",
  "address_line_1", "address_line_2", "city", "state", "postal_code", "meeting_link",
  "deaf_participants", "hearing_participants", "language_preferences", "specialty",
  "team_requested", "cdi_requested", "onsite_contact_name", "onsite_contact_phone",
  "description", "preparation_materials", "purchase_order_number", "client_reference",
];

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

async function assignmentRecord(db, assignmentId) {
  const result = await db.from("assignments")
    .select("*, clients(id,clerk_user_id,organization_name,primary_contact_name,email,billing_email), assignment_interpreters(id,interpreter_id,status,role,agreed_rate,interpreters(id,clerk_user_id,first_name,last_name,email))")
    .eq("id", assignmentId)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function adminUpdateFullAssignment(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.assignmentId) return { status: 400, payload: { error: "Assignment is required." } };
  const updates = cleanAssignment(payload.assignment || {});
  if (!Object.keys(updates).length) return { status: 400, payload: { error: "No assignment changes were provided." } };
  if (Object.prototype.hasOwnProperty.call(updates, "service_type") && !updates.service_type) return { status: 400, payload: { error: "Service type is required." } };
  if (Object.prototype.hasOwnProperty.call(updates, "delivery_mode") && !updates.delivery_mode) return { status: 400, payload: { error: "Delivery mode is required." } };
  if (Object.prototype.hasOwnProperty.call(updates, "start_at") && !updates.start_at) return { status: 400, payload: { error: "Start time is required." } };
  const before = await assignmentRecord(db, payload.assignmentId);
  if (!before) return { status: 404, payload: { error: "Assignment not found." } };
  const result = await db.from("assignments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", payload.assignmentId)
    .select("*, clients(id,clerk_user_id,organization_name,primary_contact_name,email,billing_email), assignment_interpreters(id,interpreter_id,status,role,agreed_rate,interpreters(id,clerk_user_id,first_name,last_name,email))")
    .single();
  if (result.error) throw result.error;
  await audit(db, user, {
    action: "assignment.updated",
    entityType: "assignment",
    entityId: payload.assignmentId,
    summary: `Assignment updated: ${result.data.service_type}`,
    before,
    after: result.data,
  });
  return { status: 200, payload: { assignment: result.data } };
}

export async function adminSyncAssignmentWorkspaceRecord(db, user, payload) {
  if (!payload.assignmentId) return { status: 400, payload: { error: "Assignment is required." } };
  const record = await assignmentRecord(db, payload.assignmentId);
  if (!record) return { status: 404, payload: { error: "Assignment not found." } };
  const ownsAssignment = record.clients?.clerk_user_id === user.id;
  if (!user.isAdmin && !ownsAssignment) return { status: 403, payload: { error: "Only MLS admins or the requesting client can sync this assignment record." } };
  const workspace = await syncAssignmentWorkspaceRecord(db, record);
  if (workspace.status === "failed") return { status: 502, payload: { error: workspace.error, workspace } };
  await audit(db, user, {
    action: "assignment.workspace_record_synced",
    entityType: "assignment",
    entityId: record.id,
    summary: "Full assignment record synced to Google Drive",
    after: workspace,
  });
  return { status: 200, payload: { assignmentId: record.id, workspace } };
}

export async function adminDeleteAssignment(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.assignmentId) return { status: 400, payload: { error: "Assignment is required." } };
  if (payload.confirmation !== "DELETE") return { status: 400, payload: { error: "Type DELETE to confirm permanent assignment deletion." } };
  const record = await assignmentRecord(db, payload.assignmentId);
  if (!record) return { status: 404, payload: { error: "Assignment not found." } };
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
  const workspace = await removeAssignmentWorkspaceRecords(db, record);
  const workspaceFailures = [
    record.google_calendar_event_id && ["failed", "not_configured"].includes(workspace.calendar?.status) ? workspace.calendar : null,
    record.drive_folder_id && ["failed", "not_configured"].includes(workspace.drive?.status) ? workspace.drive : null,
  ].filter(Boolean);
  if (workspaceFailures.length) {
    return { status: 502, payload: { error: `Google Workspace cleanup must succeed before this assignment can be deleted: ${workspaceFailures.map((item) => item.error || item.status).join(" | ")}`, workspace } };
  }
  const documents = await db.from("assignment_documents").select("storage_path").eq("assignment_id", payload.assignmentId);
  if (documents.error) throw documents.error;
  const paths = (documents.data || []).map((item) => item.storage_path).filter(Boolean);
  if (paths.length) {
    const removed = await db.storage.from("assignment-documents").remove(paths);
    if (removed.error) throw removed.error;
  }
  await audit(db, user, {
    action: "assignment.deleted",
    entityType: "assignment",
    entityId: record.id,
    summary: `Assignment permanently deleted: ${record.service_type}`,
    before: record,
    after: { deleted: true, workspace },
  });
  const result = await db.from("assignments").delete().eq("id", payload.assignmentId).select("id").maybeSingle();
  if (result.error) throw result.error;
  return { status: 200, payload: { deletedId: result.data?.id || payload.assignmentId, workspace } };
}
