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
        storagePath: signed.path, replaceDocumentId,
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

export default function portalDocumentControls() {
  return {
    name: "mls-portal-document-controls",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0].replaceAll("\\", "/");
      if (file.endsWith("/src/portal/ui.jsx")) return patchDocumentCard(code);
      if (file.endsWith("/src/portal/useMLSController.js")) return patchDocumentActions(code);
      return null;
    },
  };
}
