import ExistingClientInterpreterRequestForm from "../components/ExistingClientInterpreterRequestForm";
import InterpreterRequestFormShared from "../components/InterpreterRequestFormShared";
import {
  normalizeRequestService,
  normalizeRequestSetting,
  requestDefaultsFromClient,
} from "../requestFormConfig";
import { getPortalTimeZone, zonedDateTimeToUtc, zonedInputValue } from "./timezones";

function assembledAddress(client = {}) {
  return [
    client.address_line_1,
    client.address_line_2,
    [client.city, client.state, client.postal_code].filter(Boolean).join(", "),
    client.country,
  ].filter(Boolean).join("\n");
}

export function initialValuesFromClient(client = {}) {
  const physicalAddress = client.physical_address_text || assembledAddress(client);
  const billingAddress = client.billing_address_text || physicalAddress;
  const email = client.billing_email || client.email || "";
  const defaults = requestDefaultsFromClient(client);
  return {
    emailCapture: email,
    fullName: client.primary_contact_name || "",
    organizationName: client.organization_name || "",
    physicalAddress,
    billingSameAsPhysical: Boolean(physicalAddress && billingAddress === physicalAddress),
    billingAddress,
    contactEmail: email,
    phoneNumber: client.phone || client.billing_phone || "",
    ...defaults,
    timeZone: getPortalTimeZone(),
  };
}

function assignmentLocation(assignment = {}) {
  if (assignment.meeting_link) return assignment.meeting_link;
  return [
    assignment.location_name,
    assignment.address_line_1,
    assignment.address_line_2,
    [assignment.city, assignment.state, assignment.postal_code].filter(Boolean).join(", "),
  ].filter(Boolean).join("\n");
}

export function initialValuesFromAssignment(assignment = {}, client = {}) {
  const saved = assignment.request_form_data && typeof assignment.request_form_data === "object" && !Array.isArray(assignment.request_form_data)
    ? assignment.request_form_data
    : {};
  const timeZone = assignment.timezone || saved.timeZone || getPortalTimeZone();
  const start = zonedInputValue(assignment.start_at, timeZone).split("T");
  const end = zonedInputValue(assignment.end_at, timeZone).split("T");
  const setting = normalizeRequestSetting(assignment.specialty || saved.setting);
  const legacyDefaults = requestDefaultsFromClient({
    default_service_type: assignment.service_type,
    default_delivery_mode: assignment.specialty,
    communication_preferences: assignment.language_preferences,
  });
  const clientDefaults = initialValuesFromClient(client);
  const knownParticipants = [assignment.deaf_participants, assignment.hearing_participants]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(Number)
    .filter(Number.isFinite);

  return {
    ...clientDefaults,
    ...saved,
    serviceNeeded: normalizeRequestService(assignment.service_type || saved.serviceNeeded, assignment.delivery_mode),
    setting: setting.setting || saved.setting || "",
    settingOther: setting.settingOther || saved.settingOther || "",
    assignmentDate: start[0] || saved.assignmentDate || "",
    startTime: start[1] || saved.startTime || "",
    endTime: end[1] || saved.endTime || "",
    timeZone,
    assignmentLocationPlatform: assignmentLocation(assignment) || saved.assignmentLocationPlatform || "",
    participantCount: saved.participantCount || (knownParticipants.length ? String(knownParticipants.reduce((sum, value) => sum + value, 0)) : ""),
    communicationStyles: Array.isArray(saved.communicationStyles) && saved.communicationStyles.length ? saved.communicationStyles : legacyDefaults.communicationStyles.length ? legacyDefaults.communicationStyles : clientDefaults.communicationStyles,
    additionalConsiderations: Array.isArray(saved.additionalConsiderations) && saved.additionalConsiderations.length ? saved.additionalConsiderations : legacyDefaults.additionalConsiderations.length ? legacyDefaults.additionalConsiderations : clientDefaults.additionalConsiderations,
    cdiOrAdditionalSupportNeeded: saved.cdiOrAdditionalSupportNeeded || (assignment.cdi_requested ? "Yes" : ""),
    exceedsTwoHours: saved.exceedsTwoHours || (assignment.team_requested ? "Yes" : ""),
    assignmentDescription: assignment.description || saved.assignmentDescription || "",
  };
}

function localDateTimeToIso(date, time, timeZone) {
  return zonedDateTimeToUtc(`${date}T${time}`, timeZone);
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
  const timezone = request.timeZone || getPortalTimeZone();

  return {
    service_type: request.serviceNeeded,
    delivery_mode: mode,
    start_at: localDateTimeToIso(request.assignmentDate, request.startTime, timezone),
    end_at: localDateTimeToIso(request.assignmentDate, request.endTime, timezone),
    timezone,
    location_name: location,
    address_line_1: null,
    address_line_2: null,
    city: null,
    state: null,
    postal_code: null,
    meeting_link: isUrl ? location : null,
    deaf_participants: null,
    hearing_participants: null,
    language_preferences: [request.communicationStyles, request.hearingParticipantsLanguages].filter(Boolean).join(" | "),
    specialty: request.setting === "Other" && request.settingOther
      ? `Other: ${request.settingOther}`
      : request.setting,
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
  initialValues: suppliedInitialValues,
  submitLabel = "Submit Request",
}) {
  const initialValues = suppliedInitialValues || initialValuesFromClient(client || {});

  async function submit(request) {
    const assignment = portalAssignmentFromRequest(request, source);
    await onSubmit(assignment, request);
  }

  const props = {
    initialValues,
    onSubmitRequest: submit,
    successTitle: "Request Submitted",
    successMessage: "Your request has been added to the MLS Portal and is ready for review.",
    submitLabel,
  };

  return existingClient
    ? <ExistingClientInterpreterRequestForm {...props} />
    : <InterpreterRequestFormShared {...props} />;
}
