// Response projections and role policy shared by legacy and current MLS portal APIs.
// Keeping these constants independent of database clients makes them testable in CI.

export const CLIENT_ASSIGNMENT_FIELDS = [
  "id", "client_id", "requested_by_clerk_user_id", "service_type", "delivery_mode",
  "start_at", "end_at", "timezone", "location_name", "address_line_1", "address_line_2",
  "city", "state", "postal_code", "meeting_link", "deaf_participants", "hearing_participants",
  "language_preferences", "specialty", "team_requested", "cdi_requested", "onsite_contact_name",
  "onsite_contact_phone", "description", "preparation_materials", "purchase_order_number",
  "client_reference", "status", "payment_status", "confirmed_at", "completed_at", "invoice_number",
  "invoice_amount", "paid_at", "created_at", "updated_at", "lifecycle_status", "quote_status",
  "agreement_status", "deposit_required", "deposit_amount", "deposit_status", "deposit_paid_at",
  "actual_start_at", "actual_end_at", "client_verified_at", "closed_at", "cancellation_fee",
  "cancellation_reason", "required_interpreter_count", "required_cdi_count", "preparation_due_at",
  "recurring_group_id", "recurrence_rule", "priority", "google_calendar_html_link",
  "drive_folder_url", "request_source", "request_form_version", "request_form_data",
];

export const INTERPRETER_ASSIGNMENT_FIELDS = CLIENT_ASSIGNMENT_FIELDS.filter((field) =>
  !new Set([
    "payment_status", "invoice_number", "invoice_amount", "paid_at", "deposit_required",
    "deposit_amount", "deposit_status", "deposit_paid_at", "cancellation_fee",
    "purchase_order_number", "client_reference",
  ]).has(field)
);

export const STAFFING_PUBLIC_FIELDS = [
  "id", "assignment_id", "interpreter_id", "role", "status", "assigned_at", "accepted_at",
  "created_at", "updated_at",
];

export const INTERPRETER_OWN_STAFFING_FIELDS = [
  ...STAFFING_PUBLIC_FIELDS, "agreed_rate", "contractor_payment_status",
  "contractor_payment_amount", "contractor_payment_due_date", "contractor_paid_at",
];

export const CLIENT_ASSIGNMENT_SELECT = [
  ...CLIENT_ASSIGNMENT_FIELDS,
  "clients(id,organization_name,primary_contact_name,email)",
  `assignment_interpreters(${STAFFING_PUBLIC_FIELDS.join(",")},interpreters(id,first_name,last_name,email,credentials,modalities,current_location,city,state))`,
].join(",");

export const INTERPRETER_ASSIGNMENT_SELECT = [
  ...INTERPRETER_ASSIGNMENT_FIELDS,
  "clients(id,organization_name,primary_contact_name,email)",
].join(",");

export const CLIENT_TIME_ENTRY_SELECT = [
  "id", "assignment_id", "interpreter_id", "scheduled_start_at", "scheduled_end_at",
  "actual_start_at", "actual_end_at", "break_minutes", "billable_hours", "status",
  "submitted_at", "client_verified_at", "created_at", "updated_at",
  "interpreters(id,first_name,last_name,email)",
  "assignments(id,service_type,start_at)",
].join(",");

export const CLIENT_ASSIGNMENT_MESSAGES_SELECT = [
  "id", "assignment_id", "sender_clerk_user_id", "sender_role", "body", "created_at",
].join(",");

export const OWN_INTERPRETER_REDACTED_FIELDS = [
  "admin_notes", "network_submission_id", "network_submission_synced_at",
];

export const OWN_CLIENT_REDACTED_FIELDS = ["billing_notes"];

export function canWriteAsRole(user, role, existingProfile = null) {
  if (!user) return false;
  if (user.isAdmin) return true;
  const assignedRole = String(user.metadataRole || "").trim().toLowerCase();
  if (assignedRole) return assignedRole === role;
  return Boolean(existingProfile);
}

export function publicProfile(profile, role, isAdmin = false) {
  if (!profile || isAdmin) return profile;
  const forbidden = role === "client" ? OWN_CLIENT_REDACTED_FIELDS : OWN_INTERPRETER_REDACTED_FIELDS;
  const result = { ...profile };
  forbidden.forEach((field) => delete result[field]);
  return result;
}

export function safeProfileWrite(profile, role, isAdmin = false) {
  const result = { ...(profile || {}) };
  if (!isAdmin) {
    const forbidden = role === "client"
      ? ["account_status", "billing_notes", "onboarding_complete", "setup_completed_at", "setup_version"]
      : ["roster_status", "admin_notes", "screening_status", "credential_status", "rid_verified", "w9_status", "insurance_status", "onsite_rate", "vri_rate", "setup_completed_at", "setup_version"];
    forbidden.forEach((field) => delete result[field]);
  }
  return result;
}
