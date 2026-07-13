import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbAdminKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const adminEmails = (process.env.VITE_ADMIN_EMAILS || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);

function send(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

function body(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function token(req) {
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

function decode(jwt) {
  return JSON.parse(Buffer.from(jwt.split(".")[1] || "", "base64url").toString("utf8"));
}

async function signedInUser(req) {
  const jwt = token(req);
  if (!jwt || !clerkKey) return null;
  const claims = decode(jwt);
  if (!claims?.sid || !claims?.sub) return null;
  const clerk = createClerkClient({ secretKey: clerkKey });
  const session = await clerk.sessions.getSession(claims.sid);
  if (session?.userId !== claims.sub) return null;
  const record = await clerk.users.getUser(claims.sub);
  const email = record.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  return {
    id: record.id,
    email,
    isAdmin: adminEmails.includes(email),
    role: String(record.publicMetadata?.portalRole || "").toLowerCase(),
  };
}

function db() {
  if (!dbUrl || !dbAdminKey) throw new Error("Missing Supabase server settings in Vercel.");
  return createClient(dbUrl, dbAdminKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function interpreterFor(database, user) {
  const result = await database.from("interpreters").select("*").eq("clerk_user_id", user.id).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function clientFor(database, user) {
  const result = await database.from("clients").select("*").eq("clerk_user_id", user.id).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function loadOperations(database, user) {
  const [interpreter, client] = await Promise.all([interpreterFor(database, user), clientFor(database, user)]);
  const response = { training: [], opportunities: [], bids: [], feedback: [], admin: null };

  if (interpreter) {
    const [courses, opportunities, bids] = await Promise.all([
      database.from("training_courses").select("*, training_progress(*)").eq("is_published", true).order("sort_order"),
      database.from("assignment_opportunities").select("*, assignments(*)").eq("status", "open").order("opens_at", { ascending: false }),
      database.from("assignment_bids").select("*, assignment_opportunities(*, assignments(*))").eq("interpreter_id", interpreter.id).order("created_at", { ascending: false }),
    ]);
    for (const result of [courses, opportunities, bids]) if (result.error) throw result.error;
    response.training = (courses.data || []).map((course) => ({
      ...course,
      progress: (course.training_progress || []).find((x) => x.interpreter_id === interpreter.id) || null,
      training_progress: undefined,
    }));
    response.opportunities = opportunities.data || [];
    response.bids = bids.data || [];
  }

  if (client) {
    const feedback = await database.from("client_feedback").select("*, assignments(service_type,start_at,status)").eq("client_id", client.id).order("created_at", { ascending: false });
    if (feedback.error) throw feedback.error;
    response.feedback = feedback.data || [];
  }

  if (user.isAdmin) {
    const [courses, progress, opportunities, bids, feedback] = await Promise.all([
      database.from("training_courses").select("*").order("sort_order"),
      database.from("training_progress").select("*, interpreters(first_name,last_name,email), training_courses(title)").order("updated_at", { ascending: false }),
      database.from("assignment_opportunities").select("*, assignments(*, clients(organization_name,email))").order("created_at", { ascending: false }),
      database.from("assignment_bids").select("*, interpreters(first_name,last_name,email), assignment_opportunities(*, assignments(service_type,start_at,delivery_mode))").order("created_at", { ascending: false }),
      database.from("client_feedback").select("*, clients(organization_name,email), assignments(service_type,start_at)").order("created_at", { ascending: false }),
    ]);
    for (const result of [courses, progress, opportunities, bids, feedback]) if (result.error) throw result.error;
    response.admin = {
      courses: courses.data || [],
      progress: progress.data || [],
      opportunities: opportunities.data || [],
      bids: bids.data || [],
      feedback: feedback.data || [],
    };
  }

  return response;
}

async function updateTraining(database, user, payload) {
  const interpreter = await interpreterFor(database, user);
  if (!interpreter) return { status: 403, payload: { error: "Interpreter profile required." } };
  const percent = Math.max(0, Math.min(100, Number(payload.progressPercent || 0)));
  const status = percent >= 100 ? "completed" : percent > 0 ? "in_progress" : "not_started";
  const result = await database.from("training_progress").upsert({
    course_id: payload.courseId,
    interpreter_id: interpreter.id,
    progress_percent: percent,
    status,
    completed_at: status === "completed" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "course_id,interpreter_id" }).select().single();
  if (result.error) throw result.error;
  return { status: 200, payload: { progress: result.data } };
}

async function submitBid(database, user, payload) {
  const interpreter = await interpreterFor(database, user);
  if (!interpreter) return { status: 403, payload: { error: "Interpreter profile required." } };
  const opportunity = await database.from("assignment_opportunities").select("*").eq("id", payload.opportunityId).eq("status", "open").maybeSingle();
  if (opportunity.error) throw opportunity.error;
  if (!opportunity.data) return { status: 404, payload: { error: "Opportunity is not open." } };
  const result = await database.from("assignment_bids").upsert({
    opportunity_id: payload.opportunityId,
    interpreter_id: interpreter.id,
    bid_rate: payload.bidRate || null,
    message: payload.message || null,
    status: "submitted",
    updated_at: new Date().toISOString(),
  }, { onConflict: "opportunity_id,interpreter_id" }).select().single();
  if (result.error) throw result.error;
  return { status: 200, payload: { bid: result.data } };
}

async function submitFeedback(database, user, payload) {
  const client = await clientFor(database, user);
  if (!client) return { status: 403, payload: { error: "Client profile required." } };
  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { status: 400, payload: { error: "Choose a rating from 1 to 5." } };
  if (payload.assignmentId) {
    const assignment = await database.from("assignments").select("id").eq("id", payload.assignmentId).eq("client_id", client.id).maybeSingle();
    if (assignment.error) throw assignment.error;
    if (!assignment.data) return { status: 403, payload: { error: "That assignment does not belong to this client." } };
  }
  const result = await database.from("client_feedback").insert({
    client_id: client.id,
    assignment_id: payload.assignmentId || null,
    rating,
    comments: payload.comments || null,
    follow_up_requested: Boolean(payload.followUpRequested),
  }).select().single();
  if (result.error) throw result.error;
  return { status: 201, payload: { feedback: result.data } };
}

async function adminSaveCourse(database, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const values = {
    title: String(payload.title || "").trim(),
    description: payload.description || null,
    category: payload.category || "Professional Development",
    content_url: payload.contentUrl || null,
    duration_minutes: payload.durationMinutes ? Number(payload.durationMinutes) : null,
    is_published: payload.isPublished !== false,
    sort_order: Number(payload.sortOrder || 0),
    updated_at: new Date().toISOString(),
  };
  if (!values.title) return { status: 400, payload: { error: "Course title is required." } };
  const query = payload.courseId
    ? database.from("training_courses").update(values).eq("id", payload.courseId)
    : database.from("training_courses").insert(values);
  const result = await query.select().single();
  if (result.error) throw result.error;
  return { status: 200, payload: { course: result.data } };
}

async function adminPublishOpportunity(database, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.assignmentId) return { status: 400, payload: { error: "Assignment is required." } };
  const result = await database.from("assignment_opportunities").upsert({
    assignment_id: payload.assignmentId,
    status: payload.status || "open",
    opens_at: payload.opensAt || new Date().toISOString(),
    closes_at: payload.closesAt || null,
    notes: payload.notes || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "assignment_id" }).select().single();
  if (result.error) throw result.error;
  return { status: 200, payload: { opportunity: result.data } };
}

async function adminUpdateBid(database, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const allowed = new Set(["submitted", "shortlisted", "accepted", "declined", "withdrawn"]);
  if (!allowed.has(payload.status)) return { status: 400, payload: { error: "Invalid bid status." } };
  const result = await database.from("assignment_bids").update({ status: payload.status, updated_at: new Date().toISOString() }).eq("id", payload.bidId).select().single();
  if (result.error) throw result.error;
  return { status: 200, payload: { bid: result.data } };
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    const database = db();
    const action = String(req.query?.action || "loadOperations");
    const payload = body(req);
    let result;
    if (action === "loadOperations") return send(res, 200, await loadOperations(database, user));
    if (action === "updateTraining") result = await updateTraining(database, user, payload);
    else if (action === "submitBid") result = await submitBid(database, user, payload);
    else if (action === "submitFeedback") result = await submitFeedback(database, user, payload);
    else if (action === "adminSaveCourse") result = await adminSaveCourse(database, user, payload);
    else if (action === "adminPublishOpportunity") result = await adminPublishOpportunity(database, user, payload);
    else if (action === "adminUpdateBid") result = await adminUpdateBid(database, user, payload);
    else result = { status: 404, payload: { error: "Unknown operation." } };
    return send(res, result.status, result.payload);
  } catch (error) {
    console.error("Portal operations error", error);
    return send(res, 500, { error: error.message || "Portal operation failed." });
  }
}
