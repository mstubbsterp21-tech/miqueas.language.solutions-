import { audit, interpreterFor } from "./ops-v2-core.js";

const weeklyMarker = "X-MLS-BLOCK=";
const dayFields = [
  "availability_sunday",
  "availability_monday",
  "availability_tuesday",
  "availability_wednesday",
  "availability_thursday",
  "availability_friday",
  "availability_saturday",
];
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

  const oldRows = await db.from("interpreter_availability")
    .select("id")
    .eq("interpreter_id", interpreter.id)
    .like("recurrence_rule", `%${weeklyMarker}%`);
  if (oldRows.error) throw oldRows.error;

  if (windows.length) {
    const values = windows.map((window) => ({
      interpreter_id: interpreter.id,
      start_at: window.startAt,
      end_at: window.endAt,
      availability_type: window.availabilityType,
      recurrence_rule: `FREQ=WEEKLY;BYDAY=${window.byDay};${weeklyMarker}${window.block};X-MLS-TZID=${timeZone}`,
      notes: window.availabilityType === "unavailable" ? "Suppress opportunity emails during this weekly window" : "Weekly availability window",
      updated_at: new Date().toISOString(),
    }));
    const inserted = await db.from("interpreter_availability").insert(values).select();
    if (inserted.error) throw inserted.error;
  }

  if ((oldRows.data || []).length) {
    const removed = await db.from("interpreter_availability").delete().in("id", oldRows.data.map((item) => item.id));
    if (removed.error) throw removed.error;
  }

  const profileUpdates = { availability_timezone: timeZone, updated_at: new Date().toISOString() };
  dayFields.forEach((field, weekday) => {
    profileUpdates[field] = windows
      .filter((window) => window.weekday === weekday)
      .map((window) => `${window.availabilityType === "unavailable" ? "Unavailable" : "Available"}: ${blockLabels[window.block]}`)
      .join(", ");
  });
  profileUpdates.availability_morning = windows.some((window) => window.block === "morning" && window.availabilityType === "available");
  profileUpdates.availability_afternoon = windows.some((window) => window.block === "afternoon" && window.availabilityType === "available");
  profileUpdates.availability_evening = windows.some((window) => window.block === "evening" && window.availabilityType === "available");
  profileUpdates.availability_overnight = windows.some((window) => window.block === "overnight" && window.availabilityType === "available");

  const profile = await db.from("interpreters").update(profileUpdates).eq("id", interpreter.id).select().single();
  if (profile.error) throw profile.error;

  await audit(db, user, {
    action: "availability.weekly_saved",
    entityType: "interpreter",
    entityId: interpreter.id,
    summary: `${windows.length} weekly windows · ${timeZone}`,
    after: { windows, timeZone },
  });

  const refreshed = await db.from("interpreter_availability").select("*").eq("interpreter_id", interpreter.id).order("start_at", { ascending: true });
  if (refreshed.error) throw refreshed.error;
  return { status: 200, payload: { availability: refreshed.data || [], profile: profile.data } };
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
