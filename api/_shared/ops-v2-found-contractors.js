import { audit, money, notify } from "./ops-v2-core.js";

export async function adminLinkFoundContractorPayment(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };

  const now = new Date().toISOString();
  const values = {
    found_contractor_id: payload.foundContractorId || null,
    found_payment_id: payload.foundPaymentId || null,
    found_payment_url: payload.foundPaymentUrl || null,
    contractor_payment_status: payload.status || "scheduled",
    contractor_payment_amount: money(payload.amount),
    contractor_payment_due_date: payload.dueDate || null,
    contractor_paid_at: payload.status === "paid" ? (payload.paidAt || now) : null,
    updated_at: now,
  };

  const result = await db
    .from("assignment_interpreters")
    .update(values)
    .eq("id", payload.assignmentInterpreterId)
    .select("*, interpreters(clerk_user_id,first_name,last_name,email), assignments(service_type,start_at)")
    .single();
  if (result.error) throw result.error;

  await notify(db, result.data.interpreters?.clerk_user_id, {
    category: "payment",
    title: payload.status === "paid" ? "Contractor payment completed" : "Contractor payment scheduled",
    body: `${result.data.assignments?.service_type || "MLS assignment"} · $${money(payload.amount).toFixed(2)}`,
    section: "work",
    relatedType: "assignment",
    relatedId: result.data.assignment_id,
  });

  await audit(db, user, {
    action: "found.contractor_payment_linked",
    entityType: "assignment_interpreter",
    entityId: result.data.id,
    summary: `$${money(payload.amount).toFixed(2)} · ${payload.status || "scheduled"}`,
    after: result.data,
  });

  return { status: 200, payload: { assignmentInterpreter: result.data } };
}
