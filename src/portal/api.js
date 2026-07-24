const transientStatuses = new Set([502, 503, 504]);
const transientMessage = "MLS is temporarily unable to connect to its secure workspace. Please try again in a moment.";

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function rawError(data) {
  return typeof data?.error === "string" ? data.error.trim() : "";
}

function isTransientPayload(data) {
  const value = rawError(data).toLowerCase();
  return value.includes("<!doctype html")
    || value.includes("<html")
    || value.includes("ssl handshake failed")
    || value.includes("error code 525")
    || value.includes("gateway.supabase.co")
    || value.includes("cloudflare");
}

function safeRequestError(data, status) {
  const value = rawError(data);
  if (transientStatuses.has(status) || isTransientPayload(data)) return transientMessage;
  if (!value) return `Request failed (${status}).`;
  return value.length > 240 ? `${value.slice(0, 237)}...` : value;
}

async function token(session) {
  if (!session) throw new Error("Sign in is required.");
  return session.getToken();
}

async function request(session, endpoint, action, method = "GET", body) {
  const bearer = await token(session);
  const attempts = method === "GET" ? 3 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let response;
    try {
      response = await fetch(`${endpoint}?action=${encodeURIComponent(action)}`, {
        method,
        headers: {
          Authorization: `Bearer ${bearer}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch (networkError) {
      if (attempt < attempts - 1) {
        await wait(800 * (attempt + 1));
        continue;
      }
      console.error("MLS portal network request failed", networkError);
      throw new Error(transientMessage);
    }

    const responseText = await response.text();
    let data = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { error: responseText };
      }
    }

    if (response.ok) return data;

    const shouldRetry = transientStatuses.has(response.status) || isTransientPayload(data);
    if (shouldRetry && attempt < attempts - 1) {
      await wait(800 * (attempt + 1));
      continue;
    }

    throw new Error(safeRequestError(data, response.status));
  }

  throw new Error(transientMessage);
}

async function coreRequest(session, action, method, body) {
  if (action === "createAssignment") {
    return request(session, "/api/operations-v2", "createRequestAssignment", method, body);
  }
  if (action === "saveInterpreterProfile") {
    return request(session, "/api/operations-v2", "saveInterpreterProfileDetails", method, body);
  }
  if (action === "adminUpdateInterpreterProfile") {
    const result = await request(session, "/api/operations-v2", "adminUpdateInterpreterProfileDetails", method, body);
    await request(session, "/api/operations-v2", "adminUpdateInterpreterRates", "POST", {
      interpreterId: body?.interpreterId,
      onsiteRate: body?.profile?.onsite_rate || "",
      vriRate: body?.profile?.vri_rate || "",
    });
    return result;
  }
  return request(session, "/api/portal", action, method, body);
}

function appRequest(session, action, method, body) {
  if (action === "adminUpdateAssignment") return request(session, "/api/operations-v2", "adminUpdateFullAssignment", method, body);
  if (action === "adminDeleteAssignment") return request(session, "/api/operations-v2", "adminDeleteAssignment", method, body);
  if (["adminAssignInterpreter", "adminRemoveInterpreter"].includes(action)) return request(session, "/api/operations-v2", action, method, body);
  return request(session, "/api/portal-app", action, method, body);
}

async function assignmentAutomationRequest(session, action, method, body) {
  const result = await request(session, "/api/assignment-automations", action, method, body);
  if (["requestCreated", "confirmed", "syncAssignment"].includes(action) && body?.assignmentId) {
    const workspace = await request(session, "/api/operations-v2", "adminSyncAssignmentWorkspaceRecord", "POST", { assignmentId: body.assignmentId });
    return { ...result, workspaceRecord: workspace.workspace };
  }
  return result;
}

export function createMLSApi(session) {
  return {
    bootstrap: () => request(session, "/api/portal", "loadBootstrap", "GET"),
    core: (action, method, body) => coreRequest(session, action, method, body),
    operations: (action, method, body) => request(session, "/api/portal-operations", action, method, body),
    app: (action, method, body) => appRequest(session, action, method, body),
    operationsV2: (action, method, body) => request(session, "/api/operations-v2", action, method, body),
    communications: (action = "loadCommunications", method = "GET", body) => request(
      session,
      "/api/operations-v2",
      action === "createUploadUrl" ? "createCommunicationUploadUrl" : action === "openAttachment" ? "openCommunicationAttachment" : action,
      method,
      body,
    ),
    setup: (action = "save", method = "POST", body) => request(session, "/api/first-login-setup", action, method, body),
    role: (action = "status", method = "GET", body) => request(
      session,
      "/api/first-login-setup",
      action === "select" ? "selectRole" : "roleStatus",
      method,
      body,
    ),
    automations: (action, method = "POST", body) => assignmentAutomationRequest(session, action, method, body),
    documentRequestEmail: (action, method = "POST", body) => request(session, "/api/document-request-email", action, method, body),
    documentRequestCancel: (action = "cancel", method = "POST", body) => request(session, "/api/document-request-cancel", action, method, body),
    opportunityEmail: (action, method = "POST", body) => request(session, "/api/opportunity-email", action, method, body),
    gmailOAuth: (action = "status", method = "GET", body) => request(session, "/api/gmail-oauth", action, method, body),
  };
}
