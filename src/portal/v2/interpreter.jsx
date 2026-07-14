import { useMemo, useState } from "react";
import { Ban, CalendarDays, Check, CircleDollarSign, ClipboardCheck, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { Badge, Card, EmptyState, Field, Hero, INPUT, Metric, SectionHeader, cx, formatDate, formatMoney } from "../ui";
import { ActionButton, AssignmentRow, LoadingPanel, SelectField } from "./shared";

const emptyTime = { assignmentId: "", actualStartAt: "", actualEndAt: "", breakMinutes: 0, notes: "" };
const emptyExpense = { assignmentId: "", expenseType: "mileage", amount: "", mileage: "", description: "" };
const emptyUnavailable = { startAt: "", endAt: "", availabilityType: "unavailable", notes: "" };
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const BY_DAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const BLOCKS = [
  { key: "overnight", label: "Overnight", helper: "12 AM–6 AM", start: [0, 0], end: [6, 0] },
  { key: "morning", label: "Morning", helper: "6 AM–12 PM", start: [6, 0], end: [12, 0] },
  { key: "afternoon", label: "Afternoon", helper: "12 PM–6 PM", start: [12, 0], end: [18, 0] },
  { key: "evening", label: "Evening", helper: "6 PM–12 AM", start: [18, 0], end: [23, 59] },
];

function weeklyRule(item) {
  return String(item?.recurrence_rule || "").includes("X-MLS-BLOCK=");
}

function parseWeekly(records, profile) {
  const grid = {};
  records.filter(weeklyRule).forEach((item) => {
    const day = BY_DAY.findIndex((value) => String(item.recurrence_rule).includes(`BYDAY=${value}`));
    const block = BLOCKS.find((value) => String(item.recurrence_rule).includes(`X-MLS-BLOCK=${value.key}`));
    if (day >= 0 && block) grid[`${day}:${block.key}`] = item.availability_type;
  });
  if (Object.keys(grid).length) return grid;
  DAYS.forEach((day, weekday) => {
    const value = String(profile?.[`availability_${day.toLowerCase()}`] || "");
    BLOCKS.forEach((block) => {
      const blockMentioned = value.toLowerCase().includes(block.label.toLowerCase());
      if (value.toLowerCase().includes(`unavailable: ${block.label.toLowerCase()}`) || value.trim().toLowerCase() === "unavailable") grid[`${weekday}:${block.key}`] = "unavailable";
      else if (blockMentioned) grid[`${weekday}:${block.key}`] = "available";
    });
  });
  return grid;
}

function occurrence(weekday, block) {
  const start = new Date();
  const delta = (weekday - start.getDay() + 7) % 7;
  start.setDate(start.getDate() + delta);
  start.setHours(block.start[0], block.start[1], 0, 0);
  const end = new Date(start);
  end.setHours(block.end[0], block.end[1], 0, 0);
  if (end.getTime() <= Date.now()) {
    start.setDate(start.getDate() + 7);
    end.setDate(end.getDate() + 7);
  }
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

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

function Work({ operations, app, v2, actions, saving }) {
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

function Schedule({ workspace, app, v2, actions, saving }) {
  const assignments = app?.assignments || [];
  const profile = workspace.interpreter?.profile || {};
  const availability = v2?.availability || [];
  const [weekly, setWeekly] = useState(() => parseWeekly(availability, profile));
  const [unavailable, setUnavailable] = useState(emptyUnavailable);
  const timeZone = profile.availability_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  const oneTime = availability.filter((item) => !weeklyRule(item));

  function choose(weekday, block, type) {
    const key = `${weekday}:${block}`;
    setWeekly((current) => ({ ...current, [key]: current[key] === type ? "" : type }));
  }

  async function saveWeekly() {
    const windows = [];
    DAYS.forEach((_, weekday) => BLOCKS.forEach((block) => {
      const availabilityType = weekly[`${weekday}:${block.key}`];
      if (!availabilityType) return;
      windows.push({ weekday, byDay: BY_DAY[weekday], block: block.key, availabilityType, ...occurrence(weekday, block) });
    }));
    await actions.saveWeeklyAvailability({ timeZone, windows });
  }

  async function saveUnavailable(event) {
    event.preventDefault();
    await actions.saveAvailability(unavailable);
    setUnavailable(emptyUnavailable);
  }

  return (
    <div className="space-y-6">
      <Hero eyebrow="Schedule and availability" title="Tell MLS when you can work and when you cannot." text="Weekly available windows improve matching. Weekly or one-time unavailable windows prevent opportunity email blasts when the assignment overlaps that time." />
      <Card>
        <SectionHeader eyebrow="Weekly schedule" title="Select your regular available and unavailable windows." text={`Times are saved in ${timeZone}. Choose Available, Unavailable, or leave a window blank.`} />
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Unavailable takes priority.</strong> MLS will not email you a new assignment opportunity that overlaps an unavailable window. The opportunity can still remain visible in your Work center.</div>
        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[980px] space-y-3">
            <div className="grid grid-cols-[150px_repeat(4,minmax(180px,1fr))] gap-3"> <div />{BLOCKS.map((block) => <div key={block.key} className="rounded-2xl bg-slate-100 p-3 text-center"><p className="text-sm font-black text-slate-900">{block.label}</p><p className="text-xs text-slate-500">{block.helper}</p></div>)}</div>
            {DAYS.map((day, weekday) => <div key={day} className="grid grid-cols-[150px_repeat(4,minmax(180px,1fr))] gap-3"><div className="flex items-center rounded-2xl bg-[#721100] px-4 font-black text-white">{day}</div>{BLOCKS.map((block) => { const selected = weekly[`${weekday}:${block.key}`]; return <div key={block.key} className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2"><button type="button" onClick={() => choose(weekday, block.key, "available")} className={cx("rounded-xl px-2 py-2 text-xs font-black transition", selected === "available" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100")}><Check size={13} className="mr-1 inline" />Available</button><button type="button" onClick={() => choose(weekday, block.key, "unavailable")} className={cx("rounded-xl px-2 py-2 text-xs font-black transition", selected === "unavailable" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-800 hover:bg-rose-100")}><Ban size={13} className="mr-1 inline" />Unavailable</button></div>; })}</div>)}
          </div>
        </div>
        <div className="mt-6 flex justify-end"><ActionButton onClick={saveWeekly} disabled={saving}>Save weekly schedule</ActionButton></div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card><SectionHeader eyebrow="Time off / conflicts" title="Add one-time unavailable period" text="Use this for appointments, travel, vacation, or any specific dates when you do not want opportunity emails." /><form onSubmit={saveUnavailable} className="mt-6 grid gap-4"><Field name="Start" required><input className={INPUT} type="datetime-local" value={unavailable.startAt} onChange={(event) => setUnavailable({ ...unavailable, startAt: event.target.value })} /></Field><Field name="End" required><input className={INPUT} type="datetime-local" value={unavailable.endAt} onChange={(event) => setUnavailable({ ...unavailable, endAt: event.target.value })} /></Field><Field name="Notes"><textarea className={INPUT} rows={3} value={unavailable.notes} onChange={(event) => setUnavailable({ ...unavailable, notes: event.target.value })} /></Field><ActionButton type="submit" disabled={saving || !unavailable.startAt || !unavailable.endAt}>Save unavailable period</ActionButton></form></Card>
        <Card><SectionHeader eyebrow="Calendar" title="Unavailable periods and assignments" text="Remove an unavailable period when it no longer applies." /><div className="mt-5 space-y-3">{oneTime.map((item) => <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><MapPin size={17} /></span><div className="min-w-0 flex-1"><p className="font-black">{formatDate(item.start_at)} – {formatDate(item.end_at)}</p><p className="mt-1 text-xs text-slate-500">{item.notes || "No notes"}</p></div><div className="flex flex-col items-end gap-2"><Badge value={item.availability_type} /><button type="button" onClick={() => actions.deleteAvailability(item.id)} className="text-xs font-black text-rose-600">Remove</button></div></div>)}{assignments.map((item) => <AssignmentRow key={item.id} assignment={item} onOpen={actions.openAssignment} />)}{!oneTime.length && !assignments.length && <EmptyState icon={CalendarDays} title="Schedule is empty" text="Save weekly availability, add time off, or accept an assignment." />}</div></Card>
      </div>
    </div>
  );
}

export default function InterpreterV2Workspace({ section, workspace, operations, app, v2, loading, saving, actions }) {
  if (loading && !v2) return <LoadingPanel />;
  if (section === "home") return <Home workspace={workspace} operations={operations} app={app} v2={v2} actions={actions} />;
  if (section === "work") return <Work operations={operations} app={app} v2={v2} actions={actions} saving={saving} />;
  if (section === "schedule") return <Schedule workspace={workspace} app={app} v2={v2} actions={actions} saving={saving} />;
  return null;
}
