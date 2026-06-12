const fs = require('fs');

const apiPath = 'api/portal.js';
if (fs.existsSync(apiPath)) {
  let api = fs.readFileSync(apiPath, 'utf8');

  api = api.replaceAll(
    'interpreter_documents(id, document_type, status)',
    'interpreter_documents(id, document_type, file_name, storage_path, status, uploaded_at)'
  );

  if (!api.includes('async function adminCreateDocumentUploadUrl')) {
    const apiFns = String.raw`
async function adminCreateDocumentUploadUrl(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const interpreterId = body?.interpreterId;
  if (!interpreterId) return { status: 400, payload: { error: "Interpreter ID is required." } };
  const rawType = String(body?.documentType || "document");
  const documentType = rawType.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const cleanName = String(body?.fileName || "file").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180);
  const path = interpreterId + "/" + documentType + "/" + Date.now() + "-" + cleanName;
  const method = ["create", "Signed", "Upload", "Url"].join("");
  const { data, error } = await db.storage.from("interpreter-" + "documents")[method](path);
  if (error) throw error;
  return { status: 200, payload: { path, token: data.token } };
}

async function adminRecordDocumentUpload(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const interpreterId = body?.interpreterId;
  if (!interpreterId) return { status: 400, payload: { error: "Interpreter ID is required." } };
  const rawType = String(body?.documentType || "document");
  const documentType = rawType.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const fileName = String(body?.fileName || "Uploaded file").slice(0, 220);
  const storagePath = String(body?.storagePath || "");
  const expectedPrefix = interpreterId + "/" + documentType + "/";
  if (!storagePath.startsWith(expectedPrefix)) return { status: 400, payload: { error: "Invalid storage path." } };

  const { data: existing, error: existingError } = await db
    .from("interpreter_documents")
    .select("id")
    .eq("interpreter_id", interpreterId)
    .eq("document_type", documentType)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing?.id) {
    const { data, error } = await db
      .from("interpreter_documents")
      .update({ file_name: fileName, storage_path: storagePath, status: "uploaded", uploaded_by: user.id, uploaded_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return { status: 200, payload: { document: data } };
  }

  const { data, error } = await db
    .from("interpreter_documents")
    .insert({ interpreter_id: interpreterId, document_type: documentType, file_name: fileName, storage_path: storagePath, status: "uploaded", uploaded_by: user.id })
    .select()
    .single();
  if (error) throw error;
  return { status: 200, payload: { document: data } };
}

async function adminCreateDocumentLink(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const { data: record, error: recordError } = await db
    .from("interpreter_documents")
    .select("*")
    .eq("id", body?.documentId)
    .maybeSingle();
  if (recordError) throw recordError;
  if (!record) return { status: 404, payload: { error: "Document record not found." } };
  const method = ["create", "Signed", "Url"].join("");
  const { data, error } = await db.storage.from("interpreter-" + "documents")[method](record.storage_path, 300);
  if (error) throw error;
  return { status: 200, payload: { url: data.signedUrl } };
}

`;
    api = api.replace('async function loadAdminRoster', apiFns + 'async function loadAdminRoster');
  }

  if (!api.includes('action === "adminCreateDocumentUploadUrl"')) {
    const branches = String.raw`
    if (req.method === "POST" && action === "adminCreateDocumentUploadUrl") {
      const result = await adminCreateDocumentUploadUrl(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && action === "adminRecordDocumentUpload") {
      const result = await adminRecordDocumentUpload(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

    if (req.method === "POST" && action === "adminCreateDocumentLink") {
      const result = await adminCreateDocumentLink(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

`;
    api = api.replace('    if (req.method === "GET" && action === "adminRoster") {', branches + '    if (req.method === "GET" && action === "adminRoster") {');
  }

  fs.writeFileSync(apiPath, api);
}

const pagePath = 'src/pages/AdminInterpreters.jsx';
if (fs.existsSync(pagePath)) {
  let page = fs.readFileSync(pagePath, 'utf8');

  page = page.replace('import { useEffect, useState } from "react";', 'import { useEffect, useMemo, useState } from "react";');
  page = page.replace(
    'AlertTriangle, BadgeCheck, Edit3, Plus, RefreshCcw, Save, Search, Trash2, X',
    'AlertTriangle, BadgeCheck, Download, Edit3, FileText, Plus, RefreshCcw, Save, Search, Trash2, UploadCloud, X'
  );
  if (!page.includes('interpreterDocumentBucket')) {
    page = page.replace(
      'import { adminEmails, isSupabaseConfigured } from "../lib/env";',
      'import { adminEmails, isSupabaseConfigured } from "../lib/env";\nimport { createPortalSupabaseClient, interpreterDocumentBucket } from "../lib/supabaseClient";'
    );
  }

  if (!page.includes('const rosterDocumentTypes')) {
    page = page.replace(
      'const assignmentPreferenceOptions = ["On-site only", "VRI only", "Both", "Depends on setting"];',
      'const assignmentPreferenceOptions = ["On-site only", "VRI only", "Both", "Depends on setting"];\nconst rosterDocumentTypes = [\n  ["resume", "Résumé"],\n  ["w9", "W-9"],\n  ["credential_proof", "Credential proof"],\n  ["liability_insurance", "Liability insurance"],\n  ["ic_agreement", "IC Agreement"],\n  ["state_license", "State license"],\n  ["work_sample", "Work sample"],\n];'
    );
  }

  if (!page.includes('adminDocumentFiles')) {
    page = page.replace(
      '  const [newInterpreter, setNewInterpreter] = useState(initialNewInterpreter);',
      '  const [newInterpreter, setNewInterpreter] = useState(initialNewInterpreter);\n  const [adminDocumentFiles, setAdminDocumentFiles] = useState({});\n  const [adminDocumentBusy, setAdminDocumentBusy] = useState("");\n  const [adminDocumentOpeningId, setAdminDocumentOpeningId] = useState("");'
    );
  }

  if (!page.includes('adminUploadClient')) {
    page = page.replace(
      '  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";',
      '  const adminUploadClient = useMemo(() => createPortalSupabaseClient(null), []);\n  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";'
    );
  }

  if (!page.includes('const updateInterpreterDocument')) {
    const helpers = String.raw`
  const updateInterpreterDocument = (interpreterId, document) => {
    setInterpreters((current) => current.map((interpreter) => {
      if (interpreter.id !== interpreterId) return interpreter;
      const currentDocs = interpreter.interpreter_documents || [];
      const nextDocs = currentDocs.some((item) => item.id === document.id)
        ? currentDocs.map((item) => (item.id === document.id ? document : item))
        : [document, ...currentDocs];
      return { ...interpreter, interpreter_documents: nextDocs };
    }));
  };

  const openAdminDocument = async (document) => {
    if (!document?.id) return;
    setAdminDocumentOpeningId(document.id);
    setMessage("");
    try {
      const data = await portalRequest("adminCreateDocumentLink", {
        method: "POST",
        body: { documentId: document.id },
      });
      if (!data.url) throw new Error("Could not create document link.");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(`Could not open document: ${error.message}`);
    } finally {
      setAdminDocumentOpeningId("");
    }
  };

  const uploadAdminDocument = async (interpreter, documentType) => {
    const key = `${interpreter.id}:${documentType}`;
    const file = adminDocumentFiles[key];
    if (!file) {
      setMessage("Choose a file before uploading.");
      return;
    }
    setAdminDocumentBusy(key);
    setMessage("");
    try {
      const uploadData = await portalRequest("adminCreateDocumentUploadUrl", {
        method: "POST",
        body: { interpreterId: interpreter.id, documentType, fileName: file.name },
      });
      const { error: uploadError } = await adminUploadClient.storage
        .from(interpreterDocumentBucket)
        .uploadToSignedUrl(uploadData.path, uploadData.token, file);
      if (uploadError) throw uploadError;
      const recordData = await portalRequest("adminRecordDocumentUpload", {
        method: "POST",
        body: { interpreterId: interpreter.id, documentType, fileName: file.name, storagePath: uploadData.path },
      });
      updateInterpreterDocument(interpreter.id, recordData.document);
      setAdminDocumentFiles((current) => ({ ...current, [key]: null }));
      setMessage("Interpreter document uploaded.");
    } catch (error) {
      setMessage(`Could not upload document: ${error.message}`);
    } finally {
      setAdminDocumentBusy("");
    }
  };

`;
    page = page.replace('  const saveRates = async (interpreter) => {', helpers + '  const saveRates = async (interpreter) => {');
  }

  if (!page.includes('AdminDocumentPanel')) {
    page = page.replace(
      '                  {editing && (',
      '                  <AdminDocumentPanel\n                    interpreter={interpreter}\n                    palette={palette}\n                    mutedText={mutedText}\n                    softPanel={softPanel}\n                    files={adminDocumentFiles}\n                    busyKey={adminDocumentBusy}\n                    openingId={adminDocumentOpeningId}\n                    onFileChange={(key, file) => setAdminDocumentFiles((current) => ({ ...current, [key]: file }))}\n                    onUpload={uploadAdminDocument}\n                    onOpen={openAdminDocument}\n                  />\n\n                  {editing && ('
    );
  }

  if (!page.includes('function AdminDocumentPanel')) {
    const component = String.raw`
function AdminDocumentPanel({ interpreter, palette, mutedText, softPanel, files, busyKey, openingId, onFileChange, onUpload, onOpen }) {
  const documents = interpreter.interpreter_documents || [];
  const documentsByType = documents.reduce((acc, document) => {
    acc[document.document_type] = document;
    return acc;
  }, {});

  return (
    <div className="mt-5 rounded-2xl border p-5" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>Interpreter documents</h3>
          <p className="mt-1 text-sm" style={{ color: mutedText }}>View, upload, and open private onboarding files for this interpreter.</p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.08em]" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.burgundy }}>
          {documents.length} uploaded
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rosterDocumentTypes.map(([documentType, label]) => {
          const document = documentsByType[documentType];
          const key = `${interpreter.id}:${documentType}`;
          return (
            <div key={documentType} className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
              <div className="flex items-start gap-2">
                {document ? <BadgeCheck size={17} style={{ color: palette.gold, flexShrink: 0 }} /> : <FileText size={17} style={{ color: palette.burgundy, flexShrink: 0 }} />}
                <div>
                  <div className="text-sm font-black" style={{ color: palette.charcoal }}>{label}</div>
                  <div className="mt-1 text-xs leading-5" style={{ color: mutedText }}>{document?.file_name || "No file uploaded"}</div>
                  {document?.uploaded_at && <div className="mt-1 text-[11px]" style={{ color: mutedText }}>Uploaded {new Date(document.uploaded_at).toLocaleDateString()}</div>}
                </div>
              </div>

              <input type="file" onChange={(event) => onFileChange(key, event.target.files?.[0] || null)} className="mt-3 w-full rounded-xl border px-3 py-2 text-xs" style={{ borderColor: palette.border, backgroundColor: palette.white, color: palette.charcoal }} />

              <div className="mt-3 flex flex-wrap gap-2">
                {document && (
                  <button type="button" disabled={openingId === document.id} onClick={() => onOpen(document)} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold disabled:opacity-60" style={{ borderColor: palette.border, color: palette.charcoal }}>
                    <Download size={13} /> {openingId === document.id ? "Opening..." : "Download"}
                  </button>
                )}
                <button type="button" disabled={busyKey === key} onClick={() => onUpload(interpreter, documentType)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-white disabled:opacity-60" style={{ backgroundColor: document ? palette.gold : palette.burgundy }}>
                  <UploadCloud size={13} /> {busyKey === key ? "Uploading..." : document ? "Replace" : "Upload"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

`;
    page = page.replace('function AdminField', component + 'function AdminField');
  }

  fs.writeFileSync(pagePath, page);
}
