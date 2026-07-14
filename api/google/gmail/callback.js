import { database } from "../../_shared/ops-v2-core.js";
import { completeGmailAuthorization } from "../../_shared/gmail-oauth.js";

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
    const result = await completeGmailAuthorization(database(), { code, state });
    redirect(res, "connected", `${result.email} is connected.`);
  } catch (callbackError) {
    console.error("MLS Gmail callback error", callbackError);
    redirect(res, "error", callbackError.message || "Gmail authorization failed.");
  }
}
