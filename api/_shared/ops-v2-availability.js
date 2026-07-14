import { audit, interpreterFor } from "./ops-v2-core.js";

export async function interpreterSaveAvailability(db, user, payload) {
  const interpreter = await interpreterFor(db, user.id);
  if (!interpreter) return { status: 403, payload: { error: "Interpreter access required." } };

  if (new Date(payload.endAt) <= new Date(payload.startAt)) {
    return { status: 400, payload: { error: "End time must be after start time." } };
  }

  const values = {
    interpreter_id: interpreter.id,
    start_at: payload.startAt,
    end_at: payload.endAt,
    availability_type: payload.availabilityType || "available",
    recurrence_rule: payload.recurrenceRule || null,
    notes: payload.notes || null,
    updated_at: new Date().toISOString(),
  };

  const result = payload.availabilityId
    ? await db.from("interpreter_availability")
      .update(values)
      .eq("id", payload.availabilityId)
      .eq("interpreter_id", interpreter.id)
      .select()
      .single()
    : await db.from("interpreter_availability").insert(values).select().single();
  if (result.error) throw result.error;

  await audit(db, user, {
    action: "availability.saved",
    entityType: "interpreter_availability",
    entityId: result.data.id,
    summary: payload.availabilityType || "available",
    after: result.data,
  });

  return { status: 200, payload: { availability: result.data } };
}

export async function interpreterDeleteAvailability(db, user, payload) {
  const interpreter = await interpreterFor(db, user.id);
  if (!interpreter) return { status: 403, payload: { error: "Interpreter access required." } };

  const result = await db.from("interpreter_availability")
    .delete()
    .eq("id", payload.availabilityId)
    .eq("interpreter_id", interpreter.id)
    .select()
    .maybeSingle();
  if (result.error) throw result.error;

  await audit(db, user, {
    action: "availability.deleted",
    entityType: "interpreter_availability",
    entityId: payload.availabilityId,
  });

  return { status: 200, payload: { removed: result.data || null } };
}
