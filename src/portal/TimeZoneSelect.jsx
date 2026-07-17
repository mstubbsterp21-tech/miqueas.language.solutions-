import { US_TIME_ZONES, getPortalTimeZone, normalizeUSTimeZone, timeZoneAbbreviation } from "./timezones";

export default function TimeZoneSelect({ value, onChange, className = "", disabled = false, ariaLabel = "Display time zone" }) {
  const selected = normalizeUSTimeZone(value || getPortalTimeZone());
  return (
    <select
      aria-label={ariaLabel}
      title="All portal dates and schedules use this time zone"
      disabled={disabled}
      value={selected}
      onChange={(event) => onChange?.(event.target.value)}
      className={`w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10 disabled:opacity-60 ${className}`}
    >
      {US_TIME_ZONES.map((option) => (
        <option key={option.value} value={option.value}>
          {timeZoneAbbreviation(option.value)} · {option.label}
        </option>
      ))}
    </select>
  );
}
