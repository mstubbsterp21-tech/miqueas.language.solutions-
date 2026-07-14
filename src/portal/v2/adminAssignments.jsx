import { CalendarDays } from "lucide-react";
import { Card, EmptyState, Hero, SectionHeader } from "../ui";
import { ActionButton, AssignmentRow } from "./shared";

const lifecycleStages = [
  "request_received", "needs_review", "quote_sent", "client_approved", "deposit_pending",
  "staffing", "interpreter_invited", "interpreter_accepted", "confirmed", "in_progress",
  "time_submitted", "client_verified", "invoice_sent", "paid", "closed", "cancelled",
];

export default function AdminAssignmentsV2({ workspace, app, v2, actions }) {
  const assignments = app?.assignments || workspace.admin?.assignments || [];
  const quoteByAssignment = new Map((v2?.quotes || []).map((item) => [item.assignment_id, item]));
  const agreementByAssignment = new Map((v2?.agreements || []).map((item) => [item.assignment_id, item]));

  return (
    <div className="space-y-6">
      <Hero eyebrow="Assignment lifecycle" title="One record from request through closeout." text="Open an assignment to manage staffing and details. Quotes, BoldSign agreements, time, Found billing, messages, documents, and feedback remain connected to the same record." actions={<ActionButton tone="gold" onClick={actions.openOpportunity}>Publish opportunity</ActionButton>} />
      <Card>
        <SectionHeader eyebrow="Pipeline" title="Lifecycle stages" text="A request advances through approval, staffing, service delivery, verification, Found invoicing, payment, and closeout." />
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{lifecycleStages.map((status) => <span key={status} className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[.08em] text-slate-600">{status.replaceAll("_", " ")}</span>)}</div>
      </Card>
      <div className="space-y-3">
        {assignments.map((assignment) => {
          const quote = quoteByAssignment.get(assignment.id);
          const agreement = agreementByAssignment.get(assignment.id);
          const staffed = assignment.assignment_interpreters?.length || 0;
          const needed = assignment.required_interpreter_count || 1;
          const detail = `${quote ? `${quote.quote_number} · ${quote.status}` : "Quote not created"} · ${agreement ? `BoldSign ${agreement.status}` : "Agreement not linked"} · ${staffed}/${needed} staffed`;
          return <AssignmentRow key={assignment.id} assignment={assignment} onOpen={actions.openAssignment} detail={detail} />;
        })}
        {!assignments.length && <EmptyState icon={CalendarDays} title="No assignments yet" text="Client requests will appear here." />}
      </div>
    </div>
  );
}
