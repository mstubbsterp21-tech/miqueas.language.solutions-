import {
  ArrowRight, CalendarDays, CircleDollarSign, ClipboardCheck, Clock3, ExternalLink,
  FileCheck2, FileSignature, MapPin, MessageSquare, UploadCloud, Users,
} from "lucide-react";
import { Badge, Card, SectionHeader, cx, formatDate, formatMoney, pretty } from "./ui";

const WORKFLOW_STEPS = [
  { key: "request", label: "Request", icon: ClipboardCheck },
  { key: "authorize", label: "Authorize", icon: FileSignature },
  { key: "staff", label: "Staff", icon: Users },
  { key: "deliver", label: "Deliver", icon: CalendarDays },
  { key: "reconcile", label: "Reconcile", icon: FileCheck2 },
  { key: "close", label: "Close", icon: CircleDollarSign },
];

const ROLE_COPY = {
  admin: {
    title: "One service lifecycle",
    text: "Every request follows the same operational path. The admin portal surfaces handoffs and exceptions; client and interpreter portals show only the decisions and records relevant to them.",
    descriptions: ["Review scope", "Quote and agreement", "Match the team", "Support service", "Verify time and costs", "Invoice, pay, archive"],
  },
  client: {
    title: "How your service moves",
    text: "Your portal follows the request from intake through payment while keeping internal staffing, contractor rates, and agency notes private.",
    descriptions: ["Submit details", "Approve terms", "MLS confirms team", "Receive service", "Confirm records", "Pay and retain history"],
  },
  interpreter: {
    title: "Your MLS work cycle",
    text: "See only the opportunities, assignment details, preparation, submissions, and payment records connected to your work.",
    descriptions: ["Matched work", "Express interest", "Accept assignment", "Prepare and serve", "Submit time and expenses", "Track your payment"],
  },
};

const LIFECYCLE_INDEX = {
  request_received: 0, needs_review: 0,
  quote_sent: 1, client_approved: 1, deposit_pending: 1,
  staffing: 2, interpreter_invited: 2, interpreter_accepted: 2,
  confirmed: 3, in_progress: 3,
  time_submitted: 4, client_verified: 4,
  invoice_sent: 5, paid: 5, closed: 5,
};

const WORKFLOW_NOW = Date.now();

function recordAssignmentId(record) {
  return record?.assignment_id || record?.assignments?.id || record?.assignment_interpreters?.assignment_id || "";
}

export function recordsForAssignment(v2, assignmentId) {
  const match = (item) => recordAssignmentId(item) === assignmentId;
  return {
    quote: (v2?.quotes || []).find(match),
    agreement: (v2?.agreements || []).find(match),
    invoice: (v2?.invoices || []).find(match),
    timeEntries: (v2?.timeEntries || []).filter(match),
    expenses: (v2?.expenses || []).filter(match),
    payments: (v2?.payments || []).filter(match),
  };
}

export function AgencyWorkflowCard({ role, currentStage = -1, compact = false }) {
  const copy = ROLE_COPY[role] || ROLE_COPY.admin;
  return <Card className={compact ? "p-4 md:p-5" : ""}><SectionHeader title={copy.title} text={copy.text} /><div className="mt-5 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">{WORKFLOW_STEPS.map((step, index) => { const Icon = step.icon; const active = index === currentStage; const complete = currentStage >= 0 && index < currentStage; return <div key={step.key} className={cx("relative rounded-2xl border p-3", active ? "border-[#dd7d00] bg-[#fff7e8] shadow-sm" : complete ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-slate-50")}><span className={cx("flex h-9 w-9 items-center justify-center rounded-xl", active ? "bg-[#721100] text-white" : complete ? "bg-emerald-600 text-white" : "bg-white text-slate-500")}><Icon size={16} /></span><p className="mt-3 text-xs font-black text-slate-900">{index + 1}. {step.label}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{copy.descriptions[index]}</p></div>; })}</div></Card>;
}

function staffingCount(assignment) {
  return (assignment.assignment_interpreters || []).filter((item) => !["declined", "removed"].includes(item.status)).length;
}

function requiredCount(assignment) {
  return Number(assignment.required_interpreter_count || (assignment.team_requested ? 2 : 1));
}

export function adminAssignmentMeta(assignment, records = {}) {
  const lifecycle = assignment.lifecycle_status || assignment.status || "request_received";
  const staffed = staffingCount(assignment);
  const needed = requiredCount(assignment);
  const quote = records.quote;
  const agreement = records.agreement;
  const invoice = records.invoice;
  const approvedTime = (records.timeEntries || []).some((item) => ["approved", "client_verified"].includes(item.status));
  const submittedTime = (records.timeEntries || []).some((item) => item.status === "submitted");
  const serviceEnded = assignment.end_at && new Date(assignment.end_at).getTime() < WORKFLOW_NOW;
  if (["cancelled", "closed"].includes(lifecycle)) return { stage: 5, tone: "slate", title: "Archived", next: "Record is complete; retain documents and audit history." };
  if (!quote) return { stage: 0, tone: "rose", title: "Price and scope", next: "Review the request, confirm scope, and create the client quote." };
  if (["draft", "sent", "changes_requested"].includes(quote.status)) return { stage: 1, tone: "blue", title: quote.status === "sent" ? "Await client approval" : "Finish authorization", next: quote.status === "sent" ? "Monitor the quote decision and answer client questions." : "Update and send the quote before staffing." };
  if (!agreement || !["signed", "completed"].includes(agreement.status)) return { stage: 1, tone: "violet", title: "Complete agreement", next: "Send or update the service agreement and retain the executed copy." };
  if (staffed < needed) return { stage: 2, tone: "rose", title: `Staff ${needed - staffed} more`, next: "Publish or target the opportunity, review interest, and confirm the full team." };
  if (!serviceEnded) return { stage: 3, tone: "green", title: "Service readiness", next: "Confirm access details, preparation, team communication, and calendar records." };
  if (submittedTime) return { stage: 4, tone: "orange", title: "Review closeout", next: "Approve submitted time and expenses before client billing and contractor pay." };
  if (!approvedTime) return { stage: 4, tone: "orange", title: "Collect actuals", next: "Obtain time and expense submissions from the assigned interpreter team." };
  if (!invoice) return { stage: 5, tone: "orange", title: "Issue invoice", next: "Create the client invoice in Found and link it to this service." };
  if (!["paid", "void", "refunded"].includes(invoice.status)) return { stage: 5, tone: "orange", title: "Collect payment", next: `${formatMoney(invoice.balance_due)} remains on the linked client invoice.` };
  return { stage: 5, tone: "green", title: "Close service", next: "Confirm contractor payments and archive the complete service record." };
}

const TONE = {
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  violet: "border-violet-200 bg-violet-50 text-violet-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

export function AdminOperationsCard({ assignment, records, onOpen }) {
  const meta = adminAssignmentMeta(assignment, records);
  const staffed = staffingCount(assignment);
  const needed = requiredCount(assignment);
  return <button type="button" onClick={() => onOpen(assignment)} className="group w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#dd7d00]/45 hover:shadow-lg"><div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px]"><div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.13em] text-[#dd7d00]">{assignment.clients?.organization_name || assignment.clients?.primary_contact_name || "Client"}</p><h3 className="mt-1 break-words text-lg font-black text-slate-950">{assignment.service_type || "Interpreter service"}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{formatDate(assignment.start_at)} · {assignment.delivery_mode || "Delivery pending"} · {staffed}/{needed} staffed</p></div><Badge value={assignment.lifecycle_status || assignment.status} /></div><div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500"><span className="rounded-full bg-slate-100 px-3 py-1.5">Quote: {pretty(records.quote?.status || "not created")}</span><span className="rounded-full bg-slate-100 px-3 py-1.5">Agreement: {pretty(records.agreement?.status || "not linked")}</span><span className="rounded-full bg-slate-100 px-3 py-1.5">Invoice: {pretty(records.invoice?.status || "not linked")}</span></div></div><div className={cx("rounded-2xl border p-4", TONE[meta.tone])}><p className="text-[10px] font-black uppercase tracking-[.12em] opacity-70">Next agency action</p><p className="mt-2 font-black">{meta.title}</p><p className="mt-1 text-xs leading-5 opacity-80">{meta.next}</p><p className="mt-3 inline-flex items-center gap-1 text-xs font-black">Open service <ArrowRight size={13} className="transition group-hover:translate-x-1" /></p></div></div></button>;
}

export function interpreterAssignmentMeta(assignment, records = {}) {
  const lifecycle = assignment.lifecycle_status || assignment.status;
  const serviceEnded = assignment.end_at && new Date(assignment.end_at).getTime() < WORKFLOW_NOW;
  const time = (records.timeEntries || [])[0];
  const payment = (records.payments || [])[0];
  if (["cancelled", "closed"].includes(lifecycle)) return { stage: 5, tone: "slate", title: "Assignment closed", next: "The record remains available in your work history." };
  if (!serviceEnded) return { stage: 3, tone: "green", title: "Prepare for service", next: "Review logistics, access needs, preparation, and team information before arrival." };
  if (!time) return { stage: 4, tone: "orange", title: "Submit actual time", next: "Enter start, end, break, and any approved expenses in Time & Pay." };
  if (["submitted", "under_review"].includes(time.status)) return { stage: 4, tone: "blue", title: "Closeout under review", next: "MLS is reviewing your time and expense records." };
  if (time.status === "rejected") return { stage: 4, tone: "rose", title: "Update time entry", next: "Review the MLS note and resubmit corrected actual time." };
  if (!payment || ["not_ready", "ready"].includes(payment.contractor_payment_status)) return { stage: 5, tone: "orange", title: "Payment preparation", next: "Approved records are being prepared for contractor payment." };
  if (["scheduled", "processing"].includes(payment.contractor_payment_status)) return { stage: 5, tone: "blue", title: "Payment scheduled", next: `Track your ${formatMoney(payment.contractor_payment_amount)} payment record here.` };
  return { stage: 5, tone: "green", title: "Payment complete", next: "Your service and contractor payment record are complete." };
}

export function InterpreterWorkCard({ assignment, records, onOpen, onTimePay }) {
  const meta = interpreterAssignmentMeta(assignment, records);
  const location = assignment.delivery_mode === "VRI" ? "Virtual service" : assignment.location_name || [assignment.city, assignment.state].filter(Boolean).join(", ") || "Location pending";
  return <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"><div className="relative bg-gradient-to-br from-[#721100] to-[#24130e] p-4 text-white sm:p-5"><span className="absolute -right-7 -top-9 h-28 w-28 rounded-full bg-white/5" /><div className="relative flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.13em] text-[#f6b34c]">Assigned service</p><h3 className="mt-1 text-lg font-black">{assignment.service_type || "Interpreter service"}</h3><p className="mt-2 text-xs leading-5 text-white/70">{formatDate(assignment.start_at)} · {assignment.delivery_mode || "Delivery pending"}</p></div><Badge value={assignment.lifecycle_status || assignment.status} className="border-white/20 bg-white/10 text-white" /></div></div><div className="p-4 sm:p-5"><div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2"><p className="inline-flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-[#dd7d00]" />{location}</p><p className="inline-flex items-start gap-2"><Users size={14} className="mt-0.5 shrink-0 text-[#dd7d00]" />{assignment.team_requested ? "Team assignment" : "Solo assignment"}{assignment.cdi_requested ? " · CDI requested" : ""}</p></div><div className={cx("mt-4 rounded-2xl border p-4", TONE[meta.tone])}><p className="text-[10px] font-black uppercase tracking-[.12em] opacity-70">Your next action</p><p className="mt-1 font-black">{meta.title}</p><p className="mt-1 text-xs leading-5 opacity-80">{meta.next}</p></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onOpen(assignment)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#721100] px-3 text-xs font-black text-white">Open service <ArrowRight size={13} /></button>{meta.stage >= 4 && <button type="button" onClick={() => onTimePay?.(assignment)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-[#721100]"><Clock3 size={13} />Time & Pay</button>}</div></div></div>;
}

function downloadCalendar(assignment) {
  const stamp = (value) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const clean = (value) => String(value || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const location = assignment.delivery_mode === "VRI" ? assignment.meeting_link || "Virtual" : assignment.location_name || [assignment.city, assignment.state].filter(Boolean).join(", ");
  const text = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Miqueas Language Solutions//Portal//EN", "BEGIN:VEVENT", `UID:${assignment.id}@miqueaslanguagesolutions.com`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(assignment.start_at)}`, `DTEND:${stamp(assignment.end_at || assignment.start_at)}`, `SUMMARY:${clean(assignment.service_type || "MLS interpreting service")}`, `LOCATION:${clean(location)}`, `DESCRIPTION:${clean("Review secure preparation and day-of details in the MLS Portal.")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `mls-service-${assignment.id}.ics`; link.click(); URL.revokeObjectURL(url);
}

export function InterpreterAssignmentDetail({ assignment, v2, viewerInterpreterId, actions }) {
  const records = recordsForAssignment(v2, assignment.id);
  const meta = interpreterAssignmentMeta(assignment, records);
  const team = assignment.assignment_interpreters || [];
  const ownLink = team.find((item) => item.interpreter_id === viewerInterpreterId) || team.find((item) => item.interpreters?.id === viewerInterpreterId) || (team.length === 1 ? team[0] : null);
  const location = assignment.delivery_mode === "VRI" ? assignment.meeting_link || "Virtual service link pending" : assignment.location_name || [assignment.address_line_1, assignment.city, assignment.state, assignment.postal_code].filter(Boolean).join(", ") || "Location pending";
  const directions = assignment.delivery_mode !== "VRI" && location !== "Location pending" ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : "";
  const navigate = (section) => { actions.closeModal?.(); actions.go?.(section); };
  return <div className="space-y-6"><div className="relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-[#721100] via-[#5b180b] to-[#24130e] p-5 text-white sm:p-7"><span className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[28px] border-white/5" /><div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.13em] text-[#f6b34c]">Your assigned service</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{assignment.service_type || "Interpreter service"}</h2><p className="mt-3 text-sm text-white/70">{formatDate(assignment.start_at)} · {assignment.delivery_mode || "Delivery pending"}</p></div><div className="flex flex-wrap gap-2"><Badge value={assignment.lifecycle_status || assignment.status} className="border-white/20 bg-white/10 text-white" />{ownLink?.status && <Badge value={ownLink.status} className="border-white/20 bg-white/10 text-white" />}</div></div></div><AgencyWorkflowCard role="interpreter" currentStage={meta.stage} compact /><Card><div className={cx("rounded-2xl border p-4", TONE[meta.tone])}><p className="text-[10px] font-black uppercase tracking-[.12em] opacity-70">Your next action</p><p className="mt-2 text-lg font-black">{meta.title}</p><p className="mt-1 text-sm leading-6 opacity-80">{meta.next}</p></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{assignment.delivery_mode === "VRI" && assignment.meeting_link && <a href={assignment.meeting_link} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-4 text-sm font-black text-white">Join meeting <ExternalLink size={14} /></a>}{directions && <a href={directions} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-4 text-sm font-black text-white">Directions <MapPin size={14} /></a>}<button type="button" onClick={() => downloadCalendar(assignment)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-[#721100]"><CalendarDays size={14} />Add to calendar</button><button type="button" onClick={() => navigate("communications")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-[#721100]"><MessageSquare size={14} />Message MLS</button>{meta.stage >= 4 && <button type="button" onClick={() => navigate("payments")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-[#721100]"><UploadCloud size={14} />Time & Pay</button>}</div></Card><Card><SectionHeader title="Service essentials" text="The logistics and access information needed to prepare and provide the assignment." /><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Location or access", location], ["Participants", `${assignment.deaf_participants || 0} Deaf · ${assignment.hearing_participants || 0} hearing`], ["Setting", assignment.specialty || assignment.setting || "Not specified"], ["Language and access", assignment.language_preferences || assignment.communication_preferences || "Review preparation"], ["Your role", pretty(ownLink?.role || "interpreter")], ["Your confirmation", pretty(ownLink?.status || assignment.status)], ["Dress or arrival", assignment.dress_code || assignment.arrival_instructions || "Professional attire; arrive prepared"], ["Day-of contact", assignment.onsite_contact_name || assignment.contact_name || "Contact MLS through Communications"]].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-bold leading-6 text-slate-700">{value}</p></div>)}</div></Card><Card><SectionHeader title="Preparation and context" text="Client-approved information for accurate, professional service delivery." /><div className="mt-5 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-[#721100]">Assignment context</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{assignment.description || "No additional context has been shared."}</p></div><div className="rounded-2xl bg-[#fff7e8] p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-[#721100]">Preparation materials</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{assignment.preparation_materials || "No preparation materials have been added yet. Message MLS if specific terminology or documents are needed."}</p></div></div></Card><Card><SectionHeader title="Service team" text="Names and roles are shared for coordination. Each interpreter’s rate and private records remain visible only to that interpreter and MLS administrators." /><div className="mt-5 grid gap-3 sm:grid-cols-2">{team.map((link) => <div key={link.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#721100]/10 font-black text-[#721100]">{(link.interpreters?.first_name || "I")[0]}</span><div className="min-w-0 flex-1"><p className="font-black text-slate-900">{`${link.interpreters?.first_name || ""} ${link.interpreters?.last_name || ""}`.trim() || (link.interpreter_id === viewerInterpreterId ? "You" : "Assigned interpreter")}</p><p className="mt-1 text-xs text-slate-500">{pretty(link.role || "interpreter")}</p></div><Badge value={link.status || "assigned"} /></div>)}{!team.length && <p className="text-sm text-slate-500">Team details will appear after MLS confirms staffing.</p>}</div></Card><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><strong>Role privacy:</strong> This view intentionally excludes client billing, agency margin, administrative notes, other interpreters’ rates, and private quality or compliance records.</div></div>;
}

export function AdminLifecyclePanel({ assignment }) {
  const stage = LIFECYCLE_INDEX[assignment.lifecycle_status || assignment.status] ?? 0;
  return <AgencyWorkflowCard role="admin" currentStage={stage} compact />;
}
