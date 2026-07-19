import {
  ArrowRight,
  CalendarPlus,
  Check,
  CircleDollarSign,
  Clock3,
  CopyPlus,
  ExternalLink,
  FileUp,
  Headphones,
  Link2,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge, Card, SectionHeader, cx, formatDate, pretty } from "./ui";

const CLIENT_EXPERIENCE_NOW = Date.now();

const STAGES = [
  { key: "request", label: "Request", description: "Submitted to MLS" },
  { key: "approval", label: "Approval", description: "Scope and terms" },
  { key: "staffing", label: "Staffing", description: "Interpreter matching" },
  { key: "confirmed", label: "Confirmed", description: "Service team ready" },
  { key: "service", label: "Service", description: "Interpreting delivered" },
  { key: "closeout", label: "Closeout", description: "Time and billing" },
];

const STATUS_META = {
  request_received: { stage: 0, label: "Request received", next: "MLS is checking the details and will follow up if anything is missing." },
  needs_review: { stage: 0, label: "Under review", next: "MLS is reviewing the scope, timing, and access needs." },
  quote_sent: { stage: 1, label: "Quote ready", next: "Review the quote in Requests so staffing can move forward." },
  client_approved: { stage: 1, label: "Approved", next: "MLS is preparing the agreement and staffing plan." },
  deposit_pending: { stage: 1, label: "Deposit pending", next: "Complete the requested deposit to keep the service moving." },
  staffing: { stage: 2, label: "Staffing in progress", next: "MLS is matching the right interpreter team to this service." },
  interpreter_invited: { stage: 2, label: "Interpreters invited", next: "MLS is waiting for the best-matched interpreters to confirm." },
  interpreter_accepted: { stage: 2, label: "Interpreter accepted", next: "MLS is completing the final confirmation details." },
  confirmed: { stage: 3, label: "Confirmed", next: "Share preparation materials and double-check day-of logistics." },
  in_progress: { stage: 4, label: "In progress", next: "Your interpreting service is underway. Message MLS if you need day-of help." },
  time_submitted: { stage: 5, label: "Service complete", next: "MLS is verifying service time and preparing closeout." },
  client_verified: { stage: 5, label: "Time verified", next: "Your invoice and final records are being prepared." },
  invoice_sent: { stage: 5, label: "Invoice sent", next: "Review the invoice in Billing and submit payment when due." },
  paid: { stage: 5, label: "Paid", next: "This service is paid. You can request it again or share feedback." },
  closed: { stage: 5, label: "Closed", next: "This service is complete. You can request it again or share feedback." },
  cancelled: { stage: -1, label: "Cancelled", next: "This request is cancelled. Message MLS if you need clarification or want to rebook." },
};

const STATUS_ORDER = [
  "request_received", "needs_review", "quote_sent", "client_approved", "deposit_pending",
  "staffing", "interpreter_invited", "interpreter_accepted", "confirmed", "in_progress",
  "time_submitted", "client_verified", "invoice_sent", "paid", "closed",
];

function statusKey(assignment = {}) {
  if (assignment.lifecycle_status === "cancelled" || assignment.status === "cancelled") return "cancelled";
  const candidates = [assignment.lifecycle_status];
  if (assignment.quote_status === "sent") candidates.push("quote_sent");
  if (assignment.quote_status === "approved") candidates.push("client_approved");
  if (["sent", "signed"].includes(assignment.agreement_status)) candidates.push("client_approved");
  if (["pending", "partially_paid"].includes(assignment.deposit_status)) candidates.push("deposit_pending");
  if (assignment.status === "confirmed") candidates.push("confirmed");
  if (assignment.status === "completed") candidates.push("time_submitted");
  if (assignment.payment_status === "paid") candidates.push("paid");
  return candidates.filter((value) => STATUS_ORDER.includes(value)).sort((a, b) => STATUS_ORDER.indexOf(b) - STATUS_ORDER.indexOf(a))[0] || "needs_review";
}

export function clientStatusMeta(assignment = {}) {
  const key = statusKey(assignment);
  const meta = { key, ...(STATUS_META[key] || { stage: 0, label: pretty(key), next: "Open this request for the latest details from MLS." }) };
  if (["sent", "viewed"].includes(assignment.agreement_status)) return { ...meta, label: "Agreement ready", next: "Review and sign the service agreement in Requests so MLS can keep moving." };
  if (assignment.quote_status === "sent") return { ...meta, label: "Quote ready", next: "Review the quote in Requests so MLS can continue with your service." };
  return meta;
}

export function assignmentLocation(assignment = {}) {
  if (assignment.delivery_mode === "VRI") return assignment.meeting_link || assignment.location_name || "Virtual service";
  return assignment.location_name || [assignment.address_line_1, assignment.address_line_2, assignment.city, assignment.state, assignment.postal_code].filter(Boolean).join(", ") || "Location pending";
}

export function assignmentIsUpcoming(assignment = {}) {
  const start = new Date(assignment.start_at).getTime();
  return Number.isFinite(start) && start >= CLIENT_EXPERIENCE_NOW && !["cancelled", "closed", "paid"].includes(statusKey(assignment));
}

export function ClientServiceTracker({ assignment, compact = false }) {
  const meta = clientStatusMeta(assignment);
  if (meta.key === "cancelled") {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><Clock3 size={17} /></span><div><p className="font-black text-rose-950">Request cancelled</p><p className="mt-1 text-xs leading-5 text-rose-800">{meta.next}</p></div></div></div>;
  }

  return <div>
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">Service progress</p><p className="mt-1 font-black text-slate-950">{meta.label}</p></div><Badge value={meta.key} /></div>
    <div className={cx("mt-4 grid", compact ? "grid-cols-6 gap-1.5" : "grid-cols-3 gap-2 sm:grid-cols-6") }>
      {STAGES.map((stage, index) => {
        const complete = index < meta.stage;
        const current = index === meta.stage;
        return <div key={stage.key} className="min-w-0">
          <div className={cx("flex h-2 rounded-full", complete ? "bg-emerald-500" : current ? "bg-[#dd7d00]" : "bg-slate-200")} />
          {!compact && <div className="mt-2"><p className={cx("text-[10px] font-black uppercase tracking-[.08em]", complete ? "text-emerald-700" : current ? "text-[#9a5700]" : "text-slate-400")}>{stage.label}</p><p className="mt-1 hidden text-[10px] leading-4 text-slate-400 lg:block">{stage.description}</p></div>}
        </div>;
      })}
    </div>
    <p className={cx("rounded-xl bg-slate-50 text-slate-600", compact ? "mt-3 px-3 py-2 text-xs leading-5" : "mt-4 px-4 py-3 text-sm leading-6")}>{meta.next}</p>
  </div>;
}

function ActionLink({ icon: Icon, children, onClick, href, primary = false }) {
  const classes = cx("inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition hover:-translate-y-0.5", primary ? "bg-[#dd7d00] text-white" : "border border-slate-200 bg-white text-[#721100]");
  if (href) return <a href={href} target="_blank" rel="noreferrer" className={classes}><Icon size={14} />{children}</a>;
  return <button type="button" onClick={onClick} className={classes}><Icon size={14} />{children}</button>;
}

export function ClientAssignmentCard({ assignment, onOpen, onRepeat, onMessage }) {
  const date = assignment.start_at ? new Date(assignment.start_at) : null;
  const teamCount = (assignment.assignment_interpreters || []).filter((item) => item.status !== "declined").length;
  const meta = clientStatusMeta(assignment);
  return <Card className="shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#721100] text-white"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#f6b34c]">{date ? formatDate(date, { month: "short", day: undefined, year: undefined, hour: undefined, minute: undefined, timeZoneName: undefined }) : "TBD"}</span><span className="text-2xl font-black leading-none">{date ? formatDate(date, { day: "numeric", month: undefined, year: undefined, hour: undefined, minute: undefined, timeZoneName: undefined }) : "—"}</span></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-lg font-black text-slate-950">{assignment.service_type || "Interpreter service"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{formatDate(assignment.start_at)} · {assignment.delivery_mode || "Delivery mode pending"}</p></div><Badge value={meta.key} /></div>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2"><p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-[#dd7d00]" /><span className="line-clamp-2">{assignmentLocation(assignment)}</span></p><p className="flex items-center gap-2"><Users size={14} className="shrink-0 text-[#dd7d00]" />{teamCount ? `${teamCount} interpreter${teamCount === 1 ? "" : "s"} assigned` : "Staffing in progress"}</p></div>
        <div className="mt-4"><ClientServiceTracker assignment={assignment} compact /></div>
        <div className="mt-4 flex flex-wrap gap-2"><ActionLink icon={ArrowRight} primary onClick={() => onOpen?.(assignment)}>Open service</ActionLink><ActionLink icon={CopyPlus} onClick={() => onRepeat?.(assignment)}>Request again</ActionLink><ActionLink icon={MessageSquare} onClick={onMessage}>Message MLS</ActionLink></div>
      </div>
    </div>
  </Card>;
}

function DetailTile({ icon: Icon, label, value, href }) {
  const content = <><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#721100]/10 text-[#721100]"><Icon size={17} /></span><span className="min-w-0"><span className="block text-[10px] font-black uppercase tracking-[.1em] text-slate-400">{label}</span><span className="mt-1 block break-words text-sm font-bold leading-5 text-slate-800">{value || "Not provided"}</span></span>{href && <ExternalLink size={14} className="ml-auto shrink-0 text-slate-400" />}</>;
  const classes = "flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left";
  return href ? <a href={href} target="_blank" rel="noreferrer" className={cx(classes, "transition hover:bg-white hover:shadow")}>{content}</a> : <div className={classes}>{content}</div>;
}

function calendarDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function calendarEscape(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}

export function downloadAssignmentCalendar(assignment) {
  if (!assignment?.start_at || typeof window === "undefined") return;
  const location = assignmentLocation(assignment);
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Miqueas Language Solutions//Client Portal//EN", "BEGIN:VEVENT",
    `UID:${assignment.id || assignment.start_at}@miqueaslanguagesolutions.com`,
    `DTSTAMP:${calendarDate(new Date())}`,
    `DTSTART:${calendarDate(assignment.start_at)}`,
    `DTEND:${calendarDate(assignment.end_at || new Date(new Date(assignment.start_at).getTime() + 60 * 60 * 1000))}`,
    `SUMMARY:${calendarEscape(`MLS · ${assignment.service_type || "Interpreter service"}`)}`,
    `DESCRIPTION:${calendarEscape(assignment.description || "Interpreter service coordinated by Miqueas Language Solutions.")}`,
    `LOCATION:${calendarEscape(location)}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `MLS-${String(assignment.service_type || "service").replace(/[^a-z0-9]+/gi, "-")}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ClientAssignmentDetail({ assignment, actions }) {
  const meta = clientStatusMeta(assignment);
  const team = (assignment.assignment_interpreters || []).filter((item) => item.status !== "declined");
  const location = assignmentLocation(assignment);
  const isVirtual = assignment.delivery_mode === "VRI" || /^https?:\/\//i.test(assignment.meeting_link || "");
  const mapHref = !isVirtual && location !== "Location pending" ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : "";
  const joinHref = isVirtual && /^https?:\/\//i.test(assignment.meeting_link || "") ? assignment.meeting_link : "";
  const go = (section) => { actions.closeModal?.(); actions.go?.(section); };

  const checklist = [
    { done: Boolean(assignment.description), title: "Purpose and agenda", text: assignment.description ? "MLS has the service context." : "Add the purpose, agenda, or desired outcome in preparation materials." },
    { done: Boolean(assignment.preparation_materials), title: "Preparation materials", text: assignment.preparation_materials ? "Preparation notes are attached to this request." : "Upload slides, names, acronyms, scripts, or specialized terminology." },
    { done: Boolean(assignment.onsite_contact_name && assignment.onsite_contact_phone), title: "Day-of contact", text: assignment.onsite_contact_name ? `${assignment.onsite_contact_name}${assignment.onsite_contact_phone ? ` · ${assignment.onsite_contact_phone}` : " · phone needed"}` : "Add a person MLS can reach on the day of service." },
    { done: Boolean(joinHref || (!isVirtual && location !== "Location pending")), title: isVirtual ? "Meeting access" : "Arrival location", text: isVirtual ? (joinHref ? "The meeting link is ready." : "Share the final meeting link and access instructions.") : (location !== "Location pending" ? "The service location is on file." : "Share the complete address and arrival instructions.") },
  ];

  return <div className="space-y-6">
    <div className="overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#721100] via-[#5b180b] to-[#24130e] p-5 text-white sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-[#f6b34c]">{meta.label}</span>{assignment.priority && assignment.priority !== "standard" && <span className="rounded-full bg-rose-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-rose-100">{pretty(assignment.priority)}</span>}</div><h3 className="mt-3 break-words text-2xl font-black sm:text-3xl">{assignment.service_type || "Interpreter service"}</h3><p className="mt-2 text-sm leading-6 text-white/70">{formatDate(assignment.start_at)} · {assignment.delivery_mode || "Delivery mode pending"}</p></div><div className="flex flex-wrap gap-2"><ActionLink icon={CopyPlus} onClick={() => actions.openRepeatRequest?.(assignment)}>Request again</ActionLink><ActionLink icon={CalendarPlus} onClick={() => downloadAssignmentCalendar(assignment)}>Add to calendar</ActionLink><ActionLink icon={MessageSquare} primary onClick={() => go("communications")}>Message MLS</ActionLink></div></div>
    </div>

    <Card className="shadow-none"><ClientServiceTracker assignment={assignment} /></Card>

    <Card className="shadow-none">
      <SectionHeader title="Service details" />
      <div className="mt-5 grid gap-3 md:grid-cols-2"><DetailTile icon={Clock3} label="When" value={`${formatDate(assignment.start_at)}${assignment.end_at ? ` – ${formatDate(assignment.end_at, { month: undefined, day: undefined, year: undefined })}` : ""}`} /><DetailTile icon={isVirtual ? Link2 : MapPin} label={isVirtual ? "Meeting access" : "Location"} value={location} href={joinHref || mapHref} /><DetailTile icon={Phone} label="Day-of contact" value={[assignment.onsite_contact_name, assignment.onsite_contact_phone].filter(Boolean).join(" · ")} /><DetailTile icon={Users} label="Participants and team" value={`${assignment.deaf_participants ?? "—"} Deaf · ${assignment.hearing_participants ?? "—"} hearing · ${team.length || "Staffing pending"}${team.length ? ` interpreter${team.length === 1 ? "" : "s"}` : ""}`} /><DetailTile icon={ShieldCheck} label="Access plan" value={[assignment.specialty, assignment.language_preferences, assignment.cdi_requested ? "CDI requested" : "", assignment.team_requested ? "Team requested" : ""].filter(Boolean).join(" · ")} /><DetailTile icon={CircleDollarSign} label="Billing reference" value={[assignment.purchase_order_number && `PO ${assignment.purchase_order_number}`, assignment.client_reference].filter(Boolean).join(" · ")} /></div>
      {(joinHref || mapHref) && <div className="mt-4 flex flex-wrap gap-2">{joinHref && <ActionLink icon={ExternalLink} primary href={joinHref}>Join meeting</ActionLink>}{mapHref && <ActionLink icon={MapPin} primary href={mapHref}>Open directions</ActionLink>}</div>}
    </Card>

    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="shadow-none"><SectionHeader title="Preparation" /><div className="mt-5 space-y-3">{checklist.map((item) => <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{item.done ? <Check size={17} /> : <FileUp size={17} />}</span><div><p className="text-sm font-black text-slate-900">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p></div></div>)}</div><button type="button" onClick={() => document.querySelector("[data-assignment-document-center]")?.scrollIntoView({ behavior: "smooth" })} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#721100]"><FileUp size={16} />Documents</button></Card>
      <Card className="shadow-none"><SectionHeader title="Service team" /><div className="mt-5 space-y-3">{team.map((link) => { const name = `${link.interpreters?.first_name || ""} ${link.interpreters?.last_name || ""}`.trim() || link.interpreters?.email || "MLS interpreter"; return <div key={link.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#721100]/10 font-black text-[#721100]">{name[0]}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{name}</p><p className="mt-1 text-xs text-slate-500">{pretty(link.role || "interpreter")}</p></div><Badge value={link.status || "assigned"} /></div>; })}{!team.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><Users className="mx-auto text-[#721100]" size={24} /><p className="mt-3 font-black text-slate-900">Staffing in progress</p></div>}</div></Card>
    </div>

    <Card className="shadow-none"><SectionHeader title="Request details" /><div className="mt-5 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-slate-400">Service context</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{assignment.description || "No service context added."}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-slate-400">Preparation notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{assignment.preparation_materials || "No preparation notes added."}</p></div></div></Card>

    <Card className="border-[#dd7d00]/20 bg-[#fffaf2] shadow-none"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dd7d00]/15 text-[#9a5700]"><Headphones size={20} /></span><p className="font-black text-slate-950">Service support</p></div><button type="button" onClick={() => go("communications")} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-4 py-3 text-sm font-black text-white"><MessageSquare size={16} />Message MLS</button></div></Card>
  </div>;
}
