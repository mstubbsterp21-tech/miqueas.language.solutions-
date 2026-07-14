import { audit, notify } from "./ops-v2-core.js";

const agreementStatuses = new Set([
  "draft", "sent", "viewed", "signed", "declined", "expired", "void", "voided",
]);

export async function adminLinkBoldSignAgreement(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };

  const assignment = await db
    .from("assignments")
    .select("*, clients(id,clerk_user_id,organization_name,email,primary_contact_name)")
    .eq("id", payload.assignmentId)
    .maybeSingle();
  if (assignment.error) throw assignment.error;
  if (!assignment.data) return { status: 404, payload: { error: "Assignment not found." } };

  const existing = await db
    .from("assignment_agreements")
    .select("*")
    .eq("assignment_id", assignment.data.id)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const now = new Date().toISOString();
  const status = agreementStatuses.has(payload.status) ? payload.status : "draft";
  const sentLike = ["sent", "viewed", "signed"].includes(status);
  const previous = existing.data || {};

  const values = {
    assignment_id: assignment.data.id,
    client_id: assignment.data.client_id,
    template_name: payload.templateName || previous.template_name || "Interpreting Services Agreement",
    terms_version: payload.termsVersion || previous.terms_version || "2026-07",
    status,
    provider: "boldsign",
    manual_workflow: true,
    boldsign_document_id: payload.boldsignDocumentId || previous.boldsign_document_id || null,
    boldsign_template_id: payload.boldsignTemplateId || previous.boldsign_template_id || null,
    boldsign_sender_identity: payload.boldsignSenderIdentity || previous.boldsign_sender_identity || null,
    boldsign_signing_url: payload.boldsignSigningUrl || previous.boldsign_signing_url || null,
    boldsign_audit_trail_url: payload.boldsignAuditTrailUrl || previous.boldsign_audit_trail_url || null,
    boldsign_status: status,
    boldsign_last_event: `manual_${status}`,
    boldsign_last_event_at: now,
    completed_document_id: payload.completedDocumentId || previous.completed_document_id || null,
    audit_trail_document_id: payload.auditTrailDocumentId || previous.audit_trail_document_id || null,
    document_url: payload.completedDocumentUrl || previous.document_url || null,
    drive_file_id: payload.driveFileId || previous.drive_file_id || null,
    signer_name: payload.signerName || previous.signer_name || assignment.data.clients?.primary_contact_name || null,
    signer_email: payload.signerEmail || previous.signer_email || assignment.data.clients?.email || null,
    signature_acknowledgement: "Agreement status and files are maintained manually by MLS.",
    sent_at: payload.sentAt || previous.sent_at || (sentLike ? now : null),
    signed_at: status === "signed" ? (payload.signedAt || previous.signed_at || now) : previous.signed_at || null,
    declined_at: status === "declined" ? (previous.declined_at || now) : previous.declined_at || null,
    expires_at: payload.expiresAt || previous.expires_at || null,
    internal_notes: payload.internalNotes ?? previous.internal_notes ?? null,
    manual_status_updated_at: now,
    manual_status_updated_by: user.id,
    created_by: previous.created_by || user.id,
    updated_at: now,
    provider_payload: {
      ...(previous.provider_payload || {}),
      ...(payload.providerPayload || {}),
      workflow: "manual",
      apiRequired: false,
    },
  };

  const result = previous.id
    ? await db.from("assignment_agreements").update(values).eq("id", previous.id).select().single()
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
    title: status === "signed" ? "Agreement marked complete by MLS" : "Agreement status updated by MLS",
    body: `${values.template_name} · ${status.replaceAll("_", " ")}. This status was entered manually by MLS.`,
    section: "requests",
    relatedType: "agreement",
    relatedId: result.data.id,
  });

  await audit(db, user, {
    action: "agreement.manual_status_updated",
    entityType: "agreement",
    entityId: result.data.id,
    summary: `${values.template_name} · ${status}`,
    before: previous.id ? previous : null,
    after: result.data,
  });

  return { status: 200, payload: { agreement: result.data } };
}
