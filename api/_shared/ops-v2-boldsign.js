import { audit, notify } from "./ops-v2-core.js";

export async function adminLinkBoldSignAgreement(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };

  const assignment = await db
    .from("assignments")
    .select("*, clients(id,clerk_user_id,organization_name,email,primary_contact_name)")
    .eq("id", payload.assignmentId)
    .maybeSingle();
  if (assignment.error) throw assignment.error;
  if (!assignment.data) return { status: 404, payload: { error: "Assignment not found." } };

  const now = new Date().toISOString();
  const status = payload.status || "sent";
  const values = {
    assignment_id: assignment.data.id,
    client_id: assignment.data.client_id,
    template_name: payload.templateName || "Interpreting Services Agreement",
    terms_version: payload.termsVersion || "2026-07",
    status,
    provider: "boldsign",
    boldsign_document_id: payload.boldsignDocumentId || null,
    boldsign_template_id: payload.boldsignTemplateId || process.env.BOLDSIGN_SERVICE_AGREEMENT_TEMPLATE_ID || null,
    boldsign_sender_identity: payload.boldsignSenderIdentity || null,
    boldsign_signing_url: payload.boldsignSigningUrl || null,
    boldsign_audit_trail_url: payload.boldsignAuditTrailUrl || null,
    boldsign_status: payload.boldsignStatus || status,
    boldsign_last_event: payload.boldsignLastEvent || status,
    boldsign_last_event_at: now,
    document_url: payload.documentUrl || payload.boldsignSigningUrl || null,
    signer_name: payload.signerName || assignment.data.clients?.primary_contact_name || null,
    signer_email: payload.signerEmail || assignment.data.clients?.email || null,
    signature_acknowledgement: payload.signatureAcknowledgement || null,
    sent_at: ["sent", "signed"].includes(status) ? now : null,
    signed_at: status === "signed" ? (payload.signedAt || now) : null,
    declined_at: status === "declined" ? now : null,
    expires_at: payload.expiresAt || null,
    created_by: user.id,
    updated_at: now,
    provider_payload: payload.providerPayload || {},
  };

  const existing = await db
    .from("assignment_agreements")
    .select("id")
    .eq("assignment_id", assignment.data.id)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const result = existing.data
    ? await db.from("assignment_agreements").update(values).eq("id", existing.data.id).select().single()
    : await db.from("assignment_agreements").insert(values).select().single();
  if (result.error) throw result.error;

  const lifecycle = status === "signed"
    ? (assignment.data.deposit_required && assignment.data.deposit_status !== "paid" ? "deposit_pending" : "staffing")
    : assignment.data.lifecycle_status;
  const assignmentUpdate = await db.from("assignments").update({
    agreement_status: status,
    lifecycle_status: lifecycle,
    updated_at: now,
  }).eq("id", assignment.data.id);
  if (assignmentUpdate.error) throw assignmentUpdate.error;

  await notify(db, assignment.data.clients?.clerk_user_id, {
    category: "agreement",
    title: status === "signed" ? "Agreement completed" : "Agreement ready in BoldSign",
    body: `${values.template_name} · ${status}`,
    section: "requests",
    relatedType: "agreement",
    relatedId: result.data.id,
  });

  await audit(db, user, {
    action: "boldsign.agreement_linked",
    entityType: "agreement",
    entityId: result.data.id,
    summary: `${values.template_name} · ${status}`,
    after: result.data,
  });

  return { status: 200, payload: { agreement: result.data } };
}
