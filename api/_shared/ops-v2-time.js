import { audit, hoursBetween, interpreterFor, notify } from "./ops-v2-core.js";

export async function interpreterSubmitTime(db, user, payload) {
  const interpreter = await interpreterFor(db, user.id);
  if (!interpreter) return { status: 403, payload: { error: "Interpreter access required." } };

  const link = await db
    .from("assignment_interpreters")
    .select("*, assignments(*)")
    .eq("assignment_id", payload.assignmentId)
    .eq("interpreter_id", interpreter.id)
    .maybeSingle();
  if (link.error) throw link.error;
  if (!link.data) return { status: 403, payload: { error: "You are not assigned to that assignment." } };

  const billableHours = hoursBetween(payload.actualStartAt, payload.actualEndAt, payload.breakMinutes);
  if (billableHours <= 0) return { status: 400, payload: { error: "Enter a valid start and end time." } };

  const values = {
    assignment_id: payload.assignmentId,
    assignment_interpreter_id: link.data.id,
    interpreter_id: interpreter.id,
    scheduled_start_at: link.data.assignments?.start_at || null,
    scheduled_end_at: link.data.assignments?.end_at || null,
    actual_start_at: payload.actualStartAt,
    actual_end_at: payload.actualEndAt,
    break_minutes: Number(payload.breakMinutes || 0),
    billable_hours: billableHours,
    status: "submitted",
    interpreter_notes: payload.notes || null,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const result = await db
    .from("time_entries")
    .upsert(values, { onConflict: "assignment_id,interpreter_id" })
    .select()
    .single();
  if (result.error) throw result.error;

  const assignmentUpdate = await db.from("assignments").update({
    lifecycle_status: "time_submitted",
    actual_start_at: payload.actualStartAt,
    actual_end_at: payload.actualEndAt,
    updated_at: new Date().toISOString(),
  }).eq("id", payload.assignmentId);
  if (assignmentUpdate.error) throw assignmentUpdate.error;

  await audit(db, user, {
    action: "time.submitted",
    entityType: "time_entry",
    entityId: result.data.id,
    summary: `${billableHours} hours`,
    after: result.data,
  });

  return { status: 200, payload: { timeEntry: result.data } };
}

export async function adminReviewTime(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!["approved", "rejected"].includes(payload.status)) {
    return { status: 400, payload: { error: "Choose approved or rejected." } };
  }

  const result = await db.from("time_entries").update({
    status: payload.status,
    admin_notes: payload.notes || null,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", payload.timeEntryId)
    .select("*, interpreters(clerk_user_id)")
    .single();
  if (result.error) throw result.error;

  await notify(db, result.data.interpreters?.clerk_user_id, {
    category: "time",
    title: `Time entry ${payload.status}`,
    body: payload.notes || `${result.data.billable_hours} hours`,
    section: "work",
    relatedType: "time_entry",
    relatedId: result.data.id,
  });

  await audit(db, user, {
    action: `time.${payload.status}`,
    entityType: "time_entry",
    entityId: result.data.id,
    summary: payload.notes || null,
    after: result.data,
  });

  return { status: 200, payload: { timeEntry: result.data } };
}
