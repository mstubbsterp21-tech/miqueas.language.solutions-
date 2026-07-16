import crypto from "node:crypto";

const clientId = process.env.GOOGLE_GMAIL_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_GMAIL_CLIENT_SECRET || "";
const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI || "https://miqueaslanguagesolutions.com/api/google/gmail/callback";
const senderEmail = String(process.env.GOOGLE_GMAIL_SENDER || "").trim().toLowerCase();

export const sheetsReadonlyScope = "https://www.googleapis.com/auth/spreadsheets.readonly";
const expandedScopes = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive.file",
  sheetsReadonlyScope,
];

export async function createExpandedWorkspaceAuthorization(db, user) {
  const missing = [];
  if (!clientId) missing.push("GOOGLE_GMAIL_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_GMAIL_CLIENT_SECRET");
  if (!redirectUri) missing.push("GOOGLE_GMAIL_REDIRECT_URI");
  if (!senderEmail) missing.push("GOOGLE_GMAIL_SENDER");
  if (missing.length) throw new Error(`Google Workspace OAuth is missing: ${missing.join(", ")}.`);

  const now = new Date();
  const state = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  await db.from("gmail_oauth_states").delete().lt("expires_at", now.toISOString());
  const inserted = await db.from("gmail_oauth_states").insert({ state, admin_clerk_user_id: user.id, expires_at: expiresAt });
  if (inserted.error) throw inserted.error;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", expandedScopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("login_hint", senderEmail);
  url.searchParams.set("state", state);
  return { url: url.toString(), expiresAt, requestedScopes: expandedScopes };
}
