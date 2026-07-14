import { clientFor, interpreterFor } from "./ops-v2-core.js";

async function unwrap(results) {
  for (const result of results) if (result.error) throw result.error;
  return results.map((result) => result.data || []);
}

async function loadAdmin(db) {
  const [quotes, invoices, agreements, times, expenses, credentials, availability, onboarding, auditEvents, integrations] = await unwrap(await Promise.all([
    db.from("quotes").select("*, quote_items(*), clients(id,organization_name,email), assignments(id,service_type,start_at,lifecycle_status)").order("created_at", { ascending: false }),
    db.from("invoices").select("*, invoice_items(*), payments(*), clients(id,organization_name,email), assignments(id,service_type,start_at,lifecycle_status), quotes(id,quote_number)").order("created_at", { ascending: false }),
    db.from("assignment_agreements").select("*, clients(id,organization_name,email), assignments(id,service_type,start_at,lifecycle_status)").order("created_at", { ascending: false }),
    db.from("time_entries").select("*, interpreters(id,first_name,last_name,email), assignments(id,service_type,start_at,client_id)").order("created_at", { ascending: false }),
    db.from("expenses").select("*, interpreters(id,first_name,last_name,email), assignments(id,service_type,start_at,client_id)").order("created_at", { ascending: false }),
    db.from("interpreter_credentials").select("*, interpreters(id,first_name,last_name,email,roster_status)").order("expires_on", { ascending: true, nullsFirst: false }),
    db.from("interpreter_availability").select("*, interpreters(id,first_name,last_name,email)").order("start_at", { ascending: true }),
    db.from("interpreter_onboarding").select("*, interpreters(id,first_name,last_name,email,roster_status,screening_status,w9_status,insurance_status)").order("updated_at", { ascending: false }),
    db.from("audit_events").select("*").order("created_at", { ascending: false }).limit(250),
    db.from("integration_settings").select("*").order("integration_key"),
  ]));

  return {
    role: "admin",
    quotes, invoices, agreements, timeEntries: times, expenses,
    credentials, availability, onboarding, auditEvents, integrations,
    integrationCapabilities: {
      found: { mode: "reference_and_manual_sync", apiAvailable: false },
      boldsign: { mode: "manual", apiRequired: false, enabled: true },
      googleDrive: { configured: false },
    },
  };
}

async function loadClient(db, user) {
  const client = await clientFor(db, user.id);
  if (!client) return { role: "client", quotes: [], invoices: [], agreements: [], timeEntries: [] };

  const assignmentIdsResult = await db.from("assignments").select("id").eq("client_id", client.id);
  if (assignmentIdsResult.error) throw assignmentIdsResult.error;
  const assignmentIds = (assignmentIdsResult.data || []).map((item) => item.id);

  const [quotes, invoices, agreements, times] = await unwrap(await Promise.all([
    db.from("quotes").select("*, quote_items(*), assignments(id,service_type,start_at,lifecycle_status)").eq("client_id", client.id).order("created_at", { ascending: false }),
    db.from("invoices").select("*, invoice_items(*), payments(*), assignments(id,service_type,start_at,lifecycle_status)").eq("client_id", client.id).order("created_at", { ascending: false }),
    db.from("assignment_agreements").select("*, assignments(id,service_type,start_at,lifecycle_status)").eq("client_id", client.id).order("created_at", { ascending: false }),
    assignmentIds.length
      ? db.from("time_entries").select("*, interpreters(id,first_name,last_name,email), assignments(id,service_type,start_at)").in("assignment_id", assignmentIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]));

  return { role: "client", quotes, invoices, agreements, timeEntries: times };
}

async function loadInterpreter(db, user) {
  const interpreter = await interpreterFor(db, user.id);
  if (!interpreter) return { role: "interpreter", timeEntries: [], expenses: [], credentials: [], availability: [], onboarding: null, payments: [] };

  const [times, expenses, credentials, availability, onboardingRows, payments] = await unwrap(await Promise.all([
    db.from("time_entries").select("*, assignments(id,service_type,start_at,end_at,delivery_mode,location_name,city,state)").eq("interpreter_id", interpreter.id).order("created_at", { ascending: false }),
    db.from("expenses").select("*, assignments(id,service_type,start_at)").eq("interpreter_id", interpreter.id).order("created_at", { ascending: false }),
    db.from("interpreter_credentials").select("*").eq("interpreter_id", interpreter.id).order("expires_on", { ascending: true, nullsFirst: false }),
    db.from("interpreter_availability").select("*").eq("interpreter_id", interpreter.id).order("start_at", { ascending: true }),
    db.from("interpreter_onboarding").select("*").eq("interpreter_id", interpreter.id),
    db.from("assignment_interpreters").select("*, assignments(id,service_type,start_at)").eq("interpreter_id", interpreter.id).order("assigned_at", { ascending: false }),
  ]));

  return {
    role: "interpreter",
    timeEntries: times,
    expenses,
    credentials,
    availability,
    onboarding: onboardingRows[0] || null,
    payments,
  };
}

export async function loadOperationsV2(db, user) {
  if (user.isAdmin) return loadAdmin(db);
  const client = await clientFor(db, user.id);
  return client ? loadClient(db, user) : loadInterpreter(db, user);
}
