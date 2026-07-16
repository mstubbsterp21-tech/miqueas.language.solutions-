import ExistingClientInterpreterRequestForm from "../components/ExistingClientInterpreterRequestForm";
import InterpreterRequestFormShared from "../components/InterpreterRequestFormShared";

function assembledAddress(client = {}) {
  return [
    client.address_line_1,
    client.address_line_2,
    [client.city, client.state, client.postal_code].filter(Boolean).join(", "),
    client.country,
  ].filter(Boolean).join("\n");
}

function preferredService(client = {}) {
  const service = String(client.default_service_type || "").toLowerCase();
  const delivery = String(client.default_delivery_mode || "").toLowerCase();
  if (service.includes("english") && service.includes("asl") && service.includes("translation")) return "ASL Video Translation (English → ASL)";
  if (service.includes("asl") && service.includes("english") && service.includes("translation")) return "ASL Content Translation (ASL → English)";
  if (delivery.includes("vri") || delivery.includes("virtual") || service.includes("video remote")) return "Video Remote Interpreting";
  if (delivery.includes("on-site") || delivery.includes("onsite") || service.includes("interpreting")) return "In-Person Interpreting";
  return "";
}

export function initialValuesFromClient(client = {}) {
  const physicalAddress = client.physical_address_text || assembledAddress(client);
  const billingAddress = client.billing_address_text || physicalAddress;
  const email = client.billing_email || client.email || "";
  const savedPreferences = String(client.communication_preferences || "").trim();
  const cdiPreference = /certified deaf interpreter|\bcdi\b/i.test(`${client.default_service_type || ""} ${savedPreferences}`);
  return {
    emailCapture: email,
    fullName: client.primary_contact_name || "",
    organizationName: client.organization_name || "",
    physicalAddress,
    billingSameAsPhysical: Boolean(physicalAddress && billingAddress === physicalAddress),
    billingAddress,
    contactEmail: email,
    phoneNumber: client.phone || client.billing_phone || "",
    serviceNeeded: preferredService(client),
    communicationNotes: savedPreferences,
    cdiOrAdditionalSupportNeeded: cdiPreference ? "Yes" : "",
  };
}

function localDateTimeToIso(date, time) {
  const value = new Date(`${date}T${time}`);
  if (Number.isNaN(value.getTime())) throw new Error("Enter a valid assignment date and time.");
  return value.toISOString();
}

function deliveryMode(serviceNeeded) {
  return serviceNeeded === "In-Person Interpreting" ? "On-site" : "VRI";
}

function preparationSummary(request) {
  return [
    request.specializedTopics ? `Specialized topics / terminology:\n${request.specializedTopics}` : "",
    request.materialsList ? `Available materials:\n${request.materialsList}` : "",
    request.interactionGoal ? `Goal of the interaction:\n${request.interactionGoal}` : "",
    request.communicationNotes ? `Communication notes:\n${request.communicationNotes}` : "",
    request.environmentalFactors ? `Environmental factors:\n${request.environmentalFactors}` : "",
  ].filter(Boolean).join("\n\n");
}

export function portalAssignmentFromRequest(request, source = "client_portal") {
  const mode = deliveryMode(request.serviceNeeded);
  const location = String(request.assignmentLocationPlatform || "").trim();
  const isUrl = /^https?:\/\//i.test(location);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

  return {
    service_type: request.serviceNeeded,
    delivery_mode: mode,
    start_at: localDateTimeToIso(request.assignmentDate, request.startTime),
    end_at: localDateTimeToIso(request.assignmentDate, request.endTime),
    timezone,
    location_name: location,
    meeting_link: isUrl ? location : null,
    deaf_participants: null,
    hearing_participants: null,
    language_preferences: [request.communicationStyles, request.hearingParticipantsLanguages].filter(Boolean).join(" | "),
    specialty: request.setting,
    team_requested: request.exceedsTwoHours === "Yes",
    cdi_requested: request.cdiOrAdditionalSupportNeeded === "Yes",
    onsite_contact_name: request.fullName,
    onsite_contact_phone: request.phoneNumber,
    description: request.assignmentDescription,
    preparation_materials: preparationSummary(request),
    request_source: source,
    request_form_version: 1,
    request_form_data: request,
  };
}

export default function PortalInterpreterRequestForm({
  client,
  source = "client_portal",
  onSubmit,
  existingClient = Boolean(client?.id),
}) {
  const initialValues = initialValuesFromClient(client || {});

  async function submit(request) {
    const assignment = portalAssignmentFromRequest(request, source);
    await onSubmit(assignment, request);
  }

  const props = {
    initialValues,
    onSubmitRequest: submit,
    successTitle: "Request Submitted",
    successMessage: "Your request has been added to the MLS Portal and is ready for review.",
  };

  return existingClient
    ? <ExistingClientInterpreterRequestForm {...props} />
    : <InterpreterRequestFormShared {...props} />;
}
