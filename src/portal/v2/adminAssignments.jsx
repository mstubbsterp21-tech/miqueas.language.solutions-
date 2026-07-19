import { useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, Filter, Search, Users } from "lucide-react";
import { NewAssignmentControl } from "../AssignmentAdminControls";
import { AdminOperationsCard, adminAssignmentMeta, recordsForAssignment } from "../agencyWorkflowExperience";
import { Card, EmptyState, Hero, Metric, SectionHeader, cx } from "../ui";
import { ActionButton } from "./shared";

const FILTERS = [
  ["action", "Needs action"],
  ["authorization", "Authorization"],
  ["staffing", "Staffing"],
  ["service", "Service"],
  ["closeout", "Closeout"],
  ["archive", "Archive"],
  ["all", "All"],
];

const ADMIN_ASSIGNMENTS_NOW = Date.now();

function filterStage(meta, value) {
  if (value === "all") return true;
  if (value === "action") return meta.stage !== 3 && meta.title !== "Archived";
  if (value === "authorization") return meta.stage <= 1;
  if (value === "staffing") return meta.stage === 2;
  if (value === "service") return meta.stage === 3;
  if (value === "closeout") return meta.stage >= 4 && meta.title !== "Archived";
  if (value === "archive") return meta.title === "Archived";
  return true;
}

export default function AdminAssignmentsV2({ workspace, app, v2, actions }) {
  const assignments = useMemo(() => app?.assignments || workspace.admin?.assignments || [], [app?.assignments, workspace.admin?.assignments]);
  const clients = workspace.admin?.clients || [];
  const [view, setView] = useState("action");
  const [query, setQuery] = useState("");
  const prepared = useMemo(() => assignments.map((assignment) => {
    const records = recordsForAssignment(v2, assignment.id);
    return { assignment, records, meta: adminAssignmentMeta(assignment, records) };
  }), [assignments, v2]);
  const visible = useMemo(() => prepared.filter(({ assignment, meta }) => {
    const haystack = [assignment.service_type, assignment.clients?.organization_name, assignment.clients?.primary_contact_name, assignment.delivery_mode, assignment.city, assignment.state, assignment.lifecycle_status, meta.title].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && filterStage(meta, view);
  }).sort((a, b) => {
    if (view === "archive") return new Date(b.assignment.start_at) - new Date(a.assignment.start_at);
    const actionSort = a.meta.stage - b.meta.stage;
    return actionSort || new Date(a.assignment.start_at) - new Date(b.assignment.start_at);
  }), [prepared, query, view]);
  const needsAction = prepared.filter(({ meta }) => filterStage(meta, "action")).length;
  const unstaffed = prepared.filter(({ meta }) => meta.stage === 2).length;
  const closeout = prepared.filter(({ meta }) => meta.stage >= 4 && meta.title !== "Archived").length;
  const upcoming = assignments.filter((item) => new Date(item.start_at).getTime() >= ADMIN_ASSIGNMENTS_NOW && !["cancelled", "closed"].includes(item.lifecycle_status)).length;

  return <div className="space-y-6">
    <Hero title="Operations" actions={<div className="flex flex-wrap gap-3"><NewAssignmentControl clients={clients} actions={actions} /><ActionButton tone="soft" onClick={actions.openOpportunity}>Publish opportunity</ActionButton></div>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={AlertCircle} name="Needs action" value={needsAction} note="Operational handoffs" color="#be123c" /><Metric icon={Users} name="Need staffing" value={unstaffed} note="Incomplete service teams" color="#7c3aed" /><Metric icon={CalendarDays} name="Upcoming service" value={upcoming} note="Active future assignments" color="#1d4ed8" /><Metric icon={CheckCircle2} name="Closeout queue" value={closeout} note="Time, invoice, or payment" color="#c2410c" /></div>
    <Card><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><SectionHeader title="Service queue" /><div className="flex min-w-0 flex-col gap-2 lg:flex-row"><label className="flex min-h-11 min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 lg:w-72"><Search size={16} className="shrink-0 text-[#dd7d00]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client or service" className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" /></label><div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5"><Filter size={15} className="ml-2 shrink-0 text-slate-400" />{FILTERS.map(([value, label]) => <button key={value} type="button" onClick={() => setView(value)} className={cx("min-h-9 whitespace-nowrap rounded-xl px-3 text-xs font-black", view === value ? "bg-[#721100] text-white" : "text-slate-500")}>{label}</button>)}</div></div></div><div className="mt-6 space-y-4">{visible.map(({ assignment, records }) => <AdminOperationsCard key={assignment.id} assignment={assignment} records={records} onOpen={actions.openAssignment} />)}{!visible.length && <EmptyState icon={Search} title="No services match" />}</div></Card>
  </div>;
}
