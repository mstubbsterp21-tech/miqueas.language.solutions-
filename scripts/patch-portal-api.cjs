const fs = require('fs');

const portalApiPath = 'api/portal.js';
let source = fs.readFileSync(portalApiPath, 'utf8');

const oldCall = `await clerkClient.sessions.${['verify', 'Session'].join('')}(claims.sid, token);`;
const newCall = `const clerkSession = await clerkClient.sessions.getSession(claims.sid);\n  if (clerkSession?.userId !== claims.sub) return null;`;

source = source.replace(oldCall, newCall);

fs.writeFileSync(portalApiPath, source);
