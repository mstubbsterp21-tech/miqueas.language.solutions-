import { audit, notify } from "./ops-v2-core.js";

export async function adminSaveCredential(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };

  const values = {
    interpreter_id: payload.interpreterId,
    credential_type: payload.credentialType,
    credential_name: payload.credentialName,
    credential_number: payload.credentialNumber || null,
    issuer: payload.issuer || null,
    issued_on: payload.issuedOn || null,
    expires_on: payload.expiresOn || null,
    verification_status: payload.verificationStatus || "pending",
    document_id: payload.documentId || null,
    verified_by: payload.verificationStatus === "verified" ? user.id : null,
    verified_at: payload.verificationStatus === "verified" ? new Date().toISOString() : null,
    rejection_reason: payload.rejectionReason || null,
    notes: payload.notes || null,
    updated_at: new Date().toISOString(),
  };

  if (!values.interpreter_id || !values.credential_type || !values.credential_name) {
    return { status: 400, payload: { error: "Interpreter, credential type, and credential name are required." } };
  }

  const result = payload.credentialId
    ? await db.from("interpreter_credentials").update(values).eq("id", payload.credentialId).select().single()
    : await db.from("interpreter_credentials").insert(values).select().single();
  if (result.error) throw result.error;

  await audit(db, user, {
    action: "credential.saved",
    entityType: "interpreter_credential",
    entityId: result.data.id,
    summary: `${payload.credentialName} · ${values.verification_status}`,
    after: result.data,
  });

  return { status: 200, payload: { credential: result.data } };
}

export async function adminUpdateOnboarding(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.interpreterId || !payload.stage) {
    return { status: 400, payload: { error: "Interpreter and onboarding stage are required." } };
  }

  const now = new Date().toISOString();
  const values = {
    interpreter_id: payload.interpreterId,
    stage: payload.stage,
    status: payload.status || "active",
    assigned_reviewer: payload.assignedReviewer || null,
    due_date: payload.dueDate || null,
    score: payload.score ? Number(payload.score) : null,
    recommendation: payload.recommendation || null,
    notes: payload.notes || null,
    last_contact_at: payload.lastContactAt || null,
    completed_at: payload.status === "completed" || ["approved", "active", "declined"].includes(payload.stage) ? now : null,
    updated_at: now,
  };

  const result = await db.from("interpreter_onboarding")
    .upsert(values, { onConflict: "interpreter_id" })
    .select("*, interpreters(clerk_user_id,first_name,last_name,email)")
    .single();
  if (result.error) throw result.error;

  if (payload.stage === "active") {
    const roster = await db.from("interpreters").update({ roster_status: "active", updated_at: now }).eq("id", payload.interpreterId);
    if (roster.error) throw roster.error;
  }

  await notify(db, result.data.interpreters?.clerk_user_id, {
    category: "onboarding",
    title: "MLS onboarding updated",
    body: `${payload.stage.replaceAll("_", " ")} · ${(payload.status || "active").replaceAll("_", " ")}`,
    section: "profile",
    relatedType: "interpreter",
    relatedId: payload.interpreterId,
  });

  await audit(db, user, {
    action: "onboarding.updated",
    entityType: "interpreter",
    entityId: payload.interpreterId,
    summary: `${payload.stage} · ${payload.status || "active"}`,
    after: result.data,
  });

  return { status: 200, payload: { onboarding: result.data } };
}
