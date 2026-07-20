import { useEffect, useState } from "react";
import { CloudSun, Clock3, Eye, EyeOff, GripVertical, LayoutPanelTop, MapPinned, Newspaper, RotateCcw, Save } from "lucide-react";
import { Modal, cx } from "./ui";

export const PORTAL_WIDGETS = [
  ["clock", "Date & Time", Clock3],
  ["weather", "Weather", CloudSun],
  ["map", "Map", MapPinned],
  ["news", "MLS Blog", Newspaper],
];

export const LAYOUT_DEFAULTS = {
  admin: {
    nav: [["home", "Home"], ["assignments", "Operations"], ["communications", "Communications"], ["people", "People"], ["finance", "Billing & Pay"], ["compliance", "Compliance"], ["reports", "Reports"], ["feedback", "Feedback"], ["profile", "My Profile"], ["settings", "Settings"]],
    home: [["hero", "Command center"], ["metrics", "Key metrics"], ["widgets", "Widgets"], ["decision_queue", "Decision queue"], ["priority_services", "Priority services"], ["staffed_schedule", "Staffed schedule"], ["announcements", "Announcements"]],
  },
  client: {
    nav: [["home", "Home"], ["requests", "Requests"], ["assignments", "Services"], ["communications", "Communications"], ["billing", "Billing"], ["documents", "Documents"], ["feedback", "Feedback"], ["profile", "Profile"], ["settings", "Settings"]],
    home: [["hero", "Service hub"], ["metrics", "Key metrics"], ["widgets", "Widgets"], ["action_queue", "Action queue"], ["next_service", "Next service"], ["upcoming_services", "Upcoming services"], ["announcements", "Announcements"]],
  },
  interpreter: {
    nav: [["home", "Home"], ["work", "Work"], ["payments", "Time & Pay"], ["communications", "Communications"], ["schedule", "Availability"], ["documents", "Documents"], ["learning", "Learning"], ["feedback", "Feedback"], ["profile", "My Profile"], ["settings", "Settings"]],
    home: [["hero", "Welcome"], ["metrics", "Key metrics"], ["widgets", "Widgets"], ["next_work", "Next service"], ["recommended", "Recommended opportunities"], ["readiness", "Readiness tasks"], ["schedule", "Assigned schedule"], ["announcements", "Announcements"]],
  },
};

function normalize(order, items) {
  const keys = items.map(([key]) => key);
  const selected = (order || []).filter((key) => keys.includes(key));
  return [...new Set([...selected, ...keys])];
}

function ReorderList({ items, order, setOrder, hidden = [], setHidden }) {
  const labels = Object.fromEntries(items);
  const move = (key, delta) => setOrder((current) => { const next = [...current]; const index = next.indexOf(key); const target = index + delta; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const drop = (from, to) => setOrder((current) => { if (!from || from === to || !current.includes(from)) return current; const next = current.filter((key) => key !== from); next.splice(next.indexOf(to), 0, from); return next; });
  return <div className="space-y-2">{order.map((key, index) => <div key={key} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event.dataTransfer.getData("text/plain"), key)} className={cx("flex min-w-0 items-center gap-2 rounded-2xl border bg-white p-2.5", hidden.includes(key) ? "border-slate-200 opacity-55" : "border-slate-200")}><GripVertical size={17} className="shrink-0 cursor-grab text-slate-400" /><span className="min-w-0 flex-1 break-words text-sm font-black text-slate-800">{labels[key] || key}</span><button type="button" onClick={() => move(key, -1)} disabled={index === 0} className="h-9 w-9 rounded-xl border border-slate-200 text-xs font-black disabled:opacity-25" aria-label={`Move ${labels[key]} up`}>↑</button><button type="button" onClick={() => move(key, 1)} disabled={index === order.length - 1} className="h-9 w-9 rounded-xl border border-slate-200 text-xs font-black disabled:opacity-25" aria-label={`Move ${labels[key]} down`}>↓</button>{setHidden && key !== "hero" && <button type="button" onClick={() => setHidden((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200" aria-label={hidden.includes(key) ? `Show ${labels[key]}` : `Hide ${labels[key]}`}>{hidden.includes(key) ? <EyeOff size={15} /> : <Eye size={15} />}</button>}</div>)}</div>;
}

export function orderedLayoutKeys(role, type, saved = []) {
  return normalize(saved, LAYOUT_DEFAULTS[role]?.[type] || []);
}

export default function LayoutCustomizer({ open, close, role, layout, save }) {
  const defaults = LAYOUT_DEFAULTS[role];
  const [nav, setNav] = useState([]);
  const [home, setHome] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [widgetOrder, setWidgetOrder] = useState([]);
  const [enabledWidgets, setEnabledWidgets] = useState([]);
  const [tabCardPreferences, setTabCardPreferences] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setNav(normalize(layout?.nav_order, defaults.nav));
    setHome(normalize(layout?.home_order, defaults.home));
    setHidden(layout?.hidden_home_sections || []);
    setWidgetOrder(normalize(layout?.widget_order, PORTAL_WIDGETS));
    setEnabledWidgets(layout?.enabled_widgets || []);
    setTabCardPreferences(layout?.tab_card_preferences || {});
  }, [defaults, layout, open]);
  const reset = () => {
    setNav(defaults.nav.map(([key]) => key));
    setHome(defaults.home.map(([key]) => key));
    setHidden([]);
    setWidgetOrder(PORTAL_WIDGETS.map(([key]) => key));
    setEnabledWidgets([]);
    setTabCardPreferences({});
  };
  const updateCard = (key, field, value) => setTabCardPreferences((current) => ({ ...current, [key]: { size: current[key]?.size || "standard", shape: current[key]?.shape || "soft", [field]: value } }));
  const submit = async () => {
    setSaving(true);
    try {
      await save({ navOrder: nav, homeOrder: home, hiddenHomeSections: hidden, widgetOrder, enabledWidgets, tabCardPreferences });
      close();
    } finally { setSaving(false); }
  };
  const widgetLabels = PORTAL_WIDGETS.map(([key, label]) => [key, label]);
  const widgetIcons = Object.fromEntries(PORTAL_WIDGETS.map(([key, , Icon]) => [key, Icon]));
  return <Modal open={open} close={close} wide title="Customize portal">
    <div className="grid gap-6 lg:grid-cols-2">
      <section><div className="mb-3 flex items-center gap-2"><LayoutPanelTop size={18} className="text-[#721100]" /><h3 className="font-black text-slate-950">Navigation</h3></div><ReorderList items={defaults.nav} order={nav} setOrder={setNav} /></section>
      <section><div className="mb-3 flex items-center gap-2"><LayoutPanelTop size={18} className="text-[#721100]" /><h3 className="font-black text-slate-950">Home</h3></div><ReorderList items={defaults.home} order={home} setOrder={setHome} hidden={hidden} setHidden={setHidden} /></section>
      <section><div className="mb-3 flex items-center gap-2"><CloudSun size={18} className="text-[#721100]" /><h3 className="font-black text-slate-950">Widgets</h3></div><div className="space-y-2">{widgetOrder.map((key) => { const Icon = widgetIcons[key]; const enabled = enabledWidgets.includes(key); const label = Object.fromEntries(widgetLabels)[key]; return <div key={key} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#721100]/10 text-[#721100]">{Icon && <Icon size={17} />}</span><span className="min-w-0 flex-1 break-words text-sm font-black text-slate-800">{label}</span><button type="button" role="switch" aria-label={`${enabled ? "Disable" : "Enable"} ${label}`} aria-checked={enabled} onClick={() => setEnabledWidgets((current) => enabled ? current.filter((item) => item !== key) : [...current, key])} className={cx("relative h-7 w-12 shrink-0 rounded-full transition", enabled ? "bg-[#721100]" : "bg-slate-200")}><span className={cx("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition", enabled ? "left-6" : "left-1")} /></button></div>; })}</div><div className="mt-3"><ReorderList items={widgetLabels} order={widgetOrder} setOrder={setWidgetOrder} /></div></section>
      <section><div className="mb-3 flex items-center gap-2"><LayoutPanelTop size={18} className="text-[#721100]" /><h3 className="font-black text-slate-950">Cards</h3></div><div className="space-y-3">{nav.map((key) => { const label = Object.fromEntries(defaults.nav)[key] || key; const preference = tabCardPreferences[key] || {}; return <div key={key} className="grid min-w-0 gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_140px_140px] sm:items-center"><span className="min-w-0 break-words text-sm font-black text-slate-800">{label}</span><select aria-label={`${label} card size`} value={preference.size || "standard"} onChange={(event) => updateCard(key, "size", event.target.value)} className="min-h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"><option value="compact">Compact</option><option value="standard">Standard</option><option value="spacious">Spacious</option></select><select aria-label={`${label} card shape`} value={preference.shape || "soft"} onChange={(event) => updateCard(key, "shape", event.target.value)} className="min-h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"><option value="soft">Soft</option><option value="rounded">Rounded</option><option value="square">Square</option></select></div>; })}</div></section>
    </div>
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between"><button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-600"><RotateCcw size={16} />Restore defaults</button><button type="button" onClick={submit} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-5 text-sm font-black text-white disabled:opacity-50"><Save size={16} />{saving ? "Saving…" : "Save layout"}</button></div>
  </Modal>;
}
