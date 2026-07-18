import { useEffect, useState } from "react";
import { Eye, EyeOff, GripVertical, LayoutPanelTop, RotateCcw, Save } from "lucide-react";
import { Modal, cx } from "./ui";

export const LAYOUT_DEFAULTS = {
  admin: {
    nav: [["home", "Home"], ["assignments", "Assignments"], ["communications", "Communications"], ["people", "People"], ["finance", "Finance"], ["compliance", "Compliance"], ["reports", "Reports"], ["feedback", "Feedback"], ["profile", "My Profile"], ["settings", "Settings"]],
    home: [["hero", "Command center"], ["metrics", "Key metrics"], ["decision_queue", "Decision queue"], ["staffed_schedule", "Staffed schedule"], ["announcements", "Announcements"]],
  },
  client: {
    nav: [["home", "Home"], ["requests", "Requests"], ["assignments", "Assignments"], ["communications", "Communications"], ["billing", "Billing"], ["documents", "Documents"], ["feedback", "Feedback"], ["profile", "Profile"]],
    home: [["hero", "Service hub"], ["metrics", "Key metrics"], ["action_queue", "Action queue"], ["upcoming_services", "Upcoming services"], ["announcements", "Announcements"]],
  },
  interpreter: {
    nav: [["home", "Home"], ["work", "Assignments"], ["payments", "Payments"], ["communications", "Communications"], ["schedule", "Schedule"], ["documents", "Documents"], ["learning", "Learning"], ["feedback", "Feedback"], ["profile", "My Profile"]],
    home: [["hero", "Welcome and shortcuts"], ["metrics", "Key metrics"], ["recommended", "Recommended opportunities"], ["readiness", "Readiness tasks"], ["schedule", "Assigned schedule"], ["announcements", "Announcements"]],
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
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!open) return; setNav(normalize(layout?.nav_order, defaults.nav)); setHome(normalize(layout?.home_order, defaults.home)); setHidden(layout?.hidden_home_sections || []); }, [defaults, layout, open]);
  const reset = () => { setNav(defaults.nav.map(([key]) => key)); setHome(defaults.home.map(([key]) => key)); setHidden([]); };
  const submit = async () => { setSaving(true); try { await save({ navOrder: nav, homeOrder: home, hiddenHomeSections: hidden }); close(); } finally { setSaving(false); } };
  return <Modal open={open} close={close} title="Customize your MLS Portal" subtitle="Your tab and homepage priorities are saved to this account on every device."><div className="grid gap-6 lg:grid-cols-2"><section><div className="mb-3 flex items-center gap-2"><LayoutPanelTop size={18} className="text-[#721100]" /><h3 className="font-black text-slate-950">Navigation tabs</h3></div><p className="mb-4 text-xs leading-5 text-slate-500">Drag tabs or use the arrow controls. The first five become your mobile navigation bar.</p><ReorderList items={defaults.nav} order={nav} setOrder={setNav} /></section><section><div className="mb-3 flex items-center gap-2"><LayoutPanelTop size={18} className="text-[#721100]" /><h3 className="font-black text-slate-950">Homepage cards</h3></div><p className="mb-4 text-xs leading-5 text-slate-500">Reorder cards and use the eye control to hide or restore sections.</p><ReorderList items={defaults.home} order={home} setOrder={setHome} hidden={hidden} setHidden={setHidden} /></section></div><div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between"><button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-600"><RotateCcw size={16} />Restore defaults</button><button type="button" onClick={submit} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-5 text-sm font-black text-white disabled:opacity-50"><Save size={16} />{saving ? "Saving…" : "Save layout"}</button></div></Modal>;
}
