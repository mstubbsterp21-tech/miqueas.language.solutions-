import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3, Bell, BookOpen, Building2, CalendarDays, ChevronRight,
  CircleDollarSign, ClipboardCheck, Clock3, FileText, LayoutDashboard, Menu,
  Lightbulb, MessageSquare, RefreshCcw, Settings2, ShieldCheck, UserRound, Users, X,
} from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import logo from "../logo.png";
import { InstallAppButton, cx, pretty } from "./ui";
import TimeZoneSelect from "./TimeZoneSelect";
import PushNotificationButton from "./PushNotificationButton";
import LayoutCustomizer, { orderedLayoutKeys } from "./LayoutCustomizer";
import { getPortalTimeZone, timeZoneAbbreviation } from "./timezones";

const roleNavigation = {
  admin: [["home", "Home", LayoutDashboard], ["assignments", "Operations", ClipboardCheck], ["communications", "Communications", MessageSquare], ["people", "People", Users], ["finance", "Billing & Pay", CircleDollarSign], ["compliance", "Compliance", ShieldCheck], ["reports", "Reports", BarChart3], ["feedback", "Feedback", Lightbulb], ["profile", "My Profile", UserRound], ["settings", "Settings", Settings2]],
  client: [["home", "Home", LayoutDashboard], ["requests", "Requests", ClipboardCheck], ["assignments", "Services", CalendarDays], ["communications", "Communications", MessageSquare], ["billing", "Billing", CircleDollarSign], ["documents", "Documents", FileText], ["feedback", "Feedback", Lightbulb], ["profile", "Profile", Building2]],
  interpreter: [["home", "Home", LayoutDashboard], ["work", "Work", ClipboardCheck], ["payments", "Time & Pay", CircleDollarSign], ["communications", "Communications", MessageSquare], ["schedule", "Availability", CalendarDays], ["documents", "Documents", FileText], ["learning", "Learning", BookOpen], ["feedback", "Feedback", Lightbulb], ["profile", "My Profile", UserRound]],
};

function BadgeCount({ value, active, accent }) {
  if (!value) return null;
  return (
    <span
      style={active ? { color: accent } : { backgroundColor: accent }}
      className={cx("flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-black", active ? "bg-white" : "text-white")}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

function NavButton({ item, active, onClick, accent, badge = 0 }) {
  const [value, label, Icon] = item;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      style={active ? { backgroundColor: accent } : undefined}
      className={cx("group flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition", active ? "text-white shadow-lg" : "text-white/65 hover:bg-white/10 hover:text-white")}
    >
      <Icon size={18} />
      <span className="flex-1 text-left">{label}</span>
      <BadgeCount value={badge} active={active} accent={accent} />
      <ChevronRight size={15} className={cx("transition", active ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")} />
    </button>
  );
}

function pageBackground(personalization, primary, secondary, accent) {
  const style = personalization?.background_style || "soft";
  if (style === "dark") return `linear-gradient(145deg, ${secondary}, ${primary} 72%, ${secondary})`;
  if (style === "gradient") return `linear-gradient(145deg, ${primary}20, ${accent}18 45%, ${secondary}12 100%)`;
  if (style === "clean") return "#ffffff";
  return `linear-gradient(145deg, #fdfbf9 0%, ${accent}0d 52%, ${primary}0c 100%)`;
}

export default function AppShell({ role, section, setSection, user, personalization, accountName, layout, saveLayout, unread = 0, navBadges = {}, refreshing, refresh, timeZone, onTimeZoneChange, savingTimeZone = false, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const defaultNavigation = roleNavigation[role] || roleNavigation.interpreter;
  const navigation = useMemo(() => {
    const byKey = new Map(defaultNavigation.map((item) => [item[0], item]));
    return orderedLayoutKeys(role, "nav", layout?.nav_order).map((key) => byKey.get(key)).filter(Boolean);
  }, [defaultNavigation, layout?.nav_order, role]);
  const active = navigation.find(([value]) => value === section) || (section === "notifications" ? ["notifications", "Notifications", Bell] : navigation[0]);
  const mobileNavigation = useMemo(() => navigation.slice(0, 5), [navigation]);
  const primary = personalization?.theme_primary || "#721100";
  const secondary = personalization?.theme_secondary || "#24130e";
  const accent = personalization?.theme_accent || "#dd7d00";
  const clerkAccountName = user?.firstName ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  const displayName = accountName || clerkAccountName || personalization?.display_name || user?.email;
  const initials = String(displayName || "M").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const backgroundStyle = personalization?.background_style || "soft";
  const cardStyle = personalization?.card_style || "rounded";
  const selectedTimeZone = timeZone || getPortalTimeZone();
  const cardPreference = layout?.tab_card_preferences?.[section] || {};
  const cardSize = ["compact", "standard", "spacious"].includes(cardPreference.size) ? cardPreference.size : "standard";
  const cardShape = ["soft", "rounded", "square"].includes(cardPreference.shape) ? cardPreference.shape : "soft";

  const navigate = (value) => {
    setSection(value);
    setMobileOpen(false);
  };

  const avatar = (
    <button type="button" onClick={() => navigate("profile")} className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 font-black shadow-sm" style={{ color: accent }} aria-label="Open my profile" title="My Profile">
      {personalization?.avatar_url ? <img src={personalization.avatar_url} alt="My Profile" className="h-full w-full object-cover" /> : initials}
    </button>
  );

  const sidebar = (
    <>
      <div className="border-b border-white/10 p-4 sm:p-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <img src={logo} alt="Miqueas Language Solutions" className="h-12 w-auto shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#464747]">Miqueas Language Solutions</p>
            <p className="mt-0.5 text-[10px] font-bold leading-4" style={{ color: primary }}>Bridging Perspectives. Delivering Understanding.</p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          {avatar}
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{displayName}</p>
            <p className="truncate text-xs text-white/45">{pretty(role)}</p>
          </div>
        </div>
      </div>
      <nav className="mls-hide-scrollbar flex-1 space-y-1.5 overflow-y-auto p-4">
        {navigation.map((item) => <NavButton key={item[0]} item={item} active={section === item[0]} onClick={navigate} accent={accent} badge={navBadges[item[0]] || 0} />)}
      </nav>
      <div className="border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={refresh} disabled={refreshing} className="mb-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50">
          <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />Sync now
        </button>
        <PushNotificationButton />
        <button type="button" onClick={() => setCustomizing(true)} className="mb-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"><Settings2 size={16} />Customize layout</button>
        <InstallAppButton />
        <div className="mt-2"><PortalSignOutButton /></div>
      </div>
    </>
  );

  return (
    <div
      className={cx("mls-portal-theme min-h-[100dvh] overflow-x-hidden text-slate-900", backgroundStyle === "dark" && "mls-dark-theme")}
      data-card-style={cardStyle}
      data-background-style={backgroundStyle}
      style={{ "--mls-primary": primary, "--mls-secondary": secondary, "--mls-accent": accent, background: pageBackground(personalization, primary, secondary, accent) }}
    >
      <div className="pointer-events-none fixed inset-0" style={{ background: `radial-gradient(circle at 8% 8%, ${primary}14, transparent 28%), radial-gradient(circle at 92% 2%, ${accent}1f, transparent 26%)` }} />
      <div className="relative mx-auto grid min-h-[100dvh] max-w-[112rem] lg:grid-cols-[286px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-[100dvh] flex-col overflow-hidden text-white shadow-2xl lg:flex" style={{ backgroundColor: secondary }}>{sidebar}</aside>
        <div className="mls-shell-content min-w-0">
          <header className="mls-portal-header sticky top-0 z-50 border-b border-black/5 px-3 pb-2.5 backdrop-blur-xl sm:px-4 sm:pb-3 lg:px-7" style={{ backgroundColor: backgroundStyle === "dark" ? `${secondary}e8` : "rgba(253,251,249,.9)" }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white lg:hidden" style={{ backgroundColor: secondary }} aria-label="Open navigation"><Menu size={20} /></button>
              <h1 className="sr-only">{active?.[1] || "MLS"}</h1>
              <div className="ml-auto flex min-w-0 items-center gap-1.5 rounded-2xl border border-black/5 bg-white p-1.5 shadow-sm sm:gap-2">
                <Clock3 size={16} className="ml-1 shrink-0" style={{ color: primary }} />
                <span className="relative whitespace-nowrap px-1 text-[10px] font-black text-slate-500 sm:hidden">
                  {timeZoneAbbreviation(selectedTimeZone)}
                  <TimeZoneSelect value={selectedTimeZone} onChange={onTimeZoneChange} disabled={savingTimeZone} className="absolute inset-0 h-full opacity-0" />
                </span>
                <TimeZoneSelect value={selectedTimeZone} onChange={onTimeZoneChange} disabled={savingTimeZone} className="hidden w-[230px] border-0 p-2 shadow-none sm:block xl:w-[260px]" />
              </div>
              <div className="hidden md:block">{avatar}</div>
              <button type="button" onClick={() => setCustomizing(true)} style={{ color: primary }} className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm transition hover:border-black/10 sm:flex" aria-label="Customize portal layout" title="Customize layout"><Settings2 size={19} /></button>
              <button type="button" onClick={() => navigate("notifications")} style={{ color: primary }} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm" aria-label="Open notifications">
                <Bell size={19} />
                {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black text-white" style={{ backgroundColor: accent }}>{unread > 99 ? "99+" : unread}</span>}
              </button>
            </div>
          </header>
          <main data-card-size={cardSize} data-card-shape={cardShape} className="relative min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={`${role}-${section}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>{children}</motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-[#1c100c]/70 backdrop-blur-sm lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMobileOpen(false)}>
            <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} style={{ backgroundColor: secondary }} className="flex h-[100dvh] w-[88%] max-w-[330px] flex-col overflow-hidden pt-[env(safe-area-inset-top)] text-white shadow-2xl">
              <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white" style={{ top: "max(1rem, env(safe-area-inset-top))" }} aria-label="Close navigation"><X size={18} /></button>
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed inset-x-3 z-50 grid grid-flow-col auto-cols-fr rounded-[1.5rem] border border-black/5 bg-white/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden" style={{ bottom: "max(.75rem, env(safe-area-inset-bottom))" }} aria-label="Primary navigation">
        {mobileNavigation.map(([value, label, Icon]) => (
          <button key={value} type="button" title={label} aria-label={label} onClick={() => navigate(value)} style={section === value ? { backgroundColor: primary } : undefined} className={cx("relative flex min-h-14 min-w-0 items-center justify-center rounded-xl px-1.5 py-1.5 transition", section === value ? "text-white" : "text-slate-500")}>
            <Icon size={22} />
            {navBadges[value] > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-black text-white" style={{ backgroundColor: accent }}>{navBadges[value] > 99 ? "99+" : navBadges[value]}</span>}
          </button>
        ))}
      </nav>
      <LayoutCustomizer open={customizing} close={() => setCustomizing(false)} role={role} layout={layout} save={saveLayout} />
    </div>
  );
}
