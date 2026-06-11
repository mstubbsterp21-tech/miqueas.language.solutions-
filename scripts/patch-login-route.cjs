const fs = require('fs');

const appPath = 'src/App.jsx';

if (fs.existsSync(appPath)) {
  const source = fs.readFileSync(appPath, 'utf8');
  const patched = source.replace(
    '<Route path="/login" element={<Login palette={palette} />} />',
    '<Route path="/login/*" element={<Login palette={palette} />} />'
  );

  fs.writeFileSync(appPath, patched);
}
