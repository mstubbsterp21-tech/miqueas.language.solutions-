export const requiredDocumentTypes = ["resume", "w9", "credential_proof", "liability_insurance", "ic_agreement"];

export const requiredProfileSetupFields = [
  "phone",
  "preferred_contact_method",
  "cityOrLocation",
  "credentials",
  "years_experience",
  "modalities",
  "areas_of_experience",
  "assignment_type_preference",
  "willing_to_travel",
  "professional_liability_insurance",
  "availability",
];

export const rosterStatusOptions = [
  ["active", "Active"],
  ["inactive", "Inactive"],
  ["pending_documentation", "Pending Documentation"],
];

export function normalizeRosterStatus(value) {
  if (value === "pending_profile") return "inactive";
  if (value === "pending_documents") return "pending_documentation";
  if (value === "pending_documentation") return "pending_documentation";
  if (value === "active") return "active";
  if (value === "inactive") return "inactive";
  if (value === "removed") return "removed";
  return "inactive";
}

export function rosterStatusLabel(value) {
  const normalized = normalizeRosterStatus(value);
  if (normalized === "pending_documentation") return "Pending Documentation";
  if (normalized === "active") return "Active";
  if (normalized === "removed") return "Removed";
  return "Inactive";
}

export function hasAvailability(profile = {}) {
  return [
    "availability_sunday",
    "availability_monday",
    "availability_tuesday",
    "availability_wednesday",
    "availability_thursday",
    "availability_friday",
    "availability_saturday",
  ].some((field) => Boolean(profile?.[field]));
}

export function isProfileSetupFieldComplete(profile = {}, field) {
  if (field === "cityOrLocation") return Boolean(profile.city || profile.current_location);
  if (field === "availability") return hasAvailability(profile);
  return Boolean(profile[field]);
}

export function getProfileSetupCompletion(profile = {}) {
  const completed = requiredProfileSetupFields.filter((field) => isProfileSetupFieldComplete(profile, field)).length;
  return {
    completed,
    total: requiredProfileSetupFields.length,
    percent: Math.round((completed / requiredProfileSetupFields.length) * 100),
    isComplete: completed === requiredProfileSetupFields.length,
  };
}

export function getDocumentsByType(documents = []) {
  return (documents || []).reduce((acc, document) => {
    if (document?.document_type) acc[document.document_type] = document;
    return acc;
  }, {});
}

export function getRequiredDocumentCompletion(documentsOrByType = {}) {
  const byType = Array.isArray(documentsOrByType) ? getDocumentsByType(documentsOrByType) : documentsOrByType;
  const completed = requiredDocumentTypes.filter((type) => Boolean(byType[type])).length;
  return {
    completed,
    total: requiredDocumentTypes.length,
    percent: Math.round((completed / requiredDocumentTypes.length) * 100),
    isComplete: completed === requiredDocumentTypes.length,
  };
}

export function getOverallProfileCompletion(profile = {}, documentsOrByType = {}) {
  const setup = getProfileSetupCompletion(profile);
  const docs = getRequiredDocumentCompletion(documentsOrByType);
  const completed = setup.completed + docs.completed;
  const total = setup.total + docs.total;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    setup,
    docs,
    isComplete: setup.isComplete && docs.isComplete,
  };
}

export function deriveRosterStatus(profile = {}, documentsOrByType = {}) {
  const normalized = normalizeRosterStatus(profile.roster_status);
  if (normalized === "removed") return "removed";

  const setup = getProfileSetupCompletion(profile);
  const docs = getRequiredDocumentCompletion(documentsOrByType);

  if (!docs.isComplete) return "pending_documentation";
  if (!setup.isComplete) return "inactive";
  if (normalized === "inactive") return "inactive";
  return "active";
}
