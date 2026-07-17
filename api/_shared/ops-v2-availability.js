import { audit, interpreterFor } from "./ops-v2-core.js";

const blockLabels = {
  overnight: "Overnight (12AM-6AM)",
  morning: "Morning (6AM-12PM)",
  afternoon: "Afternoon (12PM-6PM)",
  evening: "Evening (6PM-12AM)",
};

function validTimeZone(value) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

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

export async function interpreterSaveWeeklyAvailability(db, user, payload) {
  const interpreter = await interpreterFor(db, user.id);
  if (!interpreter) return { status: 403, payload: { error: "Interpreter access required." } };

  const timeZone = String(payload?.timeZone || "America/New_York").trim();
  if (!validTimeZone(timeZone)) return { status: 400, payload: { error: "Choose a valid time zone." } };

  const windows = Array.isArray(payload?.windows) ? payload.windows : [];
  if (windows.length > 56) return { status: 400, payload: { error: "Too many weekly availability windows were submitted." } };

  const allowedBlocks = new Set(Object.keys(blockLabels));
  const allowedTypes = new Set(["available", "unavailable"]);
  for (const window of windows) {
    if (!Number.isInteger(window.weekday) || window.weekday < 0 || window.weekday > 6 || !allowedBlocks.has(window.block) || !allowedTypes.has(window.availabilityType)) {
      return { status: 400, payload: { error: "One or more weekly availability selections are invalid." } };
    }
    if (!window.startAt || !window.endAt || new Date(window.endAt) <= new Date(window.startAt)) {
      return { status: 400, payload: { error: "One or more weekly availability times are invalid." } };
    }
  }

  const replaced = await db.rpc("mls_replace_weekly_availability", {
    p_interpreter_id: interpreter.id,
    p_timezone: timeZone,
    p_windows: windows.map((window) => ({
      weekday: window.weekday,
      block: window.block,
      availabilityType: window.availabilityType,
      startAt: window.startAt,
      endAt: window.endAt,
    })),
  });
  if (replaced.error) throw replaced.error;

  const profile = await db.from("interpreters").select("*").eq("id", interpreter.id).single();
  if (profile.error) throw profile.error;

  await audit(db, user, {
    action: "availability.weekly_saved",
    entityType: "interpreter",
    entityId: interpreter.id,
    summary: `${windows.length} weekly windows · ${timeZone}`,
    after: { windows, timeZone },
  });

  return { status: 200, payload: { availability: replaced.data || [], profile: profile.data } };
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
