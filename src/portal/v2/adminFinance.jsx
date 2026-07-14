import { useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, FileSignature, Send, WalletCards } from "lucide-react";
import { Badge, Card, EmptyState, Field, Hero, INPUT, SectionHeader, formatDate, formatMoney } from "../ui";
import { ActionButton, ExternalRecordLink, MoneySummary, SelectField } from "./shared";

const emptyQuote = { assignmentId: "", description: "Interpreting services", quantity: 2, unitRate: 75, depositAmount: 0, expiresAt: "" };
const emptyInvoice = { assignmentId: "", invoiceNumber: "", totalAmount: "", foundInvoiceId: "", foundInvoiceUrl: "", status: "sent", dueDate: "" };
const emptyAgreement = { assignmentId: "", boldsignDocumentId: "", boldsignSigningUrl: "", boldsignAuditTrailUrl: "", status: "sent" };
const emptyPayment = { assignmentInterpreterId: "", amount: "", status: "scheduled", dueDate: "", foundPaymentId: "", foundPaymentUrl: "" };

function AssignmentOptions({ assignments }) {
  return assignments.map((item) => ({ value: item.id, label: `${item.service_type} · ${formatDate(item.start_at)}` }));
}

export default function AdminFinanceV2({ workspace, app, v2, actions, saving }) {
  const assignments = app?.assignments || workspace.admin?.assignments || [];
  const [quote, setQuote] = useState(emptyQuote);
  const [invoice, setInvoice] = useState(emptyInvoice);
  const [agreement, setAgreement] = useState(emptyAgreement);
  const [payment, setPayment] = useState(emptyPayment);
  const assignmentOptions = useMemo(() => AssignmentOptions({ assignments }), [assignments]);
  const staffing = assignments.flatMap((assignment) => (assignment.assignment_interpreters || []).map((link) => ({ ...link, assignment })));
  const staffingOptions = staffing.map((link) => ({ value: link.id, label: `${link.interpreters?.first_name || ""} ${link.interpreters?.last_name || ""} · ${link.assignment.service_type}`.trim() }));
  const invoices = v2?.invoices || [];
  const quotes = v2?.quotes || [];
  const agreements = v2?.agreements || [];
  const receivable = invoices.reduce((sum, item) => sum + Number(item.balance_due || 0), 0);
  const contractorDue = staffing.filter((item) => !["paid", "void"].includes(item.contractor_payment_status)).reduce((sum, item) => sum + Number(item.contractor_payment_amount || 0), 0);

  async function saveQuote(event) {
    event.preventDefault();
    await actions.createQuote({ assignmentId: quote.assignmentId, depositAmount: quote.depositAmount, expiresAt: quote.expiresAt || null, items: [{ itemType: "service", description: quote.description, quantity: quote.quantity, unitRate: quote.unitRate }] });
    setQuote(emptyQuote);
  }

  async function saveInvoice(event) {
    event.preventDefault();
    await actions.linkFoundInvoice(invoice);
    setInvoice(emptyInvoice);
  }

  async function saveAgreement(event) {
    event.preventDefault();
    await actions.linkBoldSignAgreement(agreement);
    setAgreement(emptyAgreement);
  }

  async function savePayment(event) {
    event.preventDefault();
    await actions.linkFoundContractorPayment(payment);
    setPayment(emptyPayment);
  }

  return (
    <div className="space-y-6">
      <Hero eyebrow="Finance" title="MLS workflow connected to Found and BoldSign." text="Create and approve operational records here. Found remains the source of truth for invoices, contractor payments, income, and expenses. BoldSign remains the source of truth for executed agreements." />
      <div className="grid gap-4 md:grid-cols-3"><MoneySummary label="Accounts receivable" value={receivable} note="Open balances linked from Found" /><MoneySummary label="Contractor pay tracked" value={contractorDue} note="Scheduled or ready in Found" /><MoneySummary label="Quoted work" value={quotes.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)} note="Current quote values" /></div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card><SectionHeader eyebrow="Quote builder" title="Prepare client pricing" text="Build the operational quote before sending the client to review it." /><form onSubmit={saveQuote} className="mt-6 grid gap-4"><Field name="Assignment" required><SelectField value={quote.assignmentId} onChange={(event) => setQuote({ ...quote, assignmentId: event.target.value })} options={assignmentOptions} /></Field><Field name="Description" required><input className={INPUT} value={quote.description} onChange={(event) => setQuote({ ...quote, description: event.target.value })} /></Field><div className="grid gap-3 sm:grid-cols-3"><Field name="Hours / units"><input className={INPUT} type="number" step="0.25" value={quote.quantity} onChange={(event) => setQuote({ ...quote, quantity: event.target.value })} /></Field><Field name="Rate"><input className={INPUT} type="number" step="0.01" value={quote.unitRate} onChange={(event) => setQuote({ ...quote, unitRate: event.target.value })} /></Field><Field name="Deposit"><input className={INPUT} type="number" step="0.01" value={quote.depositAmount} onChange={(event) => setQuote({ ...quote, depositAmount: event.target.value })} /></Field></div><Field name="Expires"><input className={INPUT} type="datetime-local" value={quote.expiresAt} onChange={(event) => setQuote({ ...quote, expiresAt: event.target.value })} /></Field><ActionButton type="submit" disabled={saving || !quote.assignmentId}>Save quote</ActionButton></form></Card>
        <Card><SectionHeader eyebrow="Found" title="Link client invoice" text="Create the invoice in Found, then attach its number and link to the MLS assignment." /><form onSubmit={saveInvoice} className="mt-6 grid gap-4"><Field name="Assignment" required><SelectField value={invoice.assignmentId} onChange={(event) => setInvoice({ ...invoice, assignmentId: event.target.value })} options={assignmentOptions} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field name="Found invoice number" required><input className={INPUT} value={invoice.invoiceNumber} onChange={(event) => setInvoice({ ...invoice, invoiceNumber: event.target.value })} /></Field><Field name="Total" required><input className={INPUT} type="number" step="0.01" value={invoice.totalAmount} onChange={(event) => setInvoice({ ...invoice, totalAmount: event.target.value })} /></Field></div><Field name="Found invoice link"><input className={INPUT} type="url" value={invoice.foundInvoiceUrl} onChange={(event) => setInvoice({ ...invoice, foundInvoiceUrl: event.target.value })} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field name="Status"><SelectField value={invoice.status} onChange={(event) => setInvoice({ ...invoice, status: event.target.value })} options={["draft", "sent", "partially_paid", "paid", "overdue", "void"]} /></Field><Field name="Due date"><input className={INPUT} type="date" value={invoice.dueDate} onChange={(event) => setInvoice({ ...invoice, dueDate: event.target.value })} /></Field></div><ActionButton type="submit" disabled={saving || !invoice.assignmentId || !invoice.invoiceNumber}>Link Found invoice</ActionButton></form></Card>
        <Card><SectionHeader eyebrow="BoldSign" title="Link service agreement" text="Attach the BoldSign document and signing status to the assignment." /><form onSubmit={saveAgreement} className="mt-6 grid gap-4"><Field name="Assignment" required><SelectField value={agreement.assignmentId} onChange={(event) => setAgreement({ ...agreement, assignmentId: event.target.value })} options={assignmentOptions} /></Field><Field name="BoldSign document ID"><input className={INPUT} value={agreement.boldsignDocumentId} onChange={(event) => setAgreement({ ...agreement, boldsignDocumentId: event.target.value })} /></Field><Field name="Signing link"><input className={INPUT} type="url" value={agreement.boldsignSigningUrl} onChange={(event) => setAgreement({ ...agreement, boldsignSigningUrl: event.target.value })} /></Field><Field name="Status"><SelectField value={agreement.status} onChange={(event) => setAgreement({ ...agreement, status: event.target.value })} options={["draft", "sent", "signed", "declined", "expired", "void"]} /></Field><ActionButton type="submit" disabled={saving || !agreement.assignmentId}>Link BoldSign agreement</ActionButton></form></Card>
        <Card><SectionHeader eyebrow="Found contractor pay" title="Link interpreter payment" text="Schedule or complete the payment in Found, then attach the reference here." /><form onSubmit={savePayment} className="mt-6 grid gap-4"><Field name="Assignment / interpreter" required><SelectField value={payment.assignmentInterpreterId} onChange={(event) => setPayment({ ...payment, assignmentInterpreterId: event.target.value })} options={staffingOptions} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field name="Amount" required><input className={INPUT} type="number" step="0.01" value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} /></Field><Field name="Status"><SelectField value={payment.status} onChange={(event) => setPayment({ ...payment, status: event.target.value })} options={["not_ready", "ready", "scheduled", "processing", "paid", "failed", "void"]} /></Field></div><Field name="Found payment link"><input className={INPUT} type="url" value={payment.foundPaymentUrl} onChange={(event) => setPayment({ ...payment, foundPaymentUrl: event.target.value })} /></Field><ActionButton type="submit" disabled={saving || !payment.assignmentInterpreterId}>Link contractor payment</ActionButton></form></Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card><SectionHeader eyebrow="Client billing" title="Found invoice register" text={`${invoices.length} linked invoices`} /><div className="mt-5 space-y-3">{invoices.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-black text-slate-950">{item.invoice_number}</p><p className="mt-1 text-xs text-slate-500">{item.clients?.organization_name || item.clients?.email} · Due {item.due_date}</p></div><Badge value={item.status} /></div><div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-sm font-black">{formatMoney(item.balance_due)} due</p><p className="text-xs text-slate-400">{formatMoney(item.total_amount)} total</p></div><ExternalRecordLink href={item.found_invoice_url}>Open in Found</ExternalRecordLink></div></div>)}{!invoices.length && <EmptyState icon={CircleDollarSign} title="No Found invoices linked" text="Create the invoice in Found, then attach it above." />}</div></Card>
        <Card><SectionHeader eyebrow="Agreements" title="BoldSign register" text={`${agreements.length} linked agreements`} /><div className="mt-5 space-y-3">{agreements.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-black text-slate-950">{item.template_name}</p><p className="mt-1 text-xs text-slate-500">{item.clients?.organization_name || item.signer_email}</p></div><Badge value={item.status} /></div><div className="mt-3 flex flex-wrap gap-4"><ExternalRecordLink href={item.boldsign_signing_url}>Open signing record</ExternalRecordLink><ExternalRecordLink href={item.boldsign_audit_trail_url}>Audit trail</ExternalRecordLink></div></div>)}{!agreements.length && <EmptyState icon={FileSignature} title="No BoldSign agreements linked" text="Send the agreement in BoldSign, then attach it above." />}</div></Card>
      </div>
      <Card><SectionHeader eyebrow="Review queues" title="Time and expenses" text="Approve contractor submissions before you invoice the client or schedule payment in Found." /><div className="mt-5 grid gap-4 xl:grid-cols-2"><div className="space-y-3">{(v2?.timeEntries || []).filter((item) => item.status === "submitted").map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><p className="font-black">{item.interpreters?.first_name} {item.interpreters?.last_name}</p><p className="mt-1 text-xs text-slate-500">{item.assignments?.service_type} · {item.billable_hours} hours</p><div className="mt-3 flex gap-2"><ActionButton onClick={() => actions.reviewTime(item.id, "approved")}>Approve</ActionButton><ActionButton tone="danger" onClick={() => actions.reviewTime(item.id, "rejected")}>Reject</ActionButton></div></div>)}{!(v2?.timeEntries || []).some((item) => item.status === "submitted") && <p className="text-sm text-slate-500">No time entries waiting.</p>}</div><div className="space-y-3">{(v2?.expenses || []).filter((item) => item.status === "submitted").map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><p className="font-black">{item.interpreters?.first_name} {item.interpreters?.last_name}</p><p className="mt-1 text-xs text-slate-500">{item.expense_type} · {formatMoney(item.amount)}</p><div className="mt-3 flex gap-2"><ActionButton onClick={() => actions.reviewExpense(item.id, "approved")}>Approve</ActionButton><ActionButton tone="danger" onClick={() => actions.reviewExpense(item.id, "rejected")}>Reject</ActionButton></div></div>)}{!(v2?.expenses || []).some((item) => item.status === "submitted") && <p className="text-sm text-slate-500">No expenses waiting.</p>}</div></div></Card>
    </div>
  );
}
