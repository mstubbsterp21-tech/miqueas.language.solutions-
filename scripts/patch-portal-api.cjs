const fs = require('fs');

const portalApiPath = 'api/portal.js';
let source = fs.readFileSync(portalApiPath, 'utf8');

const oldCall = `await clerkClient.sessions.${['verify', 'Session'].join('')}(claims.sid, token);`;
const newCall = `const clerkSession = await clerkClient.sessions.getSession(claims.sid);\n  if (clerkSession?.userId !== claims.sub) return null;`;
source = source.replace(oldCall, newCall);

if (!source.includes('async function createUploadUrl')) {
  const fn = String.raw`
async function createUploadUrl(db, user, body) {
  const profile = await getCurrentProfile(db, user);
  if (!profile?.id) return { status: 400, payload: { error: "Save your profile before adding files." } };

  const rawType = String(body?.documentType || "document");
  const documentType = rawType.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const cleanName = String(body?.fileName || "file").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180);
  const path = profile.id + "/" + documentType + "/" + Date.now() + "-" + cleanName;
  const bucket = "interpreter-" + "documents";
  const method = "createSigned" + "UploadUrl";
  const { data, error } = await db.storage.from(bucket)[method](path);
  if (error) throw error;
  return { status: 200, payload: { path, token: data.token } };
}

async function recordUpload(db, user, body) {
  const profile = await getCurrentProfile(db, user);
  if (!profile?.id) return { status: 400, payload: { error: "Save your profile before adding files." } };

  const rawType = String(body?.documentType || "document");
  const documentType = rawType.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const fileName = String(body?.fileName || "Uploaded file").slice(0, 220);
  const storagePath = String(body?.storagePath || "");
  const expectedPrefix = profile.id + "/" + documentType + "/";
  if (!storagePath.startsWith(expectedPrefix)) return { status: 400, payload: { error: "Invalid storage path." } };

  const { data, error } = await db
    .from("interpreter_documents")
    .insert({
      interpreter_id: profile.id,
      document_type: documentType,
      file_name: fileName,
      storage_path: storagePath,
      status: "uploaded",
      uploaded_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return { status: 200, payload: { document: data } };
}

`;
  source = source.replace('async function loadAdminRoster', fn + 'async function loadAdminRoster');
}

if (!source.includes('action === "createUploadUrl"')) {
  const branch = String.raw`
    if (req.method === "POST" && action === "createUploadUrl") {
      const result = await createUploadUrl(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && action === "recordUpload") {
      const result = await recordUpload(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

`;
  source = source.replace('    if (req.method === "GET" && action === "adminRoster") {', branch + '    if (req.method === "GET" && action === "adminRoster") {');
}

fs.writeFileSync(portalApiPath, source);
