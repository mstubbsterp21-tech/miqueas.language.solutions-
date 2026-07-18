import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import { deliverPortalFeedback } from "./_shared/portal-feedback-email.js";
import { sendPushNotification, vapidPublicKey } from "./_shared/web-push.js";

const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbAdminKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const adminEmails = (process.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const assignmentStatuses = new Set(["draft", "pending_confirmation", "confirmed", "completed", "cancelled"]);
const paymentStatuses = new Set(["not_invoiced", "pending_payment", "paid", "void"]);
const portalFeedbackTypes = new Set(["request_new_feature", "update_existing_feature", "remove_existing_feature"]);
const portalFeedbackCategories = new Set([
  "Home & Dashboard",
  "Assignments & Opportunities",
  "Requests & Scheduling",
  "Communications & Notifications",
  "People & Profiles",
  "Payments, Billing & Finance",
  "Documents & Compliance",
  "Learning & Resources",
  "Settings & Customization",
  "Mobile App & Push Notifications",
  "Accessibility & Usability",
  "Other",
]);

const fallbackWidgetNews = [
  { title: "Registry of Interpreters for the Deaf news", source: "RID", url: "https://rid.org/news/" },
  { title: "National Association of the Deaf news", source: "NAD", url: "https://www.nad.org/category/news/" },
  { title: "CASLI updates and announcements", source: "CASLI", url: "https://www.casli.org/" },
];

function send(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function decodeXml(value = "") {
  return String(value)
    .replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "")
    .replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">").trim();
}

function xmlTag(item, name) {
  return decodeXml(item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] || "");
}

async function industryWidgetNews() {
  const query = encodeURIComponent('("sign language interpreter" OR ASL interpreting OR Deaf interpreting) when:30d');
  try {
    const response = await fetch(`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`, {
      headers: { "user-agent": "Miqueas-MLS-Portal/1.0" },
    });
    if (!response.ok) throw new Error(`News source returned ${response.status}.`);
    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match) => {
      const value = match[1];
      return {
        title: xmlTag(value, "title"),
        source: xmlTag(value, "source") || "Industry news",
        url: xmlTag(value, "link"),
        publishedAt: xmlTag(value, "pubDate") || null,
      };
    }).filter((item) => item.title && item.url.startsWith("https://"));
    return items.length ? items : fallbackWidgetNews;
  } catch (error) {
    console.warn("MLS widget news refresh failed", error);
    return fallbackWidgetNews;
  }
}

async function widgetWeather(query = {}) {
  const latitude = Number(query.latitude);
  const longitude = Number(query.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Valid latitude and longitude are required.");
  }
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,is_day",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
  });
  const response = await fetch(url, { headers: { "user-agent": "Miqueas-MLS-Portal/1.0" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.current) throw new Error(data.reason || "Current weather is unavailable.");
  return {
    current: data.current,
    units: data.current_units || {},
    timeZone: data.timezone || null,
    location: { latitude, longitude },
  };
}

async function widgetData(query = {}) {
  const type = String(query.type || "news");
  if (type === "news") return { status: 200, payload: { news: await industryWidgetNews() }, cache: "private, max-age=300" };
  if (type === "weather") return { status: 200, payload: { weather: await widgetWeather(query) }, cache: "private, max-age=120" };
  return { status: 400, payload: { error: "Unknown widget type." } };
}

function bearer(req) {
  return String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1] || "";
}

function decode(token) {
  return JSON.parse(Buffer.from(token.split(".")[1] || "", "base64url").toString("utf8"));
}

async function signedInUser(req) {
  const jwt = bearer(req);
  if (!jwt || !clerkKey) return null;
  const claims = decode(jwt);
  if (!claims?.sid || !claims?.sub) return null;

  const clerk = createClerkClient({ secretKey: clerkKey });
  const session = await clerk.sessions.getSession(claims.sid);
  if (session?.userId !== claims.sub) return null;

  const record = await clerk.users.getUser(claims.sub);
  const email = record.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  return {
    id: record.id,
    email,
    firstName: record.firstName || "",
    lastName: record.lastName || "",
    isAdmin: adminEmails.includes(email),
    metadataRole: String(record.publicMetadata?.portalRole || "").toLowerCase(),
  };
}

function database() {
  if (!dbUrl || !dbAdminKey) throw new Error("Missing Supabase server settings in Vercel.");
  return createClient(dbUrl, dbAdminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function interpreterFor(db, userId) {
  const result = await db.from("interpreters").select("*").eq("clerk_user_id", userId).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function clientFor(db, userId) {
  const result = await db.from("clients").select("*").eq("clerk_user_id", userId).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function portalRoleFor(db, user) {
  if (user.isAdmin) return "admin";
  return (await clientFor(db, user.id)) ? "client" : "interpreter";
}

async function createNotification(db, recipient, values) {
  if (!recipient) return null;
  const result = await db.from("notifications").insert({
    recipient_clerk_user_id: recipient,
    category: values.category || "general",
    title: values.title,
    body: values.body || null,
    section: values.section || null,
    related_type: values.relatedType || null,
    related_id: values.relatedId || null,
  }).select().single();
  if (result.error) throw result.error;
  await sendPushNotification(db, result.data).catch((error) => console.warn("MLS push delivery failed", error));
  return result.data;
}

function cleanPushSubscription(value = {}) {
  const endpoint = String(value.endpoint || "").trim();
  const p256dh = String(value.keys?.p256dh || "").trim();
  const auth = String(value.keys?.auth || "").trim();
  return endpoint.startsWith("https://") && p256dh && auth ? { endpoint, p256dh, auth } : null;
}

async function pushAction(db, user, action, payload, req) {
  if (action === "pushConfig") {
    const publicKey = await vapidPublicKey(db);
    return { status: 200, payload: { configured: Boolean(publicKey), publicKey } };
  }
  if (action === "pushSubscribe") {
    const subscription = cleanPushSubscription(payload.subscription);
    if (!subscription) return { status: 400, payload: { error: "A valid browser push subscription is required." } };
    const result = await db.from("push_subscriptions").upsert({
      clerk_user_id: user.id, ...subscription,
      user_agent: String(req.headers["user-agent"] || "").slice(0, 500),
      is_active: true, disabled_at: null, last_error: null, updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" }).select("id,endpoint,is_active").single();
    if (result.error) throw result.error;
    return { status: 200, payload: { subscription: result.data } };
  }
  if (action === "pushUnsubscribe") {
    const result = await db.from("push_subscriptions").update({ is_active: false, disabled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("clerk_user_id", user.id).eq("endpoint", String(payload.endpoint || "")).select("id");
    if (result.error) throw result.error;
    return { status: 200, payload: { disabled: result.data?.length || 0 } };
  }
  if (action === "pushTest") {
    const delivery = await sendPushNotification(db, { recipient_clerk_user_id: user.id, category: "test", title: "MLS alerts are enabled", body: "Apple-style portal notifications are ready on this device.", section: "notifications" });
    return { status: 200, payload: { delivery } };
  }
  return null;
}

async function assignmentAccess(db, user, assignmentId) {
  const assignmentResult = await db
    .from("assignments")
    .select("*, clients(id,clerk_user_id,organization_name,email)")
    .eq("id", assignmentId)
    .maybeSingle();
  if (assignmentResult.error) throw assignmentResult.error;
  const assignment = assignmentResult.data;
  if (!assignment) return { allowed: false, assignment: null, role: "" };
  if (user.isAdmin) return { allowed: true, assignment, role: "admin" };

  const client = await clientFor(db, user.id);
  if (client?.id === assignment.client_id) return { allowed: true, assignment, role: "client" };

  const interpreter = await interpreterFor(db, user.id);
  if (interpreter) {
    const link = await db
      .from("assignment_interpreters")
      .select("id")
      .eq("assignment_id", assignmentId)
      .eq("interpreter_id", interpreter.id)
      .maybeSingle();
    if (link.error) throw link.error;
    if (link.data) return { allowed: true, assignment, role: "interpreter" };
  }

  return { allowed: false, assignment, role: "" };
}

async function loadAssignments(db, user) {
  const select = "*, clients(id,clerk_user_id,organization_name,primary_contact_name,email), assignment_interpreters(*, interpreters(id,clerk_user_id,first_name,last_name,email,credentials,modalities,current_location,city,state))";
  if (user.isAdmin) {
    const result = await db.from("assignments").select(select).order("start_at", { ascending: false });
    if (result.error) throw result.error;
    return result.data || [];
  }

  const client = await clientFor(db, user.id);
  if (client) {
    const result = await db.from("assignments").select(select).eq("client_id", client.id).order("start_at", { ascending: false });
    if (result.error) throw result.error;
    return result.data || [];
  }

  const interpreter = await interpreterFor(db, user.id);
  if (!interpreter) return [];
  const links = await db
    .from("assignment_interpreters")
    .select("*, assignments(*, clients(id,clerk_user_id,organization_name,primary_contact_name,email))")
    .eq("interpreter_id", interpreter.id)
    .order("assigned_at", { ascending: false });
  if (links.error) throw links.error;
  return (links.data || []).map((link) => ({
    ...(link.assignments || {}),
    assignment_interpreters: [{ ...link, interpreters: interpreter }],
  }));
}

export async function loadApp(db, user) {
  const assignments = await loadAssignments(db, user);
  const assignmentIds = assignments.map((item) => item.id).filter(Boolean);
  const role = await portalRoleFor(db, user);

  const [notificationResult, messageResult, layoutResult] = await Promise.all([
    db.from("notifications").select("*").eq("recipient_clerk_user_id", user.id).order("created_at", { ascending: false }).limit(50),
    assignmentIds.length
      ? db.from("assignment_messages").select("*").in("assignment_id", assignmentIds).order("created_at", { ascending: true }).limit(500)
      : Promise.resolve({ data: [], error: null }),
    db.from("portal_layout_preferences").select("nav_order,home_order,hidden_home_sections,widget_order,enabled_widgets,tab_card_preferences").eq("clerk_user_id", user.id).eq("role", role).maybeSingle(),
  ]);
  if (notificationResult.error) throw notificationResult.error;
  if (messageResult.error) throw messageResult.error;
  if (layoutResult.error) throw layoutResult.error;

  return {
    role,
    assignments,
    messages: messageResult.data || [],
    notifications: notificationResult.data || [],
    unreadCount: (notificationResult.data || []).filter((item) => !item.is_read).length,
    layout: layoutResult.data || { nav_order: [], home_order: [], hidden_home_sections: [], widget_order: [], enabled_widgets: [], tab_card_preferences: {} },
  };
}

const layoutKeys = {
  admin: { nav: ["home", "assignments", "communications", "people", "finance", "compliance", "reports", "feedback", "profile", "settings"], home: ["hero", "metrics", "widgets", "decision_queue", "staffed_schedule", "announcements"] },
  client: { nav: ["home", "requests", "assignments", "communications", "billing", "documents", "feedback", "profile"], home: ["hero", "metrics", "widgets", "action_queue", "upcoming_services", "announcements"] },
  interpreter: { nav: ["home", "work", "payments", "communications", "schedule", "documents", "learning", "feedback", "profile"], home: ["hero", "metrics", "widgets", "recommended", "readiness", "schedule", "announcements"] },
};

const widgetKeys = ["clock", "weather", "map", "news"];
const cardSizes = new Set(["compact", "standard", "spacious"]);
const cardShapes = new Set(["soft", "rounded", "square"]);

function orderedSelection(values, allowed) {
  const selected = [...new Set((Array.isArray(values) ? values : []).map(String))].filter((value) => allowed.includes(value));
  return [...selected, ...allowed.filter((value) => !selected.includes(value))];
}

async function savePortalLayout(db, user, payload) {
  const role = await portalRoleFor(db, user);
  const allowed = layoutKeys[role];
  const navOrder = orderedSelection(payload.navOrder, allowed.nav);
  const homeOrder = orderedSelection(payload.homeOrder, allowed.home);
  const hidden = [...new Set((Array.isArray(payload.hiddenHomeSections) ? payload.hiddenHomeSections : []).map(String))].filter((value) => allowed.home.includes(value) && value !== "hero");
  const widgetOrder = orderedSelection(payload.widgetOrder, widgetKeys);
  const enabledWidgets = [...new Set((Array.isArray(payload.enabledWidgets) ? payload.enabledWidgets : []).map(String))].filter((value) => widgetKeys.includes(value));
  const rawPreferences = payload.tabCardPreferences && typeof payload.tabCardPreferences === "object" && !Array.isArray(payload.tabCardPreferences) ? payload.tabCardPreferences : {};
  const tabCardPreferences = {};
  allowed.nav.forEach((key) => {
    const value = rawPreferences[key];
    if (!value || typeof value !== "object") return;
    const size = cardSizes.has(String(value.size)) ? String(value.size) : "standard";
    const shape = cardShapes.has(String(value.shape)) ? String(value.shape) : "soft";
    tabCardPreferences[key] = { size, shape };
  });
  const result = await db.from("portal_layout_preferences").upsert({
    clerk_user_id: user.id,
    role,
    nav_order: navOrder,
    home_order: homeOrder,
    hidden_home_sections: hidden,
    widget_order: widgetOrder,
    enabled_widgets: enabledWidgets,
    tab_card_preferences: tabCardPreferences,
    updated_at: new Date().toISOString(),
  }, { onConflict: "clerk_user_id,role" }).select("nav_order,home_order,hidden_home_sections,widget_order,enabled_widgets,tab_card_preferences").single();
  if (result.error) throw result.error;
  return { status: 200, payload: { layout: result.data } };
}

async function submitPortalFeedback(db, user, payload) {
  const requestType = String(payload.requestType || "").trim();
  const category = String(payload.category || "").trim();
  const comments = String(payload.comments || "").trim();
  if (!portalFeedbackTypes.has(requestType)) {
    return { status: 400, payload: { error: "Choose a valid feedback request type." } };
  }
  if (!portalFeedbackCategories.has(category)) {
    return { status: 400, payload: { error: "Choose a valid portal category." } };
  }
  if (comments.length < 10 || comments.length > 4000) {
    return { status: 400, payload: { error: "Feedback must be between 10 and 4,000 characters." } };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await db.from("portal_feedback")
    .select("id", { count: "exact", head: true })
    .eq("clerk_user_id", user.id)
    .gte("created_at", oneHourAgo);
  if (recent.error) throw recent.error;
  if ((recent.count || 0) >= 20) {
    return { status: 429, payload: { error: "Too many feedback submissions. Please try again later." } };
  }

  const role = await portalRoleFor(db, user);
  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "MLS Portal user";
  const inserted = await db.from("portal_feedback").insert({
    clerk_user_id: user.id,
    role,
    user_name: userName,
    user_email: user.email || null,
    request_type: requestType,
    category,
    comments,
  }).select("*").single();
  if (inserted.error) throw inserted.error;

  let delivery;
  try {
    delivery = await deliverPortalFeedback(db, inserted.data);
  } catch (deliveryError) {
    delivery = { sent: false, status: "failed", error: deliveryError.message || "Gmail feedback delivery failed." };
    const failed = await db.from("portal_feedback").update({
      gmail_delivery_status: "failed",
      gmail_delivery_error: delivery.error,
      updated_at: new Date().toISOString(),
    }).eq("id", inserted.data.id);
    if (failed.error) throw failed.error;
  }

  return {
    status: 201,
    payload: {
      feedback: { id: inserted.data.id, createdAt: inserted.data.created_at },
      delivery: {
        sent: Boolean(delivery.sent),
        filed: Boolean(delivery.labeled),
        status: delivery.status,
      },
    },
  };
}

function selectedNotificationIds(payload) {
  const values = [
    ...(Array.isArray(payload.notificationIds) ? payload.notificationIds : []),
    payload.notificationId,
  ];
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].slice(0, 100);
}

function applyNotificationSelection(query, ids) {
  if (!ids.length) return query;
  return ids.length === 1 ? query.eq("id", ids[0]) : query.in("id", ids);
}

async function setNotificationReadState(db, user, payload) {
  const ids = selectedNotificationIds(payload);
  const isRead = payload.isRead !== false;
  let query = db.from("notifications")
    .update({ is_read: isRead, read_at: isRead ? new Date().toISOString() : null })
    .eq("recipient_clerk_user_id", user.id);
  query = applyNotificationSelection(query, ids);
  const result = await query.select("id,is_read,read_at");
  if (result.error) throw result.error;
  return { status: 200, payload: { notifications: result.data || [] } };
}

async function markNotificationRead(db, user, payload) {
  return setNotificationReadState(db, user, { ...payload, isRead: true });
}

async function clearNotifications(db, user, payload) {
  const ids = selectedNotificationIds(payload);
  let query = db.from("notifications")
    .delete()
    .eq("recipient_clerk_user_id", user.id);
  query = applyNotificationSelection(query, ids);
  const result = await query.select("id");
  if (result.error) throw result.error;
  return { status: 200, payload: { notifications: result.data || [] } };
}

async function sendMessage(db, user, payload) {
  const assignmentId = String(payload.assignmentId || "");
  const text = String(payload.body || "").trim();
  if (!assignmentId || !text) return { status: 400, payload: { error: "Choose an assignment and enter a message." } };
  if (text.length > 4000) return { status: 400, payload: { error: "Messages must be 4,000 characters or fewer." } };

  const access = await assignmentAccess(db, user, assignmentId);
  if (!access.allowed) return { status: 403, payload: { error: "You do not have access to that assignment conversation." } };

  const insert = await db.from("assignment_messages").insert({
    assignment_id: assignmentId,
    sender_clerk_user_id: user.id,
    sender_role: access.role,
    body: text,
  }).select().single();
  if (insert.error) throw insert.error;

  const links = await db
    .from("assignment_interpreters")
    .select("interpreters(clerk_user_id)")
    .eq("assignment_id", assignmentId);
  if (links.error) throw links.error;

  const recipients = new Set([
    access.assignment.clients?.clerk_user_id,
    ...(links.data || []).map((item) => item.interpreters?.clerk_user_id),
  ].filter(Boolean));
  recipients.delete(user.id);

  await Promise.all([...recipients].map((recipient) => createNotification(db, recipient, {
    category: "message",
    title: "New assignment message",
    body: text.slice(0, 180),
    section: "messages",
    relatedType: "assignment",
    relatedId: assignmentId,
  })));

  return { status: 201, payload: { message: insert.data } };
}

async function adminAssignInterpreter(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.assignmentId || !payload.interpreterId) return { status: 400, payload: { error: "Assignment and interpreter are required." } };

  const interpreterResult = await db.from("interpreters").select("*").eq("id", payload.interpreterId).maybeSingle();
  if (interpreterResult.error) throw interpreterResult.error;
  if (!interpreterResult.data) return { status: 404, payload: { error: "Interpreter not found." } };

  const link = await db.from("assignment_interpreters").upsert({
    assignment_id: payload.assignmentId,
    interpreter_id: payload.interpreterId,
    role: payload.role || "interpreter",
    status: payload.status || "assigned",
    agreed_rate: payload.agreedRate || null,
    notes: payload.notes || null,
    accepted_at: payload.status === "accepted" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "assignment_id,interpreter_id" }).select().single();
  if (link.error) throw link.error;

  await createNotification(db, interpreterResult.data.clerk_user_id, {
    category: "assignment",
    title: "You were assigned to an MLS assignment",
    body: "Open your schedule to review the assignment details.",
    section: "schedule",
    relatedType: "assignment",
    relatedId: payload.assignmentId,
  });

  return { status: 200, payload: { assignmentInterpreter: link.data } };
}

async function adminRemoveInterpreter(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const result = await db.from("assignment_interpreters").delete().eq("id", payload.assignmentInterpreterId).select().maybeSingle();
  if (result.error) throw result.error;
  return { status: 200, payload: { removed: result.data || null } };
}

async function adminUpdateAssignment(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.assignmentId) return { status: 400, payload: { error: "Assignment is required." } };

  const updates = { updated_at: new Date().toISOString() };
  if (payload.status) {
    if (!assignmentStatuses.has(payload.status)) return { status: 400, payload: { error: "Invalid assignment status." } };
    updates.status = payload.status;
    if (payload.status === "confirmed") updates.confirmed_at = new Date().toISOString();
    if (payload.status === "completed") updates.completed_at = new Date().toISOString();
  }
  if (payload.paymentStatus) {
    if (!paymentStatuses.has(payload.paymentStatus)) return { status: 400, payload: { error: "Invalid payment status." } };
    updates.payment_status = payload.paymentStatus;
    if (payload.paymentStatus === "paid") updates.paid_at = new Date().toISOString();
  }
  if (Object.prototype.hasOwnProperty.call(payload, "invoiceNumber")) updates.invoice_number = payload.invoiceNumber || null;
  if (Object.prototype.hasOwnProperty.call(payload, "invoiceAmount")) updates.invoice_amount = payload.invoiceAmount || null;
  if (Object.prototype.hasOwnProperty.call(payload, "adminNotes")) updates.admin_notes = payload.adminNotes || null;

  const result = await db.from("assignments")
    .update(updates)
    .eq("id", payload.assignmentId)
    .select("*, clients(clerk_user_id,organization_name,email)")
    .single();
  if (result.error) throw result.error;

  const changes = [
    payload.status ? `Status: ${payload.status.replaceAll("_", " ")}` : "",
    payload.paymentStatus ? `Payment: ${payload.paymentStatus.replaceAll("_", " ")}` : "",
  ].filter(Boolean).join(" · ");
  if (changes) {
    await createNotification(db, result.data.clients?.clerk_user_id, {
      category: "assignment",
      title: "Assignment updated",
      body: changes,
      section: "assignments",
      relatedType: "assignment",
      relatedId: payload.assignmentId,
    });
  }

  return { status: 200, payload: { assignment: result.data } };
}

async function adminAcceptBid(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const bid = await db.from("assignment_bids")
    .select("*, interpreters(*), assignment_opportunities(*, assignments(*, clients(clerk_user_id,organization_name,email)))")
    .eq("id", payload.bidId)
    .maybeSingle();
  if (bid.error) throw bid.error;
  if (!bid.data) return { status: 404, payload: { error: "Bid not found." } };

  const assignmentId = bid.data.assignment_opportunities?.assignment_id;
  const interpreterId = bid.data.interpreter_id;
  if (!assignmentId || !interpreterId) return { status: 400, payload: { error: "Bid is missing assignment details." } };

  const [bidUpdate, linkUpdate, assignmentUpdate] = await Promise.all([
    db.from("assignment_bids").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", payload.bidId).select().single(),
    db.from("assignment_interpreters").upsert({
      assignment_id: assignmentId,
      interpreter_id: interpreterId,
      role: payload.role || "interpreter",
      status: "accepted",
      agreed_rate: bid.data.bid_rate || null,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "assignment_id,interpreter_id" }).select().single(),
    db.from("assignments").update({ status: "confirmed", confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", assignmentId).select().single(),
  ]);
  for (const result of [bidUpdate, linkUpdate, assignmentUpdate]) if (result.error) throw result.error;

  await Promise.all([
    createNotification(db, bid.data.interpreters?.clerk_user_id, {
      category: "assignment",
      title: "Your MLS bid was accepted",
      body: "The assignment is now in your schedule.",
      section: "schedule",
      relatedType: "assignment",
      relatedId: assignmentId,
    }),
    createNotification(db, bid.data.assignment_opportunities?.assignments?.clients?.clerk_user_id, {
      category: "assignment",
      title: "Interpreter confirmed",
      body: "MLS has confirmed staffing for your assignment.",
      section: "assignments",
      relatedType: "assignment",
      relatedId: assignmentId,
    }),
  ]);

  return { status: 200, payload: { bid: bidUpdate.data, assignmentInterpreter: linkUpdate.data, assignment: assignmentUpdate.data } };
}

async function notifyDocumentRequest(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  const table = payload.audienceType === "client" ? "clients" : "interpreters";
  const record = await db.from(table).select("clerk_user_id").eq("id", payload.ownerId).maybeSingle();
  if (record.error) throw record.error;
  if (record.data?.clerk_user_id) {
    await createNotification(db, record.data.clerk_user_id, {
      category: "document",
      title: payload.title || "MLS requested a document",
      body: payload.instructions || "Open your document center to upload the requested file.",
      section: "documents",
      relatedType: "document_request",
      relatedId: payload.requestId || null,
    });
  }
  return { status: 200, payload: { notified: Boolean(record.data?.clerk_user_id) } };
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    const db = database();
    const action = String(req.query?.action || "loadApp");
    const payload = readBody(req);

    if (action === "loadApp") return send(res, 200, await loadApp(db, user));
    if (action === "widgetData") {
      const result = await widgetData(req.query || {});
      if (result.cache) res.setHeader("Cache-Control", result.cache);
      return send(res, result.status, result.payload);
    }
    if (action === "savePortalLayout") {
      const result = await savePortalLayout(db, user, payload);
      return send(res, result.status, result.payload);
    }
    if (action === "submitPortalFeedback") {
      const result = await submitPortalFeedback(db, user, payload);
      return send(res, result.status, result.payload);
    }
    if (action.startsWith("push")) {
      const result = await pushAction(db, user, action, payload, req);
      return send(res, result?.status || 404, result?.payload || { error: "Unknown push action." });
    }

    let result;
    if (action === "markNotificationRead") result = await markNotificationRead(db, user, payload);
    else if (action === "setNotificationReadState") result = await setNotificationReadState(db, user, payload);
    else if (action === "clearNotifications") result = await clearNotifications(db, user, payload);
    else if (action === "sendMessage") result = await sendMessage(db, user, payload);
    else if (action === "adminAssignInterpreter") result = await adminAssignInterpreter(db, user, payload);
    else if (action === "adminRemoveInterpreter") result = await adminRemoveInterpreter(db, user, payload);
    else if (action === "adminUpdateAssignment") result = await adminUpdateAssignment(db, user, payload);
    else if (action === "adminAcceptBid") result = await adminAcceptBid(db, user, payload);
    else if (action === "notifyDocumentRequest") result = await notifyDocumentRequest(db, user, payload);
    else result = { status: 404, payload: { error: "Unknown app action." } };

    return send(res, result.status, result.payload);
  } catch (error) {
    console.error("MLS app API error", error);
    return send(res, 500, { error: error.message || "MLS app request failed." });
  }
}
