import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, BookOpen, Building2, CalendarDays, ChevronRight, ClipboardCheck,
  FileText, GraduationCap, LayoutDashboard, Menu, MessageSquare, RefreshCcw,
  ShieldCheck, Star, UserRound, Users, X,
} from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import logo from "../logo.png";
import { BRAND, InstallAppButton, cx, pretty } from "./ui";

const roleNavigation = {
  admin: [
    ["overview", "Overview", LayoutDashboard],
    ["assignments", "Assignments", ClipboardCheck],
    ["schedule", "Schedule", CalendarDays],
    ["clients", "Clients", Building2],
    ["interpreters", "Interpreters", Users],
    ["documents", "Documents", FileText],
    ["training", "Training", GraduationCap],
    ["bids", "Bids", ShieldCheck],
    ["messages", "Messages", MessageSquare],
    ["feedback", "Feedback", Star],
    ["notifications", "Notifications", Bell],
  ],
  client: [
    ["overview", "Overview", LayoutDashboard],
    ["profile", "Profile", Building2],
    ["request", "Request", ClipboardCheck],
    ["assignments", "Assignments", CalendarDays],
    ["schedule", "Schedule", CalendarDays],
    ["documents", "Documents", FileText],
    ["messages", "Messages", MessageSquare],
    ["feedback", "Feedback", Star],
    ["notifications", "Notifications", Bell],
  ],
  interpreter: [
    ["overview", "Overview", LayoutDashboard],
    ["profile", "Profile", UserRound],
    ["schedule", "Schedule", CalendarDays],
    ["opportunities", "Opportunities", ClipboardCheck],
    ["documents", "Documents", FileText],
    ["training", "Training", BookOpen],
    ["messages", "Messages", MessageSquare],
    ["notifications", "Notifications", Bell],
  ],
};

function NavButton({ item, active, onClick, unread }) {
  const [value, label, Icon] = item;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cx(
        "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition",
        active ? "bg-[#dd7d00] text-white shadow-lg" : "text-white/65 hover:bg-white/10 hover:text-white",
      )}
    >
      <span className="relative"><Icon size={18} />{value === "notifications" && unread > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-black text-[#721100]">{unread > 99 ? "99+" : unread}</span>}</span>
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight size={15} className={cx("transition", active ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")} />
    </button>
  );
}

export default function AppShell({ role, section, setSection, user, unread = 0, refreshing, refresh, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = roleNavigation[role] || roleNavigation.interpreter;
  const active = navigation.find(([value]) => value === section) || navigation[0];
  const mobileNavigation = useMemo(() => navigation.filter(([value]) => ["overview", "assignments", "schedule", "request", "opportunities", "documents", "notifications"].includes(value)).slice(0, 5), [navigation]);

  useEffect(() => setMobileOpen(false), [section]);

  const sidebar = (
    <>
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <img src={logo} alt="Miqueas Language Solutions" className="h-12 w-auto shrink-0" />
          <div className="min-w-0"><p className="truncate text-sm font-black text-[#464747]">Miqueas Language Solutions</p><p className="mt-0.5 text-[10px] font-bold leading-4 text-[#721100]">Bridging Perspectives. Delivering Understanding.</p></div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 font-black text-[#f6b34c]">{(user?.firstName || user?.email || "M")[0]?.toUpperCase()}</span>
          <div className="min-w-0"><p className="truncate text-sm font-black">{user?.firstName || user?.email}</p><p className="truncate text-xs text-white/45">{pretty(role)} workspace</p></div>
        </div>
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">{navigation.map((item) => <NavButton key={item[0]} item={item} active={section === item[0]} onClick={setSection} unread={unread} />)}</nav>
      <div className="border-t border-white/10 p-4">
        <button type="button" onClick={refresh} disabled={refreshing} className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"><RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
        <InstallAppButton />
        <div className="mt-2"><PortalSignOutButton /></div>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-[#f7f3ef] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(114,17,0,.08),transparent_28%),radial-gradient(circle_at_92%_2%,rgba(221,125,0,.12),transparent_26%)]" />
      <div className="relative mx-auto grid min-h-[100dvh] max-w-[112rem] lg:grid-cols-[286px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-[100dvh] flex-col overflow-hidden bg-[#24130e] text-white shadow-2xl lg:flex">{sidebar}</aside>

        <div className="min-w-0 pb-24 lg:pb-0">
          <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f7f3ef]/88 px-4 py-3 backdrop-blur-xl lg:px-7">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#24130e] text-white lg:hidden"><Menu size={20} /></button>
              <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#dd7d00]">{pretty(role)} workspace</p><h1 className="truncate text-xl font-black text-slate-950">{active?.[1] || "MLS"}</h1></div>
              <button type="button" onClick={() => setSection("notifications")} className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-white text-[#721100] shadow-sm"><Bell size={19} />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dd7d00] px-1 text-[9px] font-black text-white">{unread > 99 ? "99+" : unread}</span>}</button>
            </div>
          </header>

          <main className="relative p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait"><motion.div key={`${role}-${section}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>{children}</motion.div></AnimatePresence>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-[#1c100c]/70 backdrop-blur-sm lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMobileOpen(false)}><motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="flex h-full w-[88%] max-w-[330px] flex-col bg-[#24130e] text-white shadow-2xl"><button type="button" onClick={() => setMobileOpen(false)} className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white"><X size={18} /></button>{sidebar}</motion.aside></motion.div>}
      </AnimatePresence>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-flow-col auto-cols-fr rounded-[1.5rem] border border-black/5 bg-white/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden">{mobileNavigation.map(([value, label, Icon]) => <button key={value} type="button" onClick={() => setSection(value)} className={cx("relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px] font-black transition", section === value ? "bg-[#721100] text-white" : "text-slate-500")}><Icon size={18} /><span className="max-w-full truncate">{label}</span>{value === "notifications" && unread > 0 && <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-[#dd7d00]" />}</button>)}</nav>
    </div>
  );
}
