import { useMemo, useState } from "react";
import { AlertCircle, Copy, CircleDollarSign, Clock3, ExternalLink, FileSignature, ReceiptText, UploadCloud, WalletCards } from "lucide-react";
import {
  Badge, Card, EmptyState, Field, Hero, INPUT, Metric, SectionHeader,
  formatDate, formatMoney,
} from "../ui";
import { ActionButton, ExternalRecordLink, SelectField } from "./shared";
import {
  getPortalTimeZone,
  timeZoneAbbreviation,
  timeZoneLabel,
  zonedDateTimeToUtc,
  zonedInputValue,
} from "../timezones";
import { AgencyWorkflowCard } from "../agencyWorkflowExperience";

const emptyQuote = {
  assignmentId: "",
  description: "Interpreting services",
  quantity: 2,
  unitRate: 75,
  depositAmount: 0,
  expiresAt: "",
};

const emptyInvoice = {
  assignmentId: "",
  invoiceNumber: "",
  totalAmount: "",
  foundInvoiceId: "",
  foundInvoiceUrl: "",
  status: "sent",
  dueDate: "",
};

const emptyAgreement = {
  assignmentId: "",
  boldsignDocumentId: "",
  boldsignSigningUrl: "",
  boldsignAuditTrailUrl: "",
  status: "draft",
  sentAt: "",
  signedAt: "",
  expiresAt: "",
  internalNotes: "",
  completedDocumentId: "",
  auditTrailDocumentId: "",
};

const emptyPayment = {
  assignmentInterpreterId: "",
  amount: "",
  status: "scheduled",
  dueDate: "",
  foundPaymentId: "",
  foundPaymentUrl: "",
};

const FINANCE_DASHBOARD_NOW = Date.now();

function FilePicker({ label, file, onChange, existing, onOpen }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#721100]/10 text-[#721100]">
          <UploadCloud size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900">{label}</p>
          <p className="mt-1 break-words text-xs leading-5 text-slate-500">
            {file?.name || (existing ? "A secure file is already attached." : "PDF, Word, PNG, or JPG · 15 MB max")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-xl bg-white px-3 py-2 text-xs font-black text-[#721100] shadow-sm">
              {existing ? "Replace file" : "Choose file"}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(event) => onChange(event.target.files?.[0] || null)}
              />
            </label>
            {existing && (
              <button type="button" onClick={onOpen} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">
                Open attached file
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanceV2({ workspace, app, v2, actions, saving }) {
  const timeZone = getPortalTimeZone(workspace.preferences?.timeZone);
  const zone = timeZoneAbbreviation(timeZone);
  const assignments = useMemo(() => app?.assignments || workspace.admin?.assignments || [], [app?.assignments, workspace.admin?.assignments]);
  const clients = workspace.admin?.clients || [];
  const agreements = v2?.agreements || [];
  const invoices = v2?.invoices || [];

  const [quote, setQuote] = useState(emptyQuote);
  const [invoice, setInvoice] = useState(emptyInvoice);
  const [agreement, setAgreement] = useState(emptyAgreement);
  const [completedFile, setCompletedFile] = useState(null);
  const [auditTrailFile, setAuditTrailFile] = useState(null);
  const [payment, setPayment] = useState(emptyPayment);

  const assignmentOptions = useMemo(() => assignments.map((item) => ({
    value: item.id,
    label: `${item.service_type} · ${formatDate(item.start_at)}`,
  })), [assignments]);

  const staffing = assignments.flatMap((assignment) => (assignment.assignment_interpreters || []).map((link) => ({
    ...link,
    assignment,
  })));
  const staffingOptions = staffing.map((link) => ({
    value: link.id,
    label: `${link.interpreters?.first_name || ""} ${link.interpreters?.last_name || ""} · ${link.assignment.service_type}`.trim(),
  }));

  const selectedAssignment = assignments.find((item) => item.id === agreement.assignmentId) || null;
  const selectedClient = selectedAssignment
    ? clients.find((item) => item.id === selectedAssignment.client_id) || selectedAssignment.clients || null
    : null;
  const receivable = invoices.reduce((sum, item) => sum + Number(item.balance_due || 0), 0);
  const contractorDue = staffing
    .filter((item) => !["paid", "void"].includes(item.contractor_payment_status))
    .reduce((sum, item) => sum + Number(item.contractor_payment_amount || 0), 0);
  const submittedTime = (v2?.timeEntries || []).filter((item) => item.status === "submitted");
  const submittedExpenses = (v2?.expenses || []).filter((item) => item.status === "submitted");
  const overdueInvoices = invoices.filter((item) => item.status === "overdue" || (item.due_date && !["paid", "void", "refunded"].includes(item.status) && new Date(`${item.due_date}T23:59:59`).getTime() < FINANCE_DASHBOARD_NOW));
  const unpaidContractors = staffing.filter((item) => !["paid", "void"].includes(item.contractor_payment_status) && Number(item.contractor_payment_amount || 0) > 0);

  function selectAgreementAssignment(assignmentId) {
    const existing = agreements.find((item) => item.assignment_id === assignmentId);
    setCompletedFile(null);
    setAuditTrailFile(null);
    setAgreement(existing ? {
      assignmentId,
      boldsignDocumentId: existing.boldsign_document_id || "",
      boldsignSigningUrl: existing.boldsign_signing_url || "",
      boldsignAuditTrailUrl: existing.boldsign_audit_trail_url || "",
      status: existing.status || "draft",
      sentAt: zonedInputValue(existing.sent_at, timeZone),
      signedAt: zonedInputValue(existing.signed_at, timeZone),
      expiresAt: zonedInputValue(existing.expires_at, timeZone),
      internalNotes: existing.internal_notes || "",
      completedDocumentId: existing.completed_document_id || "",
      auditTrailDocumentId: existing.audit_trail_document_id || "",
    } : { ...emptyAgreement, assignmentId });
  }

  async function copyText(text, label) {
    await navigator.clipboard.writeText(text);
    window.alert(`${label} copied.`);
  }

  async function saveQuote(event) {
    event.preventDefault();
    await actions.createQuote({
      assignmentId: quote.assignmentId,
      depositAmount: quote.depositAmount,
      expiresAt: quote.expiresAt ? zonedDateTimeToUtc(quote.expiresAt, timeZone) : null,
      items: [{
        itemType: "service",
        description: quote.description,
        quantity: quote.quantity,
        unitRate: quote.unitRate,
      }],
    });
    setQuote(emptyQuote);
  }

  async function saveInvoice(event) {
    event.preventDefault();
    await actions.linkFoundInvoice(invoice);
    setInvoice(emptyInvoice);
  }

  async function saveAgreement(event) {
    event.preventDefault();
    if (!selectedAssignment?.client_id) throw new Error("The selected assignment does not have a client record.");

    let completedDocumentId = agreement.completedDocumentId || null;
    let auditTrailDocumentId = agreement.auditTrailDocumentId || null;

    if (completedFile) {
      const document = await actions.uploadAgreementFile({
        assignmentId: agreement.assignmentId,
        clientId: selectedAssignment.client_id,
        kind: "signed_service_agreement",
        file: completedFile,
      });
      completedDocumentId = document.id;
    }

    if (auditTrailFile) {
      const document = await actions.uploadAgreementFile({
        assignmentId: agreement.assignmentId,
        clientId: selectedAssignment.client_id,
        kind: "boldsign_audit_trail",
        file: auditTrailFile,
      });
      auditTrailDocumentId = document.id;
    }

    await actions.linkBoldSignAgreement({
      ...agreement,
      completedDocumentId,
      auditTrailDocumentId,
      sentAt: agreement.sentAt ? zonedDateTimeToUtc(agreement.sentAt, timeZone) : null,
      signedAt: agreement.signedAt ? zonedDateTimeToUtc(agreement.signedAt, timeZone) : null,
      expiresAt: agreement.expiresAt ? zonedDateTimeToUtc(agreement.expiresAt, timeZone) : null,
    });

    setAgreement(emptyAgreement);
    setCompletedFile(null);
    setAuditTrailFile(null);
  }

  async function savePayment(event) {
    event.preventDefault();
    await actions.linkFoundContractorPayment(payment);
    setPayment(emptyPayment);
  }

  const clientCopy = selectedClient ? [
    selectedClient.organization_name,
    selectedClient.primary_contact_name,
    selectedClient.email,
    selectedClient.phone,
  ].filter(Boolean).join("\n") : "";

  const agreementCopy = selectedAssignment ? [
    `Client: ${selectedClient?.organization_name || selectedClient?.email || "Client"}`,
    `Signer: ${selectedClient?.primary_contact_name || "Not listed"}`,
    `Email: ${selectedClient?.email || "Not listed"}`,
    `Service: ${selectedAssignment.service_type}`,
    `Date: ${formatDate(selectedAssignment.start_at)}`,
    `Assignment ID: ${selectedAssignment.id}`,
  ].join("\n") : "";

  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Authorization and financial closeout"
        title="Billing, Agreements & Contractor Pay"
        text="Prepare client authorization before staffing, verify actual service records after delivery, link the client invoice, collect payment, and track only the contractor payments tied to completed work. Found remains the financial system of record and BoldSign remains the signature system of record."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Clock3} name="Closeout reviews" value={submittedTime.length + submittedExpenses.length} note={`${submittedTime.length} time · ${submittedExpenses.length} expense`} color="#1d4ed8" /><Metric icon={ReceiptText} name="Receivables" value={formatMoney(receivable)} note={`${invoices.filter((item) => Number(item.balance_due || 0) > 0).length} open invoices`} color="#c2410c" /><Metric icon={AlertCircle} name="Overdue invoices" value={overdueInvoices.length} note={overdueInvoices.length ? formatMoney(overdueInvoices.reduce((sum, item) => sum + Number(item.balance_due || 0), 0)) : "Nothing overdue"} color="#be123c" /><Metric icon={WalletCards} name="Contractor pay" value={formatMoney(contractorDue)} note={`${unpaidContractors.length} tracked payments`} color="#15803d" /></div>
      <AgencyWorkflowCard role="admin" currentStage={(submittedTime.length || submittedExpenses.length) ? 4 : (receivable || contractorDue) ? 5 : -1} />
      <Card><SectionHeader title="Financial control queue" text="Complete closeout in order: approve actuals, issue the client invoice, collect payment, prepare contractor pay, and retain the final records." /><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Time to review", submittedTime.length, "Approve service hours before billing."], ["Expenses to review", submittedExpenses.length, "Verify receipts and assignment relevance."], ["Client balances", invoices.filter((item) => Number(item.balance_due || 0) > 0).length, `${formatMoney(receivable)} outstanding.`], ["Contractor payments", unpaidContractors.length, `${formatMoney(contractorDue)} ready, scheduled, or processing.`]].map(([label, count, text]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{count}</p><p className="mt-2 text-xs leading-5 text-slate-500">{text}</p></div>)}</div></Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader eyebrow="Quote builder" title="Prepare client pricing" text="Build the operational quote before sending it to the client." />
          <form onSubmit={saveQuote} className="mt-6 grid gap-4">
            <Field name="Assignment" required>
              <SelectField value={quote.assignmentId} onChange={(event) => setQuote({ ...quote, assignmentId: event.target.value })} options={assignmentOptions} />
            </Field>
            <Field name="Description" required>
              <input className={INPUT} value={quote.description} onChange={(event) => setQuote({ ...quote, description: event.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field name="Hours / units"><input className={INPUT} type="number" step="0.25" value={quote.quantity} onChange={(event) => setQuote({ ...quote, quantity: event.target.value })} /></Field>
              <Field name="Rate"><input className={INPUT} type="number" step="0.01" value={quote.unitRate} onChange={(event) => setQuote({ ...quote, unitRate: event.target.value })} /></Field>
              <Field name="Deposit"><input className={INPUT} type="number" step="0.01" value={quote.depositAmount} onChange={(event) => setQuote({ ...quote, depositAmount: event.target.value })} /></Field>
            </div>
            <Field name={`Expires · ${zone}`} help={timeZoneLabel(timeZone)}><input className={INPUT} type="datetime-local" value={quote.expiresAt} onChange={(event) => setQuote({ ...quote, expiresAt: event.target.value })} /></Field>
            <ActionButton type="submit" disabled={saving || !quote.assignmentId}>Save quote</ActionButton>
          </form>
        </Card>

        <Card>
          <SectionHeader eyebrow="Found" title="Link client invoice" text="Create the invoice in Found, then attach its number and link to the MLS assignment." />
          <form onSubmit={saveInvoice} className="mt-6 grid gap-4">
            <Field name="Assignment" required><SelectField value={invoice.assignmentId} onChange={(event) => setInvoice({ ...invoice, assignmentId: event.target.value })} options={assignmentOptions} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="Found invoice number" required><input className={INPUT} value={invoice.invoiceNumber} onChange={(event) => setInvoice({ ...invoice, invoiceNumber: event.target.value })} /></Field>
              <Field name="Total" required><input className={INPUT} type="number" step="0.01" value={invoice.totalAmount} onChange={(event) => setInvoice({ ...invoice, totalAmount: event.target.value })} /></Field>
            </div>
            <Field name="Found invoice link"><input className={INPUT} type="url" value={invoice.foundInvoiceUrl} onChange={(event) => setInvoice({ ...invoice, foundInvoiceUrl: event.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="Status"><SelectField value={invoice.status} onChange={(event) => setInvoice({ ...invoice, status: event.target.value })} options={["draft", "sent", "partially_paid", "paid", "overdue", "void"]} /></Field>
              <Field name="Due date"><input className={INPUT} type="date" value={invoice.dueDate} onChange={(event) => setInvoice({ ...invoice, dueDate: event.target.value })} /></Field>
            </div>
            <ActionButton type="submit" disabled={saving || !invoice.assignmentId || !invoice.invoiceNumber}>Link Found invoice</ActionButton>
          </form>
        </Card>
      </div>

      <Card>
        <SectionHeader
          eyebrow="Manual BoldSign workflow"
          title="Track the agreement after working in BoldSign"
          text="Open BoldSign in a separate tab, create or send the agreement there, then return here to paste the signing link, update the status, and attach the completed PDF and audit trail. MLS never claims to send or check the agreement automatically."
          action={(
            <a href="https://app.boldsign.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-[#24130e] px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
              Open BoldSign <ExternalLink size={16} />
            </a>
          )}
        />

        <form onSubmit={saveAgreement} className="mt-6 grid gap-5">
          <Field name="Assignment" required>
            <SelectField value={agreement.assignmentId} onChange={(event) => selectAgreementAssignment(event.target.value)} options={assignmentOptions} />
          </Field>

          {selectedAssignment && (
            <div className="rounded-2xl border border-[#dd7d00]/25 bg-[#fff8ed] p-4">
              <p className="text-xs font-black uppercase tracking-[.1em] text-[#721100]">Copy into BoldSign</p>
              <p className="mt-2 text-sm font-black text-slate-900">{selectedClient?.organization_name || selectedClient?.email || "Client"}</p>
              <p className="mt-1 text-xs text-slate-600">{selectedAssignment.service_type} · {formatDate(selectedAssignment.start_at)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton type="button" tone="soft" icon={Copy} onClick={() => copyText(clientCopy, "Client information")}>Copy client information</ActionButton>
                <ActionButton type="button" tone="soft" icon={Copy} onClick={() => copyText(agreementCopy, "Agreement details")}>Copy assignment details</ActionButton>
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Field name="BoldSign document ID"><input className={INPUT} value={agreement.boldsignDocumentId} onChange={(event) => setAgreement({ ...agreement, boldsignDocumentId: event.target.value })} /></Field>
            <Field name="Manual status"><SelectField value={agreement.status} onChange={(event) => setAgreement({ ...agreement, status: event.target.value })} options={["draft", "sent", "viewed", "signed", "declined", "expired", "voided"]} /></Field>
            <Field name="Client signing link"><input className={INPUT} type="url" value={agreement.boldsignSigningUrl} onChange={(event) => setAgreement({ ...agreement, boldsignSigningUrl: event.target.value })} /></Field>
            <Field name="External audit-trail link"><input className={INPUT} type="url" value={agreement.boldsignAuditTrailUrl} onChange={(event) => setAgreement({ ...agreement, boldsignAuditTrailUrl: event.target.value })} /></Field>
            <Field name={`Date sent · ${zone}`}><input className={INPUT} type="datetime-local" value={agreement.sentAt} onChange={(event) => setAgreement({ ...agreement, sentAt: event.target.value })} /></Field>
            <Field name={`Date signed · ${zone}`}><input className={INPUT} type="datetime-local" value={agreement.signedAt} onChange={(event) => setAgreement({ ...agreement, signedAt: event.target.value })} /></Field>
            <Field name={`Expiration date · ${zone}`}><input className={INPUT} type="datetime-local" value={agreement.expiresAt} onChange={(event) => setAgreement({ ...agreement, expiresAt: event.target.value })} /></Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <FilePicker
              label="Completed signed agreement"
              file={completedFile}
              onChange={setCompletedFile}
              existing={Boolean(agreement.completedDocumentId)}
              onOpen={() => actions.openAgreementDocument({ clientId: selectedAssignment?.client_id, documentId: agreement.completedDocumentId })}
            />
            <FilePicker
              label="BoldSign audit trail"
              file={auditTrailFile}
              onChange={setAuditTrailFile}
              existing={Boolean(agreement.auditTrailDocumentId)}
              onOpen={() => actions.openAgreementDocument({ clientId: selectedAssignment?.client_id, documentId: agreement.auditTrailDocumentId })}
            />
          </div>

          <Field name="Internal notes" help="Visible only to MLS administrators.">
            <textarea className={INPUT} rows={4} value={agreement.internalNotes} onChange={(event) => setAgreement({ ...agreement, internalNotes: event.target.value })} />
          </Field>

          <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            Statuses are entered manually by MLS. Uploading the completed agreement or audit trail also places that file in the client’s secure Document Center.
          </div>

          <ActionButton type="submit" disabled={saving || !agreement.assignmentId}>Save manual agreement record</ActionButton>
        </form>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader eyebrow="Found contractor pay" title="Link interpreter payment" text="Schedule or complete the payment in Found, then attach the reference here." />
          <form onSubmit={savePayment} className="mt-6 grid gap-4">
            <Field name="Assignment / interpreter" required><SelectField value={payment.assignmentInterpreterId} onChange={(event) => setPayment({ ...payment, assignmentInterpreterId: event.target.value })} options={staffingOptions} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="Amount" required><input className={INPUT} type="number" step="0.01" value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} /></Field>
              <Field name="Status"><SelectField value={payment.status} onChange={(event) => setPayment({ ...payment, status: event.target.value })} options={["not_ready", "ready", "scheduled", "processing", "paid", "failed", "void"]} /></Field>
            </div>
            <Field name="Found payment link"><input className={INPUT} type="url" value={payment.foundPaymentUrl} onChange={(event) => setPayment({ ...payment, foundPaymentUrl: event.target.value })} /></Field>
            <ActionButton type="submit" disabled={saving || !payment.assignmentInterpreterId}>Link contractor payment</ActionButton>
          </form>
        </Card>

        <Card>
          <SectionHeader eyebrow="Agreements" title="Manual BoldSign register" text={`${agreements.length} agreement records`} />
          <div className="mt-5 space-y-3">
            {agreements.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{item.template_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.clients?.organization_name || item.signer_email}</p>
                    <p className="mt-1 text-[11px] font-bold text-[#721100]">Updated manually by MLS {item.manual_status_updated_at ? `· ${formatDate(item.manual_status_updated_at)}` : ""}</p>
                  </div>
                  <Badge value={item.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <ExternalRecordLink href={item.boldsign_signing_url}>Open signing link</ExternalRecordLink>
                  <ExternalRecordLink href={item.boldsign_audit_trail_url}>External audit link</ExternalRecordLink>
                  {item.completed_document_id && <button type="button" onClick={() => actions.openAgreementDocument({ clientId: item.client_id, documentId: item.completed_document_id })} className="text-xs font-black text-[#721100] hover:underline">Open completed agreement</button>}
                  {item.audit_trail_document_id && <button type="button" onClick={() => actions.openAgreementDocument({ clientId: item.client_id, documentId: item.audit_trail_document_id })} className="text-xs font-black text-[#721100] hover:underline">Open uploaded audit trail</button>}
                  <button type="button" onClick={() => selectAgreementAssignment(item.assignment_id)} className="text-xs font-black text-slate-600 hover:underline">Edit record</button>
                </div>
              </div>
            ))}
            {!agreements.length && <EmptyState icon={FileSignature} title="No manual agreement records" text="Create the agreement in BoldSign, then track it here." />}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader eyebrow="Client billing" title="Found invoice register" text={`${invoices.length} linked invoices`} />
          <div className="mt-5 space-y-3">
            {invoices.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between gap-3">
                  <div><p className="font-black text-slate-950">{item.invoice_number}</p><p className="mt-1 text-xs text-slate-500">{item.clients?.organization_name || item.clients?.email} · Due {item.due_date}</p></div>
                  <Badge value={item.status} />
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div><p className="text-sm font-black">{formatMoney(item.balance_due)} due</p><p className="text-xs text-slate-400">{formatMoney(item.total_amount)} total</p></div>
                  <ExternalRecordLink href={item.found_invoice_url}>Open in Found</ExternalRecordLink>
                </div>
              </div>
            ))}
            {!invoices.length && <EmptyState icon={CircleDollarSign} title="No Found invoices linked" text="Create the invoice in Found, then attach it above." />}
          </div>
        </Card>

        <Card>
          <SectionHeader eyebrow="Review queues" title="Time and expenses" text="Approve contractor submissions before client billing or Found payment preparation." />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              {(v2?.timeEntries || []).filter((item) => item.status === "submitted").map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-black">{item.interpreters?.first_name} {item.interpreters?.last_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.assignments?.service_type} · {item.billable_hours} hours</p>
                  <div className="mt-3 flex gap-2"><ActionButton onClick={() => actions.reviewTime(item.id, "approved")}>Approve</ActionButton><ActionButton tone="danger" onClick={() => actions.reviewTime(item.id, "rejected")}>Reject</ActionButton></div>
                </div>
              ))}
              {!(v2?.timeEntries || []).some((item) => item.status === "submitted") && <p className="text-sm text-slate-500">No time entries waiting.</p>}
            </div>
            <div className="space-y-3">
              {(v2?.expenses || []).filter((item) => item.status === "submitted").map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-black">{item.interpreters?.first_name} {item.interpreters?.last_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.expense_type} · {formatMoney(item.amount)}</p>
                  <div className="mt-3 flex gap-2"><ActionButton onClick={() => actions.reviewExpense(item.id, "approved")}>Approve</ActionButton><ActionButton tone="danger" onClick={() => actions.reviewExpense(item.id, "rejected")}>Reject</ActionButton></div>
                </div>
              ))}
              {!(v2?.expenses || []).some((item) => item.status === "submitted") && <p className="text-sm text-slate-500">No expenses waiting.</p>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
