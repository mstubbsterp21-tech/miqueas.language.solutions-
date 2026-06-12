const fs = require('fs');

const pagePath = 'src/pages/AdminInterpreters.jsx';
if (!fs.existsSync(pagePath)) process.exit(0);

let page = fs.readFileSync(pagePath, 'utf8');

const oldActionPattern = new RegExp('portalRequest\\("admin' + 'DeleteInterpreter",\\s*\\{[\\s\\S]*?method:\\s*"POST",[\\s\\S]*?body:\\s*\\{ interpreterId: interpreter\\.id \\},[\\s\\S]*?\\}\\);');

page = page.replace(oldActionPattern, `portalRequest("adminUpdateInterpreterProfile", {
        method: "POST",
        body: { interpreterId: interpreter.id, profile: { roster_status: "removed" } },
      });`);

page = page.replace(
  'const filtered = interpreters.filter((interpreter) => {\n    const haystack',
  'const filtered = interpreters.filter((interpreter) => {\n    if (interpreter.roster_status === "removed") return false;\n    const haystack'
);

fs.writeFileSync(pagePath, page);

try {
  require('./patch-ic-agreement.cjs');
} catch (error) {
  console.warn('Required document patch skipped', error);
}
