import { ArrowRight, CalendarDays, ExternalLink, Loader2 } from "lucide-react";
import { Badge, Card, EmptyState, INPUT, SectionHeader, cx, formatDate, formatMoney, pretty } from "../ui";

export function ActionButton({ children, onClick, type = "button", tone = "primary", disabled = false, icon: Icon }) {
  const styles = {
    primary: "bg-[#721100] text-white hover:bg-[#5a0d00]",
    gold: "bg-[#dd7d00] text-white hover:bg-[#c46f00]",
    soft: "border border-slate-200 bg-white text-[#721100] hover:border-[#dd7d00]/40 hover:bg-[#fffaf2]",
    dark: "bg-[#24130e] text-white hover:bg-black",
    danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cx("inline-flex min-h-11 min-w-0 max-w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-sm font-black leading-5 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50", styles[tone])}>
      {disabled ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

export function WorkflowList({ title, eyebrow, text, items, emptyTitle, emptyText, renderItem, action }) {
  return (
    <Card>
      <SectionHeader eyebrow={eyebrow} title={title} text={text} action={action} />
      <div className="mls-adaptive-list mt-6 space-y-3">
        {items.map((item, index) => (
          <div
            key={item?.id || item?.assignment_id || `${title}-${index}`}
            className={index === 0 ? "mls-density-summary" : index < 3 ? "mls-density-medium" : "mls-density-large"}
          >
            {renderItem(item, index)}
          </div>
        ))}
        {!items.length && <EmptyState icon={CalendarDays} title={emptyTitle} text={emptyText} />}
      </div>
    </Card>
  );
}

export function AssignmentRow({ assignment, onOpen, detail }) {
  return (
    <button type="button" onClick={() => onOpen?.(assignment)} className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#dd7d00]/40 hover:bg-white hover:shadow-lg md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><CalendarDays size={19} /></span>
      <span className="min-w-0 flex-1">
        <span className="block break-words font-black text-slate-950">{assignment.service_type || "MLS assignment"}</span>
        <span className="mls-density-medium mt-1 block break-words text-xs leading-5 text-slate-500">{assignment.clients?.organization_name || assignment.clients?.email || "Client"} · {formatDate(assignment.start_at)}</span>
        {detail && <span className="mls-density-large mt-2 block break-words text-xs font-bold text-[#721100]">{detail}</span>}
      </span>
      <span className="col-start-2 flex flex-wrap items-center gap-2 md:col-auto"><Badge value={assignment.lifecycle_status || assignment.status} /><ArrowRight size={16} className="mls-density-medium text-slate-400" /></span>
    </button>
  );
}

export function MoneySummary({ label, value, note }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{formatMoney(value)}</p>
      {note && <p className="mls-density-medium mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

export function ExternalRecordLink({ href, children = "Open external record" }) {
  if (!href) return null;
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-[#721100] hover:underline">{children}<ExternalLink size={13} /></a>;
}

export function SelectField({ value, onChange, options, placeholder = "Select", className = "" }) {
  return (
    <select value={value} onChange={onChange} className={cx(INPUT, className)}>
      <option value="">{placeholder}</option>
      {options.map((option) => {
        const item = typeof option === "string" ? { value: option, label: pretty(option) } : option;
        return <option key={item.value} value={item.value}>{item.label}</option>;
      })}
    </select>
  );
}

export function LoadingPanel({ text = "Loading operations" }) {
  return <Card><div className="flex items-center justify-center gap-3 py-12 text-sm font-black text-slate-500"><Loader2 className="animate-spin text-[#721100]" size={20} />{text}</div></Card>;
}
