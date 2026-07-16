import { audit, database, readBody, send, signedInUser } from "./_shared/ops-v2-core.js";
import { removeAssignmentWorkspaceRecords, syncAssignmentWorkspaceRecord } from "./_shared/assignment-workspace-records.js";

async function assignmentFor(db, assignmentId) {
  const result = await db.from("assignments")
    .select("*, clients(id,clerk_user_id,organization_name,primary_contact_name,email,billing_email), assignment_interpreters(id,interpreter_id,status,role,agreed_rate,interpreters(id,clerk_user_id,first_name,last_name,email))")
    .eq("id", assignmentId)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    if (!user.isAdmin) return send(res, 403, { error: "Admin access is required." });
    if (req.method !== "POST") return send(res, 405, { error: "Use POST for Workspace assignment sync." });
    const db = database();
    const action = String(req.query?.action || "syncRecord");
    const body = readBody(req);
    if (!body.assignmentId) return send(res, 400, { error: "Assignment is required." });
    const assignment = await assignmentFor(db, body.assignmentId);
    if (!assignment) return send(res, 404, { error: "Assignment not found." });
    let result;
    if (action === "syncRecord") {
      result = await syncAssignmentWorkspaceRecord(db, assignment);
      if (result.status === "failed") return send(res, 502, { error: result.error, workspace: result });
    } else if (action === "deleteRecords") {
      if (body.confirmation !== "DELETE") return send(res, 400, { error: "Type DELETE to confirm Workspace deletion." });
      result = await removeAssignmentWorkspaceRecords(db, assignment);
      const failures = [result.calendar, result.drive].filter((item) => item.status === "failed");
      if (failures.length) return send(res, 502, { error: failures.map((item) => item.error).join(" | "), workspace: result });
    } else {
      return send(res, 404, { error: "Unknown Workspace assignment action." });
    }
    await audit(db, user, {
      action: `assignment.workspace_${action}`,
      entityType: "assignment",
      entityId: assignment.id,
      summary: action === "deleteRecords" ? "Assignment Calendar and Drive records removed" : "Full assignment record synced to Drive",
      after: result,
    });
    return send(res, 200, { assignmentId: assignment.id, workspace: result });
  } catch (error) {
    console.error("MLS assignment Workspace sync error", error);
    return send(res, 500, { error: error.message || "Workspace assignment sync failed." });
  }
}
