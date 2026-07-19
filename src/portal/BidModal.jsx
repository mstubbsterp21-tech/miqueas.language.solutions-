import { CalendarDays, ClipboardCheck, Clock3, Languages, Loader2, MapPin, Users } from "lucide-react";
import { Field, INPUT, Modal, cx, formatDate } from "./ui";

export default function BidModal({ controller }) {
  const {
    modal, setModal, bidDraft, setBidDraft, bidOpportunity,
    saving, submitBid,
  } = controller;
  const assignment = bidOpportunity?.assignments || {};
  const duration = assignment.start_at && assignment.end_at
    ? Math.max(0, (new Date(assignment.end_at) - new Date(assignment.start_at)) / 36e5)
    : null;
  const facts = [
    [CalendarDays, "Schedule", assignment.start_at ? `${formatDate(assignment.start_at)}${assignment.end_at ? ` – ${formatDate(assignment.end_at)}` : ""}` : "To be scheduled"],
    [Clock3, "Expected duration", duration ? `${duration.toFixed(duration % 1 ? 1 : 0)} hours` : "Ask MLS"],
    [MapPin, "Delivery / general area", [assignment.delivery_mode, assignment.city, assignment.state].filter(Boolean).join(" · ") || "Ask MLS"],
    [Languages, "Language and setting", [assignment.language_preferences, assignment.specialty].filter(Boolean).join(" · ") || "Ask MLS"],
    [Users, "Participants / team", `${assignment.deaf_participants || 0} Deaf · ${assignment.hearing_participants || 0} hearing${assignment.team_requested ? " · Team requested" : ""}${assignment.cdi_requested ? " · CDI requested" : ""}`],
  ];

  return (
    <Modal
      open={modal === "bid"}
      close={() => setModal("")}
      title="Review opportunity"
      subtitle="Client details remain private until assignment."
    >
      <div className="mb-5 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <p className="text-lg font-black text-slate-950">{assignment.service_type || "Interpreter opportunity"}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{facts.map(([Icon, label, value]) => <div key={label} className="flex min-w-0 gap-3 rounded-2xl bg-white p-3"><Icon size={17} className="mt-0.5 shrink-0 text-[#721100]" /><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-bold leading-5 text-slate-700">{value}</p></div></div>)}</div>
        {bidOpportunity?.notes && <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-900"><b>MLS pre-commitment note:</b> {bidOpportunity.notes}</div>}
      </div>
      <form onSubmit={submitBid} className="space-y-4">
        <Field name="Requested hourly rate">
          <input
            className={INPUT}
            type="number"
            min="0"
            step="0.01"
            value={bidDraft.bidRate}
            onChange={(event) => setBidDraft({ ...bidDraft, bidRate: event.target.value })}
          />
        </Field>
        <Field name="Message to MLS">
          <textarea
            className={cx(INPUT, "min-h-32")}
            value={bidDraft.message}
            onChange={(event) => setBidDraft({ ...bidDraft, message: event.target.value })}
            placeholder="Availability, teaming considerations, travel, or other important context"
          />
        </Field>
        <button
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <ClipboardCheck size={16} />}
          Submit interest to MLS
        </button>
      </form>
    </Modal>
  );
}
