const layoutKeys = {
  admin: {
    nav: ["home", "assignments", "communications", "people", "finance", "compliance", "reports", "feedback", "profile", "settings"],
    home: ["hero", "metrics", "widgets", "decision_queue", "priority_services", "staffed_schedule", "announcements"],
  },
  client: {
    nav: ["home", "requests", "assignments", "communications", "billing", "documents", "feedback", "profile", "settings"],
    home: ["hero", "metrics", "widgets", "action_queue", "next_service", "upcoming_services", "announcements"],
  },
  interpreter: {
    nav: ["home", "work", "payments", "communications", "schedule", "documents", "learning", "feedback", "profile", "settings"],
    home: ["hero", "metrics", "widgets", "next_work", "recommended", "readiness", "schedule", "announcements"],
  },
};

const widgetKeys = ["clock", "weather", "map", "news"];
const cardSizes = new Set(["small", "medium", "large"]);
const cardShapes = new Set(["soft", "rounded", "square"]);
const legacySizes = { compact: "small", standard: "medium", spacious: "large" };

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function orderedSelection(values, allowed) {
  const selected = [...new Set((Array.isArray(values) ? values : []).map(String))].filter((value) => allowed.includes(value));
  return [...selected, ...allowed.filter((value) => !selected.includes(value))];
}

function normalizeSize(value, fallback = "medium") {
  const normalized = legacySizes[String(value || "")] || String(value || "");
  return cardSizes.has(normalized) ? normalized : fallback;
}

function normalizeShape(value, fallback = "soft") {
  const normalized = String(value || "");
  return cardShapes.has(normalized) ? normalized : fallback;
}

function cleanCardId(value) {
  const key = String(value || "").trim();
  return key.length <= 140 && /^[a-zA-Z0-9:_-]+$/.test(key) ? key : "";
}

function cleanPagePreference(value = {}) {
  const size = normalizeSize(value.size);
  const shape = normalizeShape(value.shape);
  const rawCards = value.cards && typeof value.cards === "object" && !Array.isArray(value.cards) ? value.cards : {};
  const cards = {};
  Object.entries(rawCards).slice(0, 150).forEach(([rawKey, rawCard]) => {
    const key = cleanCardId(rawKey);
    if (!key || !rawCard || typeof rawCard !== "object" || Array.isArray(rawCard)) return;
    const order = Number.isInteger(rawCard.order) ? Math.max(0, Math.min(rawCard.order, 999)) : undefined;
    cards[key] = {
      size: normalizeSize(rawCard.size, size),
      shape: normalizeShape(rawCard.shape, shape),
      ...(order === undefined ? {} : { order }),
    };
  });
  return { size, shape, cards };
}

function cleanTabPreferences(rawPreferences, allowedSections) {
  const raw = rawPreferences && typeof rawPreferences === "object" && !Array.isArray(rawPreferences) ? rawPreferences : {};
  const result = {};
  allowedSections.forEach((section) => {
    if (raw[section] && typeof raw[section] === "object" && !Array.isArray(raw[section])) {
      result[section] = cleanPagePreference(raw[section]);
    }
  });
  return result;
}

async function portalRoleFor(db, user) {
  if (user.isAdmin) return "admin";
  const client = await db.from("clients").select("id").eq("clerk_user_id", user.id).maybeSingle();
  if (client.error) throw client.error;
  return client.data ? "client" : "interpreter";
}

export async function savePortalLayoutV2(db, user, payload = {}) {
  const role = await portalRoleFor(db, user);
  const allowed = layoutKeys[role];
  const allowedCardSections = [...new Set([...allowed.nav, "notifications"] )];
  const existing = await db
    .from("portal_layout_preferences")
    .select("nav_order,home_order,hidden_home_sections,widget_order,enabled_widgets,tab_card_preferences")
    .eq("clerk_user_id", user.id)
    .eq("role", role)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const current = existing.data || {
    nav_order: [],
    home_order: [],
    hidden_home_sections: [],
    widget_order: [],
    enabled_widgets: [],
    tab_card_preferences: {},
  };

  const navOrder = orderedSelection(hasOwn(payload, "navOrder") ? payload.navOrder : current.nav_order, allowed.nav);
  const homeOrder = orderedSelection(hasOwn(payload, "homeOrder") ? payload.homeOrder : current.home_order, allowed.home);
  const hiddenSource = hasOwn(payload, "hiddenHomeSections") ? payload.hiddenHomeSections : current.hidden_home_sections;
  const hiddenHomeSections = [...new Set((Array.isArray(hiddenSource) ? hiddenSource : []).map(String))]
    .filter((value) => allowed.home.includes(value) && value !== "hero");
  const widgetOrder = orderedSelection(hasOwn(payload, "widgetOrder") ? payload.widgetOrder : current.widget_order, widgetKeys);
  const enabledSource = hasOwn(payload, "enabledWidgets") ? payload.enabledWidgets : current.enabled_widgets;
  const enabledWidgets = [...new Set((Array.isArray(enabledSource) ? enabledSource : []).map(String))]
    .filter((value) => widgetKeys.includes(value));

  let rawPreferences = hasOwn(payload, "tabCardPreferences") ? payload.tabCardPreferences : current.tab_card_preferences;
  if (payload.section && payload.cardPreferences) {
    const section = String(payload.section);
    if (!allowedCardSections.includes(section)) return { status: 400, payload: { error: "That portal page cannot be customized." } };
    rawPreferences = { ...(current.tab_card_preferences || {}), [section]: payload.cardPreferences };
  }
  const tabCardPreferences = cleanTabPreferences(rawPreferences, allowedCardSections);

  const result = await db.from("portal_layout_preferences").upsert({
    clerk_user_id: user.id,
    role,
    nav_order: navOrder,
    home_order: homeOrder,
    hidden_home_sections: hiddenHomeSections,
    widget_order: widgetOrder,
    enabled_widgets: enabledWidgets,
    tab_card_preferences: tabCardPreferences,
    updated_at: new Date().toISOString(),
  }, { onConflict: "clerk_user_id,role" })
    .select("nav_order,home_order,hidden_home_sections,widget_order,enabled_widgets,tab_card_preferences")
    .single();
  if (result.error) throw result.error;
  return { status: 200, payload: { layout: result.data } };
}
