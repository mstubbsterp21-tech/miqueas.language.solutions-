import { useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { AlertCircle, Ban, CalendarDays, Check, CheckCircle2, CircleDollarSign, ClipboardCheck, Clock3, List, MapPin, Pencil, ShieldCheck, WalletCards, X } from "lucide-react";
import { Badge, Card, EmptyState, Field, Hero, INPUT, Metric, SectionHeader, cx, formatDate, formatMoney } from "../ui";
import { ActionButton, AssignmentRow, LoadingPanel, SelectField } from "./shared";
import { getPortalTimeZone, timeZoneAbbreviation, timeZoneLabel, zonedDateTimeToUtc, zonedInputValue } from "../timezones";
import AssignmentDocumentCenter from "../AssignmentDocumentCenter";
import { createPortalSupabaseClient } from "../../lib/supabaseClient";
import { createMLSApi } from "../api";
import { InterpreterWorkCard, recordsForAssignment } from "../agencyWorkflowExperience";

const emptyTime = { assignmentId: "", actualStartAt: "", actualEndAt: "", breakMinutes: 0, notes: "" };
const emptyExpense = { assignmentId: "", expenseType: "mileage", amount: "", mileage: "", description: "", receipt: null };
const emptyUnavailable = { startAt: "", endAt: "", availabilityType: "unavailable", notes: "" };
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const BY_DAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const BLOCKS = [
  { key: "overnight", label: "Overnight", helper: "12 AM–6 AM", start: [0, 0], end: [6, 0] },
  { key: "morning", label: "Morning", helper: "6 AM–12 PM", start: [6, 0], end: [12, 0] },
  { key: "afternoon", label: "Afternoon", helper: "12 PM–6 PM", start: [12, 0], end: [18, 0] },
  { key: "evening", label: "Evening", helper: "6 PM–12 AM", start: [18, 0], end: [23, 59] },
];

const INTERPRETER_DASHBOARD_NOW = Date.now();

function weeklyRule(item) {
  return String(item?.recurrence_rule || "").includes("X-MLS-BLOCK=");
}

function AvailabilityChoice({ selected, choose }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2">
      <button type="button" onClick={() => choose("available")} className={cx("min-h-11 rounded-xl px-2 py-2 text-xs font-black transition", selected === "available" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100")}><Check size={13} className="mr-1 inline" />Available</button>
      <button type="button" onClick={() => choose("unavailable")} className={cx("min-h-11 rounded-xl px-2 py-2 text-xs font-black transition", selected === "unavailable" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-800 hover:bg-rose-100")}><Ban size={13} className="mr-1 inline" />Unavailable</button>
    </div>
  );
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

function occurrence(weekday, block, timeZone) {
  const [today] = zonedInputValue(new Date(), timeZone).split("T");
  const localDate = new Date(`${today}T12:00:00Z`);
  const delta = (weekday - localDate.getUTCDay() + 7) % 7;
  localDate.setUTCDate(localDate.getUTCDate() + delta);
  const pad = (value) => String(value).padStart(2, "0");
  const date = `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())}`;
  let startAt = zonedDateTimeToUtc(`${date}T${pad(block.start[0])}:${pad(block.start[1])}`, timeZone);
  let endAt = zonedDateTimeToUtc(`${date}T${pad(block.end[0])}:${pad(block.end[1])}`, timeZone);
  if (new Date(endAt).getTime() <= Date.now()) {
    localDate.setUTCDate(localDate.getUTCDate() + 7);
    const nextDate = `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())}`;
    startAt = zonedDateTimeToUtc(`${nextDate}T${pad(block.start[0])}:${pad(block.start[1])}`, timeZone);
    endAt = zonedDateTimeToUtc(`${nextDate}T${pad(block.end[0])}:${pad(block.end[1])}`, timeZone);
  }
  return { startAt, endAt };
}

function Home({ workspace, operations, app, v2, actions }) {
  const profile = workspace.interpreter?.profile || {};
  const assignments = app?.assignments || [];
  const payments = v2?.payments || [];
  const credentials = v2?.credentials || [];
  const upcoming = assignments.filter((item) => new Date(item.start_at).getTime() >= INTERPRETER_DASHBOARD_NOW && !["cancelled", "closed"].includes(item.lifecycle_status));
  const unpaid = payments.filter((item) => !["paid", "void"].includes(item.contractor_payment_status));
  const expiring = credentials.filter((item) => item.expires_on && new Date(item.expires_on).getTime() <= INTERPRETER_DASHBOARD_NOW + 60 * 864e5);
  return (
    <div className="space-y-6">
      <Hero title={`${profile.first_name || "Interpreter"}, keep your MLS work assignment-ready.`} actions={<ActionButton tone="gold" onClick={() => actions.go("work")}>Open work</ActionButton>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={CalendarDays} name="Upcoming" value={upcoming.length} note="Scheduled assignments" /><Metric icon={ClipboardCheck} name="Opportunities" value={(operations?.opportunities || []).length} note="Open for bidding" color="#dd7d00" /><Metric icon={CircleDollarSign} name="Payments" value={unpaid.length} note="Ready, scheduled, or processing" color="#15803d" /><Metric icon={ShieldCheck} name="Expiring" value={expiring.length} note="Credentials within 60 days" color="#c2410c" /></div>
      <Card><SectionHeader title="Upcoming assignments" /><div className="mt-5 grid gap-4 xl:grid-cols-2">{upcoming.slice(0, 6).map((item) => <InterpreterWorkCard key={item.id} assignment={item} records={recordsForAssignment(v2, item.id)} onOpen={actions.openAssignment} onTimePay={() => actions.go("payments")} />)}{!upcoming.length && <EmptyState icon={CalendarDays} title="No upcoming assignments" />}</div></Card>
    </div>
  );
}

function AssignmentCalendar({ assignments, onOpen }) {
  const grouped = assignments.reduce((map, item) => {
    const key = new Date(item.start_at).toLocaleDateString("en-US", { year: "numeric", month: "long", timeZone: getPortalTimeZone() });
    if (!map[key]) map[key] = [];
    map[key].push(item);
    return map;
  }, {});
  return <div className="space-y-5">{Object.entries(grouped).map(([month, items]) => <section key={month}><h3 className="mb-3 text-sm font-black uppercase tracking-[.1em] text-slate-500">{month}</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <button key={item.id} type="button" onClick={() => onOpen(item)} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#dd7d00]/40 hover:bg-white"><p className="text-xs font-black uppercase tracking-[.1em] text-[#721100]">{new Date(item.start_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: getPortalTimeZone() })}</p><p className="mt-2 break-words font-black text-slate-950">{item.service_type}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.start_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: getPortalTimeZone() })} · {item.delivery_mode}</p><div className="mt-3"><Badge value={item.lifecycle_status || item.status} /></div></button>)}</div></section>)}{!assignments.length && <EmptyState icon={CalendarDays} title="No assigned work" />}</div>;
}

function Work({ operations, app, v2, actions }) {
  const assignments = app?.assignments || [];
  const opportunities = operations?.opportunities || [];
  const [view, setView] = useState("list");
  const [opportunityView, setOpportunityView] = useState("list");
  const opportunityAssignments = opportunities.map((opportunity) => ({
    ...(opportunity.assignments || {}),
    id: opportunity.id,
    lifecycle_status: opportunity.status,
    opportunity,
  }));
  const viewToggle = (value, setValue) => <div className="flex max-w-full rounded-xl border border-slate-200 bg-slate-50 p-1"><button type="button" onClick={() => setValue("list")} className={cx("inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-black", value === "list" ? "bg-[#721100] text-white" : "text-slate-500")}><List size={14} />List</button><button type="button" onClick={() => setValue("calendar")} className={cx("inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-black", value === "calendar" ? "bg-[#721100] text-white" : "text-slate-500")}><CalendarDays size={14} />Calendar</button></div>;
  return (
    <div className="space-y-6">
      <Hero title="Work" actions={<ActionButton tone="soft" onClick={() => actions.go("schedule")}>Availability</ActionButton>} />
      <Card><SectionHeader title="Opportunities" action={viewToggle(opportunityView, setOpportunityView)} /><div className="mt-5">{opportunityView === "list" ? <div className="grid gap-4 lg:grid-cols-2">{opportunities.map((opportunity) => { const item = opportunity.assignments || {}; return <button type="button" key={opportunity.id} onClick={() => actions.submitBid(opportunity)} className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#dd7d00]/50 hover:shadow-lg"><div className="bg-gradient-to-br from-[#721100] to-[#24130e] p-4 text-white"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="mt-1 break-words text-lg font-black">{item.service_type || "Interpreter opportunity"}</p><p className="mt-2 break-words text-xs leading-5 text-white/70">{formatDate(item.start_at)} · {item.delivery_mode || "Delivery pending"}</p></div><Badge value={opportunity.status} className="border-white/20 bg-white/10 text-white" /></div></div><div className="grid gap-2 p-4 text-xs text-slate-600 sm:grid-cols-2"><p><b>Area:</b> {item.delivery_mode === "VRI" ? "Remote" : [item.city, item.state].filter(Boolean).join(", ") || "Shared after assignment"}</p><p><b>Setting:</b> {item.specialty || item.setting || "General"}</p><p><b>Participants:</b> {item.deaf_participants || 0} Deaf · {item.hearing_participants || 0} hearing</p><p><b>Team:</b> {item.team_requested ? "Team requested" : "Solo assignment"}{item.cdi_requested ? " · CDI" : ""}</p><p className="sm:col-span-2"><b>Language/access:</b> {item.language_preferences || item.communication_preferences || "Not specified"}</p><p className="inline-flex items-center gap-1 font-black text-[#721100] sm:col-span-2">Express interest <ClipboardCheck size={13} /></p></div></button>; })}{!opportunities.length && <EmptyState icon={ClipboardCheck} title="No opportunities" />}</div> : <AssignmentCalendar assignments={opportunityAssignments} onOpen={(item) => actions.submitBid(item.opportunity)} />}</div></Card>
      <Card><SectionHeader title="Assigned services" action={viewToggle(view, setView)} /><div className="mt-5">{view === "list" ? <div className="grid gap-4 xl:grid-cols-2">{assignments.map((item) => <InterpreterWorkCard key={item.id} assignment={item} records={recordsForAssignment(v2, item.id)} onOpen={actions.openAssignment} onTimePay={() => actions.go("payments")} />)}{!assignments.length && <EmptyState icon={CalendarDays} title="No assigned work" />}</div> : <AssignmentCalendar assignments={assignments} onOpen={actions.openAssignment} />}</div></Card>
    </div>
  );
}

function Payments({ app, v2, actions, saving }) {
  const { session } = useSession();
  const api = useMemo(() => createMLSApi(session), [session]);
  const storage = useMemo(() => createPortalSupabaseClient(null), []);
  const assignments = useMemo(() => app?.assignments || [], [app?.assignments]);
  const timeZone = getPortalTimeZone();
  const zone = timeZoneAbbreviation(timeZone);
  const [time, setTime] = useState(emptyTime);
  const [expense, setExpense] = useState(emptyExpense);
  const [documentAssignmentId, setDocumentAssignmentId] = useState("");
  const assignmentOptions = useMemo(() => assignments.map((item) => ({ value: item.id, label: `${item.service_type} · ${formatDate(item.start_at)}` })), [assignments]);
  const documentAssignment = assignments.find((item) => item.id === documentAssignmentId);
  const timeEntries = v2?.timeEntries || [];
  const expenses = v2?.expenses || [];
  const payments = v2?.payments || [];
  const completedNeedingTime = assignments.filter((assignment) => assignment.end_at && new Date(assignment.end_at).getTime() < INTERPRETER_DASHBOARD_NOW && !timeEntries.some((entry) => (entry.assignment_id || entry.assignments?.id) === assignment.id));
  const awaitingReview = timeEntries.filter((item) => ["submitted", "under_review"].includes(item.status)).length + expenses.filter((item) => ["submitted", "under_review"].includes(item.status)).length;
  const scheduledPayments = payments.filter((item) => ["ready", "scheduled", "processing"].includes(item.contractor_payment_status));
  const paidTotal = payments.filter((item) => item.contractor_payment_status === "paid").reduce((sum, item) => sum + Number(item.contractor_payment_amount || 0), 0);
  function startTimeEntry(assignment) {
    setTime((current) => ({ ...current, assignmentId: assignment.id }));
    window.requestAnimationFrame(() => document.getElementById("interpreter-time-entry")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }
  async function submitTime(event) {
    event.preventDefault();
    await actions.submitTime({
      ...time,
      actualStartAt: zonedDateTimeToUtc(time.actualStartAt, timeZone),
      actualEndAt: zonedDateTimeToUtc(time.actualEndAt, timeZone),
    });
    setTime(emptyTime);
  }
  async function submitExpense(event) {
    event.preventDefault();
    const file = expense.receipt;
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) throw new Error("Receipts must be 15 MB or smaller.");
    const signed = await api.automations("createDocumentUploadUrl", "POST", { assignmentId: expense.assignmentId, category: "expense_receipt", fileName: file.name, fileSize: file.size });
    const upload = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type || undefined });
    if (upload.error) throw upload.error;
    await api.automations("recordDocumentUpload", "POST", { assignmentId: expense.assignmentId, category: "expense_receipt", title: `${expense.expenseType} receipt`, visibility: "specific_interpreter", fileName: file.name, fileSize: file.size, mimeType: file.type || null, storagePath: signed.path });
    await actions.submitExpense({ ...expense, receipt: undefined, receiptStoragePath: signed.path });
    setExpense(emptyExpense);
  }
  return (
    <div className="space-y-6">
      <Hero title="Time, Expenses & Pay" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={AlertCircle} name="Time needed" value={completedNeedingTime.length} note="Completed services without actuals" color="#be123c" /><Metric icon={Clock3} name="Under review" value={awaitingReview} note="Time and expense submissions" color="#1d4ed8" /><Metric icon={WalletCards} name="Payment pipeline" value={scheduledPayments.length} note={scheduledPayments.length ? formatMoney(scheduledPayments.reduce((sum, item) => sum + Number(item.contractor_payment_amount || 0), 0)) : "No payment pending"} color="#c2410c" /><Metric icon={CheckCircle2} name="Paid history" value={formatMoney(paidTotal)} note="Recorded contractor payments" color="#15803d" /></div>
      {completedNeedingTime.length > 0 && <Card><SectionHeader title="Time needed" /><div className="mt-5 grid gap-3 md:grid-cols-2">{completedNeedingTime.map((assignment) => <button key={assignment.id} type="button" onClick={() => startTimeEntry(assignment)} className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><Clock3 size={17} /></span><span className="min-w-0 flex-1"><span className="block font-black text-slate-900">{assignment.service_type}</span><span className="mt-1 block text-xs text-slate-500">{formatDate(assignment.start_at)} · Add actual time</span></span></button>)}</div></Card>}
      <div className="grid gap-5 xl:grid-cols-2">
        <div id="interpreter-time-entry"><Card><SectionHeader title="Actual time" text={timeZoneLabel(timeZone)} /><form onSubmit={submitTime} className="mt-6 grid gap-4"><Field name="Assignment" required><SelectField value={time.assignmentId} onChange={(event) => setTime({ ...time, assignmentId: event.target.value })} options={assignmentOptions} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field name={`Actual start · ${zone}`} required><input className={INPUT} type="datetime-local" value={time.actualStartAt} onChange={(event) => setTime({ ...time, actualStartAt: event.target.value })} /></Field><Field name={`Actual end · ${zone}`} required><input className={INPUT} type="datetime-local" value={time.actualEndAt} onChange={(event) => setTime({ ...time, actualEndAt: event.target.value })} /></Field></div><Field name="Break minutes"><input className={INPUT} type="number" min="0" value={time.breakMinutes} onChange={(event) => setTime({ ...time, breakMinutes: event.target.value })} /></Field><Field name="Notes"><textarea className={INPUT} rows={3} value={time.notes} onChange={(event) => setTime({ ...time, notes: event.target.value })} /></Field><ActionButton type="submit" disabled={saving || !time.assignmentId || !time.actualStartAt || !time.actualEndAt}>Submit time</ActionButton></form></Card></div>
        <Card><SectionHeader title="Expense" text="Receipt required · 15 MB maximum" /><form onSubmit={submitExpense} className="mt-6 grid gap-4"><Field name="Assignment" required><SelectField value={expense.assignmentId} onChange={(event) => setExpense({ ...expense, assignmentId: event.target.value })} options={assignmentOptions} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field name="Expense type"><SelectField value={expense.expenseType} onChange={(event) => setExpense({ ...expense, expenseType: event.target.value })} options={["mileage", "parking", "toll", "airfare", "lodging", "per_diem", "rideshare", "supplies", "other"]} /></Field><Field name="Amount" required><input className={INPUT} type="number" min="0" step="0.01" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} /></Field></div>{expense.expenseType === "mileage" && <Field name="Miles"><input className={INPUT} type="number" step="0.1" value={expense.mileage} onChange={(event) => setExpense({ ...expense, mileage: event.target.value })} /></Field>}<Field name="Receipt" required><input className={INPUT} type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg" onChange={(event) => setExpense({ ...expense, receipt: event.target.files?.[0] || null })} /></Field><Field name="Description"><textarea className={INPUT} rows={3} value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} /></Field><ActionButton type="submit" disabled={saving || !expense.assignmentId || !expense.amount || !expense.receipt}>Submit expense</ActionButton></form></Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card><SectionHeader title="Time entries" /><div className="mt-5 space-y-3">{timeEntries.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{item.assignments?.service_type}</p><p className="mt-1 text-xs text-slate-500">{item.billable_hours} hours · {formatDate(item.actual_start_at)}</p>{item.review_notes && <p className="mt-2 text-xs leading-5 text-slate-600"><b>MLS note:</b> {item.review_notes}</p>}</div><Badge value={item.status} /></div></div>)}{!timeEntries.length && <EmptyState icon={Clock3} title="No time entries" />}</div></Card>
        <Card><SectionHeader title="Payment status" text="Your contractor payments only" /><div className="mt-5 space-y-3">{payments.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{item.assignments?.service_type}</p><p className="mt-1 text-xs text-slate-500">{formatMoney(item.contractor_payment_amount)} · Due {item.contractor_payment_due_date || "not set"}</p></div><Badge value={item.contractor_payment_status} /></div>{item.found_payment_url && <a href={item.found_payment_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-black text-[#721100] hover:underline">Open in Found</a>}</div>)}{!payments.length && <EmptyState icon={CircleDollarSign} title="No payment records" />}</div></Card>
      </div>
      <Card><SectionHeader title="Documents" /><div className="mt-5"><Field name="Assignment"><SelectField value={documentAssignmentId} onChange={(event) => setDocumentAssignmentId(event.target.value)} options={assignmentOptions} /></Field></div></Card>
      {documentAssignment && <AssignmentDocumentCenter assignment={documentAssignment} role="interpreter" />}
    </div>
  );
}

function Schedule({ workspace, app, v2, actions, saving }) {
  const assignments = app?.assignments || [];
  const profile = workspace.interpreter?.profile || {};
  const availability = v2?.availability || [];
  const [weekly, setWeekly] = useState(() => parseWeekly(availability, profile));
  const [unavailable, setUnavailable] = useState(emptyUnavailable);
  const timeZone = workspace.preferences?.timeZone || getPortalTimeZone(profile.availability_timezone);
  const zone = timeZoneAbbreviation(timeZone);
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
      windows.push({ weekday, byDay: BY_DAY[weekday], block: block.key, availabilityType, ...occurrence(weekday, block, timeZone) });
    }));
    await actions.saveWeeklyAvailability({ timeZone, windows });
  }

  async function saveUnavailable(event) {
    event.preventDefault();
    await actions.saveAvailability({
      ...unavailable,
      startAt: zonedDateTimeToUtc(unavailable.startAt, timeZone),
      endAt: zonedDateTimeToUtc(unavailable.endAt, timeZone),
      recurrenceRule: unavailable.recurrenceRule || `X-MLS-TZID=${timeZone}`,
    });
    setUnavailable(emptyUnavailable);
  }

  function editUnavailable(item) {
    setUnavailable({
      availabilityId: item.id,
      startAt: zonedInputValue(item.start_at, timeZone),
      endAt: zonedInputValue(item.end_at, timeZone),
      availabilityType: item.availability_type || "unavailable",
      notes: item.notes || "",
      recurrenceRule: item.recurrence_rule || `X-MLS-TZID=${timeZone}`,
    });
    window.requestAnimationFrame(() => document.getElementById("unavailable-period-form")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Weekly availability" text={timeZoneLabel(timeZone)} />
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Unavailable takes priority</strong> and suppresses overlapping opportunity emails.</div>
        <div className="mt-5 grid gap-4 lg:hidden sm:grid-cols-2">
          {DAYS.map((day, weekday) => (
            <section key={day} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3">
              <h3 className="rounded-2xl bg-[#721100] px-4 py-3 font-black text-white">{day}</h3>
              <div className="mt-3 space-y-3">
                {BLOCKS.map((block) => (
                  <div key={block.key}>
                    <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
                      <p className="text-sm font-black text-slate-900">{block.label}</p>
                      <p className="text-[11px] font-bold text-slate-500">{block.helper} · {zone}</p>
                    </div>
                    <AvailabilityChoice selected={weekly[`${weekday}:${block.key}`]} choose={(type) => choose(weekday, block.key, type)} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-5 hidden overflow-x-auto lg:block">
          <div className="min-w-[980px] space-y-3">
            <div className="grid grid-cols-[150px_repeat(4,minmax(180px,1fr))] gap-3"> <div />{BLOCKS.map((block) => <div key={block.key} className="rounded-2xl bg-slate-100 p-3 text-center"><p className="text-sm font-black text-slate-900">{block.label}</p><p className="text-xs text-slate-500">{block.helper} · {zone}</p></div>)}</div>
            {DAYS.map((day, weekday) => <div key={day} className="grid grid-cols-[150px_repeat(4,minmax(180px,1fr))] gap-3"><div className="flex items-center rounded-2xl bg-[#721100] px-4 font-black text-white">{day}</div>{BLOCKS.map((block) => <AvailabilityChoice key={block.key} selected={weekly[`${weekday}:${block.key}`]} choose={(type) => choose(weekday, block.key, type)} />)}</div>)}
          </div>
        </div>
        <div className="mt-6 flex justify-end"><div className="w-full sm:w-auto"><ActionButton onClick={saveWeekly} disabled={saving}>Save weekly availability</ActionButton></div></div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <div id="unavailable-period-form"><Card><SectionHeader title={unavailable.availabilityId ? "Edit unavailable period" : "Add unavailable period"} text={timeZoneLabel(timeZone)} /><form onSubmit={saveUnavailable} className="mt-6 grid gap-4"><Field name={`Start · ${zone}`} required><input className={INPUT} type="datetime-local" value={unavailable.startAt} onChange={(event) => setUnavailable({ ...unavailable, startAt: event.target.value })} /></Field><Field name={`End · ${zone}`} required><input className={INPUT} type="datetime-local" value={unavailable.endAt} onChange={(event) => setUnavailable({ ...unavailable, endAt: event.target.value })} /></Field><Field name="Notes"><textarea className={INPUT} rows={3} value={unavailable.notes} onChange={(event) => setUnavailable({ ...unavailable, notes: event.target.value })} /></Field><div className="flex flex-wrap gap-2"><ActionButton type="submit" disabled={saving || !unavailable.startAt || !unavailable.endAt}>{unavailable.availabilityId ? "Update period" : "Save period"}</ActionButton>{unavailable.availabilityId && <button type="button" onClick={() => setUnavailable(emptyUnavailable)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600"><X size={15} />Cancel</button>}</div></form></Card></div>
        <Card><SectionHeader title="Availability overview" /><div className="mt-5 space-y-3">{oneTime.map((item) => <div key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><MapPin size={17} /></span><div className="min-w-0"><p className="font-black">{formatDate(item.start_at)} – {formatDate(item.end_at)}</p><p className="mt-1 text-xs text-slate-500">{item.notes || "Unavailable"}</p></div><div className="col-start-2 flex flex-wrap items-center gap-3 sm:col-auto sm:flex-col sm:items-end"><Badge value={item.availability_type} /><div className="flex gap-3"><button type="button" onClick={() => editUnavailable(item)} className="inline-flex items-center gap-1 text-xs font-black text-[#721100]"><Pencil size={13} />Edit</button><button type="button" onClick={() => actions.deleteAvailability(item.id)} className="text-xs font-black text-rose-600">Delete</button></div></div></div>)}{assignments.map((item) => <AssignmentRow key={item.id} assignment={item} onOpen={actions.openAssignment} />)}{!oneTime.length && !assignments.length && <EmptyState icon={CalendarDays} title="No availability entries" />}</div></Card>
      </div>
    </div>
  );
}

export default function InterpreterV2Workspace({ section, workspace, operations, app, v2, loading, saving, actions }) {
  if (loading && !v2) return <LoadingPanel />;
  if (section === "home") return <Home workspace={workspace} operations={operations} app={app} v2={v2} actions={actions} />;
  if (section === "work") return <Work operations={operations} app={app} v2={v2} actions={actions} />;
  if (section === "payments") return <Payments app={app} v2={v2} actions={actions} saving={saving} />;
  if (section === "schedule") return <Schedule workspace={workspace} app={app} v2={v2} actions={actions} saving={saving} />;
  return null;
}
