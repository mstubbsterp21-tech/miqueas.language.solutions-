import { useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { Loader2, Mail, Send } from "lucide-react";
import { createMLSApi } from "./api";
import { Field, INPUT, cx, formatDate } from "./ui";
import { getPortalTimeZone, timeZoneAbbreviation, zonedDateTimeToUtc } from "./timezones";

const EMPTY = { assignmentId: "", closesAt: "", notes: "", sendEmail: true };

export default function OpportunityEmailForm({ controller }) {
  const { session } = useSession();
  const api = useMemo(() => createMLSApi(session), [session]);
  const {
    opportunityDraft: draft,
    setOpportunityDraft: setDraft,
    app,
    setModal,
    setMessage,
    setError,
    load,
  } = controller;
  const [saving, setSaving] = useState(false);
  const sendEmail = draft.sendEmail !== false;
  const assignments = app?.assignments || [];
  const timeZone = getPortalTimeZone();

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const published = await api.operations("adminPublishOpportunity", "POST", {
        ...draft,
        closesAt: draft.closesAt ? zonedDateTimeToUtc(draft.closesAt, timeZone) : null,
      });
      const opportunityId = published.opportunity?.id;
      let text = "Assignment opportunity published without an email blast.";

      if (sendEmail && opportunityId) {
        const delivery = await api.opportunityEmail("send", "POST", { opportunityId });
        if (delivery.configured === false) {
          text = "Opportunity published. Gmail is not connected, so no emails were sent.";
        } else if (delivery.sent > 0) {
          text = `Opportunity published. ${delivery.sent} email${delivery.sent === 1 ? "" : "s"} sent; ${delivery.suppressed || 0} interpreter${delivery.suppressed === 1 ? "" : "s"} excluded by availability.`;
        } else if ((delivery.suppressed || 0) > 0 && (delivery.eligible || 0) === 0) {
          text = `Opportunity published. No email was sent because all ${delivery.suppressed} active interpreter${delivery.suppressed === 1 ? " was" : "s were"} unavailable or outside saved available windows.`;
        } else {
          text = `Opportunity published, but ${delivery.failed || 0} eligible email${delivery.failed === 1 ? "" : "s"} could not be delivered.`;
        }
      }

      setDraft(EMPTY);
      setModal("");
      setMessage(text);
      window.setTimeout(() => setMessage(""), 6500);
      await load(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field name="Assignment" required>
        <select className={INPUT} required value={draft.assignmentId || ""} onChange={(event) => setDraft({ ...draft, assignmentId: event.target.value })}>
          <option value="">Choose an assignment</option>
          {assignments.filter((assignment) => !["completed", "cancelled"].includes(assignment.status)).map((assignment) => (
            <option key={assignment.id} value={assignment.id}>
              {assignment.clients?.organization_name || assignment.clients?.email} · {assignment.service_type} · {formatDate(assignment.start_at)}
            </option>
          ))}
        </select>
      </Field>
      <Field name={`Closes at · ${timeZoneAbbreviation(timeZone)}`}><input className={INPUT} type="datetime-local" value={draft.closesAt || ""} onChange={(event) => setDraft({ ...draft, closesAt: event.target.value })} /></Field>
      <Field name="Notes"><textarea className={cx(INPUT, "min-h-28")} value={draft.notes || ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></Field>
      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={sendEmail} onChange={(event) => setDraft({ ...draft, sendEmail: event.target.checked })} />
        <span><span className="font-black">Email eligible interpreters now</span><span className="mt-1 block text-xs leading-5 text-slate-500">MLS excludes interpreters whose weekly or one-time unavailable windows overlap the assignment. Interpreters with saved available windows must also match the assignment time.</span></span>
      </label>
      <button type="submit" disabled={saving || !draft.assignmentId} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#721100] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
        {saving ? <Loader2 className="animate-spin" size={16} /> : sendEmail ? <Mail size={16} /> : <Send size={16} />}
        {sendEmail ? "Publish & email" : "Publish opportunity"}
      </button>
    </form>
  );
}
