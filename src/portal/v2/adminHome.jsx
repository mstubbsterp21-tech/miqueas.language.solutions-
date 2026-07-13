import { Building2, CircleDollarSign, ClipboardCheck, ShieldCheck, Users } from "lucide-react";
import { Card, Hero, Metric, SectionHeader } from "../ui";
import { ActionButton, AssignmentRow, WorkflowList } from "./shared";

export default function AdminHomeV2({ workspace, app, v2, actions }) {
  const clients = workspace.admin?.clients || [];
  const interpreters = (workspace.admin?.interpreters || []).filter((item) => item.roster_status !== "removed");
  const assignments = app?.assignments || workspace.admin?.assignments || [];
  const invoices = v2?.invoices || [];
  const credentials = v2?.credentials || [];
  const expiryWindow = Date.now() + 60 * 864e5;
  const active = assignments.filter((item) => !["closed", "paid", "cancelled"].includes(item.lifecycle_status));
  const pendingTimes = (v2?.timeEntries || []).filter((item) => item.status === "submitted");
  const pendingExpenses = (v2?.expenses || []).filter((item) => item.status === "submitted");
  const onboarding = (v2?.onboarding || []).filter((item) => !["completed", "declined"].includes(item.status));

  const metrics = [
    { icon: ClipboardCheck, name: "Open work", value: active.length, note: "Active assignment records" },
    { icon: Users, name: "Interpreters", value: interpreters.length, note: "Visible roster", color: "#dd7d00" },
    { icon: Building2, name: "Clients", value: clients.length, note: "Client accounts", color: "#4338ca" },
    { icon: CircleDollarSign, name: "Receivables", value: invoices.filter((item) => !["paid", "void", "refunded"].includes(item.status)).length, note: "Found invoices needing attention", color: "#c2410c" },
    { icon: ShieldCheck, name: "Expiring", value: credentials.filter((item) => item.expires_on && new Date(item.expires_on).getTime() <= expiryWindow).length, note: "Credentials within 60 days", color: "#7c3aed" },
  ];

  return (
    <div className="space-y-6">
      <Hero eyebrow="MLS command center" title="Run the full agency workflow from one place." text="Requests, staffing, client approval, BoldSign agreements, Found records, contractor work, compliance, and quality stay attached to the people and assignments they belong to." actions={<><ActionButton tone="gold" onClick={() => actions.go("assignments")}>Open pipeline</ActionButton><ActionButton tone="soft" onClick={actions.openInvite}>Invite user</ActionButton></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((item) => <Metric key={item.name} {...item} />)}</div>
      <div className="grid gap-5 xl:grid-cols-2">
        <WorkflowList eyebrow="Needs action" title="Assignment pipeline" text="Requests and active jobs that have not reached a closed state." items={active.slice(0, 7)} emptyTitle="Pipeline is clear" emptyText="New requests will appear here." renderItem={(assignment) => <AssignmentRow key={assignment.id} assignment={assignment} onOpen={actions.openAssignment} detail={`${assignment.quote_status?.replaceAll("_", " ") || "No quote"} · ${assignment.agreement_status?.replaceAll("_", " ") || "No agreement"}`} />} />
        <Card>
          <SectionHeader eyebrow="Operations queue" title="What needs review" text="Handle these before they turn into exceptions." />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Time entries", pendingTimes.length, "finance"],
              ["Expenses", pendingExpenses.length, "finance"],
              ["Onboarding files", onboarding.length, "compliance"],
              ["Unlinked Found invoices", invoices.filter((item) => item.sync_status === "needs_review").length, "finance"],
            ].map(([label, count, section]) => <button key={label} type="button" onClick={() => actions.go(section)} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-[#dd7d00]/40 hover:bg-white hover:shadow-lg"><p className="text-xs font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{count}</p><p className="mt-2 text-xs font-bold text-[#721100]">Review queue →</p></button>)}
          </div>
        </Card>
      </div>
    </div>
  );
}
