import { Building2, CalendarDays, CircleDollarSign, ClipboardCheck, FileSignature, Plus } from "lucide-react";
import CommunicationsCenter from "../CommunicationsCenter";
import { Badge, Card, EmptyState, Hero, Metric, SectionHeader, formatDate, formatMoney } from "../ui";
import { ActionButton, AssignmentRow, ExternalRecordLink, LoadingPanel } from "./shared";

function ClientHome({ workspace, app, v2, actions }) {
  const profile = workspace.client?.profile || {};
  const assignments = app?.assignments || workspace.client?.assignments || [];
  const quotes = v2?.quotes || [];
  const invoices = v2?.invoices || [];
  const agreements = v2?.agreements || [];
  const due = invoices.reduce((sum, item) => sum + Number(item.balance_due || 0), 0);
  const agreementsWaiting = agreements.filter((item) => ["sent", "viewed"].includes(item.status)).length;

  return (
    <div className="space-y-6">
      <Hero title={`Welcome${profile.organization_name ? `, ${profile.organization_name}` : ""}.`} text="Request interpreters, review approvals, and track assignments." actions={<ActionButton tone="gold" icon={Plus} onClick={actions.openRequest}>Request interpreter</ActionButton>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={ClipboardCheck} name="Open requests" value={assignments.filter((item) => !["closed", "paid", "cancelled"].includes(item.lifecycle_status)).length} /><Metric icon={FileSignature} name="Quotes to review" value={quotes.filter((item) => item.status === "sent").length} color="#dd7d00" /><Metric icon={Building2} name="Agreements to sign" value={agreementsWaiting} color="#4338ca" /><Metric icon={CircleDollarSign} name="Balance due" value={formatMoney(due)} color="#c2410c" /></div>
      <Card><SectionHeader title="Assignments" text="Your most recent requests." /><div className="mt-5 space-y-3">{assignments.slice(0, 6).map((item) => <AssignmentRow key={item.id} assignment={item} onOpen={actions.openAssignment} />)}{!assignments.length && <EmptyState icon={CalendarDays} title="No assignments yet" text="Submit a request to get started." />}</div></Card>
    </div>
  );
}

function ClientRequests({ v2, actions, saving }) {
  const quotes = v2?.quotes || [];
  const agreements = v2?.agreements || [];

  return (
    <div className="space-y-6">
      <Hero title="Requests and approvals" text="Review quotes and agreements connected to your requests." actions={<ActionButton tone="gold" icon={Plus} onClick={actions.openRequest}>New request</ActionButton>} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader title="Quotes" text="Approve, request changes, or decline." />
          <div className="mt-5 space-y-4">
            {quotes.map((quote) => <div key={quote.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"><div className="flex justify-between gap-3"><div className="min-w-0"><p className="font-black text-slate-950">{quote.quote_number}</p><p className="mt-1 text-xs text-slate-500">{quote.assignments?.service_type} · {formatDate(quote.assignments?.start_at)}</p></div><Badge value={quote.status} /></div><div className="mt-4 space-y-2">{(quote.quote_items || []).map((item) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm"><span>{item.description} · {item.quantity} × {formatMoney(item.unit_rate)}</span><b>{formatMoney(item.amount)}</b></div>)}</div><div className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs text-slate-400">Total</p><p className="text-2xl font-black">{formatMoney(quote.total_amount)}</p>{Number(quote.deposit_amount || 0) > 0 && <p className="mt-1 text-xs text-slate-500">Deposit: {formatMoney(quote.deposit_amount)}</p>}</div>{quote.status === "sent" && <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end"><ActionButton disabled={saving} onClick={() => actions.respondQuote(quote.id, "approved")}>Approve</ActionButton><ActionButton disabled={saving} tone="soft" onClick={() => actions.respondQuote(quote.id, "changes_requested", window.prompt("What should MLS change?") || "Changes requested")}>Request changes</ActionButton><ActionButton disabled={saving} tone="danger" onClick={() => actions.respondQuote(quote.id, "rejected")}>Decline</ActionButton></div>}</div></div>)}
            {!quotes.length && <EmptyState icon={ClipboardCheck} title="No quotes" text="Quotes appear after MLS reviews a request." />}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Agreements" text="Open or review the agreement connected to each assignment." />
          <div className="mt-5 space-y-4">
            {agreements.map((item) => {
              const waitingForSignature = ["sent", "viewed"].includes(item.status);
              return <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex justify-between gap-3"><div><p className="font-black text-slate-950">{item.template_name}</p><p className="mt-1 text-xs text-slate-500">{item.assignments?.service_type} · {formatDate(item.assignments?.start_at)}</p>{item.signed_at && <p className="mt-1 text-xs text-slate-500">Signed {formatDate(item.signed_at)}</p>}</div><Badge value={item.status} /></div><div className="mt-4 flex flex-wrap gap-3">{waitingForSignature && <ExternalRecordLink href={item.boldsign_signing_url}>Open to sign</ExternalRecordLink>}{item.status === "draft" && item.boldsign_signing_url && <ExternalRecordLink href={item.boldsign_signing_url}>Open agreement</ExternalRecordLink>}{item.completed_document_id && <button type="button" onClick={() => actions.openAgreementDocument({ clientId: item.client_id, documentId: item.completed_document_id })} className="text-xs font-black text-[#721100] hover:underline">Completed agreement</button>}{item.audit_trail_document_id && <button type="button" onClick={() => actions.openAgreementDocument({ clientId: item.client_id, documentId: item.audit_trail_document_id })} className="text-xs font-black text-[#721100] hover:underline">Audit trail</button>}{!item.audit_trail_document_id && item.boldsign_audit_trail_url && <ExternalRecordLink href={item.boldsign_audit_trail_url}>Audit trail</ExternalRecordLink>}</div></div>;
            })}
            {!agreements.length && <EmptyState icon={FileSignature} title="No agreements" text="Agreements appear after MLS prepares them." />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ClientAssignments({ workspace, app, actions }) {
  const assignments = app?.assignments || workspace.client?.assignments || [];
  return <div className="space-y-6"><Hero title="Assignments" text="Open an assignment for details, preparation, messages, and billing." actions={<ActionButton tone="gold" icon={Plus} onClick={actions.openRequest}>New request</ActionButton>} /><div className="space-y-3">{assignments.map((item) => <AssignmentRow key={item.id} assignment={item} onOpen={actions.openAssignment} />)}{!assignments.length && <EmptyState icon={CalendarDays} title="No assignments" text="New requests will appear here." />}</div></div>;
}

function ClientBilling({ v2 }) {
  const invoices = v2?.invoices || [];
  return <div className="space-y-6"><Hero title="Billing" text="Review invoices and payment history." /><Card><SectionHeader title="Invoices" text={`${invoices.length} record${invoices.length === 1 ? "" : "s"}`} /><div className="mt-5 space-y-4">{invoices.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-5"><div className="flex justify-between gap-3"><div><p className="font-black text-slate-950">{item.invoice_number}</p><p className="mt-1 text-xs text-slate-500">{item.assignments?.service_type} · Due {item.due_date}</p></div><Badge value={item.status} /></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-400">Total</p><p className="font-black">{formatMoney(item.total_amount)}</p></div><div><p className="text-xs text-slate-400">Paid</p><p className="font-black">{formatMoney(item.amount_paid)}</p></div><div><p className="text-xs text-slate-400">Balance</p><p className="font-black text-[#721100]">{formatMoney(item.balance_due)}</p></div></div><div className="mt-4"><ExternalRecordLink href={item.found_invoice_url}>Open in Found</ExternalRecordLink></div></div>)}{!invoices.length && <EmptyState icon={CircleDollarSign} title="No invoices" text="Invoices will appear here when available." />}</div></Card></div>;
}

export default function ClientV2Workspace({ section, workspace, app, v2, loading, saving, actions }) {
  if (loading && !v2) return <LoadingPanel />;
  if (section === "home") return <ClientHome workspace={workspace} app={app} v2={v2} actions={actions} />;
  if (section === "requests") return <ClientRequests v2={v2} actions={actions} saving={saving} />;
  if (section === "assignments") return <ClientAssignments workspace={workspace} app={app} actions={actions} />;
  if (section === "communications") return <CommunicationsCenter workspace={workspace} onRefresh={actions.refreshPortal} />;
  if (section === "billing") return <ClientBilling v2={v2} />;
  return null;
}
