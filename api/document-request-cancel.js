import { audit, database, readBody, send, signedInUser } from "./_shared/ops-v2-core.js";

const cancellableStatuses = new Set(["requested", "viewed", "overdue"]);

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    if (!user.isAdmin) return send(res, 403, { error: "Admin access required." });
    if (req.method !== "POST") return send(res, 405, { error: "Use POST to cancel a document request." });

    const body = readBody(req);
    if (!body.requestId) return send(res, 400, { error: "Document request ID is required." });

    const db = database();
    const existing = await db.from("document_requests").select("*").eq("id", body.requestId).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) return send(res, 404, { error: "Document request not found." });
    if (!cancellableStatuses.has(existing.data.status)) {
      return send(res, 409, { error: `A ${existing.data.status} document request cannot be cancelled.` });
    }

    const now = new Date().toISOString();
    const updated = await db
      .from("document_requests")
      .update({
        status: "cancelled",
        cancelled_by: user.id,
        cancelled_by_email: user.email || null,
        cancelled_at: now,
        next_reminder_at: null,
        updated_at: now,
      })
      .eq("id", existing.data.id)
      .in("status", [...cancellableStatuses])
      .select()
      .maybeSingle();
    if (updated.error) throw updated.error;
    if (!updated.data) return send(res, 409, { error: "This document request changed before it could be cancelled. Refresh and try again." });

    await audit(db, user, {
      action: "document_request.cancelled",
      entityType: "document_request",
      entityId: updated.data.id,
      summary: updated.data.title,
      before: existing.data,
      after: updated.data,
    });

    return send(res, 200, { request: updated.data });
  } catch (error) {
    console.error("MLS document request cancellation error", error);
    return send(res, 500, { error: error.message || "The document request could not be cancelled." });
  }
}
