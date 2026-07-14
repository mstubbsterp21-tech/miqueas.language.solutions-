import { audit, database, readBody, send, signedInUser } from "./_shared/ops-v2-core.js";
import {
  createGmailAuthorization,
  disconnectGmail,
  getGmailStatus,
  sendGmailTest,
} from "./_shared/gmail-oauth.js";

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
      const authorization = await createGmailAuthorization(db, user);
      await audit(db, user, {
        action: "gmail.oauth_started",
        entityType: "integration",
        entityId: "gmail",
        summary: "Gmail authorization started",
      });
      return send(res, 200, authorization);
    }

    if (req.method === "POST" && action === "test") {
      const delivery = await sendGmailTest(db, user);
      await audit(db, user, {
        action: delivery.sent ? "gmail.test_sent" : "gmail.test_failed",
        entityType: "integration",
        entityId: "gmail",
        summary: delivery.sent ? `Test email sent to ${delivery.to}` : delivery.error,
      });
      return send(res, delivery.sent ? 200 : 400, delivery);
    }

    if (req.method === "POST" && action === "disconnect") {
      readBody(req);
      const result = await disconnectGmail(db);
      await audit(db, user, {
        action: "gmail.disconnected",
        entityType: "integration",
        entityId: "gmail",
        summary: "Gmail connection removed",
      });
      return send(res, 200, result);
    }

    return send(res, 405, { error: "Unsupported Gmail action." });
  } catch (error) {
    console.error("MLS Gmail OAuth error", error);
    return send(res, 500, { error: error.message || "Gmail could not be updated." });
  }
}
