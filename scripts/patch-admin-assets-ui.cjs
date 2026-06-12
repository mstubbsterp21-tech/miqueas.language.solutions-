const fs = require('fs');

const profilePath = 'src/pages/AdminInterpreterProfile.jsx';
if (!fs.existsSync(profilePath)) process.exit(0);

let page = fs.readFileSync(profilePath, 'utf8');

if (!page.includes('async function adminFileRequest')) {
  page = page.replace(
    `  async function portalRequest(action, options = {}) {
    const token = await session?.getToken();
    const response = await fetch(\`/api/portal?action=\${action}\`, {
      method: options.method || "GET",
      headers: {
        authorization: \`Bearer \${token}\`,
        ...(options.body ? { "content-type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Portal request failed.");
    return data;
  }
`,
    `  async function portalRequest(action, options = {}) {
    const token = await session?.getToken();
    const response = await fetch(\`/api/portal?action=\${action}\`, {
      method: options.method || "GET",
      headers: {
        authorization: \`Bearer \${token}\`,
        ...(options.body ? { "content-type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Portal request failed.");
    return data;
  }

  async function adminFileRequest(mode, body = {}) {
    const token = await session?.getToken();
    const response = await fetch("/api/admin-assets", {
      method: "POST",
      headers: {
        authorization: \`Bearer \${token}\`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ mode, ...body }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Admin file request failed.");
    return data;
  }
`
  );
}

page = page.replace(
  'const data = await portalRequest("adminCreateDocumentLink", { method: "POST", body: { documentId: document.id } });',
  'const data = await adminFileRequest("open", { documentId: document.id });'
);

page = page.replace(
  'const data = await portalRequest("adminRemoveDocument", { method: "POST", body: { documentId: document.id } });',
  'const data = await adminFileRequest("drop", { documentId: document.id });'
);

page = page.replace(
  `const uploadData = await portalRequest("adminCreateDocumentUploadUrl", {
        method: "POST",
        body: { interpreterId, documentType, fileName: file.name },
      });`,
  `const uploadData = await adminFileRequest("ticket", { interpreterId, documentType, fileName: file.name });`
);

page = page.replace(
  `const recordData = await portalRequest("adminRecordDocumentUpload", {
        method: "POST",
        body: { interpreterId, documentType, fileName: file.name, storagePath: uploadData.path },
      });`,
  `const recordData = await adminFileRequest("save", { interpreterId, documentType, fileName: file.name, storagePath: uploadData.path });`
);

fs.writeFileSync(profilePath, page);
