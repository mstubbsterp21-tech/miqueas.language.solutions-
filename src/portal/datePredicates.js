export function isAtOrAfterNow(value, now = Date.now()) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp >= now;
}

export function isDueDatePast(dueDate, now = Date.now()) {
  if (!dueDate) return false;
  const timestamp = new Date(`${dueDate}T23:59:59`).getTime();
  return Number.isFinite(timestamp) && timestamp < now;
}

export function isWithinDays(value, now = Date.now(), days = 60) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp <= now + days * 864e5;
}
