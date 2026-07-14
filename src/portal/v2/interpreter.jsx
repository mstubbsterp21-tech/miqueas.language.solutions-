import { useMemo, useState } from "react";
import { CalendarDays, CircleDollarSign, ClipboardCheck, Clock3, MapPin, Plus, Receipt, ShieldCheck } from "lucide-react";
import { Badge, Card, EmptyState, Field, Hero, INPUT, Metric, SectionHeader, formatDate, formatMoney } from "../ui";
import { ActionButton, AssignmentRow, LoadingPanel, SelectField } from "./shared";

const emptyTime = { assignmentId: "", actualStartAt: "", actualEndAt: "", breakMinutes: 0, notes: "" };
const emptyExpense = { assignmentId: "", expenseType: "mileage", amount: "", mileage: "", description: "" };
const emptyAvailability = { startAt: "", endAt: "", availabilityType: "available", notes: "" };

function Home({ workspace, operations, app, v2, actions }) {
  const profile = workspace.interpreter?.profile || {};
  const assignments = app?.assignments || [];
  const payments = v2?.payments || [];
  const credentials = v2?.credentials || [];
  const upcoming = assignments.filter((item) => new Date(item.start_at).getTime() >= Date.now() && !["cancelled", "closed"].includes(item.lifecycle_status));
  const unpaid = payments.filter((item) => !["paid", "void"].includes(item.contractor_payment_status));
  const expiring = credentials.filter((item) => item.expires_on && new Date(item.expires_on).getTime() <= Date.now() + 60 * 864e5);
  return (
    <div className="space-y-6">
      <Hero eyebrow="Interpreter workspace" title={`${profile.first_name || "Interpreter"}, keep your MLS work assignment-ready.`} text="Assigned work, opportunities, availability, time, expenses, documents, learning, compliance, and Found payment references live in one consistent workspace." actions={<ActionButton tone="gold" onClick={() => actions.go("work")}>Open work center</ActionButton>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={CalendarDays} name="Upcoming" value={upcoming.length} note="Scheduled assignments" /><Metric icon={ClipboardCheck} name="Opportunities" value={(operations?.opportunities || []).length} note="Open for bidding" color="#dd7d00" /><Metric icon={CircleDollarSign} name="Payments" value={unpaid.length} note="Ready, scheduled, or processing" color="#15803d" /><Metric icon={ShieldCheck} name="Expiring" value={expiring.length} note="Credentials within 60 days" color="#c2410c" /></div>
      <Card><SectionHeader eyebrow="Next up" title="Upcoming assignments" text="Open an assignment for preparation, location, messages, time, and expense submission." /><div className="mt-5 space-y-3">{upcoming.slice(0, 6).map((item) => <AssignmentRow key={item.id} assignment={item} onOpen={actions.openAssignment} />)}{!upcoming.length && <EmptyState icon={CalendarDays} title="No upcoming assignments" text="Accepted bids and direct assignments will appear here." />}</div></Card>
    </div>
  );
}

function Work({ workspace, operations, app, v2, actions, saving }) {
  const assignments = app?.assignments || [];
  const [time, setTime] = useState(emptyTime);
  const [expense, setExpense] = useState(emptyExpense);
  const assignmentOptions = useMemo(() => assignments.map((item) => ({ value: item.id, label: `${item.service_type} · ${formatDate(item.start_at)}` })), [assignments]);

  async function submitTime(event) { event.preventDefault(); await actions.submitTime(time); setTime(emptyTime); }
  async function submitExpense(event) { event.preventDefault(); await actions.submitExpense(expense); setExpense(emptyExpense); }

  return (
    <div className="space-y-6">
      <Hero eyebrow="Work center" title="Assigned work, bids, time, expenses, and pay status." text="Complete the operational parts of an assignment here. Found remains the payment system; MLS displays the linked status and record." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card><SectionHeader eyebrow="Timekeeping" title="Submit actual time" text="MLS uses the recorded start and end time for client billing review and contractor payment preparation." /><form onSubmit={submitTime} className="mt-6 grid gap-4"><Field name="Assignment" required><SelectField value={time.assignmentId} onChange={(event) => setTime({ ...time, assignmentId: event.target.value })} options={assignmentOptions} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field name="Actual start" required><input className={INPUT} type="datetime-local" value={time.actualStartAt} onChange={(event) => setTime({ ...time, actualStartAt: event.target.value })} /></Field><Field name="Actual end" required><input className={INPUT} type="datetime-local" value={time.actualEndAt} onChange={(event) => setTime({ ...time, actualEndAt: event.target.value })} /></Field></div><Field name="Break minutes"><input className={INPUT} type="number" min="0" value={time.breakMinutes} onChange={(event) => setTime({ ...time, breakMinutes: event.target.value })} /></Field><Field name="Notes"><textarea className={INPUT} rows={3} value={time.notes} onChange={(event) => setTime({ ...time, notes: event.target.value })} /></Field><ActionButton type="submit" disabled={saving || !time.assignmentId || !time.actualStartAt || !time.actualEndAt}>Submit time</ActionButton></form></Card>
        <Card><SectionHeader eyebrow="Expenses" title="Submit assignment expense" text="Mileage, parking, tolls, lodging, airfare, and approved costs can be reviewed before reimbursement or client billing." /><form onSubmit={submitExpense} className="mt-6 grid gap-4"><Field name="Assignment" required><SelectField value={expense.assignmentId} onChange={(event) => setExpense({ ...expense, assignmentId: event.target.value })} options={assignmentOptions} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field name="Expense type"><SelectField value={expense.expenseType} onChange={(event) => setExpense({ ...expense, expenseType: event.target.value })} options={["mileage", "parking", "toll", "airfare", "lodging", "per_diem", "rideshare", "supplies", "other"]} /></Field><Field name="Amount"><input className={INPUT} type="number" step="0.01" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} /></Field></div>{expense.expenseType === "mileage" && <Field name="Miles"><input className={INPUT} type="number" step="0.1" value={expense.mileage} onChange={(event) => setExpense({ ...expense, mileage: event.target.value })} /></Field>}<Field name="Description"><textarea className={INPUT} rows={3} value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} /></Field><ActionButton type="submit" disabled={saving || !expense.assignmentId}>Submit expense</ActionButton></form></Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card><SectionHeader eyebrow="Submitted" title="Time entries" text="Admin review and client verification status." /><div className="mt-5 space-y-3">{(v2?.timeEntries || []).map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{item.assignments?.service_type}</p><p className="mt-1 text-xs text-slate-500">{item.billable_hours} hours · {formatDate(item.actual_start_at)}</p></div><Badge value={item.status} /></div></div>)}{!(v2?.timeEntries || []).length && <EmptyState icon={Clock3} title="No time submitted" text="Completed assignment time will appear here." />}</div></Card>
        <Card><SectionHeader eyebrow="Found payment tracking" title="Contractor payments" text="These are references to the payment status maintained in Found." /><div className="mt-5 space-y-3">{(v2?.payments || []).map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{item.assignments?.service_type}</p><p className="mt-1 text-xs text-slate-500">{formatMoney(item.contractor_payment_amount)} · Due {item.contractor_payment_due_date || "not set"}</p></div><Badge value={item.contractor_payment_status} /></div>{item.found_payment_url && <a href={item.found_payment_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-black text-[#721100] hover:underline">Open payment record in Found</a>}</div>)}{!(v2?.payments || []).length && <EmptyState icon={CircleDollarSign} title="No payment records" text="Found payment references appear after admin prepares contractor payment." />}</div></Card>
      </div>
      <Card><SectionHeader eyebrow="Marketplace" title="Recommended opportunities" text="Review open assignments and submit a bid to MLS." /><div className="mt-5 grid gap-3 lg:grid-cols-2">{(operations?.opportunities || []).map((opportunity) => <div key={opportunity.id} className="rounded-2xl bg-slate-50 p-5"><div className="flex justify-between gap-3"><div><p className="font-black">{opportunity.assignments?.service_type}</p><p className="mt-1 text-xs text-slate-500">{formatDate(opportunity.assignments?.start_at)} · {opportunity.assignments?.delivery_mode}</p></div><Badge value={opportunity.status} /></div><div className="mt-4"><ActionButton onClick={() => actions.submitBid(opportunity)}>Bid for assignment</ActionButton></div></div>)}{!(operations?.opportunities || []).length && <EmptyState icon={ClipboardCheck} title="No open opportunities" text="Recommended work will appear here." />}</div></Card>
    </div>
  );
}

function Schedule({ app, v2, actions, saving }) {
  const assignments = app?.assignments || [];
  const [draft, setDraft] = useState(emptyAvailability);
  async function save(event) { event.preventDefault(); await actions.saveAvailability(draft); setDraft(emptyAvailability); }
  return (
    <div className="space-y-6">
      <Hero eyebrow="Schedule and availability" title="Tell MLS when you can work and see what is booked." text="Availability records support future matching and conflict checks. Assigned work remains visible beside your open windows." />
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card><SectionHeader eyebrow="Availability" title="Add time window" text="Add available, preferred, unavailable, or tentative periods." /><form onSubmit={save} className="mt-6 grid gap-4"><Field name="Start" required><input className={INPUT} type="datetime-local" value={draft.startAt} onChange={(event) => setDraft({ ...draft, startAt: event.target.value })} /></Field><Field name="End" required><input className={INPUT} type="datetime-local" value={draft.endAt} onChange={(event) => setDraft({ ...draft, endAt: event.target.value })} /></Field><Field name="Type"><SelectField value={draft.availabilityType} onChange={(event) => setDraft({ ...draft, availabilityType: event.target.value })} options={["available", "preferred", "unavailable", "tentative"]} /></Field><Field name="Notes"><textarea className={INPUT} rows={3} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></Field><ActionButton type="submit" disabled={saving || !draft.startAt || !draft.endAt}>Save availability</ActionButton></form></Card>
        <Card><SectionHeader eyebrow="Calendar" title="Availability and assignments" text="Your upcoming work and declared availability." /><div className="mt-5 space-y-3">{(v2?.availability || []).map((item) => <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#721100]/10 text-[#721100]"><MapPin size={17} /></span><div className="min-w-0 flex-1"><p className="font-black">{formatDate(item.start_at)} – {formatDate(item.end_at)}</p><p className="mt-1 text-xs text-slate-500">{item.notes || "No notes"}</p></div><div className="flex flex-col items-end gap-2"><Badge value={item.availability_type} /><button type="button" onClick={() => actions.deleteAvailability(item.id)} className="text-xs font-black text-rose-600">Remove</button></div></div>)}{assignments.map((item) => <AssignmentRow key={item.id} assignment={item} onOpen={actions.openAssignment} />)}{!(v2?.availability || []).length && !assignments.length && <EmptyState icon={CalendarDays} title="Schedule is empty" text="Add availability or accept an assignment." />}</div></Card>
      </div>
    </div>
  );
}

export default function InterpreterV2Workspace({ section, workspace, operations, app, v2, loading, saving, actions }) {
  if (loading && !v2) return <LoadingPanel />;
  if (section === "home") return <Home workspace={workspace} operations={operations} app={app} v2={v2} actions={actions} />;
  if (section === "work") return <Work workspace={workspace} operations={operations} app={app} v2={v2} actions={actions} saving={saving} />;
  if (section === "schedule") return <Schedule app={app} v2={v2} actions={actions} saving={saving} />;
  return null;
}
