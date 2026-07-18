function patchDocumentCard(code) {
  const readOnlyGuards = code.match(/!readOnly && \(/g) || [];
  if (readOnlyGuards.length < 2) {
    throw new Error("MLS document controls patch could not find the read-only guards in src/portal/ui.jsx.");
  }

  let updated = code.replaceAll("!readOnly && (", "true && (");
  const currentOpenButton = `          <button type="button" onClick={() => open?.(document)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">
            <Download size={14} /> Open
          </button>`;
  const restoredButtons = `          <button type="button" onClick={() => open?.(document, "view")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">
            <FileText size={14} /> Open
          </button>
          <button type="button" onClick={() => open?.(document, "download")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">
            <Download size={14} /> Download
          </button>`;

  if (!updated.includes(currentOpenButton)) {
    throw new Error("MLS document controls patch could not find the current Open button in src/portal/ui.jsx.");
  }
  updated = updated.replace(currentOpenButton, restoredButtons);
  return updated;
}

function patchDocumentActions(code) {
  const currentBlock = /  async function uploadDocument\(type, file, replaceDocumentId = null\) \{[\s\S]*?\n  async function updateAssignment/;
  if (!currentBlock.test(code)) {
    throw new Error("MLS document controls patch could not find the document action block in src/portal/useMLSController.js.");
  }

  const restoredBlock = `  function resolveDocumentContext(context = {}) {
    const explicitAudience = context?.audienceType === "client"
      ? "client"
      : context?.audienceType === "interpreter"
        ? "interpreter"
        : "";
    if (explicitAudience && context?.ownerId) {
      return { audienceType: explicitAudience, ownerId: context.ownerId };
    }
    if (role === "admin" && accountType && accountRecord?.id) {
      return { audienceType: accountType, ownerId: accountRecord.id };
    }
    const audienceType = role === "client" ? "client" : "interpreter";
    const owner = audienceType === "client" ? workspace?.client?.profile : workspace?.interpreter?.profile;
    return { audienceType, ownerId: owner?.id || "" };
  }

  async function uploadDocument(type, file, replaceDocumentId = null, context = {}) {
    if (!file) return;
    const { audienceType, ownerId } = resolveDocumentContext(context);
    if (!ownerId) return fail(\`Save the \${audienceType} profile before uploading documents.\`);
    setBusyDoc(type);
    try {
      const signed = await api.core("createUploadUrl", "POST", {
        audienceType, ownerId, documentType: type, fileName: file.name, fileSize: file.size,
      });
      const result = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file);
      if (result.error) throw result.error;
      await api.core("recordUpload", "POST", {
        audienceType, ownerId, documentType: type, fileName: file.name,
        storagePath: signed.path, replaceDocumentId, documentLabel: context.documentLabel || "",
      });
      flash(replaceDocumentId ? "Document replaced." : "Document uploaded.");
      await load(true);
    } catch (uploadError) {
      fail(uploadError);
    } finally {
      setBusyDoc("");
    }
  }

  async function openDocument(fileRecord, intent = "view", context = {}) {
    if (!fileRecord?.id) return;
    const { audienceType, ownerId } = resolveDocumentContext(context);
    if (!ownerId) return fail("The document owner could not be identified.");
    const previewWindow = intent === "view" ? window.open("about:blank", "_blank") : null;
    if (previewWindow) {
      previewWindow.document.title = "Opening secure document";
      previewWindow.document.body.innerHTML = '<p style="font-family:Arial,sans-serif;padding:24px">Opening secure document…</p>';
    }
    try {
      const result = await api.core("createDocumentOpenLink", "POST", {
        audienceType, ownerId, documentId: fileRecord.id,
      });
      if (!result?.url) throw new Error("A secure document link could not be created.");

      if (intent === "download") {
        const downloadUrl = new URL(result.url, window.location.origin);
        downloadUrl.searchParams.set("download", fileRecord.file_name || "document");
        const link = window.document.createElement("a");
        link.href = downloadUrl.toString();
        link.download = fileRecord.file_name || "document";
        link.style.display = "none";
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        flash("Document download started.");
        return;
      }

      if (previewWindow) {
        previewWindow.location.replace(result.url);
      } else {
        window.location.assign(result.url);
      }
    } catch (documentError) {
      previewWindow?.close();
      fail(documentError);
    }
  }

  async function removeDocument(fileRecord, context = {}) {
    if (!fileRecord?.id) return;
    if (!window.confirm(\`Delete \${fileRecord.file_name}? This cannot be undone.\`)) return;
    const { audienceType, ownerId } = resolveDocumentContext(context);
    if (!ownerId) return fail("The document owner could not be identified.");
    try {
      await api.core("deleteDocument", "POST", { audienceType, ownerId, documentId: fileRecord.id });
      flash("Document deleted.");
      await load(true);
    } catch (documentError) {
      fail(documentError);
    }
  }

  async function updateAssignment`;

  return code.replace(currentBlock, restoredBlock);
}

function patchAdminDocumentCenter(code) {
  const importLine = 'import { FileText, GraduationCap, ShieldCheck, UserCheck, XCircle } from "lucide-react";';
  const expandedImport = 'import { Download, ExternalLink, FileText, GraduationCap, ShieldCheck, Trash2, UploadCloud, UserCheck, XCircle } from "lucide-react";';
  if (!code.includes(importLine)) {
    throw new Error("MLS document controls patch could not find the icon import in adminCompliance.jsx.");
  }
  let updated = code.replace(importLine, expandedImport);

  const coursesLine = '  const courses = operations?.admin?.courses || [];';
  const documentIndex = `  const courses = operations?.admin?.courses || [];
  const uploadedDocuments = useMemo(() => [
    ...clients.flatMap((client) => (client.client_documents || []).map((document) => ({
      ...document,
      audienceType: "client",
      ownerId: client.id,
      ownerName: client.organization_name || client.primary_contact_name || client.email || "Client",
      ownerRecord: client,
    }))),
    ...interpreters.flatMap((interpreter) => (interpreter.interpreter_documents || []).map((document) => ({
      ...document,
      audienceType: "interpreter",
      ownerId: interpreter.id,
      ownerName: \`\${interpreter.first_name || ""} \${interpreter.last_name || ""}\`.trim() || interpreter.email || "Interpreter",
      ownerRecord: interpreter,
    }))),
  ].sort((left, right) => new Date(right.uploaded_at || 0).getTime() - new Date(left.uploaded_at || 0).getTime()), [clients, interpreters]);`;
  if (!updated.includes(coursesLine)) {
    throw new Error("MLS document controls patch could not find the document data insertion point in adminCompliance.jsx.");
  }
  updated = updated.replace(coursesLine, documentIndex);

  const currentCard = /      <Card>\n        <SectionHeader eyebrow="Documents" title="Admin document center"[\s\S]*?      <\/Card>\n      <div className="grid gap-5 xl:grid-cols-2">/;
  if (!currentCard.test(updated)) {
    throw new Error("MLS document controls patch could not find the admin document center card.");
  }

  const restoredCard = `      <Card>
        <SectionHeader eyebrow="Documents" title="Admin document center" text={\`\${uploadedDocuments.length} uploaded file\${uploadedDocuments.length === 1 ? "" : "s"} and \${documentRequests.length} request\${documentRequests.length === 1 ? "" : "s"} across client and interpreter accounts.\`} action={<ActionButton onClick={actions.openDocumentRequest}>New request</ActionButton>} />

        <div className="mt-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[.12em] text-[#dd7d00]">Uploaded files</p><h3 className="mt-1 text-xl font-black text-slate-950">Secure account documents</h3></div>
            <p className="text-xs font-bold text-slate-400">Open, download, delete, or manage the account.</p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {uploadedDocuments.map((document) => {
              const context = { audienceType: document.audienceType, ownerId: document.ownerId };
              return (
                <div key={\`\${document.audienceType}-\${document.id}\`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><FileText size={17} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-slate-950">{document.file_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{document.ownerName} · {document.document_type?.replaceAll("_", " ") || "Document"}</p>
                      <p className="mt-1 text-[11px] text-slate-400">Uploaded {formatDate(document.uploaded_at)}</p>
                    </div>
                    <Badge value={document.status || "uploaded"} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => actions.openDocument(document, "view", context)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"><ExternalLink size={14} /> Open</button>
                    <button type="button" onClick={() => actions.openDocument(document, "download", context)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"><Download size={14} /> Download</button>
                    <button type="button" onClick={() => actions.removeDocument(document, context)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"><Trash2 size={14} /> Delete</button>
                    <button type="button" onClick={() => document.audienceType === "client" ? actions.openClient(document.ownerRecord) : actions.openInterpreter(document.ownerRecord)} className="inline-flex items-center gap-2 rounded-xl bg-[#721100]/10 px-3 py-2 text-xs font-black text-[#721100]"><UploadCloud size={14} /> Manage files</button>
                  </div>
                </div>
              );
            })}
            {!uploadedDocuments.length && <EmptyState icon={FileText} title="No uploaded files" text="Files uploaded by MLS, clients, or interpreters will appear here." />}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-7">
          <div><p className="text-xs font-black uppercase tracking-[.12em] text-[#dd7d00]">Requests</p><h3 className="mt-1 text-xl font-black text-slate-950">Document request tracking</h3></div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {documentRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#721100]/10 text-[#721100]"><FileText size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">{request.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{requestRecipient(request)} · Due {request.due_date || "not set"}</p>
                      </div>
                      <Badge value={request.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{request.instructions || "No additional instructions."}</p>
                    {request.status === "cancelled" && (
                      <p className="mt-3 text-xs font-bold text-rose-700">Cancelled {request.cancelled_at ? formatDate(request.cancelled_at) : ""}{request.cancelled_by_email ? \` by \${request.cancelled_by_email}\` : ""}</p>
                    )}
                    {cancellableRequestStatuses.has(request.status) && (
                      <button type="button" disabled={saving} onClick={() => cancelRequest(request)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
                        <XCircle size={14} /> Cancel request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!documentRequests.length && <EmptyState icon={FileText} title="No document requests" text="Create a request when a client or interpreter file is needed." />}
          </div>
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">`;

  return updated.replace(currentCard, restoredCard);
}

export default function portalDocumentControls() {
  return {
    name: "mls-portal-document-controls",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0].replaceAll("\\", "/");
      if (file.endsWith("/src/portal/ui.jsx")) return patchDocumentCard(code);
      if (file.endsWith("/src/portal/useMLSController.js")) return patchDocumentActions(code);
      if (file.endsWith("/src/portal/v2/adminCompliance.jsx")) return patchAdminDocumentCenter(code);
      return null;
    },
  };
}
