import { audit, clientFor, money, notify } from "./ops-v2-core.js";

export async function adminCreateQuote(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const assignment = await db.from("assignments").select("*, clients(id,clerk_user_id,organization_name,email)").eq("id", payload.assignmentId).maybeSingle();
  if (assignment.error) throw assignment.error;
  if (!assignment.data) return { status: 404, payload: { error: "Assignment not found." } };

  const items = Array.isArray(payload.items) ? payload.items.filter((item) => String(item.description || "").trim()) : [];
  const normalized = items.map((item, index) => ({
    item_type: item.itemType || "service",
    description: String(item.description).trim(),
    quantity: money(item.quantity || 1),
    unit_rate: money(item.unitRate),
    amount: money(item.amount || money(item.quantity || 1) * money(item.unitRate)),
    sort_order: index,
    metadata: item.metadata || {},
  }));
  const subtotal = money(normalized.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const discount = money(payload.discountAmount);
  const tax = money(payload.taxAmount);
  const total = money(subtotal - discount + tax);
  const deposit = money(payload.depositAmount);

  const existing = await db.from("quotes").select("*").eq("assignment_id", assignment.data.id).maybeSingle();
  if (existing.error) throw existing.error;
  const values = {
    assignment_id: assignment.data.id,
    client_id: assignment.data.client_id,
    quote_number: existing.data?.quote_number || `MLS-Q-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`,
    status: "draft",
    subtotal,
    discount_amount: discount,
    tax_amount: tax,
    deposit_amount: deposit,
    total_amount: total,
    expires_at: payload.expiresAt || null,
    terms: payload.terms || null,
    client_note: payload.clientNote || null,
    admin_note: payload.adminNote || null,
    created_by: existing.data?.created_by || user.id,
    updated_at: new Date().toISOString(),
  };
  const quote = existing.data
    ? await db.from("quotes").update(values).eq("id", existing.data.id).select().single()
    : await db.from("quotes").insert(values).select().single();
  if (quote.error) throw quote.error;

  const removeItems = await db.from("quote_items").delete().eq("quote_id", quote.data.id);
  if (removeItems.error) throw removeItems.error;
  if (normalized.length) {
    const insertItems = await db.from("quote_items").insert(normalized.map((item) => ({ ...item, quote_id: quote.data.id })));
    if (insertItems.error) throw insertItems.error;
  }

  const assignmentUpdate = await db.from("assignments").update({
    quote_status: "draft",
    lifecycle_status: "needs_review",
    deposit_required: deposit > 0,
    deposit_amount: deposit || null,
    deposit_status: deposit > 0 ? "pending" : "not_required",
    updated_at: new Date().toISOString(),
  }).eq("id", assignment.data.id);
  if (assignmentUpdate.error) throw assignmentUpdate.error;

  await audit(db, user, {
    action: existing.data ? "quote.updated" : "quote.created",
    entityType: "quote",
    entityId: quote.data.id,
    summary: `${quote.data.quote_number} for ${assignment.data.service_type}`,
    after: quote.data,
  });
  return { status: 200, payload: { quote: quote.data } };
}

export async function adminSendQuote(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const quote = await db.from("quotes").select("*, clients(clerk_user_id,organization_name,email), assignments(id,service_type)").eq("id", payload.quoteId).maybeSingle();
  if (quote.error) throw quote.error;
  if (!quote.data) return { status: 404, payload: { error: "Quote not found." } };

  const now = new Date().toISOString();
  const update = await db.from("quotes").update({ status: "sent", sent_at: now, updated_at: now }).eq("id", quote.data.id).select().single();
  if (update.error) throw update.error;
  const assignmentUpdate = await db.from("assignments").update({ quote_status: "sent", lifecycle_status: "quote_sent", updated_at: now }).eq("id", quote.data.assignment_id);
  if (assignmentUpdate.error) throw assignmentUpdate.error;

  await notify(db, quote.data.clients?.clerk_user_id, {
    category: "quote",
    title: "MLS quote ready for review",
    body: `${quote.data.quote_number} is ready. Open Requests to approve it or request changes.`,
    section: "requests",
    relatedType: "quote",
    relatedId: quote.data.id,
  });
  await audit(db, user, { action: "quote.sent", entityType: "quote", entityId: quote.data.id, summary: quote.data.quote_number });
  return { status: 200, payload: { quote: update.data } };
}

export async function clientRespondQuote(db, user, payload) {
  const client = await clientFor(db, user.id);
  if (!client) return { status: 403, payload: { error: "Client access required." } };
  const quote = await db.from("quotes").select("*").eq("id", payload.quoteId).eq("client_id", client.id).maybeSingle();
  if (quote.error) throw quote.error;
  if (!quote.data) return { status: 404, payload: { error: "Quote not found." } };

  const response = String(payload.response || "");
  if (!["approved", "changes_requested", "rejected"].includes(response)) {
    return { status: 400, payload: { error: "Choose approve, request changes, or reject." } };
  }
  const now = new Date().toISOString();
  const update = await db.from("quotes").update({
    status: response,
    client_note: payload.note || quote.data.client_note,
    responded_at: now,
    approved_at: response === "approved" ? now : null,
    rejected_at: response === "rejected" ? now : null,
    updated_at: now,
  }).eq("id", quote.data.id).select().single();
  if (update.error) throw update.error;

  const lifecycle = response === "approved"
    ? (Number(quote.data.deposit_amount || 0) > 0 ? "deposit_pending" : "staffing")
    : "needs_review";
  const assignmentUpdate = await db.from("assignments").update({ quote_status: response, lifecycle_status: lifecycle, updated_at: now }).eq("id", quote.data.assignment_id);
  if (assignmentUpdate.error) throw assignmentUpdate.error;

  await audit(db, user, { action: `quote.${response}`, entityType: "quote", entityId: quote.data.id, summary: payload.note || quote.data.quote_number });
  return { status: 200, payload: { quote: update.data } };
}
