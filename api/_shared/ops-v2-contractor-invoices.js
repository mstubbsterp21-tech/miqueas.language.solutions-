import { audit, interpreterFor, money, notify } from "./ops-v2-core.js";

const reviewStatuses = new Set(["under_review", "approved", "scheduled_for_payment", "paid", "rejected", "void"]);
const transitions = {
  submitted: new Set(["under_review", "approved", "rejected", "void"]),
  under_review: new Set(["approved", "rejected", "void"]),
  approved: new Set(["scheduled_for_payment", "paid", "void"]),
  scheduled_for_payment: new Set(["paid", "void"]),
  rejected: new Set(["under_review", "void"]),
  paid: new Set(),
  void: new Set(),
};

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && Number.isFinite(new Date(`${value}T12:00:00Z`).getTime());
}

export async function interpreterSubmitInvoice(db, user, payload) {
  const interpreter = await interpreterFor(db, user.id);
  if (!interpreter) return { status: 403, payload: { error: "Interpreter access required." } };
  const number = String(payload.invoiceNumber || "").trim();
  const amount = money(payload.amount);
  if (!payload.assignmentId || !number || amount <= 0 || !payload.storagePath || !payload.fileName) {
    return { status: 400, payload: { error: "Assignment, invoice number, positive amount, and invoice file are required." } };
  }
  const invoiceDate = payload.invoiceDate || new Date().toISOString().slice(0, 10);
  if (!validDate(invoiceDate)) return { status: 400, payload: { error: "Enter a valid invoice date." } };
  const link = await db.from("assignment_interpreters").select("id,assignment_id,status,assignments(service_type,start_at,end_at,status,lifecycle_status)").eq("assignment_id", payload.assignmentId).eq("interpreter_id", interpreter.id).maybeSingle();
  if (link.error) throw link.error;
  if (!link.data) return { status: 403, payload: { error: "You can only invoice an assignment assigned to you." } };
  const assignment = link.data.assignments;
  if (!assignment?.end_at || new Date(assignment.end_at).getTime() > Date.now()) {
    return { status: 409, payload: { error: "Submit the invoice after the assignment has ended." } };
  }
  if (["cancelled", "canceled", "void"].includes(String(assignment.status || assignment.lifecycle_status).toLowerCase())) {
    return { status: 409, payload: { error: "A cancelled assignment cannot be invoiced." } };
  }
  const expectedPrefix = `assignments/${payload.assignmentId}/invoice/`;
  if (!String(payload.storagePath).startsWith(expectedPrefix)) {
    return { status: 400, payload: { error: "The invoice upload does not match this assignment." } };
  }
  const now = new Date().toISOString();
  const result = await db.from("contractor_invoices").insert({
    assignment_id: payload.assignmentId,
    assignment_interpreter_id: link.data.id,
    interpreter_id: interpreter.id,
    invoice_number: number,
    invoice_date: invoiceDate,
    amount,
    currency: String(payload.currency || "USD").toUpperCase(),
    status: "submitted",
    storage_path: payload.storagePath,
    file_name: payload.fileName,
    mime_type: payload.mimeType || null,
    interpreter_notes: String(payload.notes || "").trim() || null,
    submitted_at: now,
    updated_at: now,
  }).select("*, assignments(service_type,start_at)").single();
  if (result.error) {
    if (result.error.code === "23505") return { status: 409, payload: { error: "That invoice number has already been used." } };
    throw result.error;
  }
  await audit(db, user, { action: "contractor_invoice.submitted", entityType: "contractor_invoice", entityId: result.data.id, summary: `${number} · $${amount.toFixed(2)}` });
  return { status: 201, payload: { contractorInvoice: result.data } };
}

export async function adminReviewContractorInvoice(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!reviewStatuses.has(payload.status)) return { status: 400, payload: { error: "Invalid contractor invoice status." } };
  const current = await db.from("contractor_invoices").select("*, interpreters(clerk_user_id,first_name,last_name,email), assignments(service_type,start_at)").eq("id", payload.contractorInvoiceId).single();
  if (current.error) throw current.error;
  if (!transitions[current.data.status]?.has(payload.status)) {
    return { status: 409, payload: { error: `Invoice status cannot move from ${current.data.status.replaceAll("_", " ")} to ${payload.status.replaceAll("_", " ")}.` } };
  }
  if (payload.status === "paid" && !String(payload.paymentReference || "").trim() && !current.data.payment_reference) {
    return { status: 400, payload: { error: "Enter the Found payment reference before marking this invoice paid." } };
  }
  const now = new Date().toISOString();
  const updates = {
    status: payload.status,
    admin_notes: payload.notes === undefined ? current.data.admin_notes : (String(payload.notes || "").trim() || null),
    reviewed_by: user.id,
    reviewed_at: now,
    scheduled_at: payload.status === "scheduled_for_payment" ? now : current.data.scheduled_at,
    paid_at: payload.status === "paid" ? (payload.paidAt || now) : current.data.paid_at,
    payment_reference: String(payload.paymentReference || "").trim() || current.data.payment_reference,
    updated_at: now,
  };
  const result = await db.from("contractor_invoices").update(updates).eq("id", payload.contractorInvoiceId).select("*, interpreters(clerk_user_id,first_name,last_name,email), assignments(service_type,start_at)").single();
  if (result.error) throw result.error;
  await notify(db, result.data.interpreters?.clerk_user_id, {
    category: "payment", title: `Invoice ${payload.status.replaceAll("_", " ")}`,
    body: `${result.data.invoice_number} · ${result.data.assignments?.service_type || "MLS assignment"}`,
    section: "payments", relatedType: "contractor_invoice", relatedId: result.data.id,
  });
  await audit(db, user, { action: "contractor_invoice.reviewed", entityType: "contractor_invoice", entityId: result.data.id, summary: `${result.data.invoice_number} · ${payload.status}`, before: current.data, after: result.data });
  return { status: 200, payload: { contractorInvoice: result.data } };
}

export async function openContractorInvoice(db, user, payload) {
  const invoice = await db.from("contractor_invoices").select("id,interpreter_id,storage_path,file_name").eq("id", payload.contractorInvoiceId).single();
  if (invoice.error) throw invoice.error;
  if (!user.isAdmin) {
    const interpreter = await interpreterFor(db, user.id);
    if (!interpreter || interpreter.id !== invoice.data.interpreter_id) return { status: 403, payload: { error: "You cannot open this invoice." } };
  }
  const signed = await db.storage.from("assignment-documents").createSignedUrl(invoice.data.storage_path, 300, { download: invoice.data.file_name });
  if (signed.error) throw signed.error;
  return { status: 200, payload: { url: signed.data.signedUrl } };
}
