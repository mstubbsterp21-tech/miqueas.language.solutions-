import InterpreterRequestFormShared from "../components/InterpreterRequestFormShared";

function addressFromClient(client = {}) {
  return [
    client.address_line_1,
    client.address_line_2,
    [client.city, client.state, client.postal_code].filter(Boolean).join(", "),
    client.country,
  ].filter(Boolean).join("\n");
}

function initialValuesFromClient(client = {}) {
  const address = addressFromClient(client);
  const email = client.billing_email || client.email || "";
  return {
    emailCapture: email,
    fullName: client.primary_contact_name || "",
    organizationName: client.organization_name || "",
    physicalAddress: address,
    billingSameAsPhysical: Boolean(address),
    billingAddress: address,
    contactEmail: email,
    phoneNumber: client.phone || client.billing_phone || "",
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

export default function PortalInterpreterRequestForm({ client, source = "client_portal", onSubmit }) {
  const initialValues = initialValuesFromClient(client);

  async function submit(request) {
    const assignment = portalAssignmentFromRequest(request, source);
    await onSubmit(assignment, request);
  }

  return (
    <InterpreterRequestFormShared
      initialValues={initialValues}
      onSubmitRequest={submit}
      successTitle="Request Submitted"
      successMessage="Your request has been added to the MLS Portal and is ready for review."
    />
  );
}
