import { notify } from "./ops-v2-core.js";
import { syncAssignmentWorkspaceRecord } from "./assignment-workspace-records.js";

function interpreterName(record) {
  return [record?.first_name, record?.last_name].filter(Boolean).join(" ") || record?.email || "Interpreter";
}

function assignmentLabel(assignment) {
  const date = assignment?.start_at ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(assignment.start_at)) : "the scheduled date";
  return `${assignment?.service_type || "MLS assignment"} on ${date}`;
}

async function assignmentWithTeam(db, assignmentId) {
  const result = await db.from("assignments").select("*, clients(id,clerk_user_id,organization_name,primary_contact_name,email), assignment_interpreters(*, interpreters(id,clerk_user_id,first_name,last_name,email))").eq("id", assignmentId).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function notifyMany(db, recipients, values) {
  const byId = new Map();
  recipients.filter((item) => item?.id).forEach((item) => byId.set(item.id, item));
  await Promise.all([...byId.values()].map((recipient) => notify(db, recipient.id, {
    category: "assignment",
    title: typeof values.title === "function" ? values.title(recipient) : values.title,
    body: typeof values.body === "function" ? values.body(recipient) : values.body,
    section: recipient.role === "interpreter" ? "schedule" : "assignments",
    relatedType: "assignment",
    relatedId: values.assignmentId,
  })));
}

export async function adminAssignInterpreterWithNotifications(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.assignmentId || !payload.interpreterId) return { status: 400, payload: { error: "Assignment and interpreter are required." } };
  const [assignmentBefore, interpreterResult] = await Promise.all([
    assignmentWithTeam(db, payload.assignmentId),
    db.from("interpreters").select("*").eq("id", payload.interpreterId).maybeSingle(),
  ]);
  if (interpreterResult.error) throw interpreterResult.error;
  if (!assignmentBefore) return { status: 404, payload: { error: "Assignment not found." } };
  if (!interpreterResult.data) return { status: 404, payload: { error: "Interpreter not found." } };

  const link = await db.from("assignment_interpreters").upsert({
    assignment_id: payload.assignmentId,
    interpreter_id: payload.interpreterId,
    role: payload.role || "interpreter",
    status: payload.status || "assigned",
    agreed_rate: payload.agreedRate || null,
    notes: payload.notes || null,
    accepted_at: payload.status === "accepted" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "assignment_id,interpreter_id" }).select().single();
  if (link.error) throw link.error;

  const assignment = await assignmentWithTeam(db, payload.assignmentId);
  const added = interpreterResult.data;
  const team = (assignment?.assignment_interpreters || []).map((item) => item.interpreters).filter(Boolean);
  const teammateNames = team.filter((item) => item.id !== added.id).map(interpreterName).join(", ");
  const label = assignmentLabel(assignment);

  await notifyMany(db, [
    { id: added.clerk_user_id, role: "interpreter", kind: "added" },
    { id: assignment?.clients?.clerk_user_id, role: "client", kind: "client" },
    ...team.filter((item) => item.id !== added.id).map((item) => ({ id: item.clerk_user_id, role: "interpreter", kind: "team" })),
  ], {
    assignmentId: assignment.id,
    title: (recipient) => recipient.kind === "added" ? "You were added to an MLS assignment" : "Assignment team updated",
    body: (recipient) => recipient.kind === "added"
      ? `${label}.${teammateNames ? ` Your teammate${team.length > 2 ? "s are" : " is"} ${teammateNames}.` : " You are currently the only assigned interpreter."}`
      : `${interpreterName(added)} was added to ${label}.`,
  });

  const workspace = await syncAssignmentWorkspaceRecord(db, assignment);
  return { status: 200, payload: { assignmentInterpreter: link.data, assignment, workspace } };
}

export async function adminRemoveInterpreterWithNotifications(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.assignmentInterpreterId) return { status: 400, payload: { error: "Assignment interpreter record is required." } };
  const linkResult = await db.from("assignment_interpreters").select("*, interpreters(id,clerk_user_id,first_name,last_name,email), assignments(id)").eq("id", payload.assignmentInterpreterId).maybeSingle();
  if (linkResult.error) throw linkResult.error;
  const existing = linkResult.data;
  if (!existing) return { status: 404, payload: { error: "Assignment interpreter record not found." } };
  const assignmentBefore = await assignmentWithTeam(db, existing.assignment_id);
  if (!assignmentBefore) return { status: 404, payload: { error: "Assignment not found." } };

  const removedResult = await db.from("assignment_interpreters").delete().eq("id", payload.assignmentInterpreterId).select().maybeSingle();
  if (removedResult.error) throw removedResult.error;
  const assignment = await assignmentWithTeam(db, existing.assignment_id);
  const removed = existing.interpreters;
  const remaining = (assignment?.assignment_interpreters || []).map((item) => item.interpreters).filter(Boolean);
  const label = assignmentLabel(assignment);

  await notifyMany(db, [
    { id: removed?.clerk_user_id, role: "interpreter", kind: "removed" },
    { id: assignment?.clients?.clerk_user_id, role: "client", kind: "client" },
    ...remaining.map((item) => ({ id: item.clerk_user_id, role: "interpreter", kind: "team" })),
  ], {
    assignmentId: assignment.id,
    title: (recipient) => recipient.kind === "removed" ? "You were removed from an MLS assignment" : "Assignment team updated",
    body: (recipient) => recipient.kind === "removed"
      ? `You are no longer assigned to ${label}. Contact MLS if you have questions.`
      : `${interpreterName(removed)} was removed from ${label}.${remaining.length ? ` Current team: ${remaining.map(interpreterName).join(", ")}.` : " MLS is arranging replacement coverage."}`,
  });

  const workspace = await syncAssignmentWorkspaceRecord(db, assignment);
  return { status: 200, payload: { removed: removedResult.data || existing, assignment, workspace } };
}
