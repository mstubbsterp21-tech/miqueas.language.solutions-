import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Bell, BookOpen, Building2, CalendarDays, CheckCircle2,
  CircleDollarSign, ClipboardCheck, Clock3, FileCheck2, FileText, Filter,
  GraduationCap, LayoutDashboard, Mail, MapPin, MessageSquare, Plus,
  Search, Send, Settings2, ShieldCheck, Star, UserRound, Users,
} from "lucide-react";
import {
  Badge, BRAND, Card, DocumentCard, EmptyState, Field, Hero, INPUT,
  Metric, SectionHeader, cx, formatDate, formatMoney, parseRate, pretty, safe,
} from "./ui";
import {
  CLIENT_DOCUMENTS, CREDENTIAL_OPTIONS, EXPERIENCE_OPTIONS, INTERPRETER_DOCUMENTS,
  INTERPRETER_OPTIONAL_DOCUMENTS, INTERPRETER_REQUIRED_DOCUMENTS, MODALITY_OPTIONS, SETTING_OPTIONS,
} from "./forms";
import { displayRequestSetting, requestDefaultsFromClient } from "../requestFormConfig";

function Button({ children, onClick, tone = "primary", icon: Icon, type = "button", disabled = false }) {
  const styles = {
    primary: "bg-[#721100] text-white",
    gold: "bg-[#dd7d00] text-white",
    soft: "border border-slate-200 bg-white text-[#721100]",
    dark: "bg-[#24130e] text-white",
    danger: "bg-rose-50 text-rose-700",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cx("inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50", styles[tone])}>
      {Icon && <Icon size={16} />}{children}
    </button>
  );
}

function StatStrip({ items }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <Metric key={item.name} {...item} />)}</div>;
}

function AssignmentCard({ assignment, onOpen, compact = false }) {
  const team = assignment.assignment_interpreters || [];
  return (
    <Card hover onClick={() => onOpen?.(assignment)} className={compact ? "p-4 md:p-4" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[.12em] text-[#dd7d00]">{assignment.clients?.organization_name || assignment.clients?.email || "MLS assignment"}</p>
          <h3 className="mt-1 break-words text-lg font-black text-slate-950">{assignment.service_type}</h3>
          <p className="mt-2 text-sm font-bold text-slate-600">{formatDate(assignment.start_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2"><Badge value={assignment.status} /><Badge value={assignment.payment_status} /></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{assignment.delivery_mode === "VRI" ? "Virtual" : assignment.location_name || [assignment.city, assignment.state].filter(Boolean).join(", ") || "Location pending"}</span>
        <span className="inline-flex items-center gap-1.5"><Users size={14} />{team.length ? `${team.length} assigned` : "Unstaffed"}</span>
      </div>
    </Card>
  );
}

function AssignmentList({ assignments, onOpen, emptyTitle = "No assignments yet", emptyText = "Assignments will appear here when they are created." }) {
  if (!assignments.length) return <EmptyState icon={CalendarDays} title={emptyTitle} text={emptyText} />;
  return <div className="grid gap-4 lg:grid-cols-2">{assignments.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} onOpen={onOpen} />)}</div>;
}

function ProfileSnapshot({ fields }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {fields.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm font-bold text-slate-700">{value || "Not provided"}</p>
        </div>
      ))}
    </div>
  );
}

function DocumentsPanel({ audience, view, busyDoc, upload, open, remove, admin = false }) {
  const definitions = audience === "client" ? CLIENT_DOCUMENTS : INTERPRETER_DOCUMENTS;
  const documents = Object.fromEntries((view?.documents || []).map((item) => [item.document_type, item]));
  const requests = Object.fromEntries((view?.documentRequests || []).map((item) => [item.document_type, item]));
  const [customName, setCustomName] = useState("");
  const [customFile, setCustomFile] = useState(null);
  const customDocuments = (view?.documents || []).filter((item) => String(item.document_type || "").startsWith("other_"));
  const uploadedRequired = audience === "interpreter" ? INTERPRETER_REQUIRED_DOCUMENTS.filter(([type]) => documents[type]).length : 0;
  async function uploadCustom(event) {
    event.preventDefault();
    if (!customName.trim() || !customFile) return;
    const form = event.currentTarget;
    const safeName = customName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "document";
    await upload(`other_${safeName}_${Date.now()}`, customFile, null, { documentLabel: customName.trim() });
    setCustomName("");
    setCustomFile(null);
    form.reset();
  }
  if (audience === "interpreter") return (
    <div className="space-y-5">
      <Card>
        <SectionHeader title="Required Documents" text={admin ? "Review required interpreter compliance files." : "Upload all five required documents before MLS sends assignment broadcasts or recommended opportunities."} />
        {!admin && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-black text-amber-950">{uploadedRequired} of {INTERPRETER_REQUIRED_DOCUMENTS.length} required documents uploaded</p><p className="mt-1 text-xs leading-5 text-amber-800">Résumé, W-9, Credentials, Liability Insurance, and IC Agreement are required.</p></div>}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">{INTERPRETER_REQUIRED_DOCUMENTS.map(([type, title]) => <DocumentCard key={type} type={type} title={title} document={documents[type]} request={requests[type]} busy={busyDoc} upload={upload} open={open} remove={remove} readOnly={admin} />)}</div>
      </Card>
      <Card>
        <SectionHeader title="Optional Documents" text={admin ? "Review additional files supplied by this interpreter." : "Add licenses, work samples, or another named document that supports your MLS profile."} />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">{INTERPRETER_OPTIONAL_DOCUMENTS.map(([type, title]) => <DocumentCard key={type} type={type} title={title} document={documents[type]} request={requests[type]} busy={busyDoc} upload={upload} open={open} remove={remove} readOnly={admin} />)}{customDocuments.map((document) => <DocumentCard key={document.id} type={document.document_type} title={document.notes || document.file_name || "Other document"} document={document} busy={busyDoc} upload={upload} open={open} remove={remove} readOnly={admin} />)}</div>
        {!admin && <form onSubmit={uploadCustom} className="mt-6 grid gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"><Field name="Other document name" required><input className={INPUT} required value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Example: BEI certificate" /></Field><Field name="Choose file" required><input className={INPUT} type="file" required onChange={(event) => setCustomFile(event.target.files?.[0] || null)} /></Field><Button type="submit" icon={Plus} disabled={!customName.trim() || !customFile || Boolean(busyDoc)}>Upload document</Button></form>}
      </Card>
    </div>
  );
  return (
    <Card>
      <SectionHeader eyebrow="Secure files" title="Document center" text={admin ? "Review the files tied to this account." : "Upload requested records and replace outdated versions without emailing attachments."} />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {definitions.map(([type, title]) => (
          <DocumentCard key={type} type={type} title={title} document={documents[type]} request={requests[type]} busy={busyDoc} upload={upload} open={open} remove={remove} readOnly={admin} />
        ))}
      </div>
    </Card>
  );
}

function NotificationCenter({ app, markRead }) {
  const notifications = app?.notifications || [];
  return (
    <Card>
      <SectionHeader eyebrow="Updates" title="Notifications" text="Assignment, document, training, and conversation activity stays in one place." action={notifications.some((item) => !item.is_read) ? <Button tone="soft" onClick={() => markRead()}>Mark all read</Button> : null} />
      <div className="mt-6 space-y-3">
        {notifications.map((notification) => (
          <button key={notification.id} type="button" onClick={() => !notification.is_read && markRead(notification.id)} className={cx("flex w-full items-start gap-4 rounded-2xl p-4 text-left transition", notification.is_read ? "bg-slate-50" : "border border-[#dd7d00]/20 bg-[#fff9ef] shadow-sm")}>
            <span className={cx("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", notification.is_read ? "bg-slate-200 text-slate-500" : "bg-[#721100] text-white")}><Bell size={17} /></span>
            <span className="min-w-0 flex-1"><span className="block font-black text-slate-900">{notification.title}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{notification.body}</span><span className="mt-2 block text-xs text-slate-400">{formatDate(notification.created_at)}</span></span>
            {!notification.is_read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#dd7d00]" />}
          </button>
        ))}
        {!notifications.length && <EmptyState icon={Bell} title="You are all caught up" text="New MLS activity will appear here." />}
      </div>
    </Card>
  );
}

function MessagesCenter({ assignments, messages, currentUserId, sendMessage }) {
  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || "");
  const [body, setBody] = useState("");
  const selected = assignments.find((item) => item.id === assignmentId);
  const conversation = messages.filter((item) => item.assignment_id === assignmentId);

  return (
    <Card className="overflow-hidden p-0 md:p-0">
      <div className="grid min-h-[620px] lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
          <SectionHeader eyebrow="Conversations" title="Messages" text="Every conversation stays attached to the assignment." />
          <div className="mt-5 max-h-[480px] space-y-2 overflow-y-auto">
            {assignments.map((assignment) => (
              <button key={assignment.id} type="button" onClick={() => setAssignmentId(assignment.id)} className={cx("w-full rounded-2xl p-4 text-left transition", assignmentId === assignment.id ? "bg-[#721100] text-white shadow-lg" : "bg-white text-slate-800 hover:shadow")}>
                <p className="truncate text-sm font-black">{assignment.service_type}</p>
                <p className={cx("mt-1 truncate text-xs", assignmentId === assignment.id ? "text-white/65" : "text-slate-400")}>{assignment.clients?.organization_name || assignment.clients?.email || formatDate(assignment.start_at)}</p>
              </button>
            ))}
            {!assignments.length && <EmptyState icon={MessageSquare} title="No conversations" text="Messages become available when an assignment exists." />}
          </div>
        </div>
        <div className="flex min-w-0 flex-col">
          {selected ? (
            <>
              <div className="border-b border-slate-200 bg-white p-5"><p className="font-black text-slate-950">{selected.service_type}</p><p className="mt-1 text-xs text-slate-500">{formatDate(selected.start_at)} · {selected.delivery_mode}</p></div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#faf8f6] p-5">
                {conversation.map((message) => {
                  const mine = message.sender_clerk_user_id === currentUserId;
                  return <div key={message.id} className={cx("flex", mine ? "justify-end" : "justify-start")}><div className={cx("max-w-[82%] rounded-[1.35rem] px-4 py-3 text-sm shadow-sm", mine ? "rounded-br-md bg-[#721100] text-white" : "rounded-bl-md bg-white text-slate-700")}><p className="leading-6">{message.body}</p><p className={cx("mt-2 text-[10px]", mine ? "text-white/55" : "text-slate-400")}>{pretty(message.sender_role)} · {formatDate(message.created_at)}</p></div></div>;
                })}
                {!conversation.length && <EmptyState icon={MessageSquare} title="Start the conversation" text="Use this thread for assignment logistics and preparation." />}
              </div>
              <form onSubmit={async (event) => { event.preventDefault(); if (!body.trim()) return; await sendMessage(assignmentId, body); setBody(""); }} className="border-t border-slate-200 bg-white p-4"><div className="flex gap-3"><textarea className={cx(INPUT, "min-h-12 flex-1 resize-none")} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write an assignment message" /><button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#721100] text-white"><Send size={18} /></button></div></form>
            </>
          ) : <div className="flex flex-1 items-center justify-center p-8"><EmptyState icon={MessageSquare} title="Choose an assignment" text="Select a conversation from the left." /></div>}
        </div>
      </div>
    </Card>
  );
}

function TrainingCenter({ courses, progressCourse, admin = false, progress = [] }) {
  return (
    <Card>
      <SectionHeader eyebrow="Professional growth" title="Training center" text={admin ? "Publish onboarding and development content, then monitor interpreter progress." : "Complete assigned MLS onboarding and professional development."} />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {courses.map((course) => {
          const percent = course.progress?.progress_percent || 0;
          return (
            <div key={course.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-[#dd7d00]">{course.category}</p><h3 className="mt-1 text-lg font-black text-slate-950">{course.title}</h3></div><Badge value={admin ? (course.is_published ? "published" : "draft") : (course.progress?.status || "not_started")} /></div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{course.description || "MLS training module"}</p>
              <p className="mt-3 text-xs text-slate-400">{course.duration_minutes ? `${course.duration_minutes} minutes` : "Self-paced"}</p>
              {!admin && <><div className="mt-4 h-2 overflow-hidden rounded-full bg-white"><motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full rounded-full bg-[#dd7d00]" /></div><div className="mt-4 flex flex-wrap gap-2">{course.content_url && <a href={course.content_url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#721100]">Open course</a>}<Button tone={percent === 100 ? "soft" : "primary"} onClick={() => progressCourse(course, percent === 100 ? 0 : 100)}>{percent === 100 ? "Reset" : "Mark complete"}</Button></div></>}
              {admin && <p className="mt-4 text-xs font-bold text-slate-500">{progress.filter((item) => item.course_id === course.id && item.status === "completed").length} completed</p>}
            </div>
          );
        })}
        {!courses.length && <EmptyState icon={GraduationCap} title="No training available" text={admin ? "Add the first course to begin." : "Published MLS courses will appear here."} />}
      </div>
    </Card>
  );
}

function Opportunities({ opportunities, bids, submitBid }) {
  const bidMap = new Map((bids || []).map((bid) => [bid.opportunity_id, bid]));
  return (
    <div className="space-y-5">
      <Hero eyebrow="Assignment marketplace" title="Recommended MLS opportunities" text="Review open work, compare it with your profile, and submit your interest directly to MLS." />
      <div className="grid gap-4 lg:grid-cols-2">
        {opportunities.map((opportunity) => {
          const assignment = opportunity.assignments || {};
          const bid = bidMap.get(opportunity.id);
          return <Card key={opportunity.id} hover><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-[#dd7d00]">{assignment.specialty || "Community"}</p><h3 className="mt-1 text-xl font-black text-slate-950">{assignment.service_type}</h3></div><Badge value={bid?.status || opportunity.status} /></div><p className="mt-4 text-sm font-bold text-slate-700">{formatDate(assignment.start_at)}</p><p className="mt-2 text-sm text-slate-500">{assignment.delivery_mode} · {assignment.location_name || [assignment.city, assignment.state].filter(Boolean).join(", ") || "Location pending"}</p><p className="mt-4 text-sm leading-6 text-slate-600">{opportunity.notes || assignment.description || "Review the assignment details before bidding."}</p><div className="mt-5">{bid ? <p className="text-sm font-black text-[#721100]">Bid submitted {bid.bid_rate ? `at ${formatMoney(bid.bid_rate)}/hr` : ""}</p> : <Button onClick={() => submitBid(opportunity)} icon={ClipboardCheck}>Bid for assignment</Button>}</div></Card>;
        })}
        {!opportunities.length && <EmptyState icon={ClipboardCheck} title="No open opportunities" text="MLS will post recommended assignments here when they are available." />}
      </div>
    </div>
  );
}

function FilterGroup({ label, options, values, toggle }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-[#dd7d00]">{label}</p><div className="mt-3 max-h-44 space-y-2 overflow-y-auto">{options.map((option) => <label key={option} className="flex cursor-pointer items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={values.includes(option)} onChange={() => toggle(option)} className="mt-0.5" /><span>{option}</span></label>)}</div></div>;
}

function InterpreterDirectory({ interpreters, openInterpreter }) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ location: "", credentials: [], modalities: [], settings: [], experience: [], minRate: "", maxRate: "" });
  const toggle = (key, value) => setFilters((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  const includesAll = (value, selected) => !selected.length || selected.every((item) => safe(value).toLowerCase().includes(item.toLowerCase()));

  const filtered = useMemo(() => interpreters.filter((interpreter) => {
    const location = interpreter.current_location || [interpreter.city, interpreter.state].filter(Boolean).join(", ");
    const haystack = [interpreter.first_name, interpreter.last_name, interpreter.email, location, interpreter.credentials, interpreter.modalities, interpreter.areas_of_experience, interpreter.years_experience, interpreter.onsite_rate, interpreter.vri_rate].map(safe).join(" ").toLowerCase();
    const rate = parseRate(interpreter.onsite_rate) ?? parseRate(interpreter.vri_rate);
    return (!query || haystack.includes(query.toLowerCase())) && (!filters.location || safe(location).toLowerCase().includes(filters.location.toLowerCase())) && includesAll(interpreter.credentials, filters.credentials) && includesAll(interpreter.modalities, filters.modalities) && includesAll(interpreter.areas_of_experience, filters.settings) && includesAll(interpreter.years_experience, filters.experience) && (!filters.minRate || (rate !== null && rate >= Number(filters.minRate))) && (!filters.maxRate || (rate !== null && rate <= Number(filters.maxRate)));
  }), [interpreters, query, filters]);

  return <div className="space-y-5"><Card><SectionHeader eyebrow="Roster" title="Interpreter directory" text={`${filtered.length} of ${interpreters.length} profiles`} action={<Button tone="soft" icon={Filter} onClick={() => setFiltersOpen((value) => !value)}>Filters</Button>} /><div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><Search size={18} className="text-[#dd7d00]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, location, credential, setting, or rate" className="w-full bg-transparent text-sm font-bold outline-none" /></div><AnimatePresence>{filtersOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><FilterGroup label="Credentials" options={CREDENTIAL_OPTIONS} values={filters.credentials} toggle={(value) => toggle("credentials", value)} /><FilterGroup label="Modalities" options={MODALITY_OPTIONS} values={filters.modalities} toggle={(value) => toggle("modalities", value)} /><FilterGroup label="Settings" options={SETTING_OPTIONS} values={filters.settings} toggle={(value) => toggle("settings", value)} /><FilterGroup label="Experience" options={EXPERIENCE_OPTIONS} values={filters.experience} toggle={(value) => toggle("experience", value)} /></div><div className="mt-4 grid gap-3 md:grid-cols-3"><input className={INPUT} placeholder="Location" value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} /><input className={INPUT} type="number" placeholder="Minimum rate" value={filters.minRate} onChange={(event) => setFilters({ ...filters, minRate: event.target.value })} /><input className={INPUT} type="number" placeholder="Maximum rate" value={filters.maxRate} onChange={(event) => setFilters({ ...filters, maxRate: event.target.value })} /></div></motion.div>}</AnimatePresence></Card><div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{filtered.map((interpreter) => <Card key={interpreter.id} hover onClick={() => openInterpreter(interpreter)}><div className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#721100]/10 font-black text-[#721100]">{(interpreter.first_name || interpreter.email || "?")[0]}</span><div className="min-w-0 flex-1"><h3 className="truncate text-lg font-black text-slate-950">{`${interpreter.first_name || ""} ${interpreter.last_name || ""}`.trim() || interpreter.email}</h3><p className="truncate text-xs text-slate-500">{interpreter.current_location || [interpreter.city, interpreter.state].filter(Boolean).join(", ") || "Location not provided"}</p></div><Badge value={interpreter.roster_status} /></div><div className="mt-4 space-y-2 text-sm text-slate-600"><p><b>Credentials:</b> {interpreter.credentials || "—"}</p><p><b>Modalities:</b> {interpreter.modalities || "—"}</p><p><b>Settings:</b> {interpreter.areas_of_experience || "—"}</p><p><b>Experience:</b> {interpreter.years_experience || "—"}</p><p><b>Rates:</b> {interpreter.onsite_rate || "—"} on-site · {interpreter.vri_rate || "—"} VRI</p></div><div className="mt-4 flex items-center gap-2 text-xs font-black text-[#721100]">Open profile <ArrowRight size={14} /></div></Card>)}{!filtered.length && <EmptyState icon={Users} title="No interpreters match" text="Adjust the filters or search terms." />}</div></div>;
}

function ClientDirectory({ clients, openClient }) {
  const [query, setQuery] = useState("");
  const filtered = clients.filter((client) => [client.organization_name, client.primary_contact_name, client.email, client.city, client.state, client.industry].map(safe).join(" ").toLowerCase().includes(query.toLowerCase()));
  return <Card><SectionHeader eyebrow="Accounts" title="Client directory" text={`${filtered.length} client profiles`} /><div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><Search size={18} className="text-[#dd7d00]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search organization, contact, location, or industry" className="w-full bg-transparent text-sm font-bold outline-none" /></div><div className="mt-5 grid gap-3 lg:grid-cols-2">{filtered.map((client) => <button key={client.id} type="button" onClick={() => openClient(client)} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 text-left transition hover:bg-white hover:shadow"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#721100]/10 font-black text-[#721100]">{(client.organization_name || client.email || "?")[0]}</span><span className="min-w-0 flex-1"><span className="block truncate font-black text-slate-900">{client.organization_name || client.email}</span><span className="mt-1 block truncate text-xs text-slate-400">{client.primary_contact_name || client.email}</span></span><Badge value={client.account_status || "active"} /></button>)}{!filtered.length && <EmptyState icon={Building2} title="No clients match" text="Try a broader search." />}</div></Card>;
}

export function AdminWorkspace({ section, workspace, operations, app, actions }) {
  const clients = workspace.admin?.clients || [];
  const interpreters = (workspace.admin?.interpreters || []).filter((item) => item.roster_status !== "removed");
  const assignments = app?.assignments || workspace.admin?.assignments || [];
  const requests = workspace.admin?.documentRequests || [];

  if (section === "overview") {
    return <div className="space-y-6"><Hero eyebrow="MLS operating system" title="Run the agency from one workspace." text="People, assignments, files, staffing, learning, and quality are connected instead of scattered across extra pages." actions={<><Button tone="gold" icon={Plus} onClick={actions.openInvite}>Invite user</Button><Button tone="soft" icon={FileText} onClick={actions.openDocumentRequest}>Request document</Button></>} /><StatStrip items={[{ icon: Building2, name: "Clients", value: clients.length, note: "Active profiles", onClick: () => actions.go("clients") }, { icon: Users, name: "Interpreters", value: interpreters.length, note: "Visible roster", color: BRAND.gold, onClick: () => actions.go("interpreters") }, { icon: CalendarDays, name: "Unconfirmed", value: assignments.filter((item) => item.status === "pending_confirmation").length, note: "Need action", onClick: () => actions.go("assignments") }, { icon: CircleDollarSign, name: "Payment due", value: assignments.filter((item) => item.payment_status === "pending_payment").length, note: "Awaiting payment", color: "#c2410c", onClick: () => actions.go("assignments") }]} /><div className="grid gap-5 xl:grid-cols-2"><Card><SectionHeader eyebrow="Today" title="Assignment pipeline" text="The latest work needing attention." /><div className="mt-5 space-y-3">{assignments.slice(0, 5).map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} compact onOpen={actions.openAssignment} />)}{!assignments.length && <EmptyState icon={CalendarDays} title="No assignments" text="Client requests will appear here." />}</div></Card><Card><SectionHeader eyebrow="Compliance" title="Outstanding documents" text="Requested files across clients and interpreters." /><div className="mt-5 space-y-3">{requests.filter((item) => !["fulfilled", "waived"].includes(item.status)).slice(0, 6).map((request) => <div key={request.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#721100]/10 text-[#721100]"><FileText size={17} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{request.title}</p><p className="mt-1 text-xs text-slate-400">{pretty(request.audience_type)} · {request.due_date || "No due date"}</p></div><Badge value={request.status} /></div>)}{!requests.length && <EmptyState icon={FileCheck2} title="No requests" text="Create a request when a file is needed." />}</div></Card></div></div>;
  }
  if (section === "clients") return <ClientDirectory clients={clients} openClient={actions.openClient} />;
  if (section === "interpreters") return <InterpreterDirectory interpreters={interpreters} openInterpreter={actions.openInterpreter} />;
  if (section === "assignments" || section === "schedule") return <div className="space-y-5"><Card><SectionHeader eyebrow="Operations" title={section === "schedule" ? "Master schedule" : "Assignments"} text="Open any assignment to manage staffing, confirmation, payment, and messages." action={<Button icon={ClipboardCheck} onClick={actions.openOpportunity}>Publish opportunity</Button>} /></Card><AssignmentList assignments={assignments} onOpen={actions.openAssignment} /></div>;
  if (section === "documents") return <Card><SectionHeader eyebrow="Compliance" title="Document requests" text="Track requests across every account." action={<Button icon={Plus} onClick={actions.openDocumentRequest}>New request</Button>} /><div className="mt-6 grid gap-3 lg:grid-cols-2">{requests.map((request) => <div key={request.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><p className="font-black text-slate-950">{request.title}</p><Badge value={request.status} /></div><p className="mt-1 text-xs text-slate-500">{pretty(request.audience_type)} · Due {request.due_date || "not set"}</p><p className="mt-3 text-sm leading-6 text-slate-600">{request.instructions || "No additional instructions."}</p></div>)}{!requests.length && <EmptyState icon={FileText} title="No document requests" text="Create one when a file is missing." />}</div></Card>;
  if (section === "training") return <div className="space-y-5"><div className="flex justify-end"><Button icon={Plus} onClick={actions.openCourse}>Add course</Button></div><TrainingCenter courses={operations?.admin?.courses || []} progress={operations?.admin?.progress || []} admin /></div>;
  if (section === "bids") return <Card><SectionHeader eyebrow="Staffing" title="Interpreter bids" text="Accepting a bid assigns the interpreter and confirms the assignment." /><div className="mt-6 space-y-3">{(operations?.admin?.bids || []).map((bid) => <div key={bid.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="font-black text-slate-950">{`${bid.interpreters?.first_name || ""} ${bid.interpreters?.last_name || ""}`.trim() || bid.interpreters?.email}</p><p className="mt-1 text-xs text-slate-500">{bid.assignment_opportunities?.assignments?.service_type} · {formatDate(bid.assignment_opportunities?.assignments?.start_at)}</p><p className="mt-2 text-sm text-slate-600">{bid.message || "No note"}{bid.bid_rate ? ` · ${formatMoney(bid.bid_rate)}/hr` : ""}</p></div><div className="flex items-center gap-2"><Badge value={bid.status} />{bid.status !== "accepted" && <Button onClick={() => actions.acceptBid(bid)}>Accept bid</Button>}</div></div></div>)}{!(operations?.admin?.bids || []).length && <EmptyState icon={ClipboardCheck} title="No bids yet" text="Interpreter bids will appear here." />}</div></Card>;
  if (section === "feedback") return <Card><SectionHeader eyebrow="Quality" title="Client feedback" text="Review ratings, comments, and follow-up requests." /><div className="mt-6 grid gap-4 lg:grid-cols-2">{(operations?.admin?.feedback || []).map((feedback) => <div key={feedback.id} className="rounded-2xl bg-slate-50 p-5"><div className="flex justify-between gap-3"><p className="font-black text-slate-950">{feedback.clients?.organization_name || feedback.clients?.email}</p><span className="font-black tracking-wider text-[#dd7d00]">{"★".repeat(feedback.rating)}</span></div><p className="mt-2 text-xs text-slate-500">{feedback.assignments?.service_type || "General feedback"}</p><p className="mt-3 text-sm leading-6 text-slate-700">{feedback.comments || "No written comments."}</p>{feedback.follow_up_requested && <p className="mt-3 text-xs font-black text-[#721100]">Follow-up requested</p>}</div>)}{!(operations?.admin?.feedback || []).length && <EmptyState icon={Star} title="No feedback yet" text="Client feedback will appear here." />}</div></Card>;
  if (section === "messages") return <MessagesCenter assignments={assignments} messages={app?.messages || []} currentUserId={workspace.user.id} sendMessage={actions.sendMessage} />;
  if (section === "notifications") return <NotificationCenter app={app} markRead={actions.markNotificationRead} />;
  return null;
}

export function ClientWorkspace({ section, workspace, operations, app, actions, busyDoc }) {
  const view = workspace.client;
  const profile = view?.profile || {};
  const requestDefaults = requestDefaultsFromClient(profile);
  const assignments = app?.assignments || view?.assignments || [];
  if (section === "overview") return <div className="space-y-6"><Hero eyebrow="Client workspace" title={`Welcome${profile.organization_name ? `, ${profile.organization_name}` : ""}.`} text="Request access, share preparation, and follow every assignment from intake through payment." actions={<><Button tone="gold" icon={Plus} onClick={actions.openRequest}>Request interpreter</Button><Button tone="soft" icon={Settings2} onClick={actions.openProfile}>Edit profile</Button></>} /><StatStrip items={[{ icon: Clock3, name: "Pending", value: assignments.filter((item) => item.status === "pending_confirmation").length, note: "Awaiting confirmation" }, { icon: CheckCircle2, name: "Confirmed", value: assignments.filter((item) => item.status === "confirmed").length, note: "Staffing confirmed", color: "#15803d" }, { icon: CircleDollarSign, name: "Payment due", value: assignments.filter((item) => item.payment_status === "pending_payment").length, note: "Invoices pending", color: "#c2410c" }, { icon: Bell, name: "Updates", value: app?.unreadCount || 0, note: "Unread notifications", color: BRAND.gold, onClick: () => actions.go("notifications") }]} /><Card><SectionHeader eyebrow="Next up" title="Recent assignments" text="Your newest requests and their current status." /><div className="mt-5"><AssignmentList assignments={assignments.slice(0, 4)} onOpen={actions.openAssignment} emptyTitle="No assignments yet" emptyText="Use the request tool to submit your first assignment." /></div></Card></div>;
  if (section === "profile") return <Card><SectionHeader eyebrow="Account" title={profile.organization_name || "Client profile"} text="Contact, billing, and reusable Interpreter Request defaults." action={<Button icon={Settings2} onClick={actions.openProfile}>Edit profile</Button>} /><div className="mt-6"><ProfileSnapshot fields={[["Primary contact", profile.primary_contact_name], ["Email", profile.email], ["Phone", profile.phone], ["Preferred contact", profile.preferred_contact_method], ["Billing email", profile.billing_email], ["Location", [profile.city, profile.state].filter(Boolean).join(", ")], ["Default service", requestDefaults.serviceNeeded], ["Default setting", displayRequestSetting(requestDefaults)], ["Communication styles", requestDefaults.communicationStyles.join(", ")], ["Hearing languages", requestDefaults.hearingParticipantsLanguages], ["Additional considerations", requestDefaults.additionalConsiderations.join(", ")], ["CDI / additional support", requestDefaults.cdiOrAdditionalSupportNeeded], ["Communication & access notes", requestDefaults.communicationNotes], ["Billing notes", profile.billing_notes]]} /></div></Card>;
  if (section === "documents") return <DocumentsPanel audience="client" view={view} busyDoc={busyDoc} upload={actions.upload} open={actions.openDocument} remove={actions.removeDocument} />;
  if (section === "request") return <div className="space-y-5"><Hero eyebrow="New request" title="Request communication access." text="Tell MLS what is happening, when it is happening, and what communication support is needed." actions={<Button tone="gold" icon={Plus} onClick={actions.openRequest}>Start request</Button>} /><Card><SectionHeader eyebrow="How it works" title="One clean request workflow" text="Your request enters the admin staffing pipeline, stays visible here, and updates as it moves through confirmation and payment." /></Card></div>;
  if (section === "assignments" || section === "schedule") return <div className="space-y-5"><Card><SectionHeader eyebrow="Service history" title={section === "schedule" ? "Schedule" : "Assignments"} text="Open an assignment for details, staffing, payment, and its message thread." action={<Button icon={Plus} onClick={actions.openRequest}>New request</Button>} /></Card><AssignmentList assignments={assignments} onOpen={actions.openAssignment} /></div>;
  if (section === "messages") return <MessagesCenter assignments={assignments} messages={app?.messages || []} currentUserId={workspace.user.id} sendMessage={actions.sendMessage} />;
  if (section === "feedback") return <Card><SectionHeader eyebrow="Quality" title="Feedback" text="Share what worked, what needs attention, or request a follow-up." action={<Button icon={Star} onClick={actions.openFeedback}>Leave feedback</Button>} /><div className="mt-6 grid gap-4 lg:grid-cols-2">{(operations?.feedback || []).map((feedback) => <div key={feedback.id} className="rounded-2xl bg-slate-50 p-5"><div className="flex justify-between gap-3"><p className="font-black">{feedback.assignments?.service_type || "General feedback"}</p><span className="font-black text-[#dd7d00]">{"★".repeat(feedback.rating)}</span></div><p className="mt-3 text-sm text-slate-600">{feedback.comments || "No comments."}</p><p className="mt-3 text-xs text-slate-400">{formatDate(feedback.created_at)}</p></div>)}{!(operations?.feedback || []).length && <EmptyState icon={Star} title="No feedback submitted" text="Your feedback history will appear here." />}</div></Card>;
  if (section === "notifications") return <NotificationCenter app={app} markRead={actions.markNotificationRead} />;
  return null;
}

export function InterpreterWorkspace({ section, workspace, operations, app, actions, busyDoc }) {
  const view = workspace.interpreter;
  const profile = view?.profile || {};
  const assignments = app?.assignments || [];
  const completionValues = [profile.phone, profile.current_location, profile.credentials, profile.modalities, profile.areas_of_experience, profile.assignment_type_preference];
  const completion = Math.round((completionValues.filter(Boolean).length / completionValues.length) * 100);
  if (section === "overview") return <div className="space-y-6"><Hero eyebrow="Interpreter workspace" title={`${profile.first_name || "Interpreter"}, keep your MLS work assignment-ready.`} text="Your profile, documents, training, schedule, opportunities, and conversations live in one place." actions={<Button tone="gold" icon={Settings2} onClick={actions.openProfile}>Edit profile</Button>} /><StatStrip items={[{ icon: UserRound, name: "Profile", value: `${completion}%`, note: "Core details complete" }, { icon: CalendarDays, name: "Scheduled", value: assignments.filter((item) => !["completed", "cancelled"].includes(item.status)).length, note: "Active assignments", color: "#15803d" }, { icon: GraduationCap, name: "Training", value: (operations?.training || []).filter((course) => course.progress?.status === "completed").length, note: `of ${(operations?.training || []).length} completed`, color: BRAND.gold }, { icon: Bell, name: "Updates", value: app?.unreadCount || 0, note: "Unread notifications", color: "#c2410c", onClick: () => actions.go("notifications") }]} /><div className="grid gap-5 xl:grid-cols-2"><Card><SectionHeader eyebrow="Schedule" title="Upcoming assignments" text="Confirmed work assigned to you." /><div className="mt-5 space-y-3">{assignments.slice(0, 4).map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} compact onOpen={actions.openAssignment} />)}{!assignments.length && <EmptyState icon={CalendarDays} title="No assignments yet" text="Accepted bids and direct assignments will appear here." />}</div></Card><Card><SectionHeader eyebrow="Marketplace" title="Recommended opportunities" text="Open assignments available for bidding." action={<Button tone="soft" onClick={() => actions.go("opportunities")}>View all</Button>} /><div className="mt-5 space-y-3">{(operations?.opportunities || []).slice(0, 4).map((opportunity) => <div key={opportunity.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><p className="font-black">{opportunity.assignments?.service_type}</p><Badge value={opportunity.status} /></div><p className="mt-1 text-xs text-slate-500">{formatDate(opportunity.assignments?.start_at)}</p></div>)}{!(operations?.opportunities || []).length && <EmptyState icon={ClipboardCheck} title="No open opportunities" text="Recommended work will appear here." />}</div></Card></div></div>;
  if (section === "profile") return <Card><SectionHeader eyebrow="Roster profile" title={`${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Interpreter profile"} text="MLS uses this information to match skill, modality, setting, location, and rate." action={<Button icon={Settings2} onClick={actions.openProfile}>Edit profile</Button>} /><div className="mt-6"><ProfileSnapshot fields={[["Credentials", profile.credentials], ["Location", profile.current_location || [profile.city, profile.state].filter(Boolean).join(", ")], ["Modalities", profile.modalities], ["Experience", profile.years_experience], ["Settings", profile.areas_of_experience], ["Preference", profile.assignment_type_preference], ["On-site rate", profile.onsite_rate], ["VRI rate", profile.vri_rate], ["Travel", profile.willing_to_travel], ["Travel radius", profile.travel_radius], ["PLI", profile.professional_liability_insurance], ["Roster status", pretty(profile.roster_status)]]} /></div></Card>;
  if (section === "documents") return <DocumentsPanel audience="interpreter" view={view} busyDoc={busyDoc} upload={actions.upload} open={actions.openDocument} remove={actions.removeDocument} />;
  if (section === "training") return <TrainingCenter courses={operations?.training || []} progressCourse={actions.progressCourse} />;
  if (section === "opportunities") return <Opportunities opportunities={operations?.opportunities || []} bids={operations?.bids || []} submitBid={actions.submitBid} />;
  if (section === "schedule" || section === "assignments") return <div className="space-y-5"><Card><SectionHeader eyebrow="Work" title="My schedule" text="Assignments accepted through bids or assigned directly by MLS." /></Card><AssignmentList assignments={assignments} onOpen={actions.openAssignment} emptyText="Accepted bids and direct assignments will appear here." /></div>;
  if (section === "messages") return <MessagesCenter assignments={assignments} messages={app?.messages || []} currentUserId={workspace.user.id} sendMessage={actions.sendMessage} />;
  if (section === "notifications") return <NotificationCenter app={app} markRead={actions.markNotificationRead} />;
  return null;
}

export function AssignmentDetail({ assignment, role, interpreters, actions }) {
  const [interpreterId, setInterpreterId] = useState("");
  const [roleType, setRoleType] = useState("interpreter");
  const [agreedRate, setAgreedRate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(assignment?.invoice_number || "");
  const [invoiceAmount, setInvoiceAmount] = useState(assignment?.invoice_amount || "");
  const [adminNotes, setAdminNotes] = useState(assignment?.admin_notes || "");
  if (!assignment) return null;
  const team = assignment.assignment_interpreters || [];

  return <div className="space-y-6"><div className="rounded-[1.5rem] bg-gradient-to-br from-[#721100] to-[#24130e] p-5 text-white sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="break-words text-xs font-black uppercase tracking-[.12em] text-[#f6b34c]">{assignment.clients?.organization_name || assignment.clients?.email || "MLS assignment"}</p><h3 className="mt-2 break-words text-2xl font-black">{assignment.service_type}</h3><p className="mt-3 break-words text-sm text-white/70">{formatDate(assignment.start_at)} · {assignment.delivery_mode}</p></div><div className="flex max-w-full flex-wrap gap-2"><Badge value={assignment.status} /><Badge value={assignment.payment_status} /></div></div></div><ProfileSnapshot fields={[["Location", assignment.delivery_mode === "VRI" ? assignment.meeting_link || "Virtual" : assignment.location_name || [assignment.city, assignment.state].filter(Boolean).join(", ")], ["Specialty", assignment.specialty], ["Language", assignment.language_preferences], ["Participants", `${assignment.deaf_participants || 0} Deaf · ${assignment.hearing_participants || 0} hearing`], ["Team requested", assignment.team_requested ? "Yes" : "No"], ["CDI requested", assignment.cdi_requested ? "Yes" : "No"], ["PO number", assignment.purchase_order_number], ["Client reference", assignment.client_reference]]} /><Card className="shadow-none"><SectionHeader eyebrow="Details" title="Assignment context" /><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{assignment.description || "No assignment description provided."}</p>{assignment.preparation_materials && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-slate-400">Preparation</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{assignment.preparation_materials}</p></div>}</Card><Card className="shadow-none"><SectionHeader eyebrow="Staffing" title="Assigned interpreters" /><div className="mt-5 space-y-3">{team.map((link) => <div key={link.id} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#721100]/10 font-black text-[#721100]">{(link.interpreters?.first_name || link.interpreters?.email || "?")[0]}</span><div className="min-w-0"><p className="break-words font-black">{`${link.interpreters?.first_name || ""} ${link.interpreters?.last_name || ""}`.trim() || link.interpreters?.email}</p><p className="break-words text-xs leading-5 text-slate-400">{pretty(link.role)}{link.agreed_rate ? ` · ${formatMoney(link.agreed_rate)}/hr` : ""}</p></div><div className="col-span-2 flex min-w-0 flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end"><Badge value={link.status} />{role === "admin" && <Button tone="danger" onClick={() => actions.removeInterpreter(link.id)}>Remove</Button>}</div></div>)}{!team.length && <EmptyState icon={Users} title="Not staffed yet" text="Assign an interpreter directly or accept a bid." />}</div>{role === "admin" && <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 md:grid-cols-4"><Field name="Interpreter" className="md:col-span-2"><select className={INPUT} value={interpreterId} onChange={(event) => setInterpreterId(event.target.value)}><option value="">Choose</option>{interpreters.filter((interpreter) => !team.some((link) => link.interpreter_id === interpreter.id)).map((interpreter) => <option key={interpreter.id} value={interpreter.id}>{`${interpreter.first_name || ""} ${interpreter.last_name || ""}`.trim() || interpreter.email}</option>)}</select></Field><Field name="Role"><select className={INPUT} value={roleType} onChange={(event) => setRoleType(event.target.value)}><option value="interpreter">Interpreter</option><option value="team">Team interpreter</option><option value="cdi">CDI</option></select></Field><Field name="Agreed rate"><input className={INPUT} type="number" min="0" step="0.01" value={agreedRate} onChange={(event) => setAgreedRate(event.target.value)} /></Field><div className="md:col-span-4"><Button disabled={!interpreterId} onClick={() => actions.assignInterpreter({ assignmentId: assignment.id, interpreterId, role: roleType, agreedRate })}>Assign interpreter</Button></div></div>}</Card>{role === "admin" && <Card className="shadow-none"><SectionHeader eyebrow="Admin controls" title="Status and billing" /><div className="mt-5 grid gap-4 md:grid-cols-2"><Field name="Confirmation status"><select className={INPUT} value={assignment.status} onChange={(event) => actions.updateAssignment(assignment, { status: event.target.value })}><option value="draft">Draft</option><option value="pending_confirmation">Pending confirmation</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></Field><Field name="Payment status"><select className={INPUT} value={assignment.payment_status} onChange={(event) => actions.updateAssignment(assignment, { paymentStatus: event.target.value })}><option value="not_invoiced">Not invoiced</option><option value="pending_payment">Pending payment</option><option value="paid">Paid</option><option value="void">Void</option></select></Field><Field name="Invoice number"><input className={INPUT} value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} /></Field><Field name="Invoice amount"><input className={INPUT} type="number" min="0" step="0.01" value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} /></Field><Field name="Admin notes" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-28")} value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} /></Field></div><div className="mt-5"><Button onClick={() => actions.updateAssignment(assignment, { invoiceNumber, invoiceAmount, adminNotes })}>Save billing details</Button></div></Card>}</div>;
}

export function AccountDetail({ type, record, workspace, actions, busyDoc }) {
  if (!record) return null;
  const view = type === "client" ? { profile: record, documents: record.client_documents || [], documentRequests: workspace.admin?.documentRequests?.filter((request) => request.client_id === record.id) || [] } : { profile: record, documents: record.interpreter_documents || [], documentRequests: workspace.admin?.documentRequests?.filter((request) => request.interpreter_id === record.id) || [] };
  return <div className="space-y-6"><div className="rounded-[1.5rem] bg-gradient-to-br from-[#721100] to-[#24130e] p-6 text-white"><p className="text-xs font-black uppercase tracking-[.15em] text-[#f6b34c]">{type === "client" ? "Client account" : "Interpreter roster"}</p><h3 className="mt-2 text-2xl font-black">{type === "client" ? record.organization_name || record.email : `${record.first_name || ""} ${record.last_name || ""}`.trim() || record.email}</h3><p className="mt-2 text-sm text-white/65">{record.email}</p></div>{type === "client" ? <ProfileSnapshot fields={[["Contact", record.primary_contact_name], ["Phone", record.phone], ["Location", [record.city, record.state].filter(Boolean).join(", ")], ["Industry", record.industry], ["Billing email", record.billing_email], ["Preferred contact", record.preferred_contact_method], ["Default service", record.default_service_type], ["Status", pretty(record.account_status)]]} /> : <ProfileSnapshot fields={[["Credentials", record.credentials], ["Location", record.current_location || [record.city, record.state].filter(Boolean).join(", ")], ["Modalities", record.modalities], ["Settings", record.areas_of_experience], ["Experience", record.years_experience], ["On-site rate", record.onsite_rate], ["VRI rate", record.vri_rate], ["Status", pretty(record.roster_status)]]} />}<div className="flex flex-wrap gap-3"><Button icon={Settings2} onClick={() => actions.editAccount(type, record)}>Edit profile</Button><Button tone="soft" icon={FileText} onClick={() => actions.requestAccountDocument(type, record)}>Request document</Button></div><DocumentsPanel audience={type} view={view} busyDoc={busyDoc} admin /></div>;
}
