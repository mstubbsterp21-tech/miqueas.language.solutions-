import { AlertCircle, Bell, BookOpenCheck, CalendarDays, CircleDollarSign, ClipboardCheck, FileSignature, FileWarning, MessageSquare, ShieldCheck, Users } from "lucide-react";
import { Badge, Card, EmptyState, Hero, Metric, SectionHeader, formatDate, formatMoney } from "./ui";

function Action({ children, onClick, tone = "primary" }) {
  return <button type="button" onClick={onClick} className={tone === "gold" ? "rounded-2xl bg-[#dd7d00] px-4 py-3 text-sm font-black text-white" : "rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#721100] shadow"}>{children}</button>;
}

function AttentionItem({ title, text, badge, onClick }) {
  return <button type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#dd7d00]/45 hover:bg-white hover:shadow"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#dd7d00]" /><span className="min-w-0 flex-1"><span className="block font-black text-slate-900">{title}</span>{text && <span className="mt-1 block text-xs leading-5 text-slate-500">{text}</span>}</span>{badge && <Badge value={badge} />}</button>;
}

function AdminHome({ workspace, app, operations, v2, actions }) {
  const assignments = app?.assignments || workspace.admin?.assignments || [];
  const active = assignments.filter((item) => !["cancelled", "closed", "paid"].includes(item.lifecycle_status));
  const upcoming = active.filter((item) => new Date(item.start_at).getTime() >= Date.now()).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const unstaffed = upcoming.filter((item) => !(item.assignment_interpreters || []).length);
  const pendingTimes = (v2?.timeEntries || []).filter((item) => item.status === "submitted");
  const pendingExpenses = (v2?.expenses || []).filter((item) => item.status === "submitted");
  const pendingOnboarding = (v2?.onboarding || []).filter((item) => !["completed", "declined"].includes(item.status));
  const pendingDocs = (workspace.admin?.documentRequests || []).filter((item) => ["requested", "viewed", "overdue"].includes(item.status));
  const receivables = (v2?.invoices || []).filter((item) => !["paid", "void", "refunded"].includes(item.status));
  const attention = [
    ...unstaffed.slice(0, 3).map((item) => ({ title: `Staff ${item.service_type}`, text: `${formatDate(item.start_at)} · ${item.clients?.organization_name || item.clients?.primary_contact_name || "Client"}`, badge: "pending_confirmation", action: () => actions.openAssignment(item) })),
    ...(pendingTimes.length ? [{ title: `${pendingTimes.length} time entr${pendingTimes.length === 1 ? "y" : "ies"} to review`, text: "Approve actual time before billing and contractor payment.", badge: "submitted", action: () => actions.go("finance") }] : []),
    ...(pendingExpenses.length ? [{ title: `${pendingExpenses.length} expense${pendingExpenses.length === 1 ? "" : "s"} to review`, text: "Review reimbursement and client-billing eligibility.", badge: "submitted", action: () => actions.go("finance") }] : []),
    ...(pendingOnboarding.length ? [{ title: `${pendingOnboarding.length} interpreter onboarding record${pendingOnboarding.length === 1 ? "" : "s"} open`, text: "Credentials, screening, insurance, or agreements still need attention.", badge: "in_progress", action: () => actions.go("compliance") }] : []),
    ...(pendingDocs.length ? [{ title: `${pendingDocs.length} requested document${pendingDocs.length === 1 ? "" : "s"} outstanding`, text: "Follow up on requested client or interpreter files.", badge: "requested", action: () => actions.go("compliance") }] : []),
  ];
  return <div className="space-y-6"><Hero title="MLS today" text="A live snapshot of staffing, approvals, money, compliance, and communications." actions={<><Action tone="gold" onClick={() => actions.go("assignments")}>Manage assignments</Action><Action onClick={() => actions.go("communications")}>Open communications</Action></>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={ClipboardCheck} name="Active work" value={active.length} note={`${unstaffed.length} need staffing`} /><Metric icon={Bell} name="Unread" value={app?.unreadCount || 0} note="Portal notifications" color="#dd7d00" /><Metric icon={Users} name="Onboarding" value={pendingOnboarding.length} note="Open interpreter records" color="#4338ca" /><Metric icon={CircleDollarSign} name="Receivables" value={receivables.length} note="Unpaid or processing" color="#c2410c" /><Metric icon={FileWarning} name="Documents" value={pendingDocs.length} note="Outstanding requests" color="#7c3aed" /></div><div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><Card><SectionHeader title="Needs attention" text="Highest-priority items across MLS operations." /><div className="mt-5 space-y-3">{attention.slice(0, 8).map((item, index) => <AttentionItem key={`${item.title}-${index}`} {...item} onClick={item.action} />)}{!attention.length && <EmptyState icon={ShieldCheck} title="Nothing urgent" text="Your staffing, review, and compliance queues are clear." />}</div></Card><Card><SectionHeader title="Next assignments" text="Upcoming work in chronological order." /><div className="mt-5 space-y-3">{upcoming.slice(0, 6).map((item) => <AttentionItem key={item.id} title={item.service_type} text={`${formatDate(item.start_at)} · ${item.delivery_mode} · ${(item.assignment_interpreters || []).length} assigned`} badge={item.lifecycle_status || item.status} onClick={() => actions.openAssignment(item)} />)}{!upcoming.length && <EmptyState icon={CalendarDays} title="No upcoming assignments" text="New requests will appear here." />}</div></Card></div></div>;
}

function ClientHome({ workspace, app, v2, actions }) {
  const profile = workspace.client?.profile || {};
  const assignments = app?.assignments || workspace.client?.assignments || [];
  const upcoming = assignments.filter((item) => new Date(item.start_at).getTime() >= Date.now() && !["cancelled", "closed"].includes(item.lifecycle_status)).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const quotes = (v2?.quotes || []).filter((item) => item.status === "sent");
  const agreements = (v2?.agreements || []).filter((item) => ["sent", "viewed"].includes(item.status));
  const invoices = (v2?.invoices || []).filter((item) => !["paid", "void", "refunded"].includes(item.status));
  const due = invoices.reduce((sum, item) => sum + Number(item.balance_due || 0), 0);
  const docs = (workspace.client?.documentRequests || []).filter((item) => ["requested", "viewed", "overdue"].includes(item.status));
  const attention = [
    ...quotes.map((item) => ({ title: `Quote ${item.quote_number} needs your response`, text: `${item.assignments?.service_type || "Interpreter request"} · ${formatMoney(item.total_amount)}`, badge: "sent", action: () => actions.go("requests") })),
    ...agreements.map((item) => ({ title: "Agreement ready to sign", text: `${item.assignments?.service_type || item.template_name} · ${formatDate(item.assignments?.start_at)}`, badge: item.status, action: () => actions.go("requests") })),
    ...(docs.length ? [{ title: `${docs.length} requested document${docs.length === 1 ? "" : "s"} outstanding`, text: "Upload the requested file so MLS can continue processing your account.", badge: "requested", action: () => actions.go("documents") }] : []),
    ...(due > 0 ? [{ title: `${formatMoney(due)} balance due`, text: `${invoices.length} open invoice${invoices.length === 1 ? "" : "s"}.`, badge: "pending_payment", action: () => actions.go("billing") }] : []),
  ];
  return <div className="space-y-6"><Hero title={`Welcome${profile.organization_name ? `, ${profile.organization_name}` : ""}.`} text="Your live snapshot of requests, approvals, assignments, documents, messages, and billing." actions={<><Action tone="gold" onClick={actions.openRequest}>Request interpreter</Action><Action onClick={() => actions.go("communications")}>Message MLS</Action></>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={CalendarDays} name="Upcoming" value={upcoming.length} note="Scheduled assignments" /><Metric icon={Bell} name="Unread" value={app?.unreadCount || 0} note="Portal notifications" color="#dd7d00" /><Metric icon={FileSignature} name="Approvals" value={quotes.length + agreements.length} note="Quotes and agreements" color="#4338ca" /><Metric icon={FileWarning} name="Documents" value={docs.length} note="Requested files" color="#7c3aed" /><Metric icon={CircleDollarSign} name="Balance due" value={formatMoney(due)} note={`${invoices.length} open invoice${invoices.length === 1 ? "" : "s"}`} color="#c2410c" /></div><div className="grid gap-5 xl:grid-cols-2"><Card><SectionHeader title="Needs your attention" text="Complete these items to keep requests moving." /><div className="mt-5 space-y-3">{attention.map((item, index) => <AttentionItem key={`${item.title}-${index}`} {...item} onClick={item.action} />)}{!attention.length && <EmptyState icon={ShieldCheck} title="You are caught up" text="There are no approvals, documents, or balances waiting." />}</div></Card><Card><SectionHeader title="Next assignments" text="Your nearest scheduled services." /><div className="mt-5 space-y-3">{upcoming.slice(0, 6).map((item) => <AttentionItem key={item.id} title={item.service_type} text={`${formatDate(item.start_at)} · ${item.delivery_mode}`} badge={item.lifecycle_status || item.status} onClick={() => actions.openAssignment(item)} />)}{!upcoming.length && <EmptyState icon={CalendarDays} title="No upcoming assignments" text="Submit a request whenever access is needed." />}</div></Card></div></div>;
}

function InterpreterHome({ workspace, operations, app, v2, actions }) {
  const profile = workspace.interpreter?.profile || {};
  const assignments = app?.assignments || [];
  const upcoming = assignments.filter((item) => new Date(item.start_at).getTime() >= Date.now() && !["cancelled", "closed"].includes(item.lifecycle_status)).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const opportunities = operations?.opportunities || [];
  const payments = (v2?.payments || []).filter((item) => !["paid", "void"].includes(item.contractor_payment_status));
  const expiring = (v2?.credentials || []).filter((item) => item.expires_on && new Date(item.expires_on).getTime() <= Date.now() + 60 * 864e5);
  const docs = (workspace.interpreter?.documentRequests || []).filter((item) => ["requested", "viewed", "overdue"].includes(item.status));
  const trainingIncomplete = (operations?.training || []).filter((course) => course.progress?.status !== "completed");
  const onboardingIncomplete = v2?.onboarding && !["completed", "declined"].includes(v2.onboarding.status);
  const attention = [
    ...(onboardingIncomplete ? [{ title: "Complete your MLS onboarding checklist", text: `Current stage: ${v2.onboarding.stage || "profile review"}.`, badge: v2.onboarding.status || "in_progress", action: () => actions.go("documents") }] : []),
    ...(trainingIncomplete.length ? [{ title: `${trainingIncomplete.length} training item${trainingIncomplete.length === 1 ? "" : "s"} to complete`, text: "Open Learning to review required and recommended material.", badge: "in_progress", action: () => actions.go("learning") }] : []),
    ...upcoming.slice(0, 2).map((item) => ({ title: `Prepare for ${item.service_type}`, text: `${formatDate(item.start_at)} · ${item.delivery_mode}${item.location_name ? ` · ${item.location_name}` : ""}`, badge: item.lifecycle_status || item.status, action: () => actions.openAssignment(item) })),
    ...(docs.length ? [{ title: `${docs.length} requested document${docs.length === 1 ? "" : "s"} outstanding`, text: "Upload the file requested by MLS.", badge: "requested", action: () => actions.go("documents") }] : []),
    ...expiring.slice(0, 2).map((item) => ({ title: `${item.credential_type || "Credential"} expires soon`, text: item.expires_on ? `Expires ${item.expires_on}` : "Review with MLS.", badge: "overdue", action: () => actions.go("documents") })),
    ...(payments.length ? [{ title: `${payments.length} payment record${payments.length === 1 ? "" : "s"} in progress`, text: "Review status and Found references in the Work center.", badge: "pending_payment", action: () => actions.go("work") }] : []),
  ];
  return <div className="space-y-6"><Hero title={`Welcome back${profile.first_name ? `, ${profile.first_name}` : ""}.`} text="Review assignments, opportunities, onboarding, documents, communications, training, and pay status." actions={<><Action tone="gold" onClick={() => actions.go("work")}>Open work center</Action><Action onClick={() => actions.go("communications")}>Open communications</Action></>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={CalendarDays} name="Upcoming" value={upcoming.length} note="Assigned work" /><Metric icon={Bell} name="Unread" value={app?.unreadCount || 0} note="Portal notifications" color="#dd7d00" /><Metric icon={ClipboardCheck} name="Opportunities" value={opportunities.length} note="Open for bidding" color="#4338ca" /><Metric icon={BookOpenCheck} name="Learning" value={trainingIncomplete.length} note="Incomplete items" color="#7c3aed" /><Metric icon={CircleDollarSign} name="Payments" value={payments.length} note="Ready or processing" color="#15803d" /></div><div className="grid gap-5 xl:grid-cols-2"><Card><SectionHeader title="Your checklist" text="Open an item to take the next required action." /><div className="mt-5 space-y-3">{attention.map((item, index) => <AttentionItem key={`${item.title}-${index}`} {...item} onClick={item.action} />)}{!attention.length && <EmptyState icon={ShieldCheck} title="You are assignment-ready" text="No urgent assignment, onboarding, training, document, or compliance items are waiting." />}</div></Card><Card><SectionHeader title="Next assignments" text="Open an assignment for team, preparation, location, and communications." /><div className="mt-5 space-y-3">{upcoming.slice(0, 6).map((item) => <AttentionItem key={item.id} title={item.service_type} text={`${formatDate(item.start_at)} · ${item.delivery_mode}`} badge={item.lifecycle_status || item.status} onClick={() => actions.openAssignment(item)} />)}{!upcoming.length && <EmptyState icon={CalendarDays} title="No upcoming assignments" text="Direct assignments and accepted bids will appear here." />}</div></Card></div></div>;
}

export default function PortalHomeSnapshot({ role, workspace, operations, app, v2, actions }) {
  if (role === "admin") return <AdminHome workspace={workspace} app={app} operations={operations} v2={v2} actions={actions} />;
  if (role === "client") return <ClientHome workspace={workspace} app={app} v2={v2} actions={actions} />;
  return <InterpreterHome workspace={workspace} operations={operations} app={app} v2={v2} actions={actions} />;
}
