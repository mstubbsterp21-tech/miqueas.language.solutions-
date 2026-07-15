function patchAdminAccountDocumentActions(code) {
  const current = '<DocumentsPanel audience={type} view={view} busyDoc={busyDoc} admin />';
  const restored = '<DocumentsPanel audience={type} view={view} busyDoc={busyDoc} upload={(documentType, file, replaceDocumentId) => actions.upload(documentType, file, replaceDocumentId, { audienceType: type, ownerId: record.id })} open={(document, intent) => actions.openDocument(document, intent, { audienceType: type, ownerId: record.id })} remove={(document) => actions.removeDocument(document, { audienceType: type, ownerId: record.id })} admin />';

  if (!code.includes(current)) {
    throw new Error("MLS admin document upload patch could not find the account document panel in src/portal/views.jsx.");
  }

  return code.replace(current, restored);
}

export default function adminDocumentUpload() {
  return {
    name: "mls-admin-document-upload",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0].replaceAll("\\", "/");
      if (file.endsWith("/src/portal/views.jsx")) return patchAdminAccountDocumentActions(code);
      return null;
    },
  };
}
