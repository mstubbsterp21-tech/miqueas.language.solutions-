import { createClerkClient, verifyToken } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "./web-push.js";

const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbAdminKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const adminEmails = (process.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const clerkUserCache = new Map();
const clerkUserCacheMs = 30_000;

export function send(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

export function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function bearer(req) {
  return String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1] || "";
}

export async function signedInUser(req) {
  const jwt = bearer(req);
  if (!jwt || !clerkKey) return null;
  const claims = await verifyToken(jwt, { secretKey: clerkKey });
  if (!claims?.sid || !claims?.sub) return null;
  const cached = clerkUserCache.get(claims.sub);
  let record = cached?.expiresAt > Date.now() ? cached.record : null;
  if (!record) {
    const clerk = createClerkClient({ secretKey: clerkKey });
    record = await clerk.users.getUser(claims.sub);
    clerkUserCache.set(claims.sub, { record, expiresAt: Date.now() + clerkUserCacheMs });
    if (clerkUserCache.size > 250) {
      for (const [key, value] of clerkUserCache) {
        if (value.expiresAt <= Date.now()) clerkUserCache.delete(key);
      }
    }
  }
  const email = record.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const metadataRole = String(record.publicMetadata?.portalRole || "").toLowerCase();
  return {
    id: record.id,
    email,
    firstName: record.firstName || "",
    lastName: record.lastName || "",
    isAdmin: adminEmails.includes(email),
    role: metadataRole,
    metadataRole,
    organizationName: String(record.publicMetadata?.organizationName || ""),
  };
}

export function database() {
  if (!dbUrl || !dbAdminKey) throw new Error("Missing Supabase server settings in Vercel.");
  return createClient(dbUrl, dbAdminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function clientFor(db, userId) {
  const result = await db.from("clients").select("*").eq("clerk_user_id", userId).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function interpreterFor(db, userId) {
  const result = await db.from("interpreters").select("*").eq("clerk_user_id", userId).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function notify(db, recipient, values) {
  if (!recipient) return;
  const notification = {
    recipient_clerk_user_id: recipient,
    category: values.category || "general",
    title: values.title,
    body: values.body || null,
    section: values.section || null,
    related_type: values.relatedType || null,
    related_id: values.relatedId || null,
    notification_key: values.key || null,
  };
  const result = values.key
    ? await db.from("notifications").upsert(notification, { onConflict: "notification_key", ignoreDuplicates: true }).select().maybeSingle()
    : await db.from("notifications").insert(notification).select().single();
  if (result.error) throw result.error;
  if (result.data) await sendPushNotification(db, result.data).catch((error) => console.warn("MLS push delivery failed", error));
}

export async function audit(db, user, values) {
  const result = await db.from("audit_events").insert({
    actor_clerk_user_id: user.id,
    actor_role: user.isAdmin ? "admin" : user.metadataRole || "user",
    action: values.action,
    entity_type: values.entityType,
    entity_id: values.entityId || null,
    summary: values.summary || null,
    before_data: values.before || null,
    after_data: values.after || null,
  });
  if (result.error) throw result.error;
}

export function money(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0;
}

export function hoursBetween(start, end, breakMinutes = 0) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
  return Math.max(0, Math.round((((endMs - startMs) / 36e5) - Number(breakMinutes || 0) / 60) * 100) / 100);
}
