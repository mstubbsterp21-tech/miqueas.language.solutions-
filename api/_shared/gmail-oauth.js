import crypto from "node:crypto";

const clientId = process.env.GOOGLE_GMAIL_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_GMAIL_CLIENT_SECRET || "";
const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI || "https://miqueaslanguagesolutions.com/api/google/gmail/callback";
const senderEmail = String(process.env.GOOGLE_GMAIL_SENDER || "").trim().toLowerCase();
const senderName = process.env.EMAIL_FROM_NAME || "Miqueas Language Solutions";
const gmailScope = "https://www.googleapis.com/auth/gmail.send";
const identityScopes = ["openid", "email"];

function encodeHeader(value) {
  const text = String(value || "");
  return /^[\x20-\x7E]*$/.test(text)
    ? text
    : `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
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
    scope: gmailScope,
  };
}

async function readIntegration(db) {
  const result = await db
    .from("gmail_integrations")
    .select("id,google_email,scope,status,connected_by_clerk_user_id,connected_at,updated_at,last_test_at,last_error")
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
  return {
    provider: "gmail",
    environmentConfigured: environment.configured,
    missingEnvironmentVariables: environment.missing,
    sender: senderEmail,
    redirectUri,
    connected: Boolean(environment.configured && integration?.status === "connected" && senderMatches),
    status: integration?.status || "not_connected",
    email: integration?.google_email || null,
    scope: integration?.scope || gmailScope,
    connectedAt: integration?.connected_at || null,
    lastTestAt: integration?.last_test_at || null,
    lastError: integration?.last_error || null,
    senderMatches,
  };
}

export async function createGmailAuthorization(db, user) {
  const environment = gmailEnvironment();
  if (!environment.configured) {
    throw new Error(`Gmail OAuth is missing: ${environment.missing.join(", ")}.`);
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
  url.searchParams.set("scope", [...identityScopes, gmailScope].join(" "));
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
    throw new Error("Google did not return a refresh token. Reconnect Gmail and approve access again.");
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
  if (!environment.configured) throw new Error("Gmail OAuth environment variables are incomplete.");
  if (!code || !state) throw new Error("Google did not return a complete authorization response.");

  const stateResult = await db.from("gmail_oauth_states").select("*").eq("state", state).maybeSingle();
  if (stateResult.error) throw stateResult.error;
  const stateRow = stateResult.data;
  const now = new Date();
  if (!stateRow || stateRow.used_at || new Date(stateRow.expires_at).getTime() <= now.getTime()) {
    throw new Error("This Gmail authorization request is invalid or expired. Start the connection again from MLS Settings.");
  }

  const claimed = await db
    .from("gmail_oauth_states")
    .update({ used_at: now.toISOString() })
    .eq("state", state)
    .is("used_at", null)
    .select("*")
    .maybeSingle();
  if (claimed.error) throw claimed.error;
  if (!claimed.data) throw new Error("This Gmail authorization request was already used.");

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
    p_scope: tokens.scope || gmailScope,
    p_connected_by: stateRow.admin_clerk_user_id,
  });
  if (stored.error) throw stored.error;

  return {
    email: identity.email,
    scope: tokens.scope || gmailScope,
    connectedBy: stateRow.admin_clerk_user_id,
  };
}

async function refreshAccessToken(db) {
  const status = await getGmailStatus(db);
  if (!status.environmentConfigured) {
    return { error: `Gmail OAuth is missing: ${status.missingEnvironmentVariables.join(", ")}.`, status: "not_configured" };
  }
  if (!status.connected) {
    return { error: "Gmail is not connected in MLS Settings.", status: "not_configured" };
  }

  const tokenResult = await db.rpc("mls_get_gmail_refresh_token");
  if (tokenResult.error) throw tokenResult.error;
  if (!tokenResult.data) {
    return { error: "The Gmail refresh token is unavailable. Reconnect Gmail in MLS Settings.", status: "not_configured" };
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
    const message = data.error_description || data.error || "Google could not refresh Gmail access.";
    await db.from("gmail_integrations").update({
      status: "error",
      last_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", "primary");
    return { error: message, status: "failed" };
  }
  return { accessToken: data.access_token, status: "ready" };
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
    `Content-Type: multipart/alternative; boundary=\"${boundary}\"`,
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

export async function sendGmailEmail(db, { to, subject, text, html }) {
  const access = await refreshAccessToken(db);
  if (!access.accessToken) {
    return { sent: false, status: access.status || "failed", error: access.error || "Gmail access is unavailable." };
  }

  const message = buildRawMessage({ to, subject, text, html });
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${access.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ raw: message.raw }),
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

  await db.from("gmail_integrations").update({
    status: "connected",
    last_error: null,
    updated_at: new Date().toISOString(),
  }).eq("id", "primary");
  return { sent: true, status: "sent", messageId: data.id || message.messageId, threadId: data.threadId || null };
}

export async function sendGmailTest(db, user) {
  const target = user.email || senderEmail;
  const text = [
    "Gmail is connected to the Miqueas Language Solutions portal.",
    "",
    "This test confirms that MLS can send document-request notifications through the Gmail API.",
  ].join("\n");
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f7f3ef;padding:24px;color:#24130e"><div style="max-width:600px;margin:auto;background:#fff;padding:28px;border-radius:20px"><p style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#dd7d00">Miqueas Language Solutions</p><h1>Gmail connection successful</h1><p style="line-height:1.7;color:#51453f">This test confirms that MLS can send document-request notifications through the Gmail API.</p></div></body></html>`;
  const delivery = await sendGmailEmail(db, {
    to: target,
    subject: "MLS Gmail connection test",
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
  return { disconnected: true };
}
