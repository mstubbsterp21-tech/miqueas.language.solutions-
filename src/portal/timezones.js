export const DEFAULT_US_TIME_ZONE = "America/New_York";

export const US_TIME_ZONES = [
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Phoenix", label: "Arizona Time (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "America/Adak", label: "Hawaii–Aleutian Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "America/Puerto_Rico", label: "Atlantic Time (Puerto Rico / USVI)" },
  { value: "Pacific/Pago_Pago", label: "Samoa Time (American Samoa)" },
  { value: "Pacific/Guam", label: "Chamorro Time (Guam / N. Mariana Islands)" },
];

export const US_TIME_ZONE_VALUES = new Set(US_TIME_ZONES.map((item) => item.value));

const US_ZONE_ALIASES = new Map([
  ["America/Detroit", "America/New_York"],
  ["America/Indiana/Indianapolis", "America/New_York"],
  ["America/Indiana/Marengo", "America/New_York"],
  ["America/Indiana/Vevay", "America/New_York"],
  ["America/Indiana/Vincennes", "America/New_York"],
  ["America/Indiana/Winamac", "America/New_York"],
  ["America/Indianapolis", "America/New_York"],
  ["America/Kentucky/Louisville", "America/New_York"],
  ["America/Kentucky/Monticello", "America/New_York"],
  ["America/Louisville", "America/New_York"],
  ["America/Indiana/Knox", "America/Chicago"],
  ["America/Indiana/Tell_City", "America/Chicago"],
  ["America/Knox_IN", "America/Chicago"],
  ["America/Menominee", "America/Chicago"],
  ["America/North_Dakota/Beulah", "America/Chicago"],
  ["America/North_Dakota/Center", "America/Chicago"],
  ["America/North_Dakota/New_Salem", "America/Chicago"],
  ["America/Boise", "America/Denver"],
  ["America/Juneau", "America/Anchorage"],
  ["America/Metlakatla", "America/Anchorage"],
  ["America/Nome", "America/Anchorage"],
  ["America/Sitka", "America/Anchorage"],
  ["America/Yakutat", "America/Anchorage"],
  ["Pacific/Saipan", "Pacific/Guam"],
  ["US/Eastern", "America/New_York"],
  ["US/Central", "America/Chicago"],
  ["US/Mountain", "America/Denver"],
  ["US/Arizona", "America/Phoenix"],
  ["US/Pacific", "America/Los_Angeles"],
  ["US/Alaska", "America/Anchorage"],
  ["US/Aleutian", "America/Adak"],
  ["US/Hawaii", "Pacific/Honolulu"],
  ["US/Samoa", "Pacific/Pago_Pago"],
]);

let activePortalTimeZone = null;

export function normalizeUSTimeZone(value) {
  const zone = String(value || "").trim();
  if (US_TIME_ZONE_VALUES.has(zone)) return zone;
  return US_ZONE_ALIASES.get(zone) || DEFAULT_US_TIME_ZONE;
}

export function detectedUSTimeZone() {
  try {
    return normalizeUSTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return DEFAULT_US_TIME_ZONE;
  }
}

export function setActivePortalTimeZone(value) {
  activePortalTimeZone = normalizeUSTimeZone(value);
  if (typeof window !== "undefined") window.localStorage.setItem("mls:time-zone", activePortalTimeZone);
  return activePortalTimeZone;
}

export function getPortalTimeZone(preferred) {
  if (preferred) return normalizeUSTimeZone(preferred);
  if (activePortalTimeZone) return activePortalTimeZone;
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("mls:time-zone");
    if (saved) return normalizeUSTimeZone(saved);
  }
  return detectedUSTimeZone();
}

function partsFor(value, timeZone, includeWeekday = false) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeUSTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeWeekday ? { weekday: "short" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday"),
  };
}

function offsetAt(timestamp, timeZone) {
  const rounded = Math.floor(timestamp / 1000) * 1000;
  const parts = partsFor(rounded, timeZone);
  const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return representedAsUtc - rounded;
}

export function zonedDateTimeToUtc(localValue, timeZone = getPortalTimeZone()) {
  const match = String(localValue || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) throw new Error("Enter a valid date and time.");
  const [, year, month, day, hour, minute, second = "00"] = match;
  const localTimestamp = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  const zone = normalizeUSTimeZone(timeZone);
  let utcTimestamp = localTimestamp - offsetAt(localTimestamp, zone);
  utcTimestamp = localTimestamp - offsetAt(utcTimestamp, zone);

  const check = partsFor(utcTimestamp, zone);
  if (check.year !== Number(year) || check.month !== Number(month) || check.day !== Number(day) || check.hour !== Number(hour) || check.minute !== Number(minute)) {
    throw new Error("That local time does not exist because of a daylight-saving transition. Choose another time.");
  }
  return new Date(utcTimestamp).toISOString();
}

export function zonedInputValue(value, timeZone = getPortalTimeZone()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = partsFor(date, timeZone);
  const pad = (number) => String(number).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function timeZoneAbbreviation(timeZone = getPortalTimeZone(), value = new Date()) {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeUSTimeZone(timeZone),
    timeZoneName: "short",
  }).formatToParts(new Date(value)).find((item) => item.type === "timeZoneName");
  return part?.value || normalizeUSTimeZone(timeZone);
}

export function timeZoneLabel(timeZone = getPortalTimeZone(), value = new Date()) {
  const zone = normalizeUSTimeZone(timeZone);
  const label = US_TIME_ZONES.find((item) => item.value === zone)?.label || zone;
  return `${label} (${timeZoneAbbreviation(zone, value)})`;
}

export function formatInPortalTimeZone(value, options = {}) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  const { timeZone = getPortalTimeZone(), ...formatOptions } = options;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    ...formatOptions,
    timeZone: normalizeUSTimeZone(timeZone),
  }).format(date);
}
