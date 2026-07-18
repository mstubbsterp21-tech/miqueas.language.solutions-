import crypto from "node:crypto";

const clientId = process.env.GOOGLE_GMAIL_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_GMAIL_CLIENT_SECRET || "";
const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI || "https://miqueaslanguagesolutions.com/api/google/gmail/callback";
const senderEmail = String(process.env.GOOGLE_GMAIL_SENDER || "").trim().toLowerCase();
const senderName = process.env.EMAIL_FROM_NAME || "Miqueas Language Solutions";

export const gmailScope = "https://www.googleapis.com/auth/gmail.send";
export const gmailModifyScope = "https://www.googleapis.com/auth/gmail.modify";
export const calendarScope = "https://www.googleapis.com/auth/calendar";
export const driveScope = "https://www.googleapis.com/auth/drive.file";
const identityScopes = ["openid", "email"];
const workspaceScopes = [gmailScope, gmailModifyScope, calendarScope, driveScope];

function encodeHeader(value) {
  const text = String(value || "");
  return /^[\x20-\x7E]*$/.test(text)
    ? text
    : `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

function scopeSet(value) {
  return new Set(String(value || "").split(/\s+/).map((scope) => scope.trim()).filter(Boolean));
}

function missingScopes(value, required) {
  const granted = scopeSet(value);
  return required.filter((scope) => !granted.has(scope));
}

function gmailEnvironment() {
  const missing = [];
  if (!clientId) missing.push("GOOGLE_GMAIL_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_GMAIL_CLIENT_SECRET");
  if (!redirectUri) missing.push("GOOGLE_GMAIL_REDIRECT_URI");
  if (!senderEmail) missing.push("GOOGLE_GMAIL_SENDER");
  return {
    configured: missing.length === 0,
    missing,
    redirectUri,
    senderEmail,
    senderName,
    scopes: workspaceScopes,
  };
}

async function readIntegration(db) {
  const result = await db
    .from("gmail_integrations")
    .select("id,google_email,scope,status,connected_by_clerk_user_id,connected_at,updated_at,last_test_at,last_error,calendar_id,calendar_summary,drive_root_folder_id,drive_root_folder_url,workspace_last_verified_at")
    .eq("id", "primary")
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function getGmailStatus(db) {
  const environment = gmailEnvironment();
  const integration = await readIntegration(db);
  const senderMatches = Boolean(
    integration?.google_email
    && senderEmail
    && integration.google_email.toLowerCase() === senderEmail,
  );
  const gmailMissing = missingScopes(integration?.scope, [gmailScope]);
  const workspaceMissing = missingScopes(integration?.scope, workspaceScopes);
  const baseConnected = Boolean(environment.configured && integration?.status === "connected" && senderMatches);
  return {
    provider: "google_workspace",
    environmentConfigured: environment.configured,
    missingEnvironmentVariables: environment.missing,
    sender: senderEmail,
    redirectUri,
    connected: Boolean(baseConnected && gmailMissing.length === 0),
    workspaceConnected: Boolean(baseConnected && workspaceMissing.length === 0),
    status: integration?.status || "not_connected",
    email: integration?.google_email || null,
    scope: integration?.scope || gmailScope,
    requiredScopes: workspaceScopes,
    missingScopes: workspaceMissing,
    connectedAt: integration?.connected_at || null,
    lastTestAt: integration?.last_test_at || null,
    lastError: integration?.last_error || null,
    senderMatches,
    calendarId: integration?.calendar_id || null,
    calendarSummary: integration?.calendar_summary || null,
    driveRootFolderId: integration?.drive_root_folder_id || null,
    driveRootFolderUrl: integration?.drive_root_folder_url || null,
    workspaceLastVerifiedAt: integration?.workspace_last_verified_at || null,
  };
}

export async function createGmailAuthorization(db, user) {
  const environment = gmailEnvironment();
  if (!environment.configured) {
    throw new Error(`Google Workspace OAuth is missing: ${environment.missing.join(", ")}.`);
  }

  const now = new Date();
  const state = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  await db.from("gmail_oauth_states").delete().lt("expires_at", now.toISOString());
  const inserted = await db.from("gmail_oauth_states").insert({
    state,
    admin_clerk_user_id: user.id,
    expires_at: expiresAt,
  });
  if (inserted.error) throw inserted.error;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", [...identityScopes, ...workspaceScopes].join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("login_hint", senderEmail);
  url.searchParams.set("state", state);
  return { url: url.toString(), expiresAt };
}

async function exchangeCode(code) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Google did not accept the authorization code.");
  }
  if (!data.refresh_token) {
    throw new Error("Google did not return a refresh token. Reconnect Google Workspace and approve access again.");
  }
  return data;
}

async function googleIdentity(accessToken) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.email) {
    throw new Error(data.error_description || data.error || "Google account identity could not be verified.");
  }
  return { email: String(data.email).trim().toLowerCase() };
}

export async function completeGmailAuthorization(db, { code, state }) {
  const environment = gmailEnvironment();
  if (!environment.configured) throw new Error("Google Workspace OAuth environment variables are incomplete.");
  if (!code || !state) throw new Error("Google did not return a complete authorization response.");

  const stateResult = await db.from("gmail_oauth_states").select("*").eq("state", state).maybeSingle();
  if (stateResult.error) throw stateResult.error;
  const stateRow = stateResult.data;
  const now = new Date();
  if (!stateRow || stateRow.used_at || new Date(stateRow.expires_at).getTime() <= now.getTime()) {
    throw new Error("This Google Workspace authorization request is invalid or expired. Start the connection again from MLS Settings.");
  }

  const claimed = await db
    .from("gmail_oauth_states")
    .update({ used_at: now.toISOString() })
    .eq("state", state)
    .is("used_at", null)
    .select("*")
    .maybeSingle();
  if (claimed.error) throw claimed.error;
  if (!claimed.data) throw new Error("This Google Workspace authorization request was already used.");

  const tokens = await exchangeCode(code);
  const identity = await googleIdentity(tokens.access_token);
  if (identity.email !== senderEmail) {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: tokens.refresh_token }),
    }).catch(() => null);
    throw new Error(`Connect ${senderEmail}. Google returned ${identity.email}.`);
  }

  const stored = await db.rpc("mls_store_gmail_refresh_token", {
    p_refresh_token: tokens.refresh_token,
    p_google_email: identity.email,
    p_scope: tokens.scope || workspaceScopes.join(" "),
    p_connected_by: stateRow.admin_clerk_user_id,
  });
  if (stored.error) throw stored.error;

  await db.from("gmail_integrations").update({
    workspace_last_verified_at: now.toISOString(),
    last_error: null,
    updated_at: now.toISOString(),
  }).eq("id", "primary");

  return {
    email: identity.email,
    scope: tokens.scope || workspaceScopes.join(" "),
    connectedBy: stateRow.admin_clerk_user_id,
  };
}

async function refreshAccessToken(db, requiredScopes = [gmailScope]) {
  const status = await getGmailStatus(db);
  if (!status.environmentConfigured) {
    return { error: `Google Workspace OAuth is missing: ${status.missingEnvironmentVariables.join(", ")}.`, status: "not_configured" };
  }
  if (!status.connected) {
    return { error: "Google Workspace is not connected in MLS Settings.", status: "not_configured" };
  }
  const missing = missingScopes(status.scope, requiredScopes);
  if (missing.length) {
    return {
      error: "Reconnect Google Workspace in MLS Settings to approve portal email filing, Calendar, and Drive access.",
      status: "not_configured",
      missingScopes: missing,
    };
  }

  const tokenResult = await db.rpc("mls_get_gmail_refresh_token");
  if (tokenResult.error) throw tokenResult.error;
  if (!tokenResult.data) {
    return { error: "The Google refresh token is unavailable. Reconnect Google Workspace in MLS Settings.", status: "not_configured" };
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenResult.data,
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const message = data.error_description || data.error || "Google could not refresh Workspace access.";
    await db.from("gmail_integrations").update({
      status: "error",
      last_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", "primary");
    return { error: message, status: "failed" };
  }
  return { accessToken: data.access_token, status: "ready", scope: status.scope };
}

export async function getGoogleWorkspaceAccessToken(db, requiredScopes = []) {
  return refreshAccessToken(db, requiredScopes.length ? requiredScopes : workspaceScopes);
}

function buildRawMessage({ to, subject, text, html }) {
  const messageId = `<${crypto.randomUUID()}@miqueaslanguagesolutions.com>`;
  const boundary = `mls_${crypto.randomUUID().replaceAll("-", "")}`;
  const message = [
    `From: ${encodeHeader(senderName)} <${senderEmail}>`,
    `To: ${to}`,
    `Reply-To: ${senderEmail}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
  ].join("\r\n");
  return {
    raw: Buffer.from(message, "utf8").toString("base64url"),
    messageId,
  };
}

async function ensureGmailLabel(accessToken, labelName) {
  const listResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const list = await listResponse.json().catch(() => ({}));
  if (!listResponse.ok) throw new Error(list.error?.message || "Gmail labels could not be read.");

  const existing = (list.labels || []).find((label) => String(label.name || "").toLowerCase() === String(labelName).toLowerCase());
  if (existing?.id) return existing.id;

  const createResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: labelName,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    }),
  });
  const created = await createResponse.json().catch(() => ({}));
  if (!createResponse.ok || !created.id) throw new Error(created.error?.message || "The Gmail feedback label could not be created.");
  return created.id;
}

async function applyGmailLabel(accessToken, messageId, labelId) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}/modify`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ addLabelIds: [labelId], removeLabelIds: [] }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "The Gmail feedback label could not be applied.");
}

export async function sendGmailEmail(db, { to, subject, text, html, threadId = null, labelName = "" }) {
  const access = await refreshAccessToken(db, labelName ? [gmailScope, gmailModifyScope] : [gmailScope]);
  if (!access.accessToken) {
    return { sent: false, status: access.status || "failed", error: access.error || "Gmail access is unavailable." };
  }

  let labelId = null;
  if (labelName) {
    try {
      labelId = await ensureGmailLabel(access.accessToken, labelName);
    } catch (labelError) {
      return { sent: false, status: "failed", error: labelError.message, labelName };
    }
  }

  const message = buildRawMessage({ to, subject, text, html });
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${access.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      raw: message.raw,
      ...(threadId ? { threadId } : {}),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) {
    const error = data.error?.message || "Gmail could not send the message.";
    await db.from("gmail_integrations").update({
      last_error: error,
      updated_at: new Date().toISOString(),
    }).eq("id", "primary");
    return { sent: false, status: "failed", error };
  }

  let labelError = null;
  if (labelId) {
    try {
      await applyGmailLabel(access.accessToken, data.id, labelId);
    } catch (error) {
      labelError = error.message;
    }
  }

  await db.from("gmail_integrations").update({
    status: "connected",
    last_error: labelError,
    updated_at: new Date().toISOString(),
  }).eq("id", "primary");
  return {
    sent: true,
    status: labelError ? "sent_unfiled" : "sent",
    messageId: data.id || message.messageId,
    threadId: data.threadId || threadId || null,
    labelId,
    labelName: labelName || null,
    labeled: Boolean(labelId && !labelError),
    error: labelError,
  };
}

export async function sendGmailTest(db, user) {
  const target = user.email || senderEmail;
  const text = [
    "Google Workspace is connected to the Miqueas Language Solutions portal.",
    "",
    "This confirms that MLS can send portal email through Gmail. Calendar and Drive permissions are also checked in MLS Settings.",
  ].join("\n");
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f7f3ef;padding:24px;color:#24130e"><div style="max-width:600px;margin:auto;background:#fff;padding:28px;border-radius:20px"><p style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#dd7d00">Miqueas Language Solutions</p><h1>Google Workspace connection successful</h1><p style="line-height:1.7;color:#51453f">MLS can send portal email through Gmail. Calendar and Drive permissions are also available for assignment automation.</p></div></body></html>`;
  const delivery = await sendGmailEmail(db, {
    to: target,
    subject: "MLS Google Workspace connection test",
    text,
    html,
  });
  const now = new Date().toISOString();
  await db.from("gmail_integrations").update({
    last_test_at: delivery.sent ? now : null,
    last_error: delivery.error || null,
    updated_at: now,
  }).eq("id", "primary");
  return { ...delivery, to: target };
}

export async function disconnectGmail(db) {
  const tokenResult = await db.rpc("mls_get_gmail_refresh_token");
  if (!tokenResult.error && tokenResult.data) {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: tokenResult.data }),
    }).catch(() => null);
  }
  const deleted = await db.rpc("mls_delete_gmail_refresh_token");
  if (deleted.error) throw deleted.error;
  await db.from("gmail_integrations").update({
    calendar_id: null,
    calendar_summary: null,
    drive_root_folder_id: null,
    drive_root_folder_url: null,
    workspace_last_verified_at: null,
    updated_at: new Date().toISOString(),
  }).eq("id", "primary");
  return { disconnected: true };
}
