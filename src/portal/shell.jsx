import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3, Bell, BookOpen, Building2, CalendarDays, Check, ChevronRight,
  CircleDollarSign, ClipboardCheck, Clock3, FileText, GripVertical, LayoutDashboard, Menu,
  Lightbulb, MessageSquare, RefreshCcw, Settings2, ShieldCheck, UserRound, Users, X,
} from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import logo from "../logo.png";
import { CardCustomizationProvider, useCardCustomization, useLongPress } from "./CardCustomization";
import { cx, pretty } from "./ui";
import TimeZoneSelect from "./TimeZoneSelect";
import { orderedLayoutKeys } from "./LayoutCustomizer";
import { getPortalTimeZone, timeZoneAbbreviation } from "./timezones";
import { portalThemeTokens, portalThemeVariables } from "./themeContrast";

const roleNavigation = {
  admin: [["home", "Home", LayoutDashboard], ["assignments", "Operations", ClipboardCheck], ["communications", "Communications", MessageSquare], ["people", "People", Users], ["finance", "Billing & Pay", CircleDollarSign], ["compliance", "Compliance", ShieldCheck], ["reports", "Reports", BarChart3], ["feedback", "Feedback", Lightbulb], ["profile", "My Profile", UserRound], ["settings", "Settings", Settings2]],
  client: [["home", "Home", LayoutDashboard], ["requests", "Requests", ClipboardCheck], ["assignments", "Services", CalendarDays], ["communications", "Communications", MessageSquare], ["billing", "Billing", CircleDollarSign], ["documents", "Documents", FileText], ["feedback", "Feedback", Lightbulb], ["profile", "Profile", Building2], ["settings", "Settings", Settings2]],
  interpreter: [["home", "Home", LayoutDashboard], ["work", "Work", ClipboardCheck], ["payments", "Time & Pay", CircleDollarSign], ["communications", "Communications", MessageSquare], ["schedule", "Availability", CalendarDays], ["documents", "Documents", FileText], ["learning", "Learning", BookOpen], ["feedback", "Feedback", Lightbulb], ["profile", "My Profile", UserRound], ["settings", "Settings", Settings2]],
};

function BadgeCount({ value, active, accent, onAccent }) {
  if (!value) return null;
  return (
    <span
      style={active ? { color: accent } : { backgroundColor: accent, color: onAccent }}
      className={cx("flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-black", active && "bg-white")}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

function NavButton({ item, active, onClick, accent, accentInk, onAccent, onSidebar, badge = 0, editing, onLongPress, onMove, onCommit }) {
  const [value, label, Icon] = item;
  const buttonRef = useRef(null);
  const pointerRef = useRef(null);
  const lastTargetRef = useRef("");
  const longPress = useLongPress(onLongPress, { disabled: editing });

  const startDrag = (event) => {
    if (!editing || event.button > 0) return;
    event.preventDefault();
    pointerRef.current = event.pointerId;
    lastTargetRef.current = "";
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const drag = (event) => {
    if (!editing || pointerRef.current !== event.pointerId || !buttonRef.current) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-nav-key]");
    if (!target || target === buttonRef.current || target.parentElement !== buttonRef.current.parentElement) return;
    const targetKey = target.getAttribute("data-nav-key");
    if (!targetKey || targetKey === lastTargetRef.current) return;
    lastTargetRef.current = targetKey;
    onMove(value, targetKey);
  };

  const endDrag = (event) => {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    lastTargetRef.current = "";
    onCommit();
  };

  const activate = (event) => {
    if (longPress.consumeTriggered() || editing) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick(value);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      data-nav-key={value}
      onClick={activate}
      {...(!editing ? longPress.handlers : {})}
      onPointerDown={editing ? startDrag : longPress.handlers.onPointerDown}
      onPointerMove={editing ? drag : longPress.handlers.onPointerMove}
      onPointerUp={editing ? endDrag : longPress.handlers.onPointerUp}
      onPointerCancel={editing ? endDrag : longPress.handlers.onPointerCancel}
      onLostPointerCapture={editing ? endDrag : undefined}
      style={active ? { backgroundColor: accent, color: onAccent } : { color: onSidebar }}
      className={cx(
        "group flex min-h-11 w-full touch-none items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition",
        active ? "shadow-lg" : "opacity-80 hover:bg-white/10 hover:opacity-100",
        editing && "mls-nav-jiggle cursor-grab border border-white/15 bg-white/5 active:cursor-grabbing",
      )}
    >
      <Icon size={18} />
      <span className="flex-1 text-left">{label}</span>
      <BadgeCount value={badge} active={active} accent={active ? accentInk : accent} onAccent={onAccent} />
      {editing ? <GripVertical size={16} className="opacity-70" /> : <ChevronRight size={15} className={cx("transition", active ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")} />}
    </button>
  );
}

function MobileNavButton({ item, active, badge, primary, accent, onPrimary, onAccent, onClick, onLongPress }) {
  const [value, label, Icon] = item;
  const longPress = useLongPress(onLongPress);
  const activate = (event) => {
    if (longPress.consumeTriggered()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick(value);
  };
  return (
    <button type="button" title={label} aria-label={label} onClick={activate} {...longPress.handlers} style={active ? { backgroundColor: primary, color: onPrimary } : undefined} className={cx("relative flex min-h-14 min-w-0 items-center justify-center rounded-xl px-1.5 py-1.5 transition", !active && "text-slate-600")}>
      <Icon size={22} />
      {badge > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-black" style={{ backgroundColor: accent, color: onAccent }}>{badge > 99 ? "99+" : badge}</span>}
    </button>
  );
}

function pageBackground(personalization, theme) {
  const style = personalization?.background_style || "soft";
  if (style === "dark") return `linear-gradient(145deg, ${theme.heroEnd}, ${theme.heroStart} 72%, ${theme.heroEnd})`;
  if (style === "gradient") return `linear-gradient(145deg, ${theme.primary}20, ${theme.accent}18 45%, ${theme.secondary}12 100%)`;
  if (style === "clean") return "#ffffff";
  return `linear-gradient(145deg, #fdfbf9 0%, ${theme.accent}0d 52%, ${theme.primary}0c 100%)`;
}

function AppShellContent({ role, section, setSection, user, personalization, accountName, unread = 0, navBadges = {}, refreshing, refresh, timeZone, onTimeZoneChange, savingTimeZone = false, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const customization = useCardCustomization();
  const defaultNavigation = roleNavigation[role] || roleNavigation.interpreter;
  const navigation = useMemo(() => {
    const byKey = new Map(defaultNavigation.map((item) => [item[0], item]));
    return orderedLayoutKeys(role, "nav", customization.navOrder).map((key) => byKey.get(key)).filter(Boolean);
  }, [customization.navOrder, defaultNavigation, role]);
  const active = navigation.find(([value]) => value === section) || (section === "notifications" ? ["notifications", "Notifications", Bell] : navigation[0]);
  const mobileNavigation = useMemo(() => navigation.slice(0, 5), [navigation]);
  const theme = portalThemeTokens(personalization);
  const { primary, accent } = theme;
  const clerkAccountName = user?.firstName ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  const displayName = accountName || clerkAccountName || personalization?.display_name || user?.email;
  const initials = String(displayName || "M").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const backgroundStyle = personalization?.background_style || "soft";
  const cardStyle = personalization?.card_style || "rounded";
  const selectedTimeZone = timeZone || getPortalTimeZone();
  const cardSize = customization.pagePreference?.size || "medium";
  const cardShape = customization.pagePreference?.shape || "soft";

  const navigate = (value) => {
    if (customization.navigationEditing || customization.cardEditing) return;
    setSection(value);
    setMobileOpen(false);
  };

  const startNavigationEditing = (openMobile = false) => {
    customization.startNavigationEditing();
    if (openMobile) setMobileOpen(true);
  };

  const avatar = (
    <button type="button" onClick={() => navigate("profile")} className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 font-black shadow-sm" style={{ color: theme.onSidebar }} aria-label="Open my profile" title="My Profile">
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
            <p className="mt-0.5 text-[10px] font-bold leading-4" style={{ color: theme.primaryInk }}>Bridging Perspectives. Delivering Understanding.</p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          {avatar}
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{displayName}</p>
            <p className="truncate text-xs opacity-70">{pretty(role)}</p>
          </div>
        </div>
        {customization.navigationEditing && <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 p-3"><div><p className="text-xs font-black">Edit navigation</p><p className="mt-0.5 text-[10px] opacity-70">Press and drag any item.</p></div><button type="button" onClick={customization.stopNavigationEditing} className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-white px-3 text-xs font-black" style={{ color: theme.primaryInk }}><Check size={14} />Done</button></div>}
      </div>
      <nav className="mls-hide-scrollbar flex-1 space-y-1.5 overflow-y-auto p-4">
        {navigation.map((item) => <NavButton key={item[0]} item={item} active={section === item[0]} onClick={navigate} accent={accent} accentInk={theme.accentInk} onAccent={theme.onAccent} onSidebar={theme.onSidebar} badge={navBadges[item[0]] || 0} editing={customization.navigationEditing} onLongPress={() => startNavigationEditing(false)} onMove={customization.moveNavigation} onCommit={customization.commitNavigation} />)}
      </nav>
      <div className="border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={refresh} disabled={refreshing || customization.navigationEditing} style={{ color: theme.onSidebar }} className="mb-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black opacity-85 transition hover:bg-white/15 hover:opacity-100 disabled:opacity-50">
          <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />Sync now
        </button>
        <div className="mt-2"><PortalSignOutButton /></div>
      </div>
    </>
  );

  return (
    <div
      className={cx("mls-portal-theme min-h-[100dvh] overflow-x-hidden text-slate-900", backgroundStyle === "dark" && "mls-dark-theme")}
      data-card-style={cardStyle}
      data-background-style={backgroundStyle}
      data-card-editing={customization.cardEditing ? "true" : "false"}
      data-nav-editing={customization.navigationEditing ? "true" : "false"}
      style={{ ...portalThemeVariables(theme), background: pageBackground(personalization, theme) }}
    >
      <div className="pointer-events-none fixed inset-0" style={{ background: `radial-gradient(circle at 8% 8%, ${primary}14, transparent 28%), radial-gradient(circle at 92% 2%, ${accent}1f, transparent 26%)` }} />
      <div className="relative mx-auto grid min-h-[100dvh] max-w-[112rem] lg:grid-cols-[286px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-[100dvh] flex-col overflow-hidden shadow-2xl lg:flex" style={{ backgroundColor: theme.sidebar, color: theme.onSidebar }}>{sidebar}</aside>
        <div className="mls-shell-content min-w-0">
          <header className="mls-portal-header sticky top-0 z-50 border-b border-black/5 px-3 pb-2.5 backdrop-blur-xl sm:px-4 sm:pb-3 lg:px-7" style={{ backgroundColor: backgroundStyle === "dark" ? `${theme.heroEnd}f2` : "rgba(253,251,249,.94)" }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl lg:hidden" style={{ backgroundColor: theme.sidebar, color: theme.onSidebar }} aria-label="Open navigation"><Menu size={20} /></button>
              <h1 className="sr-only">{active?.[1] || "MLS"}</h1>
              <div className="ml-auto flex min-w-0 items-center gap-1.5 rounded-2xl border border-black/5 bg-white p-1.5 shadow-sm sm:gap-2">
                <Clock3 size={16} className="ml-1 shrink-0" style={{ color: theme.primaryInk }} />
                <span className="relative whitespace-nowrap px-1 text-[10px] font-black text-slate-500 sm:hidden">
                  {timeZoneAbbreviation(selectedTimeZone)}
                  <TimeZoneSelect value={selectedTimeZone} onChange={onTimeZoneChange} disabled={savingTimeZone} className="absolute inset-0 h-full opacity-0" />
                </span>
                <TimeZoneSelect value={selectedTimeZone} onChange={onTimeZoneChange} disabled={savingTimeZone} className="hidden w-[230px] border-0 p-2 shadow-none sm:block xl:w-[260px]" />
              </div>
              <div className="hidden md:block">{avatar}</div>
              <button type="button" onClick={() => navigate("notifications")} style={{ color: theme.primaryInk }} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm" aria-label="Open notifications">
                <Bell size={19} />
                {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black" style={{ backgroundColor: accent, color: theme.onAccent }}>{unread > 99 ? "99+" : unread}</span>}
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
            <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} style={{ backgroundColor: theme.sidebar, color: theme.onSidebar }} className="flex h-[100dvh] w-[88%] max-w-[330px] flex-col overflow-hidden pt-[env(safe-area-inset-top)] shadow-2xl">
              <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/20" style={{ top: "max(1rem, env(safe-area-inset-top))", color: theme.onSidebar }} aria-label="Close navigation"><X size={18} /></button>
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={cx("fixed inset-x-3 z-50 grid grid-flow-col auto-cols-fr rounded-[1.5rem] border border-black/5 bg-white/95 p-2 shadow-2xl backdrop-blur-xl transition lg:hidden", customization.navigationEditing && "pointer-events-none opacity-35")} style={{ bottom: "max(.75rem, env(safe-area-inset-bottom))" }} aria-label="Primary navigation">
        {mobileNavigation.map((item) => <MobileNavButton key={item[0]} item={item} active={section === item[0]} badge={navBadges[item[0]] || 0} primary={primary} accent={accent} onPrimary={theme.onPrimary} onAccent={theme.onAccent} onClick={navigate} onLongPress={() => startNavigationEditing(true)} />)}
      </nav>

      {customization.cardEditing && <div className="mls-card-edit-toolbar fixed inset-x-3 z-[100] mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/95 p-3 text-slate-800 shadow-2xl backdrop-blur-xl" style={{ bottom: "calc(5.8rem + env(safe-area-inset-bottom))" }}><div className="min-w-0"><p className="truncate text-sm font-black">Editing page cards</p><p className="truncate text-[10px] text-slate-500">Drag the grip. Tap S, M, or L to resize.</p>{customization.saveError && <p className="mt-1 truncate text-[10px] font-bold text-rose-700">{customization.saveError}</p>}</div><button type="button" onClick={customization.stopCardEditing} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl bg-[#721100] px-4 text-xs font-black text-white"><Check size={14} />{customization.saving ? "Saving…" : "Done"}</button></div>}
    </div>
  );
}

export default function AppShell(props) {
  return <CardCustomizationProvider role={props.role} section={props.section} layout={props.layout}><AppShellContent {...props} /></CardCustomizationProvider>;
}
