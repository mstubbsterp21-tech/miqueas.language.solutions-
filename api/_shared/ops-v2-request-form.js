import { audit, clientFor } from "./ops-v2-core.js";

const allowedFields = new Set([
  "service_type", "delivery_mode", "start_at", "end_at", "timezone", "location_name",
  "address_line_1", "address_line_2", "city", "state", "postal_code", "meeting_link",
  "deaf_participants", "hearing_participants", "language_preferences", "specialty",
  "team_requested", "cdi_requested", "onsite_contact_name", "onsite_contact_phone",
  "description", "preparation_materials", "purchase_order_number", "client_reference",
  "request_source", "request_form_version", "request_form_data",
]);

function cleanAssignment(value = {}) {
  return Object.entries(value).reduce((result, [key, fieldValue]) => {
    if (allowedFields.has(key)) result[key] = fieldValue;
    return result;
  }, {});
}

async function selectedClient(db, user, clientId) {
  if (!user.isAdmin) return clientFor(db, user.id);
  if (!clientId) return null;
  const result = await db.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function createRequestAssignment(db, user, payload = {}) {
  const client = await selectedClient(db, user, payload.clientId);
  if (!client) {
    return { status: user.isAdmin ? 400 : 403, payload: { error: user.isAdmin ? "Choose a client before creating the assignment." : "A client profile is required to submit a request." } };
  }

  const assignment = cleanAssignment(payload.assignment || {});
  if (!assignment.service_type || !assignment.delivery_mode || !assignment.start_at || !assignment.end_at) {
    return { status: 400, payload: { error: "Service, date, start time, and end time are required." } };
  }
  if (!assignment.request_form_data || typeof assignment.request_form_data !== "object" || Array.isArray(assignment.request_form_data)) {
    return { status: 400, payload: { error: "The complete Interpreter Request form is required." } };
  }

  const result = await db.from("assignments").insert({
    ...assignment,
    client_id: client.id,
    requested_by_clerk_user_id: user.id,
    request_source: user.isAdmin ? "admin_portal" : "client_portal",
    request_form_version: Number(assignment.request_form_version || 1),
    status: "pending_confirmation",
    payment_status: "not_invoiced",
  }).select("*, clients(id,clerk_user_id,organization_name,primary_contact_name,email)").single();
  if (result.error) throw result.error;

  await audit(db, user, {
    action: "assignment.request_created",
    entityType: "assignment",
    entityId: result.data.id,
    summary: `${user.isAdmin ? "Admin" : "Client"} submitted the shared Interpreter Request form`,
    after: { clientId: client.id, requestSource: result.data.request_source, serviceType: result.data.service_type },
  });

  return { status: 201, payload: { assignment: result.data } };
}
