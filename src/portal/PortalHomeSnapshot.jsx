import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  FileSignature,
  FileWarning,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge, Card, Hero, Metric, SectionHeader, formatDate, formatMoney } from "./ui";
import { formatInPortalTimeZone } from "./timezones";
import { orderedLayoutKeys } from "./LayoutCustomizer";
import PortalWidgets from "./PortalWidgets";
import { firstNameFromDisplayName, portalDisplayName } from "./portalIdentity";
import { ClientAssignmentCard } from "./clientServiceExperience";
import { AdminOperationsCard, InterpreterWorkCard, adminAssignmentMeta, recordsForAssignment } from "./agencyWorkflowExperience";
import { INTERPRETER_REQUIRED_DOCUMENTS } from "./forms";

const SNAPSHOT_NOW = Date.now();

function Action({ children, onClick, tone = "primary" }) {
  const style = tone === "gold"
    ? "bg-[#dd7d00] text-white"
    : "bg-white text-[#721100] shadow";
  return <button type="button" onClick={onClick} className={`rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 ${style}`}>{children}</button>;
}

function ViewAll({ children = "View all", onClick }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-black text-[#721100] transition hover:gap-2">{children}<ArrowRight size={14} /></button>;
}

function QueueItem({ icon: Icon = ClipboardCheck, title, text, badge, onClick, tone = "gold" }) {
  const colors = {
    gold: "bg-amber-50 text-[#dd7d00]",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return <button type="button" onClick={onClick} className="group grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#dd7d00]/45 hover:shadow-md sm:grid-cols-[auto_minmax(0,1fr)_auto]">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[tone] || colors.gold}`}><Icon size={17} /></span>
    <span className="min-w-0 flex-1">
      <span className="block break-words font-black text-slate-900">{title}</span>
      {text && <span className="mt-1 block break-words text-xs leading-5 text-slate-500">{text}</span>}
    </span>
    <span className="col-start-2 sm:col-auto">{badge ? <Badge value={badge} /> : <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#721100]" />}</span>
  </button>;
}

function ScheduleItem({ assignment, onClick, note }) {
  const date = assignment.start_at ? new Date(assignment.start_at) : null;
  const month = date ? formatInPortalTimeZone(date, { year: undefined, day: undefined, hour: undefined, minute: undefined, timeZoneName: undefined }) : "TBD";
  const day = date ? formatInPortalTimeZone(date, { year: undefined, month: undefined, hour: undefined, minute: undefined, timeZoneName: undefined }) : "—";
  return <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-[#dd7d00]/45 hover:bg-white hover:shadow sm:gap-4">
    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#721100] text-white sm:h-14 sm:w-14"><span className="text-[9px] font-black uppercase tracking-[.1em] text-[#f6b34c] sm:text-[10px]">{month}</span><span className="text-lg font-black leading-none sm:text-xl">{day}</span></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">{assignment.service_type || "Interpreter service"}</span><span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{note || `${formatDate(assignment.start_at)} · ${assignment.delivery_mode || "Details in portal"}`}</span></span>
    <ArrowRight size={15} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#721100]" />
  </button>;
}

function CompactEmpty({ icon: Icon, title, text }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Icon size={20} /></span><p className="mt-3 font-black text-slate-900">{title}</p><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{text}</p></div>;
}

function Announcements({ items = [], actions }) {
  return <Card>
    <SectionHeader title="Announcements" action={<ViewAll onClick={() => actions.go("communications")}>Open all</ViewAll>} />
    <div className="mt-5 space-y-3">
      {items.slice(0, 3).map((item) => <button key={item.id} type="button" onClick={() => actions.go("communications")} className="flex w-full gap-3 rounded-2xl bg-slate-50 p-4 text-left transition hover:bg-[#fff8f2]">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.read_at ? "bg-slate-300" : "bg-[#dd7d00]"}`} />
        <span className="min-w-0 flex-1"><span className="block break-words text-sm font-black text-slate-900">{item.title}</span><span className="mt-1 line-clamp-3 block break-words text-xs leading-5 text-slate-500">{item.body}</span></span>
        {!item.read_at && <span className="text-[10px] font-black uppercase tracking-[.1em] text-[#dd7d00]">New</span>}
      </button>)}
      {!items.length && <CompactEmpty icon={Megaphone} title="No announcements" />}
    </div>
  </Card>;
}

function DashboardSections({ role, layout, sections }) {
  const hidden = new Set(layout?.hidden_home_sections || []);
  return <div className="space-y-6">{orderedLayoutKeys(role, "home", layout?.home_order).filter((key) => sections[key] && !hidden.has(key)).map((key) => <div key={key} data-layout-section={key}>{sections[key]}</div>)}</div>;
}

function AdminHome({ workspace, app, v2, actions, layout }) {
  const assignments = app?.assignments || workspace.admin?.assignments || [];
  const active = assignments.filter((item) => !["cancelled", "closed", "paid"].includes(item.lifecycle_status));
  const upcoming = active.filter((item) => new Date(item.start_at).getTime() >= SNAPSHOT_NOW).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const unstaffed = upcoming.filter((item) => !(item.assignment_interpreters || []).length);
  const staffed = upcoming.filter((item) => (item.assignment_interpreters || []).length);
  const pendingTimes = (v2?.timeEntries || []).filter((item) => item.status === "submitted");
  const pendingExpenses = (v2?.expenses || []).filter((item) => item.status === "submitted");
  const pendingOnboarding = (v2?.onboarding || []).filter((item) => !["completed", "declined"].includes(item.status));
  const pendingDocs = (workspace.admin?.documentRequests || []).filter((item) => ["requested", "viewed", "overdue"].includes(item.status));
  const financeReviews = pendingTimes.length + pendingExpenses.length;
  const operationalActions = active.map((assignment) => { const records = recordsForAssignment(v2, assignment.id); return { assignment, records, meta: adminAssignmentMeta(assignment, records) }; }).filter(({ meta }) => meta.stage !== 3 && meta.title !== "Archived").sort((a, b) => a.meta.stage - b.meta.stage);
  const queue = [
    ...operationalActions.slice(0, 4).map(({ assignment, meta }) => ({ icon: meta.stage <= 1 ? FileSignature : meta.stage === 2 ? Users : CircleDollarSign, title: meta.title, text: `${assignment.service_type} · ${assignment.clients?.organization_name || assignment.clients?.primary_contact_name || "Client"}`, badge: assignment.lifecycle_status || assignment.status, onClick: () => actions.openAssignment(assignment), tone: meta.tone === "rose" ? "rose" : meta.tone === "violet" ? "violet" : meta.tone === "blue" ? "blue" : "gold" })),
    ...(pendingTimes.length ? [{ icon: CircleDollarSign, title: `${pendingTimes.length} time entr${pendingTimes.length === 1 ? "y" : "ies"} ready for review`, text: "Approve actual time before billing and contractor payment.", badge: "submitted", onClick: () => actions.go("finance"), tone: "blue" }] : []),
    ...(pendingExpenses.length ? [{ icon: CircleDollarSign, title: `${pendingExpenses.length} expense${pendingExpenses.length === 1 ? "" : "s"} ready for review`, text: "Confirm reimbursement and client-billing eligibility.", badge: "submitted", onClick: () => actions.go("finance"), tone: "blue" }] : []),
    ...(pendingOnboarding.length ? [{ icon: Users, title: `${pendingOnboarding.length} onboarding record${pendingOnboarding.length === 1 ? "" : "s"} in progress`, text: "Screening, credentials, insurance, or agreements need attention.", badge: "in_progress", onClick: () => actions.go("compliance"), tone: "violet" }] : []),
    ...(pendingDocs.length ? [{ icon: FileWarning, title: `${pendingDocs.length} document request${pendingDocs.length === 1 ? "" : "s"} outstanding`, text: "Review or follow up from Compliance.", badge: "requested", onClick: () => actions.go("compliance"), tone: "gold" }] : []),
  ];
  const statusText = queue.length ? `${queue.length} priority item${queue.length === 1 ? "" : "s"} need a decision.` : "All operational queues are clear.";

  const sections = {
    hero: <Hero title="MLS command center" text={statusText} actions={<><Action tone="gold" onClick={() => actions.go("assignments")}>Operations</Action><Action onClick={() => actions.go("communications")}>Communications</Action><Action onClick={() => actions.go("settings")}>Customize home</Action></>} />,
    metrics: <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} name="Need staffing" value={unstaffed.length} note="Assignments without a team" color="#be123c" onClick={() => actions.go("assignments")} />
      <Metric icon={CircleDollarSign} name="Financial reviews" value={financeReviews} note="Time and expenses submitted" color="#1d4ed8" onClick={() => actions.go("finance")} />
      <Metric icon={ShieldCheck} name="Onboarding" value={pendingOnboarding.length} note="Interpreter records in progress" color="#6d28d9" onClick={() => actions.go("compliance")} />
      <Metric icon={Bell} name="Unread updates" value={app?.unreadCount || 0} note="Across the MLS portal" color="#dd7d00" onClick={() => actions.go("notifications")} />
    </div>,
    widgets: layout?.enabled_widgets?.length ? <PortalWidgets layout={layout} /> : null,
    decision_queue: <Card>
        <SectionHeader title="Decision queue" action={<ViewAll onClick={() => actions.go("assignments")}>Assignments</ViewAll>} />
        <div className="mt-5 space-y-3">{queue.slice(0, 8).map((item, index) => <QueueItem key={`${item.title}-${index}`} {...item} />)}{!queue.length && <CompactEmpty icon={ShieldCheck} title="Queue cleared" />}</div>
      </Card>,
    priority_services: operationalActions.length ? <section><SectionHeader title="Priority services" action={<ViewAll onClick={() => actions.go("assignments")}>Open operations</ViewAll>} /><div className="mt-4 space-y-4">{operationalActions.slice(0, 2).map(({ assignment, records }) => <AdminOperationsCard key={assignment.id} assignment={assignment} records={records} onOpen={actions.openAssignment} />)}</div></section> : null,
    staffed_schedule: <Card>
          <SectionHeader title="Staffed schedule" action={<ViewAll onClick={() => actions.go("assignments")} />} />
          <div className="mt-5 space-y-3">{staffed.slice(0, 4).map((item) => <ScheduleItem key={item.id} assignment={item} onClick={() => actions.openAssignment(item)} note={`${formatDate(item.start_at)} · ${(item.assignment_interpreters || []).length} assigned`} />)}{!staffed.length && <CompactEmpty icon={CalendarDays} title="No staffed assignments" />}</div>
        </Card>,
    announcements: <Announcements items={v2?.announcements} actions={actions} />,
  };
  return <DashboardSections role="admin" layout={layout} sections={sections} />;
}

function ClientHome({ workspace, app, v2, actions, layout }) {
  const profile = workspace.client?.profile || {};
  const assignments = app?.assignments || workspace.client?.assignments || [];
  const upcoming = assignments.filter((item) => new Date(item.start_at).getTime() >= SNAPSHOT_NOW && !["cancelled", "closed"].includes(item.lifecycle_status)).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const quotes = (v2?.quotes || []).filter((item) => item.status === "sent");
  const agreements = (v2?.agreements || []).filter((item) => ["sent", "viewed"].includes(item.status));
  const invoices = (v2?.invoices || []).filter((item) => !["paid", "void", "refunded"].includes(item.status));
  const due = invoices.reduce((sum, item) => sum + Number(item.balance_due || 0), 0);
  const docs = (workspace.client?.documentRequests || []).filter((item) => ["requested", "viewed", "overdue"].includes(item.status));
  const queue = [
    ...quotes.map((item) => ({ icon: FileSignature, title: `Respond to quote ${item.quote_number}`, text: `${item.assignments?.service_type || "Interpreter request"} · ${formatMoney(item.total_amount)}`, badge: "sent", onClick: () => actions.go("requests"), tone: "blue" })),
    ...agreements.map((item) => ({ icon: FileSignature, title: "Sign your service agreement", text: `${item.assignments?.service_type || item.template_name} · ${formatDate(item.assignments?.start_at)}`, badge: item.status, onClick: () => actions.go("requests"), tone: "violet" })),
    ...(docs.length ? [{ icon: FileWarning, title: `Upload ${docs.length} requested document${docs.length === 1 ? "" : "s"}`, text: "MLS needs these files to continue processing your account.", badge: "requested", onClick: () => actions.go("documents"), tone: "gold" }] : []),
    ...(due > 0 ? [{ icon: CircleDollarSign, title: `${formatMoney(due)} balance due`, text: `${invoices.length} open invoice${invoices.length === 1 ? "" : "s"} in Billing.`, badge: "pending_payment", onClick: () => actions.go("billing"), tone: "rose" }] : []),
  ];

  const sections = {
    hero: <Hero title={profile.organization_name ? `Welcome, ${profile.organization_name}` : "Your MLS service hub"} text={queue.length ? `${queue.length} item${queue.length === 1 ? "" : "s"} need your attention.` : "You’re caught up."} actions={<><Action tone="gold" onClick={actions.openRequest}>Request an interpreter</Action><Action onClick={() => actions.go("communications")}>Message MLS</Action><Action onClick={() => actions.go("settings")}>Customize home</Action></>} />,
    metrics: <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={ClipboardCheck} name="Needs action" value={queue.length} note="Approvals, files, or billing" color="#be123c" onClick={() => actions.go("requests")} />
      <Metric icon={CalendarDays} name="Upcoming services" value={upcoming.length} note="Confirmed and in progress" onClick={() => actions.go("assignments")} />
      <Metric icon={FileWarning} name="Requested files" value={docs.length} note="Secure document requests" color="#6d28d9" onClick={() => actions.go("documents")} />
      <Metric icon={CircleDollarSign} name="Balance due" value={formatMoney(due)} note={`${invoices.length} open invoice${invoices.length === 1 ? "" : "s"}`} color="#c2410c" onClick={() => actions.go("billing")} />
    </div>,
    widgets: layout?.enabled_widgets?.length ? <PortalWidgets layout={layout} /> : null,
    action_queue: <Card>
        <SectionHeader title="Your action queue" action={<ViewAll onClick={() => actions.go("requests")}>Open requests</ViewAll>} />
        <div className="mt-5 space-y-3">{queue.slice(0, 8).map((item, index) => <QueueItem key={`${item.title}-${index}`} {...item} />)}{!queue.length && <CompactEmpty icon={ShieldCheck} title="You’re caught up" text="No quotes, agreements, documents, or payments are waiting." />}</div>
      </Card>,
    next_service: upcoming[0] ? <section><SectionHeader title="Your next service" /><div className="mt-4"><ClientAssignmentCard assignment={upcoming[0]} onOpen={actions.openAssignment} onRepeat={actions.openRepeatRequest} onMessage={() => actions.go("communications")} /></div></section> : null,
    upcoming_services: <Card>
          <SectionHeader title="Upcoming services" action={<ViewAll onClick={() => actions.go("assignments")} />} />
          <div className="mt-5 space-y-3">{upcoming.slice(1, 5).map((item) => <ScheduleItem key={item.id} assignment={item} onClick={() => actions.openAssignment(item)} />)}{upcoming.length <= 1 && <CompactEmpty icon={CalendarDays} title={upcoming.length ? "No other services scheduled" : "Nothing scheduled"} />}</div>
        </Card>,
    announcements: <Announcements items={v2?.announcements} actions={actions} />,
  };
  return <DashboardSections role="client" layout={layout} sections={sections} />;
}

function InterpreterHome({ workspace, operations, app, v2, actions, identityName, layout }) {
  const displayName = portalDisplayName({ role: "interpreter", workspace, fallbackName: identityName });
  const firstName = firstNameFromDisplayName(displayName);
  const assignments = app?.assignments || [];
  const upcoming = assignments.filter((item) => new Date(item.start_at).getTime() >= SNAPSHOT_NOW && !["cancelled", "closed"].includes(item.lifecycle_status)).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const opportunities = operations?.opportunities || [];
  const payments = (v2?.payments || []).filter((item) => !["paid", "void"].includes(item.contractor_payment_status));
  const expiring = (v2?.credentials || []).filter((item) => item.expires_on && new Date(item.expires_on).getTime() <= SNAPSHOT_NOW + 60 * 864e5);
  const docs = (workspace.interpreter?.documentRequests || []).filter((item) => ["requested", "viewed", "overdue"].includes(item.status));
  const uploadedDocumentTypes = new Set((workspace.interpreter?.documents || []).map((item) => item.document_type));
  const requiredDocumentTypes = INTERPRETER_REQUIRED_DOCUMENTS.map(([type]) => type);
  const missingRequiredDocuments = requiredDocumentTypes.filter((type) => !uploadedDocumentTypes.has(type));
  const training = (operations?.training || []).filter((course) => course.progress?.status !== "completed");
  const timeEntries = v2?.timeEntries || [];
  const completedNeedingTime = assignments.filter((assignment) => assignment.end_at && new Date(assignment.end_at).getTime() < SNAPSHOT_NOW && !timeEntries.some((entry) => (entry.assignment_id || entry.assignments?.id) === assignment.id));
  const onboardingIncomplete = v2?.onboarding && !["completed", "declined"].includes(v2.onboarding.status);
  const tasks = [
    ...(onboardingIncomplete ? [{ icon: Users, title: "Complete your MLS onboarding", text: `Current stage: ${v2.onboarding.stage || "profile review"}.`, badge: v2.onboarding.status || "in_progress", onClick: () => actions.go("documents"), tone: "violet" }] : []),
    ...(training.length ? [{ icon: BookOpenCheck, title: `${training.length} learning item${training.length === 1 ? "" : "s"} to complete`, text: "Review required and recommended MLS material.", badge: "in_progress", onClick: () => actions.go("learning"), tone: "blue" }] : []),
    ...(docs.length ? [{ icon: FileWarning, title: `Upload ${docs.length} requested document${docs.length === 1 ? "" : "s"}`, text: "Open Documents to send the requested files securely.", badge: "requested", onClick: () => actions.go("documents"), tone: "gold" }] : []),
    ...(missingRequiredDocuments.length ? [{ icon: FileWarning, title: `${missingRequiredDocuments.length} required document${missingRequiredDocuments.length === 1 ? "" : "s"} missing`, text: "Complete Required Documents to receive broadcasts and recommended opportunities.", badge: "required", onClick: () => actions.go("documents"), tone: "rose" }] : []),
    ...(completedNeedingTime.length ? [{ icon: CircleDollarSign, title: `${completedNeedingTime.length} service closeout${completedNeedingTime.length === 1 ? "" : "s"} need actual time`, text: "Submit time and any approved expenses so MLS can complete billing and prepare your payment.", badge: "time_submitted", onClick: () => actions.go("payments"), tone: "rose" }] : []),
    ...expiring.slice(0, 2).map((item) => ({ icon: FileWarning, title: `${item.credential_type || "Credential"} expires soon`, text: `Expires ${item.expires_on}.`, badge: "overdue", onClick: () => actions.go("documents"), tone: "rose" })),
  ];
  const nextAssignment = upcoming[0];

  const sections = {
    hero: <Hero title={`Welcome back${firstName ? `, ${firstName}` : ""}`} text={tasks.length ? <button type="button" onClick={tasks[0].onClick} className="rounded-md text-left font-bold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">{tasks.length} readiness task{tasks.length === 1 ? "" : "s"} need attention. Open the next task.</button> : "You’re assignment-ready."} actions={<><Action tone="gold" onClick={() => actions.go("work")}>Work</Action><Action onClick={() => actions.go("schedule")}>Availability</Action><Action onClick={() => actions.go("settings")}>Customize home</Action></>} />,
    metrics: <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={CalendarDays} name="Assigned work" value={upcoming.length} note={nextAssignment ? `Next: ${formatDate(nextAssignment.start_at, { month: "short", day: "numeric" })}` : "No upcoming assignments"} onClick={() => actions.go("work")} />
      <Metric icon={Sparkles} name="Recommended" value={opportunities.length} note="Open assignments matched to you" color="#4338ca" onClick={() => actions.go("work")} />
      <Metric icon={ClipboardCheck} name="Readiness tasks" value={tasks.length} note={tasks.length ? "Open the next item needing attention" : "You’re assignment-ready"} color={tasks.length ? "#be123c" : "#15803d"} onClick={tasks.length ? tasks[0].onClick : undefined} />
      <Metric icon={CircleDollarSign} name="Payment activity" value={payments.length} note="Ready or processing" color="#15803d" onClick={() => actions.go("payments")} />
    </div>,
    widgets: layout?.enabled_widgets?.length ? <PortalWidgets layout={layout} /> : null,
    next_work: nextAssignment ? <section><SectionHeader title="Your next service" /><div className="mt-4"><InterpreterWorkCard assignment={nextAssignment} records={recordsForAssignment(v2, nextAssignment.id)} onOpen={actions.openAssignment} onTimePay={() => actions.go("payments")} /></div></section> : null,
    recommended: <Card>
          <SectionHeader title="Recommended for you" action={<ViewAll onClick={() => actions.go("work")}>Browse work</ViewAll>} />
          <div className="mt-5 space-y-3">{opportunities.slice(0, 5).map((item) => { const assignment = item.assignments || {}; return <QueueItem key={item.id} icon={Sparkles} title={assignment.service_type || "Interpreter opportunity"} text={`${formatDate(assignment.start_at)}${assignment.delivery_mode ? ` · ${assignment.delivery_mode}` : ""}${assignment.city || assignment.state ? ` · ${[assignment.city, assignment.state].filter(Boolean).join(", ")}` : ""}`} badge={item.status || "open"} onClick={() => actions.submitBid(item)} tone="green" />; })}{!opportunities.length && <CompactEmpty icon={Sparkles} title="No matches" />}</div>
        </Card>,
    readiness: tasks.length > 0 ? <Card>
          <SectionHeader title="Readiness tasks" />
          <div className="mt-5 space-y-3">{tasks.map((item, index) => <QueueItem key={`${item.title}-${index}`} {...item} />)}</div>
        </Card> : null,
    schedule: <Card>
          <SectionHeader title="Your schedule" action={<ViewAll onClick={() => actions.go("work")} />} />
          <div className="mt-5 space-y-3">{upcoming.slice(0, 4).map((item) => <ScheduleItem key={item.id} assignment={item} onClick={() => actions.openAssignment(item)} />)}{!upcoming.length && <CompactEmpty icon={CalendarDays} title="No assigned work" />}</div>
        </Card>,
    announcements: <Announcements items={v2?.announcements} actions={actions} />,
  };
  return <DashboardSections role="interpreter" layout={layout} sections={sections} />;
}

export default function PortalHomeSnapshot({ role, workspace, operations, app, v2, actions, identityName, layout }) {
  if (role === "admin") return <AdminHome workspace={workspace} app={app} v2={v2} actions={actions} layout={layout} />;
  if (role === "client") return <ClientHome workspace={workspace} app={app} v2={v2} actions={actions} layout={layout} />;
  return <InterpreterHome workspace={workspace} operations={operations} app={app} v2={v2} actions={actions} identityName={identityName} layout={layout} />;
}
