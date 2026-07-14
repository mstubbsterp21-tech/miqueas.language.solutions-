export function createMLSApi(session) {
  async function request(path, action, method = "GET", body) {
    const token = await session?.getToken();
    const response = await fetch(`${path}?action=${encodeURIComponent(action)}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "MLS app request failed.");
    return data;
  }

  return {
    core: (action, method = "GET", body) => request("/api/portal", action, method, body),
    operations: (action, method = "GET", body) => request("/api/portal-operations", action, method, body),
    app: (action, method = "GET", body) => request("/api/portal-app", action, method, body),
    operationsV2: (action, method = "GET", body) => request("/api/operations-v2", action, method, body),
    setup: (action = "save", method = "POST", body) => request("/api/first-login-setup", action, method, body),
    documentRequestEmail: (action = "send", method = "POST", body) => request("/api/document-request-email", action, method, body),
  };
}
