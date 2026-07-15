import {
  audit,
  database,
  readBody,
  send,
  signedInUser,
} from "./_shared/ops-v2-core.js";
import {
  runConfirmationAutomation,
  runRequestAutomation,
  sendAssignmentMessageEmails,
} from "./_shared/assignment-automations.js";
import {
  archiveAssignmentDocument,
  createAssignmentDocumentUploadUrl,
  listAssignmentDocuments,
  openAssignmentDocument,
  recordAssignmentDocumentUpload,
  updateAssignmentDocumentVisibility,
} from "./_shared/assignment-documents.js";

async function assignmentFor(db, assignmentId) {
  const result = await db.from("assignments")
    .select("*, clients(id,clerk_user_id,organization_name,primary_contact_name,email,billing_email), assignment_interpreters(id,interpreter_id,status,role,interpreters(id,clerk_user_id,first_name,last_name,email))")
    .eq("id", assignmentId)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

function canViewAssignment(user, assignment) {
  if (user.isAdmin) return true;
  if (assignment?.clients?.clerk_user_id === user.id) return true;
  return (assignment?.assignment_interpreters || []).some((link) => link.interpreters?.clerk_user_id === user.id);
}

const documentActions = new Set([
  "listDocuments",
  "createDocumentUploadUrl",
  "recordDocumentUpload",
  "openDocument",
  "archiveDocument",
  "updateDocumentVisibility",
]);

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    if (req.method !== "POST") return send(res, 405, { error: "Use POST for assignment automation." });

    const db = database();
    const action = String(req.query?.action || "");
    const body = readBody(req);

    if (action === "messageEmail") {
      if (!body.messageId) return send(res, 400, { error: "Message is required." });
      const messageResult = await db.from("assignment_messages").select("*").eq("id", body.messageId).maybeSingle();
      if (messageResult.error) throw messageResult.error;
      const message = messageResult.data;
      if (!message) return send(res, 404, { error: "Message not found." });
      if (!user.isAdmin && message.sender_clerk_user_id !== user.id) {
        return send(res, 403, { error: "You cannot send email for this message." });
      }
      const assignment = await assignmentFor(db, message.assignment_id);
      if (!assignment || !canViewAssignment(user, assignment)) {
        return send(res, 403, { error: "Assignment access is required." });
      }
      const result = await sendAssignmentMessageEmails(db, assignment, message, user);
      await audit(db, user, {
        action: "assignment.message_email_processed",
        entityType: "assignment_message",
        entityId: message.id,
        summary: `Portal message email ${result.status}`,
        after: result,
      });
      return send(res, 200, { automation: result });
    }

    if (!body.assignmentId) return send(res, 400, { error: "Assignment is required." });
    const assignment = await assignmentFor(db, body.assignmentId);
    if (!assignment) return send(res, 404, { error: "Assignment not found." });
    if (!canViewAssignment(user, assignment)) {
      return send(res, 403, { error: "Assignment access is required." });
    }

    if (documentActions.has(action)) {
      let documentResult;
      if (action === "listDocuments") documentResult = await listAssignmentDocuments(db, user, assignment);
      else if (action === "createDocumentUploadUrl") documentResult = await createAssignmentDocumentUploadUrl(db, user, assignment, body);
      else if (action === "recordDocumentUpload") documentResult = await recordAssignmentDocumentUpload(db, user, assignment, body);
      else if (action === "openDocument") documentResult = await openAssignmentDocument(db, user, assignment, body);
      else if (action === "archiveDocument") documentResult = await archiveAssignmentDocument(db, user, assignment, body);
      else documentResult = await updateAssignmentDocumentVisibility(db, user, assignment, body);
      return send(res, documentResult.status, documentResult.payload);
    }

    let result;
    if (action === "requestCreated") {
      if (!user.isAdmin && assignment.clients?.clerk_user_id !== user.id) {
        return send(res, 403, { error: "Only the requesting client or MLS admin can process this request." });
      }
      result = await runRequestAutomation(db, assignment);
    } else if (action === "confirmed") {
      if (!user.isAdmin) return send(res, 403, { error: "Admin access is required to confirm an assignment." });
      result = await runConfirmationAutomation(db, assignment);
    } else if (action === "syncAssignment") {
      if (!user.isAdmin) return send(res, 403, { error: "Admin access is required to sync an assignment." });
      result = assignment.status === "confirmed"
        ? await runConfirmationAutomation(db, assignment)
        : await runRequestAutomation(db, assignment);
    } else {
      return send(res, 404, { error: "Unknown assignment automation action." });
    }

    await audit(db, user, {
      action: `assignment.automation_${action}`,
      entityType: "assignment",
      entityId: assignment.id,
      summary: `Assignment automation processed: ${action}`,
      after: result,
    });
    return send(res, 200, { assignmentId: assignment.id, automation: result });
  } catch (error) {
    console.error("MLS assignment automation error", error);
    return send(res, 500, { error: error.message || "Assignment automation could not be completed." });
  }
}
