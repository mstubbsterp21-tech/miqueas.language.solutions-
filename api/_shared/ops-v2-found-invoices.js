import { audit, money, notify } from "./ops-v2-core.js";

export async function adminLinkFoundInvoice(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };

  const assignment = await db
    .from("assignments")
    .select("*, clients(id,clerk_user_id)")
    .eq("id", payload.assignmentId)
    .maybeSingle();
  if (assignment.error) throw assignment.error;
  if (!assignment.data) return { status: 404, payload: { error: "Assignment not found." } };

  const invoiceNumber = String(payload.invoiceNumber || "").trim();
  if (!invoiceNumber) return { status: 400, payload: { error: "Enter the Found invoice number." } };

  const totalAmount = money(payload.totalAmount);
  const amountPaid = money(payload.amountPaid);
  const balanceDue = money(payload.balanceDue ?? (totalAmount - amountPaid));
  const status = payload.status || (balanceDue <= 0 ? "paid" : "sent");
  const now = new Date().toISOString();

  const values = {
    assignment_id: assignment.data.id,
    client_id: assignment.data.client_id,
    quote_id: payload.quoteId || null,
    invoice_number: invoiceNumber,
    status,
    issue_date: payload.issueDate || now.slice(0, 10),
    due_date: payload.dueDate || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    subtotal: money(payload.subtotal || totalAmount),
    total_amount: totalAmount,
    amount_paid: amountPaid,
    balance_due: balanceDue,
    external_system: "found",
    found_invoice_id: payload.foundInvoiceId || null,
    found_invoice_url: payload.foundInvoiceUrl || null,
    found_status: payload.foundStatus || status,
    found_synced_at: now,
    sync_status: payload.foundInvoiceId || payload.foundInvoiceUrl ? "linked" : "needs_review",
    memo: payload.memo || null,
    sent_at: status === "draft" ? null : now,
    paid_at: status === "paid" ? now : null,
    created_by: user.id,
    updated_at: now,
  };

  const result = payload.invoiceId
    ? await db.from("invoices").update(values).eq("id", payload.invoiceId).select().single()
    : await db.from("invoices").insert(values).select().single();
  if (result.error) throw result.error;

  const paid = status === "paid" || balanceDue <= 0;
  const assignmentUpdate = await db.from("assignments").update({
    invoice_number: invoiceNumber,
    invoice_amount: totalAmount,
    payment_status: paid ? "paid" : "pending_payment",
    lifecycle_status: paid ? "paid" : "invoice_sent",
    paid_at: paid ? now : null,
    updated_at: now,
  }).eq("id", assignment.data.id);
  if (assignmentUpdate.error) throw assignmentUpdate.error;

  await notify(db, assignment.data.clients?.clerk_user_id, {
    category: "billing",
    title: paid ? "Payment received" : "Invoice available in Found",
    body: `${invoiceNumber} · $${totalAmount.toFixed(2)}`,
    section: "billing",
    relatedType: "invoice",
    relatedId: result.data.id,
  });

  await audit(db, user, {
    action: "found.invoice_linked",
    entityType: "invoice",
    entityId: result.data.id,
    summary: invoiceNumber,
    after: result.data,
  });

  return { status: 200, payload: { invoice: result.data } };
}
