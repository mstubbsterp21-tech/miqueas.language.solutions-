const fs = require('fs');

const portalPath = 'src/pages/InterpreterPortal.jsx';
if (!fs.existsSync(portalPath)) process.exit(0);

let page = fs.readFileSync(portalPath, 'utf8');

page = page.replace('Trash2, UploadCloud }', 'Trash2, UploadCloud, Download }');

if (!page.includes('openingDocumentId')) {
  page = page.replace(
    '  const [documentBusy, setDocumentBusy] = useState("");',
    '  const [documentBusy, setDocumentBusy] = useState("");\n  const [openingDocumentId, setOpeningDocumentId] = useState("");'
  );
}

if (!page.includes('const openDocument = async')) {
  const fn = String.raw`
  const openDocument = async (document) => {
    if (!document?.id) return;
    setOpeningDocumentId(document.id);
    setMessage("");
    try {
      const data = await portalRequest("createDocumentOpenLink", {
        method: "POST",
        body: { documentId: document.id },
      });
      if (!data.url) throw new Error("Could not create document link.");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(`Could not open document: ${error.message}`);
    } finally {
      setOpeningDocumentId("");
    }
  };

`;
  page = page.replace('  const deleteDocument = async (document) => {', fn + '  const deleteDocument = async (document) => {');
}

if (!page.includes('openDocument(existing)')) {
  page = page.replace(
    '<div className="flex flex-wrap gap-2">\n                          <button type="button" disabled={busy} onClick={() => uploadDocument(type.value, existing?.id || null)}',
    '<div className="flex flex-wrap gap-2">\n                          {existing && (\n                            <button type="button" disabled={openingDocumentId === existing.id} onClick={() => openDocument(existing)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-60" style={{ borderColor: palette.border, color: palette.charcoal }}>\n                              <Download size={14} /> {openingDocumentId === existing.id ? "Opening..." : "Download"}\n                            </button>\n                          )}\n                          <button type="button" disabled={busy} onClick={() => uploadDocument(type.value, existing?.id || null)}'
  );
}

fs.writeFileSync(portalPath, page);
