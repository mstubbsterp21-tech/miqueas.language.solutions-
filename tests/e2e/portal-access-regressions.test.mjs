import assert from "node:assert/strict";
import test from "node:test";
import { isBlockedInterpreterRosterStatus } from "../../api/_shared/portal-access-policy.js";
import {
  newestRecordsByDocumentType,
  normalizeWorkspaceDocumentRecords,
} from "../../src/portal/documentRecords.js";

test("removed and disabled interpreter roster statuses are blocked", () => {
  for (const status of ["removed", "inactive", "suspended", "disabled", " Removed "]) {
    assert.equal(isBlockedInterpreterRosterStatus(status), true);
  }
  for (const status of ["active", "pending_profile", "pending_documentation", ""]) {
    assert.equal(isBlockedInterpreterRosterStatus(status), false);
  }
});

test("document records keep the newest record for each document type", () => {
  const records = newestRecordsByDocumentType([
    { id: "old-resume", document_type: "resume", uploaded_at: "2026-01-01T00:00:00Z" },
    { id: "w9", document_type: "w9", uploaded_at: "2026-03-01T00:00:00Z" },
    { id: "new-resume", document_type: "resume", uploaded_at: "2026-04-01T00:00:00Z" },
  ]);

  assert.deepEqual(records.map((item) => item.id), ["new-resume", "w9"]);
});

test("cancelled document requests are excluded from the portal workspace", () => {
  const workspace = normalizeWorkspaceDocumentRecords({
    interpreter: {
      documents: [],
      documentRequests: [
        { id: "cancelled-new", document_type: "ic_agreement", status: "cancelled", created_at: "2026-05-01T00:00:00Z" },
        { id: "active-old", document_type: "ic_agreement", status: "requested", created_at: "2026-04-01T00:00:00Z" },
        { id: "active-new", document_type: "resume", status: "requested", created_at: "2026-06-01T00:00:00Z" },
      ],
    },
  });

  assert.deepEqual(
    workspace.interpreter.documentRequests.map((item) => item.id),
    ["active-new", "active-old"],
  );
});
