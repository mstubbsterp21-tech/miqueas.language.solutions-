import { CalendarDays } from "lucide-react";
import { NewAssignmentControl } from "../AssignmentAdminControls";
import { Card, EmptyState, Hero, SectionHeader } from "../ui";
import { ActionButton, AssignmentRow } from "./shared";

const lifecycleStages = [
  "request_received", "needs_review", "quote_sent", "client_approved", "deposit_pending",
  "staffing", "interpreter_invited", "interpreter_accepted", "confirmed", "in_progress",
  "time_submitted", "client_verified", "invoice_sent", "paid", "closed", "cancelled",
];

const closedLifecycle = new Set(["closed", "cancelled"]);
const closedStatus = new Set(["completed", "cancelled"]);

function assignmentDetail(assignment, quote, agreement) {
  const staffed = assignment.assignment_interpreters?.length || 0;
  const needed = assignment.required_interpreter_count || 1;
  const calendar = assignment.calendar_sync_status === "synced" ? "Calendar synced" : "Calendar pending";
  const drive = assignment.drive_sync_status === "synced" ? "Drive ready" : "Drive pending";
  return `${quote ? `${quote.quote_number} · ${quote.status}` : "Quote not created"} · ${agreement ? `BoldSign ${agreement.status}` : "Agreement not linked"} · ${staffed}/${needed} staffed · ${calendar} · ${drive}`;
}

export default function AdminAssignmentsV2({ workspace, app, v2, actions }) {
  const assignments = app?.assignments || workspace.admin?.assignments || [];
  const clients = workspace.admin?.clients || [];
  const quoteByAssignment = new Map((v2?.quotes || []).map((item) => [item.assignment_id, item]));
  const agreementByAssignment = new Map((v2?.agreements || []).map((item) => [item.assignment_id, item]));
  const openAssignments = assignments.filter((assignment) => !closedLifecycle.has(assignment.lifecycle_status) && !closedStatus.has(assignment.status));
  const closedAssignments = assignments.filter((assignment) => !openAssignments.includes(assignment));

  function rows(items) {
    return items.map((assignment) => (
      <AssignmentRow
        key={assignment.id}
        assignment={assignment}
        onOpen={actions.openAssignment}
        detail={assignmentDetail(assignment, quoteByAssignment.get(assignment.id), agreementByAssignment.get(assignment.id))}
      />
    ));
  }

  return (
    <div className="space-y-6">
      <Hero eyebrow="Assignment lifecycle" title="Open Assignments" text="Create, edit, staff, sync, cancel, close, or safely delete assignments from one workspace." actions={<div className="flex flex-wrap gap-3"><NewAssignmentControl clients={clients} actions={actions} /><ActionButton tone="soft" onClick={actions.openOpportunity}>Publish opportunity</ActionButton></div>} />
      <Card>
        <SectionHeader eyebrow="Pipeline" title="Lifecycle stages" text="A request advances through approval, staffing, service delivery, verification, invoicing, payment, and closeout." />
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{lifecycleStages.map((status) => <span key={status} className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[.08em] text-slate-600">{status.replaceAll("_", " ")}</span>)}</div>
      </Card>
      <div className="space-y-3">
        {rows(openAssignments)}
        {!openAssignments.length && <EmptyState icon={CalendarDays} title="No open assignments" text="Create an assignment or wait for a client request." />}
      </div>
      {closedAssignments.length > 0 && (
        <Card>
          <SectionHeader eyebrow="Archive" title="Closed and cancelled assignments" text="Completed records stay available without crowding the active pipeline." />
          <div className="mt-5 space-y-3">{rows(closedAssignments)}</div>
        </Card>
      )}
    </div>
  );
}
