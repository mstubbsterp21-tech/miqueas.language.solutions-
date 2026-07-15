import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbAdminKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
const clerkKey = process.env["CLERK_" + "SECRET_KEY"];

function send(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function bearer(req) {
  return String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1] || "";
}

function decode(token) {
  return JSON.parse(Buffer.from(token.split(".")[1] || "", "base64url").toString("utf8"));
}

async function signedInUser(req) {
  const jwt = bearer(req);
  if (!jwt || !clerkKey) return null;
  const claims = decode(jwt);
  if (!claims?.sid || !claims?.sub) return null;

  const clerk = createClerkClient({ secretKey: clerkKey });
  const session = await clerk.sessions.getSession(claims.sid);
  if (session?.userId !== claims.sub) return null;
  return { id: claims.sub };
}

function database() {
  if (!dbUrl || !dbAdminKey) throw new Error("Missing Supabase server settings in Vercel.");
  return createClient(dbUrl, dbAdminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function selectedIds(payload) {
  const values = [
    ...(Array.isArray(payload.notificationIds) ? payload.notificationIds : []),
    payload.notificationId,
  ];
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].slice(0, 100);
}

function applySelection(query, ids) {
  if (!ids.length) return query;
  return ids.length === 1 ? query.eq("id", ids[0]) : query.in("id", ids);
}

async function setReadState(db, user, payload) {
  const ids = selectedIds(payload);
  const isRead = payload.isRead !== false;
  let query = db
    .from("notifications")
    .update({
      is_read: isRead,
      read_at: isRead ? new Date().toISOString() : null,
    })
    .eq("recipient_clerk_user_id", user.id);
  query = applySelection(query, ids);
  const result = await query.select("id,is_read,read_at");
  if (result.error) throw result.error;
  return { updated: result.data || [] };
}

async function clearNotifications(db, user, payload) {
  const ids = selectedIds(payload);
  let query = db
    .from("notifications")
    .delete()
    .eq("recipient_clerk_user_id", user.id);
  query = applySelection(query, ids);
  const result = await query.select("id");
  if (result.error) throw result.error;
  return { deleted: result.data || [] };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "POST is required." });
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });

    const action = String(req.query?.action || "");
    const payload = readBody(req);
    const db = database();

    if (action === "setReadState") return send(res, 200, await setReadState(db, user, payload));
    if (action === "clear") return send(res, 200, await clearNotifications(db, user, payload));
    return send(res, 404, { error: "Unknown notification action." });
  } catch (error) {
    console.error("MLS notification action error", error);
    return send(res, 500, { error: error.message || "Notification action failed." });
  }
}
