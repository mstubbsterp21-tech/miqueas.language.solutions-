import { Activity, BarChart3, CircleDollarSign, FileSignature, Landmark, ShieldCheck, Timer, Users } from "lucide-react";
import GmailIntegrationCard from "../GmailIntegrationCard";
import { Badge, Card, EmptyState, Hero, Metric, SectionHeader, formatDate, formatMoney, pretty } from "../ui";
import { LoadingPanel } from "./shared";

export function AdminReportsV2({ workspace, app, v2 }) {
  const assignments = app?.assignments || workspace.admin?.assignments || [];
  const invoices = v2?.invoices || [];
  const times = v2?.timeEntries || [];
  const expenses = v2?.expenses || [];
  const completed = assignments.filter((item) => ["paid", "closed"].includes(item.lifecycle_status));
  const staffed = assignments.filter((item) => (item.assignment_interpreters || []).length >= (item.required_interpreter_count || 1));
  const fillRate = assignments.length ? Math.round((staffed.length / assignments.length) * 100) : 0;
  const revenue = invoices.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const receivable = invoices.reduce((sum, item) => sum + Number(item.balance_due || 0), 0);
  const approvedHours = times.filter((item) => ["approved", "client_verified", "paid"].includes(item.status)).reduce((sum, item) => sum + Number(item.billable_hours || 0), 0);
  const approvedExpenses = expenses.filter((item) => ["approved", "reimbursed", "billed"].includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const metrics = [
    { icon: BarChart3, name: "Fill rate", value: `${fillRate}%`, note: `${staffed.length} of ${assignments.length} assignments staffed` },
    { icon: CircleDollarSign, name: "Paid revenue", value: formatMoney(revenue), note: "Linked Found invoices", color: "#15803d" },
    { icon: Landmark, name: "Receivables", value: formatMoney(receivable), note: "Outstanding Found balances", color: "#c2410c" },
    { icon: Timer, name: "Approved hours", value: approvedHours.toFixed(2), note: "Interpreter billable time", color: "#4338ca" },
    { icon: Activity, name: "Closed work", value: completed.length, note: "Paid or closed assignments", color: "#7c3aed" },
    { icon: Users, name: "Approved expenses", value: formatMoney(approvedExpenses), note: "Travel and assignment costs", color: "#dd7d00" },
  ];

  return (
    <div className="space-y-6">
      <Hero title="Reports" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map((item) => <Metric key={item.name} {...item} />)}</div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card><SectionHeader title="Lifecycle distribution" /><div className="mt-5 space-y-3">{Object.entries(assignments.reduce((counts, item) => ({ ...counts, [item.lifecycle_status || item.status]: (counts[item.lifecycle_status || item.status] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).map(([status, count]) => <div key={status} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span className="font-black text-slate-800">{pretty(status)}</span><span className="text-xl font-black text-[#721100]">{count}</span></div>)}{!assignments.length && <EmptyState icon={BarChart3} title="No reporting data" />}</div></Card>
        <Card><SectionHeader title="Recent activity" /><div className="mt-5 space-y-3">{(v2?.auditEvents || []).slice(0, 12).map((event) => <div key={event.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><p className="font-black text-slate-900">{pretty(event.action)}</p><span className="text-[10px] text-slate-400">{formatDate(event.created_at)}</span></div><p className="mt-1 text-xs text-slate-500">{pretty(event.entity_type)}{event.summary ? ` · ${event.summary}` : ""}</p></div>)}{!(v2?.auditEvents || []).length && <EmptyState icon={Activity} title="No audit events" />}</div></Card>
      </div>
    </div>
  );
}

export function AdminSettingsV2({ v2, loading }) {
  if (loading && !v2) return <LoadingPanel />;
  const settings = new Map((v2?.integrations || []).map((item) => [item.integration_key, item]));
  const cards = [
    {
      key: "found",
      icon: Landmark,
      name: "Found Business Banking",
      description: "Source of truth for client invoices, contractor payments, income, and expense tracking.",
      status: "active",
      note: "Reference and reconciliation mode.",
    },
    {
      key: "boldsign",
      icon: FileSignature,
      name: "BoldSign",
      description: "Source of truth for electronic signatures and executed service agreements.",
      status: "active",
      note: "Manual reference mode.",
    },
    {
      key: "google_drive",
      icon: ShieldCheck,
      name: "Google Drive archive",
      description: "Long-term archive for executed agreements, final invoices, and agency records.",
      status: settings.get("google_drive")?.is_enabled ? "active" : "planned",
      note: "Planned internal archive.",
    },
  ];

  return (
    <div className="space-y-6">
      <Hero title="Settings" />
      <div className="grid gap-5 xl:grid-cols-2">
        <GmailIntegrationCard />
        {cards.map(({ key, icon: Icon, name, description, status, note }) => <Card key={key}><div className="flex items-start justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Icon size={21} /></span><Badge value={status} /></div><h2 className="mt-5 text-xl font-black text-slate-950">{name}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p><p className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">{note}</p></Card>)}
      </div>
      <Card><SectionHeader title="Security" /><div className="mt-5 grid gap-3 md:grid-cols-3">{["Clerk identity and role checks", "Supabase RLS with browser grants revoked", "Audit history for operational changes"].map((item) => <div key={item} className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">✓ {item}</div>)}</div></Card>
    </div>
  );
}
