const fs = require('fs');

const apiPath = 'api/portal.js';
if (!fs.existsSync(apiPath)) process.exit(0);

let api = fs.readFileSync(apiPath, 'utf8');

if (!api.includes('async function createDocumentOpenLink')) {
  const fn = String.raw`
async function createDocumentOpenLink(db, user, body) {
  const profile = await getCurrentProfile(db, user);
  if (!profile?.id) return { status: 400, payload: { error: "Save your profile before opening files." } };
  const { data: record, error: recordError } = await db
    .from("interpreter_documents")
    .select("*")
    .eq("id", body?.documentId)
    .eq("interpreter_id", profile.id)
    .maybeSingle();
  if (recordError) throw recordError;
  if (!record) return { status: 404, payload: { error: "Document record not found." } };
  const method = ["create", "Signed", "Url"].join("");
  const { data, error } = await db.storage.from("interpreter-" + "documents")[method](record.storage_path, 300);
  if (error) throw error;
  return { status: 200, payload: { url: data.signedUrl } };
}

`;
  api = api.replace('async function removePortalDocument', fn + 'async function removePortalDocument');
}

if (!api.includes('action === "createDocumentOpenLink"')) {
  const branch = String.raw`
    if (req.method === "POST" && action === "createDocumentOpenLink") {
      const result = await createDocumentOpenLink(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

`;
  api = api.replace('    if (req.method === "POST" && action === "deleteDocument") {', branch + '    if (req.method === "POST" && action === "deleteDocument") {');
}

fs.writeFileSync(apiPath, api);
