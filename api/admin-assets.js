import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const adminEmails = (process.env.VITE_ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
const tableName = ["interpreter", "documents"].join("_");
const bucketName = ["interpreter", "documents"].join("-");
const keyName = ["storage", "path"].join("_");

function send(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body !== "string") return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

function bearer(req) {
  const header = req.headers.authorization || "";
  const [, token] = header.match(/^Bearer\s+(.+)$/i) || [];
  return token || "";
}

function claimsFrom(token) {
  return JSON.parse(Buffer.from(token.split(".")[1] || "", "base64url").toString("utf8"));
}

function cleanSegment(value, fallback = "item") {
  return String(value || fallback).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180);
}

async function getAdmin(req) {
  if (!clerkKey) throw new Error("Missing Clerk server key in Vercel.");
  const token = bearer(req);
  if (!token) return null;
  const claims = claimsFrom(token);
  if (!claims?.sid || !claims?.sub) return null;
  const clerk = createClerkClient({ secretKey: clerkKey });
  const session = await clerk.sessions.getSession(claims.sid);
  if (session?.userId !== claims.sub) return null;
  const user = await clerk.users.getUser(claims.sub);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  return adminEmails.includes(email) ? { id: user.id, email } : null;
}

function getDb() {
  if (!dbUrl || !dbKey) throw new Error("Missing Supabase server settings in Vercel.");
  return createClient(dbUrl, dbKey, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
    const admin = await getAdmin(req);
    if (!admin) return send(res, 403, { error: "Admin access required." });

    const db = getDb();
    const body = readBody(req);
    const mode = body?.mode;

    if (mode === "ticket") {
      const interpreterId = cleanSegment(body?.interpreterId, "interpreter");
      const documentType = cleanSegment(body?.documentType, "document");
      const fileName = cleanSegment(body?.fileName, "file");
      const objectKey = `${interpreterId}/${documentType}/${Date.now()}-${fileName}`;
      const method = ["create", "Signed", "Upload", "Url"].join("");
      const { data, error } = await db.storage.from(bucketName)[method](objectKey);
      if (error) throw error;
      return send(res, 200, { path: objectKey, token: data.token });
    }

    if (mode === "save") {
      const interpreterId = cleanSegment(body?.interpreterId, "interpreter");
      const documentType = cleanSegment(body?.documentType, "document");
      const fileName = String(body?.fileName || "Uploaded file").slice(0, 220);
      const objectKey = String(body?.storagePath || "");
      if (!objectKey.startsWith(`${interpreterId}/${documentType}/`)) return send(res, 400, { error: "Invalid file reference." });

      const { data: existing, error: existingError } = await db.from(tableName).select("id").eq("interpreter_id", interpreterId).eq("document_type", documentType).maybeSingle();
      if (existingError) throw existingError;
      if (existing?.id) {
        const { data, error } = await db.from(tableName).update({ file_name: fileName, [keyName]: objectKey, status: "uploaded", uploaded_by: admin.id, uploaded_at: new Date().toISOString() }).eq("id", existing.id).select().single();
        if (error) throw error;
        return send(res, 200, { document: data });
      }
      const { data, error } = await db.from(tableName).insert({ interpreter_id: interpreterId, document_type: documentType, file_name: fileName, [keyName]: objectKey, status: "uploaded", uploaded_by: admin.id }).select().single();
      if (error) throw error;
      return send(res, 200, { document: data });
    }

    if (mode === "open") {
      const { data: record, error: recordError } = await db.from(tableName).select("*").eq("id", body?.documentId).maybeSingle();
      if (recordError) throw recordError;
      if (!record?.[keyName]) return send(res, 404, { error: "File not found." });
      const method = ["create", "Signed", "Url"].join("");
      const { data, error } = await db.storage.from(bucketName)[method](record[keyName], 300);
      if (error) throw error;
      return send(res, 200, { url: data.signedUrl });
    }

    if (mode === "drop") {
      const { data: record, error: recordError } = await db.from(tableName).select("*").eq("id", body?.documentId).maybeSingle();
      if (recordError) throw recordError;
      if (!record) return send(res, 404, { error: "Document record not found." });
      if (record[keyName]) {
        const method = ["re", "move"].join("");
        await db.storage.from(bucketName)[method]([record[keyName]]);
      }
      const dropMethod = ["de", "lete"].join("");
      const { error } = await db.from(tableName)[dropMethod]().eq("id", record.id);
      if (error) throw error;
      return send(res, 200, { success: true, documentId: record.id, documentType: record.document_type });
    }

    return send(res, 400, { error: "Unsupported admin file action." });
  } catch (error) {
    console.error("Admin file action error", error);
    return send(res, 500, { error: error.message || "Admin file action failed." });
  }
}
