const fs = require('fs');

const apiPath = 'api/portal.js';
if (fs.existsSync(apiPath)) {
  let source = fs.readFileSync(apiPath, 'utf8');

  if (!source.includes('async function adminDeleteInterpreter')) {
    const action = String.raw`
async function adminDeleteInterpreter(db, user, body) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const interpreterId = body?.interpreterId;
  if (!interpreterId) return { status: 400, payload: { error: "Interpreter ID is required." } };

  const { data: current, error: currentError } = await db
    .from("interpreters")
    .select("admin_notes")
    .eq("id", interpreterId)
    .maybeSingle();

  if (currentError) throw currentError;

  const removalNote = "Removed from active roster by MLS admin on " + new Date().toISOString();
  const adminNotes = [current?.admin_notes, removalNote].filter(Boolean).join("\n");

  const { data, error } = await db
    .from("interpreters")
    .update({ roster_status: "removed", admin_notes: adminNotes, updated_at: new Date().toISOString() })
    .eq("id", interpreterId)
    .select("*, interpreter_documents(id, document_type, status)")
    .single();

  if (error) throw error;
  return { status: 200, payload: { interpreter: data } };
}

`;
    source = source.replace('async function loadAdminRoster', action + 'async function loadAdminRoster');
  }

  if (!source.includes('action === "adminDeleteInterpreter"')) {
    const branch = String.raw`
    if (req.method === "POST" && action === "adminDeleteInterpreter") {
      const result = await adminDeleteInterpreter(db, user, body);
      sendJson(res, result.status, result.payload);
      return;
    }

`;
    source = source.replace('    if (req.method === "GET" && action === "adminRoster") {', branch + '    if (req.method === "GET" && action === "adminRoster") {');
  }

  fs.writeFileSync(apiPath, source);
}

const pagePath = 'src/pages/AdminInterpreters.jsx';
if (fs.existsSync(pagePath)) {
  let page = fs.readFileSync(pagePath, 'utf8');
  page = page.replace(
    'const confirmed = window.confirm(`Delete ${name} from the MLS roster? This removes the portal profile and document records. This cannot be undone.`);',
    'const confirmed = window.confirm(`Remove ${name} from the active MLS roster? Their portal history and documents will be kept for audit records.`);'
  );
  page = page.replace(
    'setMessage(`${name} was deleted from the MLS roster.`);',
    'setMessage(`${name} was removed from the active MLS roster.`);'
  );
  page = page.replace(
    '{deletingId === interpreter.id ? "Deleting..." : "Delete"}',
    '{deletingId === interpreter.id ? "Removing..." : "Remove"}'
  );
  page = page.replace(
    'const filtered = interpreters.filter((interpreter) => {\n    const haystack',
    'const filtered = interpreters.filter((interpreter) => {\n    if (interpreter.roster_status === "removed") return false;\n    const haystack'
  );
  fs.writeFileSync(pagePath, page);
}
