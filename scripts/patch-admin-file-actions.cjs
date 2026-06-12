const fs = require('fs');

const apiPath = 'api/portal.js';
if (fs.existsSync(apiPath)) {
  let api = fs.readFileSync(apiPath, 'utf8');

  if (!api.includes('async function adminRemoveDocument')) {
    const fn = String.raw`
async function adminRemoveDocument(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const documentId = body?.documentId;
  if (!documentId) return { status: 400, payload: { error: "Document ID is required." } };

  const { data: existing, error: existingError } = await db
    .from("interpreter_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) return { status: 404, payload: { error: "Document record not found." } };

  if (existing.storage_path) {
    await db.storage.from("interpreter-" + "documents").remove([existing.storage_path]);
  }

  const { error } = await db.from("interpreter_documents").delete().eq("id", existing.id);
  if (error) throw error;
  return { status: 200, payload: { success: true, documentId: existing.id, documentType: existing.document_type } };
}

`;
    api = api.replace('export default async function handler', fn + 'export default async function handler');
  }

  if (!api.includes('action === "adminRemoveDocument"')) {
    const branch = String.raw`
    if (req.method === "POST" && action === "adminRemoveDocument") {
      const result = await adminRemoveDocument(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

`;
    api = api.replace('    if (req.method === "POST" && action === "adminCreateDocumentLink") {', branch + '    if (req.method === "POST" && action === "adminCreateDocumentLink") {');
  }

  fs.writeFileSync(apiPath, api);
}

const profilePath = 'src/pages/AdminInterpreterProfile.jsx';
if (fs.existsSync(profilePath)) {
  let page = fs.readFileSync(profilePath, 'utf8');

  page = page.replace(
    'import { ArrowLeft, AlertCircle, BadgeCheck, CheckCircle2, Download, FileText, RefreshCcw, Save, UploadCloud } from "lucide-react";',
    'import { ArrowLeft, AlertCircle, BadgeCheck, CheckCircle2, Download, FileText, RefreshCcw, Save, Trash2, UploadCloud } from "lucide-react";'
  );

  if (!page.includes('const removeDocument = async (document)')) {
    const fn = String.raw`
  const removeDocument = async (document) => {
    if (!document?.id) return;
    const confirmed = window.confirm(`Delete ${document.file_name || "this document"}? This removes the file from the admin/interpreter portal.`);
    if (!confirmed) return;
    setDocumentBusy(document.document_type);
    setMessage("");
    try {
      const data = await portalRequest("adminRemoveDocument", { method: "POST", body: { documentId: document.id } });
      setInterpreter((current) => ({
        ...current,
        interpreter_documents: (current?.interpreter_documents || []).filter((item) => item.id !== data.documentId),
      }));
      setMessage("Document deleted.");
    } catch (error) {
      setMessage(`Could not delete file: ${error.message}`);
    } finally {
      setDocumentBusy("");
    }
  };

`;
    page = page.replace('  const uploadDocument = async (documentType) => {', fn + '  const uploadDocument = async (documentType) => {');
  }

  if (!page.includes('<Trash2 size={13} /> Delete')) {
    page = page.replace(
      `                            <button type="button" disabled={documentBusy === documentType} onClick={() => uploadDocument(documentType)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-white disabled:opacity-60" style={{ backgroundColor: document ? palette.gold : palette.burgundy }}>
                              <UploadCloud size={13} /> {documentBusy === documentType ? "Uploading..." : document ? "Replace" : "Upload"}
                            </button>`,
      `                            <button type="button" disabled={documentBusy === documentType} onClick={() => uploadDocument(documentType)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-white disabled:opacity-60" style={{ backgroundColor: document ? palette.gold : palette.burgundy }}>
                              <UploadCloud size={13} /> {documentBusy === documentType ? "Uploading..." : document ? "Replace" : "Upload"}
                            </button>
                            {document && (
                              <button type="button" disabled={documentBusy === documentType} onClick={() => removeDocument(document)} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold disabled:opacity-60" style={{ borderColor: palette.border, color: palette.burgundy }}>
                                <Trash2 size={13} /> Delete
                              </button>
                            )}`
    );
  }

  fs.writeFileSync(profilePath, page);
}
