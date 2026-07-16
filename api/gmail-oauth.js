import { audit, database, readBody, send, signedInUser } from "./_shared/ops-v2-core.js";
import {
  disconnectGmail,
  getGmailStatus,
  sendGmailTest,
} from "./_shared/gmail-oauth.js";
import { createExpandedWorkspaceAuthorization } from "./_shared/workspace-oauth-extension.js";

const gmailAuditContext = {
  provider: "google_workspace",
  integrationKey: "primary",
};

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    if (!user.isAdmin) return send(res, 403, { error: "Admin access required." });

    const db = database();
    const action = String(req.query?.action || "status");

    if (req.method === "GET" && action === "status") {
      return send(res, 200, await getGmailStatus(db));
    }

    if (req.method === "GET" && action === "connect") {
      const authorization = await createExpandedWorkspaceAuthorization(db, user);
      await audit(db, user, {
        action: "google_workspace.oauth_started",
        entityType: "integration",
        summary: "Google Workspace authorization started",
        after: gmailAuditContext,
      });
      return send(res, 200, authorization);
    }

    if (req.method === "POST" && action === "test") {
      const delivery = await sendGmailTest(db, user);
      await audit(db, user, {
        action: delivery.sent ? "gmail.test_sent" : "gmail.test_failed",
        entityType: "integration",
        summary: delivery.sent ? `Test email sent to ${delivery.to}` : delivery.error,
        after: { ...gmailAuditContext, recipient: delivery.to, sent: delivery.sent },
      });
      return send(res, delivery.sent ? 200 : 400, delivery);
    }

    if (req.method === "POST" && action === "disconnect") {
      readBody(req);
      const result = await disconnectGmail(db);
      await audit(db, user, {
        action: "google_workspace.disconnected",
        entityType: "integration",
        summary: "Google Workspace connection removed",
        after: gmailAuditContext,
      });
      return send(res, 200, result);
    }

    return send(res, 405, { error: "Unsupported Google Workspace action." });
  } catch (error) {
    console.error("MLS Google Workspace OAuth error", error);
    return send(res, 500, { error: error.message || "Google Workspace could not be updated." });
  }
}
