const blockedInterpreterRosterStatuses = new Set([
  "removed",
  "inactive",
  "suspended",
  "disabled",
]);

export function isBlockedInterpreterRosterStatus(value) {
  return blockedInterpreterRosterStatuses.has(String(value || "").trim().toLowerCase());
}
