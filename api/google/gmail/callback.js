import { database } from "../../_shared/ops-v2-core.js";
import { completeGmailAuthorization } from "../../_shared/gmail-oauth.js";
import { flushPendingPortalFeedback } from "../../_shared/portal-feedback-email.js";

const portalUrl = process.env.MLS_PORTAL_BASE_URL || "https://miqueaslanguagesolutions.com/portal";

function redirect(res, status, message = "") {
  const url = new URL(portalUrl);
  url.searchParams.set("section", "settings");
  url.searchParams.set("gmail", status);
  if (message) url.searchParams.set("gmail_message", message.slice(0, 240));
  res.statusCode = 302;
  res.setHeader("location", url.toString());
  res.end();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Use GET for the Gmail callback.");
    return;
  }

  try {
    const error = String(req.query?.error || "");
    if (error) {
      const description = String(req.query?.error_description || error);
      redirect(res, "error", description);
      return;
    }

    const code = String(req.query?.code || "");
    const state = String(req.query?.state || "");
    const db = database();
    const result = await completeGmailAuthorization(db, { code, state });
    const feedback = await flushPendingPortalFeedback(db).catch((feedbackError) => {
      console.error("MLS pending feedback delivery failed", feedbackError);
      return { delivered: 0, failed: 1 };
    });
    const routed = feedback.delivered ? ` ${feedback.delivered} pending feedback message${feedback.delivered === 1 ? " was" : "s were"} filed.` : "";
    redirect(res, "connected", `${result.email} is connected.${routed}`);
  } catch (callbackError) {
    console.error("MLS Gmail callback error", callbackError);
    redirect(res, "error", callbackError.message || "Gmail authorization failed.");
  }
}
