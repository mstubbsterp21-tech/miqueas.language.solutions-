import { audit, clientFor } from "./ops-v2-core.js";
import { INTERPRETER_REQUEST_SERVICE_OPTIONS, INTERPRETER_REQUEST_SETTING_OPTIONS } from "../../src/requestFormConfig.js";

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

function validEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || "").trim());
}

function newClientPreferences(request = {}) {
  return [
    request.communicationStyles ? `Communication styles: ${request.communicationStyles}` : "",
    request.additionalConsiderations ? `Additional considerations: ${request.additionalConsiderations}` : "",
    request.communicationNotes ? `Notes: ${request.communicationNotes}` : "",
    request.cdiOrAdditionalSupportNeeded ? `CDI / additional support: ${request.cdiOrAdditionalSupportNeeded}` : "",
  ].filter(Boolean).join("\n");
}

function newClientRequestDefaults(request = {}) {
  return {
    serviceNeeded: request.serviceNeeded || "",
    setting: request.setting || "",
    settingOther: request.settingOther || "",
    communicationStyles: Array.isArray(request.communicationStyles) ? request.communicationStyles : [],
    communicationStyleOther: request.communicationStyleOther || "",
    hearingParticipantsLanguages: request.hearingParticipantsLanguages || "",
    additionalConsiderations: Array.isArray(request.additionalConsiderations) ? request.additionalConsiderations : [],
    additionalConsiderationsOther: request.additionalConsiderationsOther || "",
    cdiOrAdditionalSupportNeeded: request.cdiOrAdditionalSupportNeeded || "",
    communicationNotes: request.communicationNotes || "",
  };
}

async function existingClient(db, user, clientId) {
  if (!user.isAdmin) return clientFor(db, user.id);
  if (!clientId) return null;
  const result = await db.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function duplicateClientForEmail(db, email) {
  const [primary, billing] = await Promise.all([
    db.from("clients").select("id,organization_name,primary_contact_name,email").eq("email", email).limit(1).maybeSingle(),
    db.from("clients").select("id,organization_name,primary_contact_name,email").eq("billing_email", email).limit(1).maybeSingle(),
  ]);
  if (primary.error) throw primary.error;
  if (billing.error) throw billing.error;
  return primary.data || billing.data || null;
}

async function createNewClient(db, user, request = {}, assignment = {}) {
  if (!user.isAdmin) return { status: 403, error: "Only MLS administrators can create a new client from an assignment." };
  const email = String(request.contactEmail || request.emailCapture || "").trim().toLowerCase();
  const fullName = String(request.fullName || "").trim();
  const organizationName = String(request.organizationName || "").trim();
  const phone = String(request.phoneNumber || "").trim();
  const physicalAddress = String(request.physicalAddress || "").trim();
  const billingAddress = String(request.billingAddress || physicalAddress).trim();

  if (!validEmail(email) || !fullName || !organizationName || !phone || !physicalAddress || !billingAddress) {
    return { status: 400, error: "Complete the new client’s contact and billing information before creating the assignment." };
  }

  const duplicate = await duplicateClientForEmail(db, email);
  if (duplicate) {
    return {
      status: 409,
      error: `${duplicate.organization_name || duplicate.primary_contact_name || email} already exists in the client roster. Choose Existing client instead.`,
    };
  }

  const inserted = await db.from("clients").insert({
    clerk_user_id: null,
    organization_name: organizationName,
    primary_contact_name: fullName,
    email,
    phone,
    preferred_contact_method: "Email",
    billing_email: email,
    billing_phone: phone,
    address_line_1: physicalAddress,
    physical_address_text: physicalAddress,
    billing_address_text: billingAddress,
    country: "United States",
    default_service_type: request.serviceNeeded || assignment.service_type || null,
    default_delivery_mode: request.setting === "Other" && request.settingOther ? `Other: ${request.settingOther}` : request.setting || null,
    communication_preferences: newClientPreferences(request) || null,
    request_defaults: newClientRequestDefaults(request),
    onboarding_complete: false,
    account_status: "active",
    updated_at: new Date().toISOString(),
  }).select("*").single();
  if (inserted.error) throw inserted.error;
  return { status: 201, client: inserted.data };
}

export async function createRequestAssignment(db, user, payload = {}) {
  const assignment = cleanAssignment(payload.assignment || {});
  if (!assignment.service_type || !assignment.delivery_mode || !assignment.start_at || !assignment.end_at) {
    return { status: 400, payload: { error: "Service, date, start time, and end time are required." } };
  }
  if (!assignment.request_form_data || typeof assignment.request_form_data !== "object" || Array.isArray(assignment.request_form_data)) {
    return { status: 400, payload: { error: "The complete Interpreter Request form is required." } };
  }
  const request = assignment.request_form_data;
  if (!INTERPRETER_REQUEST_SERVICE_OPTIONS.includes(request.serviceNeeded) || !INTERPRETER_REQUEST_SETTING_OPTIONS.includes(request.setting)) {
    return { status: 400, payload: { error: "Choose a service and setting from the current Interpreter Request Form." } };
  }
  if (request.setting === "Other" && !String(request.settingOther || "").trim()) {
    return { status: 400, payload: { error: "Describe the other assignment setting." } };
  }

  const creatingNewClient = user.isAdmin && payload.clientMode === "new";
  let client;
  if (creatingNewClient) {
    const created = await createNewClient(db, user, payload.newClient || assignment.request_form_data, assignment);
    if (!created.client) return { status: created.status, payload: { error: created.error } };
    client = created.client;
  } else {
    client = await existingClient(db, user, payload.clientId);
    if (!client) {
      return { status: user.isAdmin ? 400 : 403, payload: { error: user.isAdmin ? "Choose an existing client or select New client." : "A client profile is required to submit a request." } };
    }
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

  if (result.error) {
    if (creatingNewClient) await db.from("clients").delete().eq("id", client.id).is("clerk_user_id", null);
    throw result.error;
  }

  if (creatingNewClient) {
    await audit(db, user, {
      action: "client.created_from_assignment",
      entityType: "client",
      entityId: client.id,
      summary: `Created ${client.organization_name || client.primary_contact_name} while entering a new assignment`,
      after: { email: client.email, portalAccountLinked: false },
    });
  }

  await audit(db, user, {
    action: "assignment.request_created",
    entityType: "assignment",
    entityId: result.data.id,
    summary: `${user.isAdmin ? "Admin" : "Client"} submitted the shared Interpreter Request form`,
    after: { clientId: client.id, newClient: creatingNewClient, requestSource: result.data.request_source, serviceType: result.data.service_type },
  });

  return { status: 201, payload: { assignment: result.data, client, clientCreated: creatingNewClient } };
}
