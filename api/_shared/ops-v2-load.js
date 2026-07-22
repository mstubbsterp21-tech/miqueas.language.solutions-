import { clientFor, interpreterFor } from "./ops-v2-core.js";
import { loadProfileCustomizationCollection, loadProfileCustomizationForRecord } from "./ops-v2-profiles.js";

async function realtimeTopic(db, user, role) {
  const result = await db.from("portal_realtime_channels").upsert({
    clerk_user_id: user.id,
    role,
    updated_at: new Date().toISOString(),
  }, { onConflict: "clerk_user_id" }).select("topic_token").single();
  if (result.error) throw result.error;
  return `portal-user:${result.data.topic_token}`;
}

async function homeAnnouncements(db, user, role) {
  const announcementResult = await db.from("portal_announcements").select("*").order("published_at", { ascending: false }).limit(12);
  if (announcementResult.error) throw announcementResult.error;
  const now = Date.now();
  const announcements = (announcementResult.data || []).filter((item) => {
    if (role === "admin") return true;
    if (item.expires_at && new Date(item.expires_at).getTime() < now) return false;
    return item.audiences?.includes("all") || item.audiences?.includes(role);
  });
  if (!announcements.length) return [];
  const reads = await db.from("portal_announcement_reads").select("announcement_id,read_at").eq("clerk_user_id", user.id).in("announcement_id", announcements.map((item) => item.id));
  if (reads.error) throw reads.error;
  const readMap = new Map((reads.data || []).map((item) => [item.announcement_id, item.read_at]));
  return announcements.map((item) => ({ ...item, read_at: readMap.get(item.id) || null }));
}

async function loadAdmin(db, user) {
  const personalInterpreter = await interpreterFor(db, user.id);
  const [quotes, invoices, contractorInvoices, agreements, times, expenses, credentials, availability, onboarding, auditEvents, integrations, profileCustomizations, personalProfileCustomization] = await Promise.all([
    db.from("quotes").select("*, quote_items(*), clients(id,organization_name,email), assignments(id,service_type,start_at,lifecycle_status)").order("created_at", { ascending: false }),
    db.from("invoices").select("*, invoice_items(*), payments(*), clients(id,organization_name,email), assignments(id,service_type,start_at,lifecycle_status), quotes(id,quote_number)").order("created_at", { ascending: false }),
    db.from("contractor_invoices").select("*, interpreters(id,first_name,last_name,email), assignments(id,service_type,start_at), assignment_interpreters(id,agreed_rate,contractor_payment_status)").order("created_at", { ascending: false }),
    db.from("assignment_agreements").select("*, clients(id,organization_name,email), assignments(id,service_type,start_at,lifecycle_status)").order("created_at", { ascending: false }),
    db.from("time_entries").select("*, interpreters(id,first_name,last_name,email), assignments(id,service_type,start_at,client_id)").order("created_at", { ascending: false }),
    db.from("expenses").select("*, interpreters(id,first_name,last_name,email), assignments(id,service_type,start_at,client_id)").order("created_at", { ascending: false }),
    db.from("interpreter_credentials").select("*, interpreters(id,first_name,last_name,email,roster_status)").order("expires_on", { ascending: true, nullsFirst: false }),
    db.from("interpreter_availability").select("*, interpreters(id,first_name,last_name,email)").order("start_at", { ascending: true }),
    db.from("interpreter_onboarding").select("*, interpreters(id,first_name,last_name,email,roster_status,screening_status,w9_status,insurance_status)").order("updated_at", { ascending: false }),
    db.from("audit_events").select("*").order("created_at", { ascending: false }).limit(250),
    db.from("integration_settings").select("*").order("integration_key"),
    loadProfileCustomizationCollection(db),
    loadProfileCustomizationForRecord(db, "interpreter", personalInterpreter),
  ]);
  const databaseResults = [quotes, invoices, contractorInvoices, agreements, times, expenses, credentials, availability, onboarding, auditEvents, integrations];
  for (const result of databaseResults) if (result.error) throw result.error;
  return {
    role: "admin",
    realtimeTopic: await realtimeTopic(db, user, "admin"),
    quotes: quotes.data || [], invoices: invoices.data || [], contractorInvoices: contractorInvoices.data || [], agreements: agreements.data || [], timeEntries: times.data || [], expenses: expenses.data || [], credentials: credentials.data || [], availability: availability.data || [], onboarding: onboarding.data || [], auditEvents: auditEvents.data || [], integrations: integrations.data || [], profileCustomizations, personalProfileCustomization, personalInterpreter,
    integrationCapabilities: { found: { mode: "reference_and_manual_sync", apiAvailable: false }, boldsign: { mode: "manual", apiRequired: false, enabled: true }, googleDrive: { configured: false } },
  };
}

async function loadClient(db, user) {
  const client = await clientFor(db, user.id);
  if (!client) return { role: "client", realtimeTopic: await realtimeTopic(db, user, "client"), quotes: [], invoices: [], agreements: [], timeEntries: [], profileCustomization: null };
  const assignmentIdsResult = await db.from("assignments").select("id").eq("client_id", client.id);
  if (assignmentIdsResult.error) throw assignmentIdsResult.error;
  const assignmentIds = (assignmentIdsResult.data || []).map((item) => item.id);
  const [quotes, invoices, agreements, times, profileCustomization] = await Promise.all([
    db.from("quotes").select("*, quote_items(*), assignments(id,service_type,start_at,lifecycle_status)").eq("client_id", client.id).order("created_at", { ascending: false }),
    db.from("invoices").select("*, invoice_items(*), payments(*), assignments(id,service_type,start_at,lifecycle_status)").eq("client_id", client.id).order("created_at", { ascending: false }),
    db.from("assignment_agreements").select("*, assignments(id,service_type,start_at,lifecycle_status)").eq("client_id", client.id).order("created_at", { ascending: false }),
    assignmentIds.length ? db.from("time_entries").select("*, interpreters(id,first_name,last_name,email), assignments(id,service_type,start_at)").in("assignment_id", assignmentIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    loadProfileCustomizationForRecord(db, "client", client),
  ]);
  for (const result of [quotes, invoices, agreements, times]) if (result.error) throw result.error;
  return { role: "client", realtimeTopic: await realtimeTopic(db, user, "client"), quotes: quotes.data || [], invoices: invoices.data || [], agreements: agreements.data || [], timeEntries: times.data || [], profileCustomization };
}

async function loadInterpreter(db, user) {
  const interpreter = await interpreterFor(db, user.id);
  if (!interpreter) return { role: "interpreter", realtimeTopic: await realtimeTopic(db, user, "interpreter"), timeEntries: [], expenses: [], credentials: [], availability: [], onboarding: null, payments: [], profileCustomization: null };
  const [times, expenses, credentials, availability, onboardingRows, payments, contractorInvoices, profileCustomization] = await Promise.all([
    db.from("time_entries").select("*, assignments(id,service_type,start_at,end_at,delivery_mode,location_name,city,state)").eq("interpreter_id", interpreter.id).order("created_at", { ascending: false }),
    db.from("expenses").select("*, assignments(id,service_type,start_at)").eq("interpreter_id", interpreter.id).order("created_at", { ascending: false }),
    db.from("interpreter_credentials").select("*").eq("interpreter_id", interpreter.id).order("expires_on", { ascending: true, nullsFirst: false }),
    db.from("interpreter_availability").select("*").eq("interpreter_id", interpreter.id).order("start_at", { ascending: true }),
    db.from("interpreter_onboarding").select("*").eq("interpreter_id", interpreter.id),
    db.from("assignment_interpreters").select("*, assignments(id,service_type,start_at)").eq("interpreter_id", interpreter.id).order("assigned_at", { ascending: false }),
    db.from("contractor_invoices").select("id,assignment_id,invoice_number,invoice_date,amount,currency,status,file_name,interpreter_notes,admin_notes,submitted_at,scheduled_at,paid_at,payment_reference,created_at,assignments(id,service_type,start_at)").eq("interpreter_id", interpreter.id).order("created_at", { ascending: false }),
    loadProfileCustomizationForRecord(db, "interpreter", interpreter),
  ]);
  for (const result of [times, expenses, credentials, availability, onboardingRows, payments, contractorInvoices]) if (result.error) throw result.error;
  return { role: "interpreter", realtimeTopic: await realtimeTopic(db, user, "interpreter"), timeEntries: times.data || [], expenses: expenses.data || [], credentials: credentials.data || [], availability: availability.data || [], onboarding: (onboardingRows.data || [])[0] || null, payments: payments.data || [], contractorInvoices: contractorInvoices.data || [], profileCustomization };
}

export async function loadOperationsV2(db, user) {
  if (user.isAdmin) {
    const data = await loadAdmin(db, user);
    return { ...data, announcements: await homeAnnouncements(db, user, "admin") };
  }
  const client = await clientFor(db, user.id);
  if (client) {
    const data = await loadClient(db, user);
    return { ...data, announcements: await homeAnnouncements(db, user, "client") };
  }
  const data = await loadInterpreter(db, user);
  return { ...data, announcements: await homeAnnouncements(db, user, "interpreter") };
}
