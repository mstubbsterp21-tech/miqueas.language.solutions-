import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, CheckCircle2, Download, FileCheck2, FileText, Loader2,
  Plus, Smartphone, Trash2, UploadCloud, X,
} from "lucide-react";

export const BRAND = {
  burgundy: "#721100",
  gold: "#dd7d00",
  ink: "#24130e",
  cream: "#f7f3ef",
  slate: "#464747",
};

export const INPUT = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export const cx = (...values) => values.filter(Boolean).join(" ");
export const safe = (value) => String(value ?? "").trim();
export const pretty = (value) => safe(value || "Not set").replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
export const formatDate = (value, options = {}) => {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(new Date(value));
};
export const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
};
export const parseRate = (value) => {
  const match = safe(value).replaceAll(",", "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const badgeStyles = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  assigned: "border-blue-200 bg-blue-50 text-blue-800",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-800",
  completed: "border-slate-200 bg-slate-100 text-slate-700",
  declined: "border-rose-200 bg-rose-50 text-rose-800",
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  fulfilled: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  invited: "border-violet-200 bg-violet-50 text-violet-800",
  not_invoiced: "border-slate-200 bg-slate-50 text-slate-600",
  not_started: "border-slate-200 bg-slate-50 text-slate-600",
  open: "border-emerald-200 bg-emerald-50 text-emerald-800",
  overdue: "border-rose-200 bg-rose-50 text-rose-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending_confirmation: "border-amber-200 bg-amber-50 text-amber-800",
  pending_payment: "border-orange-200 bg-orange-50 text-orange-800",
  published: "border-emerald-200 bg-emerald-50 text-emerald-800",
  requested: "border-amber-200 bg-amber-50 text-amber-800",
  shortlisted: "border-violet-200 bg-violet-50 text-violet-800",
  submitted: "border-blue-200 bg-blue-50 text-blue-800",
  under_review: "border-violet-200 bg-violet-50 text-violet-800",
  uploaded: "border-blue-200 bg-blue-50 text-blue-800",
  viewed: "border-blue-200 bg-blue-50 text-blue-800",
  void: "border-slate-200 bg-slate-50 text-slate-500",
};

export function Badge({ value, className = "" }) {
  return <span className={cx("inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.08em]", badgeStyles[value] || "border-slate-200 bg-slate-50 text-slate-600", className)}>{pretty(value)}</span>;
}

export function Card({ children, className = "", hover = false, onClick }) {
  const Element = onClick ? motion.button : motion.div;
  return (
    <Element layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={hover ? { y: -3 } : undefined} transition={{ duration: 0.2 }} onClick={onClick} className={cx("rounded-[1.75rem] border border-black/5 bg-white p-5 text-left shadow-[0_18px_55px_rgba(40,25,18,.07)] md:p-6", onClick && "w-full cursor-pointer transition hover:shadow-[0_22px_65px_rgba(40,25,18,.12)]", className)}>
      {children}
    </Element>
  );
}

export function Metric({ icon: Icon, name, value, note, color = BRAND.burgundy, onClick }) {
  return (
    <motion.button type="button" onClick={onClick} whileHover={{ y: -3 }} className={cx("rounded-[1.55rem] border border-black/5 bg-white p-5 text-left shadow-[0_16px_50px_rgba(40,25,18,.07)]", onClick ? "cursor-pointer" : "cursor-default")}>
      <div className="flex justify-between gap-4">
        <div><p className="text-sm font-black text-slate-500">{name}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p>{note && <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>}</div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: color }}><Icon size={20} /></span>
      </div>
    </motion.button>
  );
}

export function SectionHeader({ title, text, action }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h2>{text && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{text}</p>}</div>
      {action}
    </div>
  );
}

export function Hero({ title, text, actions, children }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#721100] via-[#5b180b] to-[#24130e] p-6 text-white shadow-2xl md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[38px] border-white/[.04]" />
      <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-[#dd7d00]/15 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><h1 className="max-w-4xl text-3xl font-black tracking-tight md:text-5xl">{title}</h1>{text && <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">{text}</p>}{children}</div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </motion.div>
  );
}

export function Field({ name, required, children, className = "", help }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-bold text-slate-600">{name}{required && <b className="text-[#721100]"> *</b>}</span>
      {children}
      {help && <span className="mt-2 block text-xs leading-5 text-slate-400">{help}</span>}
    </label>
  );
}

export function EmptyState({ icon: Icon = FileText, title, text, action }) {
  return (
    <div className="rounded-[1.55rem] border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Icon size={22} /></span>
      <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
      {text && <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, close, title, children, wide = false, subtitle }) {
  return (
    <AnimatePresence>
      {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1c100c]/70 p-3 backdrop-blur-sm md:p-5" onMouseDown={(event) => event.target === event.currentTarget && close()}>
        <motion.div initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 18, opacity: 0, scale: 0.99 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className={cx("max-h-[94vh] w-full overflow-y-auto rounded-[2rem] bg-[#f8f5f1] shadow-2xl", wide ? "max-w-6xl" : "max-w-3xl")}>
          <div className="sticky top-0 z-20 flex items-start justify-between border-b border-black/5 bg-[#f8f5f1]/95 px-5 py-5 backdrop-blur md:px-7"><div><h2 className="text-2xl font-black text-slate-950">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div><button type="button" onClick={close} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow"><X size={18} /></button></div>
          <div className="p-5 md:p-8">{children}</div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}

export function DocumentCard({ type, title, document, request, busy, upload, open, remove, readOnly = false }) {
  const inputRef = useRef(null);
  const accept = (file) => file && upload?.(type, file, document?.id || null);
  return (
    <motion.div layout whileHover={{ y: -2 }} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#dd7d00]/40 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className={cx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            document ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
          )}>
            {document ? <FileCheck2 size={20} /> : <FileText size={20} />}
          </span>
          <div className="min-w-0">
            <h3 className="font-black text-slate-900">{request?.title || title}</h3>
            {request?.instructions && <p className="mt-1 text-xs leading-5 text-slate-500">{request.instructions}</p>}
          </div>
        </div>
        {request?.status && <Badge value={request.status} />}
      </div>

      {document && (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
          <p className="truncate text-sm font-bold text-slate-700">{document.file_name}</p>
          <p className="mt-1 text-xs text-slate-400">Uploaded {formatDate(document.uploaded_at)}</p>
        </div>
      )}

      {!readOnly && (
        <div
          className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            accept(event.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(event) => {
              accept(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button type="button" disabled={busy === type} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 text-sm font-black text-[#721100] disabled:opacity-50">
            {busy === type ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
            {document ? "Replace file" : "Choose or drop a file"}
          </button>
          <p className="mt-1 text-[11px] text-slate-400">PDF, Word, PNG, or JPG · 15 MB max</p>
        </div>
      )}

      {document && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => open?.(document)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">
            <Download size={14} /> Open
          </button>
          {!readOnly && (
            <button type="button" onClick={() => remove?.(document)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function Toast({ message, type = "success", dismiss }) {
  if (!message) return null;
  const success = type === "success";
  return <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={cx("mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm shadow-sm", success ? "border-emerald-200 bg-emerald-50 font-bold text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800")}>{success ? <CheckCircle2 size={18} /> : <Bell size={18} />}<span className="flex-1">{message}</span>{dismiss && <button type="button" onClick={dismiss}><X size={16} /></button>}</motion.div>;
}

export function InstallAppButton({ compact = false }) {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const handlePrompt = (event) => { event.preventDefault(); setPrompt(event); };
    const handleInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", handlePrompt); window.removeEventListener("appinstalled", handleInstalled); };
  }, []);
  if (!prompt || installed) return null;
  return <button type="button" onClick={async () => { await prompt.prompt(); await prompt.userChoice; setPrompt(null); }} className={cx("inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 font-black text-white/80 transition hover:bg-white/10 hover:text-white", compact ? "h-10 w-10" : "w-full px-4 py-3 text-sm")} title="Install MLS app"><Smartphone size={16} />{!compact && "Install app"}</button>;
}

export function FloatingAction({ onClick, label, icon: Icon = Plus }) {
  return <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClick} className="fixed bottom-24 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#721100] px-5 py-3.5 text-sm font-black text-white shadow-2xl md:bottom-8 md:right-8"><Icon size={18} /> {label}</motion.button>;
}
