function recordTimestamp(record) {
  const value = record?.updated_at || record?.uploaded_at || record?.created_at || "";
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function newestRecordsByDocumentType(records = [], { excludeStatuses = [] } = {}) {
  const excluded = new Set(excludeStatuses.map((value) => String(value || "").toLowerCase()));
  const seen = new Set();

  return [...records]
    .filter(Boolean)
    .sort((left, right) => recordTimestamp(right) - recordTimestamp(left))
    .filter((record) => {
      const type = String(record.document_type || "").trim();
      const status = String(record.status || "").trim().toLowerCase();
      if (!type || excluded.has(status) || seen.has(type)) return false;
      seen.add(type);
      return true;
    });
}

function normalizeWorkspaceView(view) {
  if (!view) return view;
  return {
    ...view,
    documents: newestRecordsByDocumentType(view.documents || []),
    documentRequests: newestRecordsByDocumentType(view.documentRequests || [], {
      excludeStatuses: ["cancelled"],
    }),
  };
}

export function normalizeWorkspaceDocumentRecords(workspace) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    client: normalizeWorkspaceView(workspace.client),
    interpreter: normalizeWorkspaceView(workspace.interpreter),
  };
}
