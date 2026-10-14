import assert from "node:assert/strict";
import { publicSiteEntries, todayInNewYork } from "../../src/seo/publishing.js";

test("scheduled blog pages stay unpublished until midnight in New York", () => {
  assert.equal(todayInNewYork(new Date("2026-10-19T03:59:59Z")), "2026-10-18");
  assert.equal(todayInNewYork(new Date("2026-10-19T04:00:00Z")), "2026-10-19");
  assert.equal(todayInNewYork(new Date("2026-12-21T04:59:59Z")), "2026-12-20");
  assert.equal(todayInNewYork(new Date("2026-12-21T05:00:00Z")), "2026-12-21");
  const sample = {
    "/": { priority: "1.0" },
    "/blog/older": { publishDate: "2026-10-12" },
    "/blog/future": { publishDate: "2026-10-26" },
  };
  assert.deepEqual(publicSiteEntries(sample, "2026-10-14").map(([path]) => path), ["/", "/blog/older"]);
  assert.deepEqual(publicSiteEntries(sample, "2026-10-26").map(([path]) => path), ["/", "/blog/older", "/blog/future"]);
});


import test from "node:test";
import { isBlockedInterpreterRosterStatus } from "../../api/_shared/portal-access-policy.js";
import { isAtOrAfterNow, isDueDatePast, isWithinDays } from "../../src/portal/datePredicates.js";
import {
  newestRecordsByDocumentType,
  normalizeWorkspaceDocumentRecords,
} from "../../src/portal/documentRecords.js";

import {
  canWriteAsRole,
  safeProfileWrite,
  publicProfile,
  CLIENT_ASSIGNMENT_FIELDS,
  CLIENT_ASSIGNMENT_SELECT,
  INTERPRETER_ASSIGNMENT_FIELDS,
  INTERPRETER_ASSIGNMENT_SELECT,
  CLIENT_TIME_ENTRY_SELECT,
  STAFFING_PUBLIC_FIELDS,
} from "../../api/_shared/portal-boundary-policy.js";

test("only admins or the account's declared role may update its profile", () => {
  const client = { id: "user-client", metadataRole: "client", isAdmin: false };
  const interpreter = { id: "user-interpreter", metadataRole: "interpreter", isAdmin: false };
  assert.equal(canWriteAsRole(client, "client"), true);
  assert.equal(canWriteAsRole(client, "interpreter", { id: "old-interpreter-record" }), false);
  assert.equal(canWriteAsRole(interpreter, "interpreter"), true);
  assert.equal(canWriteAsRole(interpreter, "client", { id: "old-client-record" }), false);
  assert.equal(canWriteAsRole({ id: "legacy", isAdmin: false }, "interpreter"), false);
  assert.equal(canWriteAsRole({ id: "legacy", isAdmin: false }, "interpreter", { id: "existing" }), true);
  assert.equal(canWriteAsRole({ id: "admin", isAdmin: true }, "client"), true);
});

test("non-admin profile writes cannot change account administration fields", () => {
  const interpreterInput = {
    first_name: "Alex", roster_status: "active", admin_notes: "override",
    onsite_rate: "500", vri_rate: "500", screening_status: "approved", w9_status: "approved",
  };
  const safeInterpreter = safeProfileWrite(interpreterInput, "interpreter");
  assert.equal(safeInterpreter.first_name, "Alex");
  for (const key of ["roster_status", "admin_notes", "onsite_rate", "vri_rate", "screening_status", "w9_status"]) {
    assert.equal(Object.hasOwn(safeInterpreter, key), false, key);
  }
  const clientInput = { organization_name: "Sample LLC", account_status: "active", billing_notes: "internal" };
  const safeClient = safeProfileWrite(clientInput, "client");
  assert.equal(safeClient.organization_name, "Sample LLC");
  assert.equal(Object.hasOwn(safeClient, "account_status"), false);
  assert.equal(Object.hasOwn(safeClient, "billing_notes"), false);
  assert.equal(safeProfileWrite(clientInput, "client", true).account_status, "active");
  assert.equal(publicProfile(clientInput, "client").billing_notes, undefined);
  assert.equal(publicProfile(interpreterInput, "interpreter").admin_notes, undefined);
});

test("client and interpreter response projections omit other parties' internal data", () => {
  const forbiddenAssignment = ["admin_notes", "calendar_last_error", "drive_last_error", "confirmation_email_last_error"];
  for (const key of forbiddenAssignment) {
    assert.equal(CLIENT_ASSIGNMENT_FIELDS.includes(key), false, `client assignment leaked ${key}`);
    assert.equal(INTERPRETER_ASSIGNMENT_FIELDS.includes(key), false, `interpreter assignment leaked ${key}`);
  }
  for (const key of ["agreed_rate", "contractor_payment_amount", "contractor_payment_status", "found_payment_url", "notes"]) {
    assert.equal(STAFFING_PUBLIC_FIELDS.includes(key), false, `client staffing leaked ${key}`);
  }
  for (const key of ["invoice_amount", "deposit_amount", "payment_status", "purchase_order_number"]) {
    assert.equal(INTERPRETER_ASSIGNMENT_FIELDS.includes(key), false, `interpreter assignment leaked ${key}`);
  }
  assert.doesNotMatch(CLIENT_ASSIGNMENT_SELECT, /assignment_interpreters\(\*/);
  assert.doesNotMatch(INTERPRETER_ASSIGNMENT_SELECT, /assignments\(\*/);
  assert.doesNotMatch(CLIENT_TIME_ENTRY_SELECT, /admin_notes|interpreter_notes|reviewed_by/);
});

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

test("portal date summaries use the supplied live clock and handle boundary cases", () => {
  const now = new Date("2026-10-12T16:00:00.000Z").getTime();
  assert.equal(isAtOrAfterNow("2026-10-12T16:00:00.000Z", now), true);
  assert.equal(isAtOrAfterNow("2026-10-12T15:59:59.999Z", now), false);
  assert.equal(isDueDatePast("2026-10-11", now), true);
  assert.equal(isDueDatePast("2026-10-12", now), false);
  assert.equal(isWithinDays("2026-12-11T16:00:00.000Z", now, 60), true);
  assert.equal(isWithinDays("2026-12-11T16:00:00.001Z", now, 60), false);
});
