const fs = require('fs');

const appPath = 'src/App.jsx';

if (fs.existsSync(appPath)) {
  let source = fs.readFileSync(appPath, 'utf8');

  source = source.replace(
    '<Route path="/login" element={<Login palette={palette} />} />',
    '<Route path="/login/*" element={<Login palette={palette} />} />'
  );

  if (!source.includes('AdminInterpreterProfile')) {
    source = source.replace(
      'import AdminInterpreters from "./pages/AdminInterpreters";',
      'import AdminInterpreters from "./pages/AdminInterpreters";\nimport AdminInterpreterProfile from "./pages/AdminInterpreterProfile";'
    );
  }

  if (!source.includes('path="/admin/interpreters/:interpreterId"')) {
    source = source.replace(
      '<Route path="/admin/interpreters" element={isClerkConfigured ? <RequirePortalAuth><AdminInterpreters palette={palette} /></RequirePortalAuth> : <PortalSetupNotice palette={palette} />} />',
      '<Route path="/admin/interpreters" element={isClerkConfigured ? <RequirePortalAuth><AdminInterpreters palette={palette} /></RequirePortalAuth> : <PortalSetupNotice palette={palette} />} />\n          <Route path="/admin/interpreters/:interpreterId" element={isClerkConfigured ? <RequirePortalAuth><AdminInterpreterProfile palette={palette} /></RequirePortalAuth> : <PortalSetupNotice palette={palette} />} />'
    );
  }

  fs.writeFileSync(appPath, source);
}
