const ROLE_FALLBACK = {
  admin: "home",
  client: "home",
  interpreter: "home",
};

function normalized(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, " ");
}

export function notificationSection(role, notification = {}) {
  const section = normalized(notification.section);
  const category = normalized(notification.category);
  const related = normalized(notification.related_type || notification.relatedType);
  const signal = `${section} ${category} ${related}`;

  if (/communication|message|mention|announcement|conversation/.test(signal)) return "communications";
  if (/profile|account/.test(signal)) return "profile";

  if (role === "admin") {
    if (/setting|integration/.test(signal)) return "settings";
    if (/report|feedback|survey/.test(signal)) return "reports";
    if (/client|interpreter|people|roster/.test(signal)) return "people";
    if (/invoice|payment|expense|time entry|quote|billing|finance/.test(signal)) return "finance";
    if (/document|credential|training|learning|compliance|onboarding|agreement/.test(signal)) return "compliance";
    if (/assignment|schedule|bid|opportunit|request|staff/.test(signal)) return "assignments";
  }

  if (role === "client") {
    if (/invoice|payment|billing|finance/.test(signal)) return "billing";
    if (/document|credential|compliance|training|learning/.test(signal)) return "documents";
    if (/quote|agreement|request|approval/.test(signal)) return "requests";
    if (/assignment|schedule|feedback/.test(signal)) return "assignments";
  }

  if (role === "interpreter") {
    if (/training|learning|course/.test(signal)) return "learning";
    if (/availability|schedule|calendar/.test(signal)) return "schedule";
    if (/document|credential|compliance|onboarding/.test(signal)) return "documents";
    if (/payment|expense|invoice|time entry/.test(signal)) return "payments";
    if (/assignment|opportunit|bid|work/.test(signal)) return "work";
  }

  return ROLE_FALLBACK[role] || "home";
}

export function navBadgesFor(role, notifications = []) {
  return notifications.reduce((badges, item) => {
    if (item.is_read) return badges;
    const section = notificationSection(role, item);
    badges[section] = (badges[section] || 0) + 1;
    badges.home = (badges.home || 0) + 1;
    return badges;
  }, {});
}
