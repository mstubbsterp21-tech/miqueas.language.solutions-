import { database, readBody, send, signedInUser } from "./_shared/ops-v2-core.js";
import { getGmailStatus, sendGmailEmail } from "./_shared/gmail-oauth.js";

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const BLOCKS = {
  overnight: [0, 360],
  morning: [360, 720],
  afternoon: [720, 1080],
  evening: [1080, 1440],
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function weeklyMeta(row) {
  const rule = String(row.recurrence_rule || "");
  if (!rule.includes("X-MLS-BLOCK=")) return null;
  const dayCode = rule.match(/BYDAY=([A-Z]{2})/)?.[1];
  const block = rule.match(/X-MLS-BLOCK=([^;]+)/)?.[1];
  const timeZone = rule.match(/X-MLS-TZID=([^;]+)/)?.[1] || "America/New_York";
  const weekday = DAY_CODES.indexOf(dayCode);
  if (weekday < 0 || !BLOCKS[block]) return null;
  return { weekday, block, timeZone };
}

function localParts(value, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: dayMap[get("weekday")],
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function weeklyOverlaps(row, startAt, endAt) {
  const meta = weeklyMeta(row);
  if (!meta) return false;
  const start = localParts(startAt, meta.timeZone);
  const end = localParts(endAt, meta.timeZone);
  const [windowStart, windowEnd] = BLOCKS[meta.block];
  if (start.date === end.date) {
    return meta.weekday === start.weekday && windowStart < end.minutes && windowEnd > start.minutes;
  }
  return (meta.weekday === start.weekday && windowEnd > start.minutes)
    || (meta.weekday === end.weekday && windowStart < end.minutes);
}

function oneTimeOverlaps(row, startAt, endAt) {
  return !weeklyMeta(row)
    && new Date(row.start_at).getTime() < new Date(endAt).getTime()
    && new Date(row.end_at).getTime() > new Date(startAt).getTime();
}

function isEligible(rows, assignment) {
  const startAt = assignment.start_at;
  const endAt = assignment.end_at || new Date(new Date(startAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
  const unavailable = rows.filter((row) => row.availability_type === "unavailable");
  if (unavailable.some((row) => weeklyOverlaps(row, startAt, endAt) || oneTimeOverlaps(row, startAt, endAt))) {
    return { eligible: false, reason: "unavailable_window" };
  }
  const recurringAvailable = rows.filter((row) => row.availability_type === "available" && weeklyMeta(row));
  if (recurringAvailable.length && !recurringAvailable.some((row) => weeklyOverlaps(row, startAt, endAt))) {
    return { eligible: false, reason: "outside_available_windows" };
  }
  return { eligible: true, reason: null };
}

function displayDate(assignment) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: assignment.timezone || "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(assignment.start_at));
}

async function sendOpportunity(db, interpreter, assignment) {
  const portalUrl = "https://miqueaslanguagesolutions.com/portal?section=work";
  const location = assignment.delivery_mode === "VRI"
    ? "Virtual"
    : [assignment.city, assignment.state].filter(Boolean).join(", ") || assignment.location_name || "Location available in the portal";
  const date = displayDate(assignment);
  const name = interpreter.first_name || "Interpreter";
  const subject = `New MLS assignment opportunity – ${assignment.service_type}`;
  const text = [
    `Hello ${name},`,
    "",
    "A new assignment opportunity that matches your saved availability is available in the MLS portal.",
    "",
    `Service: ${assignment.service_type}`,
    `Date: ${date}`,
    `Delivery: ${assignment.delivery_mode}`,
    `Location: ${location}`,
    "",
    "Sign in to review the full assignment and submit your interest or bid:",
    portalUrl,
    "",
    "Miqueas Language Solutions",
  ].join("\n");
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f7f3ef;padding:24px;color:#24130e"><div style="max-width:620px;margin:auto;background:#fff;padding:30px;border-radius:22px"><p style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#dd7d00">Miqueas Language Solutions</p><h1 style="font-size:28px">New assignment opportunity</h1><p style="line-height:1.7">Hello ${escapeHtml(name)},</p><p style="line-height:1.7">A new assignment opportunity that matches your saved availability is available in the MLS portal.</p><div style="background:#f8f5f2;border-radius:16px;padding:18px;line-height:1.8"><strong>Service:</strong> ${escapeHtml(assignment.service_type)}<br><strong>Date:</strong> ${escapeHtml(date)}<br><strong>Delivery:</strong> ${escapeHtml(assignment.delivery_mode)}<br><strong>Location:</strong> ${escapeHtml(location)}</div><p style="margin-top:24px"><a href="${portalUrl}" style="display:inline-block;background:#721100;color:#fff;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:700">Open MLS Portal</a></p><p style="font-size:12px;line-height:1.6;color:#6b625d">Your unavailable windows are automatically excluded from opportunity email notifications.</p></div></body></html>`;
  return sendGmailEmail(db, { to: interpreter.email, subject, text, html });
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    if (!user.isAdmin) return send(res, 403, { error: "Admin access required." });
    if (req.method !== "POST") return send(res, 405, { error: "Use POST." });

    const body = readBody(req);
    if (!body?.opportunityId) return send(res, 400, { error: "Opportunity ID is required." });
    const db = database();
    const opportunityResult = await db.from("assignment_opportunities").select("*, assignments(*)").eq("id", body.opportunityId).maybeSingle();
    if (opportunityResult.error) throw opportunityResult.error;
    const opportunity = opportunityResult.data;
    if (!opportunity?.assignments) return send(res, 404, { error: "Assignment opportunity not found." });

    const interpreterResult = await db.from("interpreters")
      .select("id,first_name,last_name,email,roster_status,availability_timezone")
      .eq("roster_status", "active")
      .not("email", "is", null);
    if (interpreterResult.error) throw interpreterResult.error;
    const interpreters = interpreterResult.data || [];
    const ids = interpreters.map((item) => item.id);
    const availabilityResult = ids.length
      ? await db.from("interpreter_availability").select("*").in("interpreter_id", ids)
      : { data: [], error: null };
    if (availabilityResult.error) throw availabilityResult.error;
    const grouped = new Map();
    (availabilityResult.data || []).forEach((row) => grouped.set(row.interpreter_id, [...(grouped.get(row.interpreter_id) || []), row]));

    const eligible = [];
    const suppressed = [];
    interpreters.forEach((interpreter) => {
      const decision = isEligible(grouped.get(interpreter.id) || [], opportunity.assignments);
      (decision.eligible ? eligible : suppressed).push({ interpreter, reason: decision.reason });
    });

    const gmail = await getGmailStatus(db);
    if (!gmail.connected) {
      return send(res, 200, { sent: 0, failed: eligible.length, suppressed: suppressed.length, eligible: eligible.length, configured: false, error: "Gmail is not connected." });
    }

    let sentCount = 0;
    let failedCount = 0;
    for (const item of eligible) {
      const delivery = await sendOpportunity(db, item.interpreter, opportunity.assignments);
      if (delivery.sent) sentCount += 1;
      else failedCount += 1;
    }

    return send(res, 200, {
      sent: sentCount,
      failed: failedCount,
      suppressed: suppressed.length,
      eligible: eligible.length,
      configured: true,
    });
  } catch (error) {
    console.error("MLS opportunity email error", error);
    return send(res, 500, { error: error.message || "Opportunity emails could not be sent." });
  }
}
