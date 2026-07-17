import { database, send, signedInUser } from "./_shared/ops-v2-core.js";
import { loadOperationsV2 } from "./_shared/ops-v2-load.js";
import { loadWorkspace } from "./portal.js";
import { loadOperations } from "./portal-operations.js";
import { loadApp } from "./portal-app.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return send(res, 405, { error: "Use GET for portal bootstrap." });
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });

    const db = database();
    const [workspace, operations, app, operationsV2] = await Promise.all([
      loadWorkspace(db, user),
      loadOperations(db, user),
      loadApp(db, user),
      loadOperationsV2(db, user),
    ]);

    return send(res, 200, { workspace, operations, app, operationsV2 });
  } catch (error) {
    console.error("MLS portal bootstrap error", error);
    return send(res, 500, { error: error.message || "Portal bootstrap failed." });
  }
}
