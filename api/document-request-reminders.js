import { database, send } from "./_shared/ops-v2-core.js";
import { getEmailConfiguration } from "./_shared/document-request-email.js";
import { deliver } from "./document-request-email.js";

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && req.headers.authorization === `Bearer ${secret}`);
}

export default async function handler(req, res) {
  try {
    if (!authorized(req)) return send(res, 401, { error: "Cron authorization failed." });
    if (!getEmailConfiguration().configured) {
      return send(res, 200, { configured: false, processed: 0, message: "SMTP delivery is not configured." });
    }

    const db = database();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const pending = await db
      .from("document_requests")
      .select("id,due_date,status,next_reminder_at")
      .in("status", ["requested", "viewed", "overdue"])
      .not("next_reminder_at", "is", null)
      .lte("next_reminder_at", now.toISOString())
      .order("next_reminder_at", { ascending: true })
      .limit(50);
    if (pending.error) throw pending.error;

    const systemUser = { id: "vercel-cron", metadataRole: "system", isAdmin: true };
    const results = [];
    for (const request of pending.data || []) {
      const overdue = Boolean(request.due_date && request.due_date < today);
      if (overdue && request.status !== "overdue") {
        const statusUpdate = await db.from("document_requests").update({ status: "overdue", updated_at: now.toISOString() }).eq("id", request.id);
        if (statusUpdate.error) throw statusUpdate.error;
      }
      const result = await deliver(db, systemUser, request.id, overdue ? "overdue_reminder" : "due_reminder");
      results.push({ requestId: request.id, status: result.payload?.emailStatus || "failed", overdue });
    }

    return send(res, 200, {
      configured: true,
      processed: results.length,
      sent: results.filter((item) => item.status === "sent").length,
      results,
    });
  } catch (error) {
    console.error("MLS document request reminder error", error);
    return send(res, 500, { error: error.message || "Document request reminders failed." });
  }
}
