import { audit, interpreterFor, money, notify } from "./ops-v2-core.js";

export async function interpreterSubmitExpense(db, user, payload) {
  const interpreter = await interpreterFor(db, user.id);
  if (!interpreter) return { status: 403, payload: { error: "Interpreter access required." } };

  const link = await db.from("assignment_interpreters")
    .select("id")
    .eq("assignment_id", payload.assignmentId)
    .eq("interpreter_id", interpreter.id)
    .maybeSingle();
  if (link.error) throw link.error;
  if (!link.data) return { status: 403, payload: { error: "You are not assigned to that assignment." } };

  const result = await db.from("expenses").insert({
    assignment_id: payload.assignmentId,
    interpreter_id: interpreter.id,
    expense_type: payload.expenseType,
    description: payload.description || null,
    amount: money(payload.amount),
    mileage: payload.mileage ? money(payload.mileage) : null,
    receipt_storage_path: payload.receiptStoragePath || null,
    status: "submitted",
  }).select().single();
  if (result.error) throw result.error;

  await audit(db, user, {
    action: "expense.submitted",
    entityType: "expense",
    entityId: result.data.id,
    summary: `${payload.expenseType} · $${money(payload.amount).toFixed(2)}`,
    after: result.data,
  });

  return { status: 200, payload: { expense: result.data } };
}

export async function adminReviewExpense(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!["approved", "rejected", "reimbursed", "billed"].includes(payload.status)) {
    return { status: 400, payload: { error: "Invalid expense status." } };
  }

  const result = await db.from("expenses").update({
    status: payload.status,
    admin_notes: payload.notes || null,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", payload.expenseId)
    .select("*, interpreters(clerk_user_id)")
    .single();
  if (result.error) throw result.error;

  await notify(db, result.data.interpreters?.clerk_user_id, {
    category: "expense",
    title: `Expense ${payload.status}`,
    body: `${result.data.expense_type} · $${money(result.data.amount).toFixed(2)}`,
    section: "work",
    relatedType: "expense",
    relatedId: result.data.id,
  });

  await audit(db, user, {
    action: `expense.${payload.status}`,
    entityType: "expense",
    entityId: result.data.id,
    summary: payload.notes || null,
    after: result.data,
  });

  return { status: 200, payload: { expense: result.data } };
}
