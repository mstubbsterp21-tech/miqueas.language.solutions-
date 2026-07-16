async function token(session) {
  if (!session) throw new Error("Sign in is required.");
  return session.getToken();
}

async function request(session, endpoint, action, method = "GET", body) {
  const bearer = await token(session);
  const response = await fetch(`${endpoint}?action=${encodeURIComponent(action)}`, {
    method,
    headers: {
      Authorization: `Bearer ${bearer}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
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
    core: (action, method, body) => request(session, "/api/portal", action, method, body),
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
    setup: (role, body) => request(session, "/api/first-login-setup", role, "POST", body),
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
