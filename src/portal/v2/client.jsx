import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileSignature,
  Filter,
  MessageSquare,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import CommunicationsCenter from "../CommunicationsCenter";
import {
  ClientAssignmentCard,
  assignmentIsUpcoming,
  clientStatusMeta,
} from "../clientServiceExperience";
import { Badge, Card, EmptyState, Hero, INPUT, Metric, SectionHeader, cx, formatDate, formatMoney } from "../ui";
import { ActionButton, ExternalRecordLink, LoadingPanel, MoneySummary } from "./shared";

const CLIENT_VIEW_NOW = Date.now();

function assignmentsFor(workspace, app) {
  return app?.assignments || workspace.client?.assignments || [];
}

function messageMLS(actions) {
  actions.go("communications");
}

function ClientHome({ workspace, app, v2, actions }) {
  const profile = workspace.client?.profile || {};
  const assignments = assignmentsFor(workspace, app);
  const upcoming = assignments.filter(assignmentIsUpcoming).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const quotes = v2?.quotes || [];
  const invoices = v2?.invoices || [];
  const agreements = v2?.agreements || [];
  const due = invoices.reduce((sum, item) => sum + Number(item.balance_due || 0), 0);
  const actionsWaiting = quotes.filter((item) => item.status === "sent").length + agreements.filter((item) => ["sent", "viewed"].includes(item.status)).length;

  return <div className="space-y-6">
    <Hero title={profile.organization_name ? `Welcome, ${profile.organization_name}` : "Your interpreting service hub"} actions={<><ActionButton tone="gold" icon={Plus} onClick={actions.openRequest}>Request interpreter</ActionButton><ActionButton tone="soft" icon={MessageSquare} onClick={() => messageMLS(actions)}>Message MLS</ActionButton></>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={ClipboardCheck} name="Needs your action" value={actionsWaiting} note="Quotes and agreements" color="#be123c" onClick={() => actions.go("requests")} /><Metric icon={CalendarDays} name="Upcoming services" value={upcoming.length} note={upcoming[0] ? `Next: ${formatDate(upcoming[0].start_at, { month: "short", day: "numeric", year: undefined, hour: undefined, minute: undefined, timeZoneName: undefined })}` : "Nothing scheduled"} onClick={() => actions.go("assignments")} /><Metric icon={Building2} name="Active requests" value={assignments.filter((item) => !["closed", "paid", "cancelled"].includes(clientStatusMeta(item).key)).length} note="From intake through service" color="#4338ca" onClick={() => actions.go("requests")} /><Metric icon={CircleDollarSign} name="Balance due" value={formatMoney(due)} note={`${invoices.filter((item) => Number(item.balance_due || 0) > 0).length} open invoice${invoices.filter((item) => Number(item.balance_due || 0) > 0).length === 1 ? "" : "s"}`} color="#c2410c" onClick={() => actions.go("billing")} /></div>
    {upcoming[0] && <section><SectionHeader title="Your next service" /><div className="mt-4"><ClientAssignmentCard assignment={upcoming[0]} onOpen={actions.openAssignment} onRepeat={actions.openRepeatRequest} onMessage={() => messageMLS(actions)} /></div></section>}
  </div>;
}

function QuoteCard({ quote, actions, saving }) {
  const waiting = quote.status === "sent";
  const expires = quote.expires_at ? formatDate(quote.expires_at, { hour: undefined, minute: undefined, timeZoneName: undefined }) : "No expiration listed";
  return <div className={cx("rounded-2xl border p-4 sm:p-5", waiting ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-slate-50") }>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><ReceiptText size={19} /></span><div><p className="font-black text-slate-950">Quote {quote.quote_number}</p><p className="mt-1 text-xs leading-5 text-slate-500">{quote.assignments?.service_type || "Interpreter service"} · {formatDate(quote.assignments?.start_at)}</p><p className="mt-1 text-xs text-slate-400">Valid through {expires}</p></div></div><Badge value={quote.status} /></div>
    <div className="mt-4 space-y-2 rounded-2xl bg-white/80 p-4">{(quote.quote_items || []).map((item) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm"><span className="text-slate-600">{item.description} · {item.quantity} × {formatMoney(item.unit_rate)}</span><b>{formatMoney(item.amount)}</b></div>)}{!(quote.quote_items || []).length && <p className="text-sm text-slate-500">The quoted service total is shown below.</p>}<div className="flex items-end justify-between gap-3 border-t border-slate-200 pt-3"><div><p className="text-xs text-slate-400">Quoted total</p><p className="text-2xl font-black text-slate-950">{formatMoney(quote.total_amount)}</p></div>{Number(quote.deposit_amount || 0) > 0 && <div className="text-right"><p className="text-xs text-slate-400">Deposit</p><p className="font-black text-[#721100]">{formatMoney(quote.deposit_amount)}</p></div>}</div></div>
    {quote.client_note && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-600"><b>MLS note:</b> {quote.client_note}</p>}
    {waiting && <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap"><ActionButton disabled={saving} onClick={() => actions.respondQuote(quote.id, "approved")}>Approve quote</ActionButton><ActionButton disabled={saving} tone="soft" onClick={() => { const note = window.prompt("What should MLS change?"); if (note) actions.respondQuote(quote.id, "changes_requested", note); }}>Request changes</ActionButton><ActionButton disabled={saving} tone="danger" onClick={() => actions.respondQuote(quote.id, "rejected")}>Decline</ActionButton></div>}
  </div>;
}

function AgreementCard({ agreement, actions }) {
  const waiting = ["sent", "viewed"].includes(agreement.status);
  return <div className={cx("rounded-2xl border p-4 sm:p-5", waiting ? "border-violet-200 bg-violet-50/60" : "border-slate-200 bg-slate-50") }><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><FileSignature size={19} /></span><div><p className="font-black text-slate-950">{agreement.template_name || "Service agreement"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{agreement.assignments?.service_type || "Interpreter service"} · {formatDate(agreement.assignments?.start_at)}</p>{agreement.signed_at && <p className="mt-1 text-xs text-emerald-700">Signed {formatDate(agreement.signed_at)}</p>}</div></div><Badge value={agreement.status} /></div><div className="mt-4 flex flex-wrap gap-3">{waiting && <ExternalRecordLink href={agreement.boldsign_signing_url}>Review and sign</ExternalRecordLink>}{agreement.status === "draft" && agreement.boldsign_signing_url && <ExternalRecordLink href={agreement.boldsign_signing_url}>Open agreement</ExternalRecordLink>}{agreement.completed_document_id && <button type="button" onClick={() => actions.openAgreementDocument({ clientId: agreement.client_id, documentId: agreement.completed_document_id })} className="text-xs font-black text-[#721100] hover:underline">Completed agreement</button>}{agreement.audit_trail_document_id && <button type="button" onClick={() => actions.openAgreementDocument({ clientId: agreement.client_id, documentId: agreement.audit_trail_document_id })} className="text-xs font-black text-[#721100] hover:underline">Audit trail</button>}{!agreement.audit_trail_document_id && agreement.boldsign_audit_trail_url && <ExternalRecordLink href={agreement.boldsign_audit_trail_url}>Audit trail</ExternalRecordLink>}</div></div>;
}

function ClientRequests({ workspace, app, v2, actions, saving }) {
  const assignments = assignmentsFor(workspace, app);
  const quotes = v2?.quotes || [];
  const agreements = v2?.agreements || [];
  const waitingQuotes = quotes.filter((item) => item.status === "sent");
  const waitingAgreements = agreements.filter((item) => ["sent", "viewed"].includes(item.status));
  const [query, setQuery] = useState("");
  const [view, setView] = useState("active");
  const filtered = useMemo(() => assignments.filter((item) => {
    const meta = clientStatusMeta(item);
    const search = [item.service_type, item.delivery_mode, item.location_name, item.city, item.state, item.client_reference, item.purchase_order_number, meta.label].filter(Boolean).join(" ").toLowerCase();
    const matchesQuery = search.includes(query.trim().toLowerCase());
    if (!matchesQuery) return false;
    if (view === "active") return !["closed", "paid", "cancelled"].includes(meta.key);
    if (view === "completed") return ["closed", "paid"].includes(meta.key);
    if (view === "cancelled") return meta.key === "cancelled";
    return true;
  }).sort((a, b) => new Date(b.created_at || b.start_at) - new Date(a.created_at || a.start_at)), [assignments, query, view]);

  return <div className="space-y-6">
    <Hero title="Requests" actions={<><ActionButton tone="gold" icon={Plus} onClick={actions.openRequest}>New request</ActionButton><ActionButton tone="soft" icon={MessageSquare} onClick={() => messageMLS(actions)}>Message MLS</ActionButton></>} />
    <div className="grid gap-4 sm:grid-cols-3"><Metric icon={AlertCircle} name="Quotes to review" value={waitingQuotes.length} note="Approve or request changes" color="#1d4ed8" /><Metric icon={FileSignature} name="Agreements to sign" value={waitingAgreements.length} note="Terms waiting for signature" color="#6d28d9" /><Metric icon={ClipboardCheck} name="Active requests" value={assignments.filter((item) => !["closed", "paid", "cancelled"].includes(clientStatusMeta(item).key)).length} note="Intake through service" color="#721100" /></div>
    {(waitingQuotes.length > 0 || waitingAgreements.length > 0) && <Card><SectionHeader title="Waiting for you" /><div className="mt-5 grid gap-5 xl:grid-cols-2"><div className="space-y-4">{waitingQuotes.map((item) => <QuoteCard key={item.id} quote={item} actions={actions} saving={saving} />)}</div><div className="space-y-4">{waitingAgreements.map((item) => <AgreementCard key={item.id} agreement={item} actions={actions} />)}</div></div></Card>}
    <Card>
      <SectionHeader title="Request tracker" />
      <div className="mt-5 flex flex-col gap-3 lg:flex-row"><label className="flex min-h-11 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4"><Search size={17} className="text-[#dd7d00]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search service, location, PO, or reference" className="w-full bg-transparent text-sm font-bold outline-none" /></label><div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5"><Filter size={15} className="ml-2 shrink-0 text-slate-400" />{[["active", "Active"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["all", "All"]].map(([value, label]) => <button key={value} type="button" onClick={() => setView(value)} className={cx("min-h-9 whitespace-nowrap rounded-xl px-3 text-xs font-black", view === value ? "bg-[#721100] text-white" : "text-slate-500")}>{label}</button>)}</div></div>
      <div className="mt-5 space-y-4">{filtered.map((item) => <ClientAssignmentCard key={item.id} assignment={item} onOpen={actions.openAssignment} onRepeat={actions.openRepeatRequest} onMessage={() => messageMLS(actions)} />)}{!filtered.length && <EmptyState icon={Search} title="No requests match" action={<ActionButton icon={Plus} onClick={actions.openRequest}>New request</ActionButton>} />}</div>
    </Card>
    {(quotes.length > waitingQuotes.length || agreements.length > waitingAgreements.length) && <Card><SectionHeader title="Approval history" /><div className="mt-5 grid gap-5 xl:grid-cols-2"><div className="space-y-4">{quotes.filter((item) => item.status !== "sent").map((item) => <QuoteCard key={item.id} quote={item} actions={actions} saving={saving} />)}{!quotes.filter((item) => item.status !== "sent").length && <EmptyState icon={ReceiptText} title="No quote history" />}</div><div className="space-y-4">{agreements.filter((item) => !["sent", "viewed"].includes(item.status)).map((item) => <AgreementCard key={item.id} agreement={item} actions={actions} />)}{!agreements.filter((item) => !["sent", "viewed"].includes(item.status)).length && <EmptyState icon={FileSignature} title="No agreement history" />}</div></div></Card>}
  </div>;
}

function ClientAssignments({ workspace, app, actions }) {
  const assignments = assignmentsFor(workspace, app);
  const [view, setView] = useState("upcoming");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => assignments.filter((item) => {
    const meta = clientStatusMeta(item);
    const matches = [item.service_type, item.delivery_mode, item.location_name, item.city, item.state, meta.label].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase());
    if (!matches) return false;
    if (view === "upcoming") return assignmentIsUpcoming(item);
    if (view === "active") return !["closed", "paid", "cancelled"].includes(meta.key);
    if (view === "history") return ["closed", "paid", "cancelled"].includes(meta.key) || new Date(item.start_at).getTime() < CLIENT_VIEW_NOW;
    return true;
  }).sort((a, b) => view === "history" ? new Date(b.start_at) - new Date(a.start_at) : new Date(a.start_at) - new Date(b.start_at)), [assignments, query, view]);
  return <div className="space-y-6"><Hero title="Services" actions={<><ActionButton tone="gold" icon={Plus} onClick={actions.openRequest}>New request</ActionButton><ActionButton tone="soft" icon={MessageSquare} onClick={() => messageMLS(actions)}>Message MLS</ActionButton></>} /><Card><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><SectionHeader title="Service schedule" /><div className="flex flex-col gap-2 sm:flex-row"><input className={cx(INPUT, "sm:w-72")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services" /><div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">{[["upcoming", "Upcoming"], ["active", "Active"], ["history", "History"], ["all", "All"]].map(([value, label]) => <button key={value} type="button" onClick={() => setView(value)} className={cx("min-h-9 rounded-xl px-3 text-xs font-black", view === value ? "bg-[#721100] text-white" : "text-slate-500")}>{label}</button>)}</div></div></div><div className="mt-6 space-y-4">{visible.map((item) => <ClientAssignmentCard key={item.id} assignment={item} onOpen={actions.openAssignment} onRepeat={actions.openRepeatRequest} onMessage={() => messageMLS(actions)} />)}{!visible.length && <EmptyState icon={CalendarDays} title="No services in this view" action={<ActionButton icon={Plus} onClick={actions.openRequest}>Request interpreter</ActionButton>} />}</div></Card></div>;
}

function invoiceTiming(item) {
  if (["paid", "void", "refunded"].includes(item.status)) return item.status === "paid" ? "Paid in full" : "No payment due";
  const due = new Date(`${item.due_date}T23:59:59`).getTime();
  if (!Number.isFinite(due)) return "Due date not listed";
  const days = Math.ceil((due - CLIENT_VIEW_NOW) / 864e5);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
}

function ClientBilling({ v2, actions }) {
  const invoices = v2?.invoices || [];
  const open = invoices.filter((item) => Number(item.balance_due || 0) > 0 && !["void", "refunded"].includes(item.status));
  const due = open.reduce((sum, item) => sum + Number(item.balance_due || 0), 0);
  const overdue = open.filter((item) => item.status === "overdue" || (item.due_date && new Date(`${item.due_date}T23:59:59`).getTime() < CLIENT_VIEW_NOW));
  const paid = invoices.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
  return <div className="space-y-6"><Hero title="Billing" actions={<ActionButton tone="soft" icon={MessageSquare} onClick={() => messageMLS(actions)}>Billing question</ActionButton>} /><div className="grid gap-4 sm:grid-cols-3"><Metric icon={WalletCards} name="Balance due" value={formatMoney(due)} note={`${open.length} open invoice${open.length === 1 ? "" : "s"}`} color="#c2410c" /><Metric icon={Clock3} name="Overdue" value={overdue.length} note={overdue.length ? `${formatMoney(overdue.reduce((sum, item) => sum + Number(item.balance_due || 0), 0))} past due` : "Nothing past due"} color="#be123c" /><Metric icon={CheckCircle2} name="Payments recorded" value={formatMoney(paid)} note="Across portal invoices" color="#15803d" /></div><Card><SectionHeader title={`Invoices (${invoices.length})`} /><div className="mt-5 space-y-4">{invoices.map((item) => <div key={item.id} className={cx("rounded-2xl border p-4 sm:p-5", Number(item.balance_due || 0) > 0 ? "border-orange-200 bg-orange-50/50" : "border-slate-200 bg-slate-50")}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", Number(item.balance_due || 0) > 0 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700")}><ReceiptText size={19} /></span><div><p className="font-black text-slate-950">Invoice {item.invoice_number}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.assignments?.service_type || "Interpreter service"} · {formatDate(item.assignments?.start_at)}</p><p className={cx("mt-1 text-xs font-bold", invoiceTiming(item).includes("overdue") ? "text-rose-700" : "text-slate-500")}>{invoiceTiming(item)} · Due {item.due_date || "—"}</p></div></div><Badge value={item.status} /></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><MoneySummary label="Invoice total" value={item.total_amount} /><MoneySummary label="Paid" value={item.amount_paid} /><MoneySummary label="Balance" value={item.balance_due} /></div>{item.memo && <p className="mt-4 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-600"><b>Memo:</b> {item.memo}</p>}<div className="mt-4 flex flex-wrap items-center gap-4"><ExternalRecordLink href={item.payment_link || item.found_invoice_url}>{item.payment_link ? "Open payment link" : "Open in Found"}</ExternalRecordLink>{item.assignments?.lifecycle_status && <Badge value={item.assignments.lifecycle_status} />}</div></div>)}{!invoices.length && <EmptyState icon={ShieldCheck} title="No invoices" />}</div></Card></div>;
}

export default function ClientV2Workspace({ section, workspace, app, v2, loading, saving, actions }) {
  if (loading && !v2) return <LoadingPanel />;
  if (section === "home") return <ClientHome workspace={workspace} app={app} v2={v2} actions={actions} />;
  if (section === "requests") return <ClientRequests workspace={workspace} app={app} v2={v2} actions={actions} saving={saving} />;
  if (section === "assignments") return <ClientAssignments workspace={workspace} app={app} actions={actions} />;
  if (section === "communications") return <CommunicationsCenter workspace={workspace} onRefresh={actions.refreshPortal} />;
  if (section === "billing") return <ClientBilling v2={v2} actions={actions} />;
  return null;
}
