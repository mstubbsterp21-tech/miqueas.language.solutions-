import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, CalendarDays, Check, CheckCheck, ChevronDown, ChevronUp,
  CircleDollarSign, ClipboardCheck, FileText, GraduationCap, Mail,
  MessageSquare, ShieldCheck, Trash2,
} from "lucide-react";
import { formatInPortalTimeZone, getPortalTimeZone } from "./timezones";

const categoryDetails = {
  assignment: { label: "Assignment", Icon: CalendarDays, iconClass: "bg-blue-500 text-white" },
  document: { label: "Document", Icon: FileText, iconClass: "bg-amber-500 text-white" },
  message: { label: "Message", Icon: MessageSquare, iconClass: "bg-emerald-500 text-white" },
  training: { label: "Training", Icon: GraduationCap, iconClass: "bg-violet-500 text-white" },
  payment: { label: "Billing", Icon: CircleDollarSign, iconClass: "bg-teal-500 text-white" },
  compliance: { label: "Compliance", Icon: ShieldCheck, iconClass: "bg-rose-500 text-white" },
  email: { label: "Email", Icon: Mail, iconClass: "bg-sky-500 text-white" },
  request: { label: "Request", Icon: ClipboardCheck, iconClass: "bg-orange-500 text-white" },
  general: { label: "MLS", Icon: Bell, iconClass: "bg-[#721100] text-white" },
};

function notificationMeta(category) {
  return categoryDetails[category] || categoryDetails.general;
}

function dayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: getPortalTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function groupName(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";
  if (dayKey(date) === dayKey(Date.now())) return "Today";
  if (dayKey(date) === dayKey(Date.now() - 864e5)) return "Yesterday";
  if (date.getTime() >= Date.now() - 7 * 864e5) return "This Week";
  return "Earlier";
}

function relativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return formatInPortalTimeZone(date, { year: undefined, hour: undefined, minute: undefined, timeZoneName: undefined });
}

function fullTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatInPortalTimeZone(date, {
    weekday: "short",
  });
}

function NotificationItem({ notification, actions }) {
  const meta = notificationMeta(notification.category);
  const { Icon } = meta;
  const unread = !notification.is_read;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -36, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="group relative overflow-hidden rounded-[1.45rem] border border-white/25 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,.22)] backdrop-blur-2xl"
    >
      <button
        type="button"
        onClick={() => actions.openNotification?.(notification)}
        className="flex w-full items-start gap-3.5 p-4 pr-14 text-left sm:p-5 sm:pr-32"
      >
        <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[.95rem] shadow-sm ${meta.iconClass}`}>
          <Icon size={20} strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[11px] font-black uppercase tracking-[.12em] text-slate-500">MLS · {meta.label}</span>
            <span className="ml-auto shrink-0 text-[11px] font-bold text-slate-400">{relativeTime(notification.created_at)}</span>
          </span>
          <span className={`mt-1.5 block text-[15px] leading-5 text-slate-950 ${unread ? "font-black" : "font-bold"}`}>{notification.title}</span>
          {notification.body && <span className="mt-1 block text-sm leading-5 text-slate-600">{notification.body}</span>}
          <span className="mt-2 block text-[11px] font-medium text-slate-400">{fullTimestamp(notification.created_at)}</span>
        </span>
      </button>

      {unread && <span className="absolute right-4 top-5 h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,.12)] sm:right-5" />}

      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-black/5 bg-white/90 p-1 opacity-100 shadow-sm backdrop-blur transition sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => unread ? actions.markNotificationRead?.(notification.id) : actions.markNotificationUnread?.(notification.id)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label={unread ? "Mark notification as read" : "Mark notification as unread"}
          title={unread ? "Mark as read" : "Mark as unread"}
        >
          {unread ? <Check size={15} /> : <Bell size={15} />}
        </button>
        <button
          type="button"
          onClick={() => actions.dismissNotification?.(notification.id)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label="Clear notification"
          title="Clear"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.article>
  );
}

export default function IOSNotificationCenter({ app, actions = {} }) {
  const [filter, setFilter] = useState("all");
  const [collapsed, setCollapsed] = useState({});
  const notifications = app?.notifications || [];
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const visible = useMemo(
    () => filter === "unread" ? notifications.filter((item) => !item.is_read) : notifications,
    [filter, notifications],
  );

  const groups = useMemo(() => {
    const order = ["Today", "Yesterday", "This Week", "Earlier"];
    const map = new Map(order.map((name) => [name, []]));
    visible.forEach((notification) => map.get(groupName(notification.created_at))?.push(notification));
    return order.map((name) => [name, map.get(name)]).filter(([, items]) => items.length);
  }, [visible]);

  const dateLabel = formatInPortalTimeZone(new Date(), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: undefined,
    hour: undefined,
    minute: undefined,
    timeZoneName: undefined,
  });

  async function clearGroup(name, items) {
    if (!window.confirm(`Clear ${items.length} notification${items.length === 1 ? "" : "s"} from ${name}?`)) return;
    await actions.clearNotifications?.(items.map((item) => item.id));
  }

  async function clearAll() {
    if (!notifications.length) return;
    if (!window.confirm(`Clear all ${notifications.length} notifications?`)) return;
    await actions.clearNotifications?.();
  }

  return (
    <section className="relative isolate min-h-[72vh] overflow-hidden rounded-[2.25rem] bg-[#111827] p-4 text-white shadow-2xl sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,.34),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(221,125,0,.28),transparent_30%),linear-gradient(155deg,#111827_0%,#1f2937_52%,#0f172a_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-12 -z-10 h-64 w-64 rounded-full bg-[#721100]/35 blur-3xl" />

      <div className="mx-auto max-w-4xl">
        <header className="pb-6 sm:pb-8">
          <p className="text-sm font-bold text-white/60">{dateLabel}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Notification Center</h2>
              <p className="mt-2 text-sm font-medium text-white/60">
                {unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You’re all caught up"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {unreadCount > 0 && (
                <button type="button" onClick={() => actions.markNotificationRead?.()} className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2.5 text-xs font-black text-white backdrop-blur-xl transition hover:bg-white/22">
                  <CheckCheck size={16} /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button type="button" onClick={clearAll} className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2.5 text-xs font-black text-white backdrop-blur-xl transition hover:bg-white/22">
                  <Trash2 size={15} /> Clear all
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 inline-flex rounded-full bg-black/20 p-1 backdrop-blur-xl">
            {[
              ["all", `All ${notifications.length}`],
              ["unread", `Unread ${unreadCount}`],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-xs font-black transition ${filter === value ? "bg-white text-slate-950 shadow" : "text-white/65 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-7">
          {groups.map(([name, items]) => {
            const isCollapsed = Boolean(collapsed[name]);
            return (
              <section key={name}>
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <button type="button" onClick={() => setCollapsed((current) => ({ ...current, [name]: !current[name] }))} className="inline-flex items-center gap-2 text-left">
                    <span className="text-sm font-black tracking-tight text-white">{name}</span>
                    <span className="text-xs font-bold text-white/45">{items.length}</span>
                    {isCollapsed ? <ChevronDown size={15} className="text-white/50" /> : <ChevronUp size={15} className="text-white/50" />}
                  </button>
                  <button type="button" onClick={() => clearGroup(name, items)} className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black text-white/75 transition hover:bg-white/20 hover:text-white">Clear</button>
                </div>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2.5 overflow-hidden">
                      <AnimatePresence mode="popLayout">
                        {items.map((notification) => <NotificationItem key={notification.id} notification={notification} actions={actions} />)}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          })}

          {!groups.length && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/15 bg-white/10 px-6 py-16 text-center backdrop-blur-2xl">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white/15"><Bell size={28} /></span>
              <h3 className="mt-5 text-xl font-black">{filter === "unread" ? "No unread notifications" : "No notifications"}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/55">New assignment, document, training, billing, and message updates will appear here.</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
