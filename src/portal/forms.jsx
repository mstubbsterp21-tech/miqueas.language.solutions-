import { Loader2, Save, Send } from "lucide-react";
import { Field, INPUT, cx, formatDate } from "./ui";
import TimeZoneSelect from "./TimeZoneSelect";
import { getPortalTimeZone, timeZoneAbbreviation } from "./timezones";

export const CLIENT_DOCUMENTS = [
  ["service_agreement", "Service agreement"],
  ["purchase_order", "Purchase order"],
  ["tax_exempt", "Tax-exempt certificate"],
  ["accessibility_plan", "Accessibility plan"],
  ["prep_materials", "Preparation materials"],
  ["other", "Other document"],
];

export const INTERPRETER_DOCUMENTS = [
  ["resume", "Résumé"],
  ["w9", "W-9"],
  ["credential_proof", "Credential proof"],
  ["liability_insurance", "Liability insurance"],
  ["ic_agreement", "Independent contractor agreement"],
  ["state_license", "State license"],
  ["work_sample", "Work sample"],
];

export const CREDENTIAL_OPTIONS = [
  "National Interpreter Certification (NIC)",
  "Certified Deaf Interpreter (CDI)",
  "Board for Evaluation of Interpreters (BEI)",
  "Educational Interpreter Performance Assessment (EIPA)",
  "Uncertified",
  "Other",
];

export const MODALITY_OPTIONS = [
  "ASL (American Sign Language)",
  "PTASL (Pro-Tactile ASL)",
  "CASE (Conceptually Accurate Signed English)",
  "Trilingual (ASL, English, Spanish)",
  "MCE (Manually Coded English)",
  "Cued Speech",
  "Other",
];

export const SETTING_OPTIONS = [
  "Medical",
  "Legal",
  "Edu.(K-12)",
  "Edu.(Post-Secondary)",
  "Mental Health",
  "General / Community",
  "Platform / Conference",
  "Performance / Arts",
  "Cruise",
  "Video Relay Service (VRS)",
  "Video Remote Interpreting (VRI)",
  "English > ASL Translation",
  "ASL > English Translation",
];

export const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1-3 years",
  "4-6 years",
  "7-10 years",
  "10+ years",
];

export const EMPTY_CLIENT = {
  organization_name: "",
  primary_contact_name: "",
  phone: "",
  preferred_contact_method: "Email",
  billing_email: "",
  billing_phone: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "United States",
  industry: "",
  default_service_type: "ASL/English Interpreting",
  default_delivery_mode: "On-site",
  communication_preferences: "",
  billing_notes: "",
};

export const EMPTY_INTERPRETER = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  current_location: "",
  preferred_contact_method: "Email",
  credentials: "",
  state_license: "",
  state_license_details: "",
  years_experience: "",
  modalities: "",
  areas_of_experience: "",
  assignment_type_preference: "",
  willing_to_travel: "",
  technical_readiness_confirmed: "",
  professional_liability_insurance: "",
  onsite_rate: "",
  vri_rate: "",
  travel_radius: "",
  availability_status: "contact_me",
  availability_timezone: "",
};

export const EMPTY_ASSIGNMENT = {
  service_type: "ASL/English Interpreting",
  delivery_mode: "On-site",
  start_at: "",
  end_at: "",
  timezone: "America/New_York",
  location_name: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  meeting_link: "",
  deaf_participants: 1,
  hearing_participants: 1,
  language_preferences: "ASL",
  specialty: "General / Community",
  team_requested: false,
  cdi_requested: false,
  onsite_contact_name: "",
  onsite_contact_phone: "",
  description: "",
  preparation_materials: "",
  purchase_order_number: "",
  client_reference: "",
};

function SaveButton({ saving, label = "Save changes", icon: Icon = Save, className = "" }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className={cx("inline-flex items-center justify-center gap-2 rounded-2xl bg-[#721100] px-5 py-3 text-sm font-black text-white disabled:opacity-60", className)}
    >
      {saving ? <Loader2 className="animate-spin" size={16} /> : <Icon size={16} />}
      {label}
    </button>
  );
}

export function ClientProfileForm({ draft, setDraft, submit, saving, admin = false }) {
  const set = (name) => (event) => setDraft({ ...draft, [name]: event.target.value });
  return (
    <form onSubmit={submit} className="space-y-7">
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="Organization" required><input className={INPUT} required value={draft.organization_name || ""} onChange={set("organization_name")} /></Field>
        <Field name="Primary contact" required><input className={INPUT} required value={draft.primary_contact_name || ""} onChange={set("primary_contact_name")} /></Field>
        <Field name="Phone" required><input className={INPUT} required value={draft.phone || ""} onChange={set("phone")} /></Field>
        <Field name="Preferred contact"><select className={INPUT} value={draft.preferred_contact_method || "Email"} onChange={set("preferred_contact_method")}><option>Email</option><option>Phone</option><option>Text</option></select></Field>
        <Field name="Billing email" required><input className={INPUT} type="email" required value={draft.billing_email || ""} onChange={set("billing_email")} /></Field>
        <Field name="Billing phone"><input className={INPUT} value={draft.billing_phone || ""} onChange={set("billing_phone")} /></Field>
        <Field name="Industry"><input className={INPUT} value={draft.industry || ""} onChange={set("industry")} /></Field>
        <Field name="Account status"><select disabled={!admin} className={INPUT} value={draft.account_status || "active"} onChange={set("account_status")}><option value="active">Active</option><option value="on_hold">On hold</option><option value="inactive">Inactive</option></select></Field>
        <Field name="Address" className="md:col-span-2"><input className={INPUT} value={draft.address_line_1 || ""} onChange={set("address_line_1")} /></Field>
        <Field name="Address line 2" className="md:col-span-2"><input className={INPUT} value={draft.address_line_2 || ""} onChange={set("address_line_2")} /></Field>
        <Field name="City"><input className={INPUT} value={draft.city || ""} onChange={set("city")} /></Field>
        <Field name="State"><input className={INPUT} value={draft.state || ""} onChange={set("state")} /></Field>
        <Field name="Postal code"><input className={INPUT} value={draft.postal_code || ""} onChange={set("postal_code")} /></Field>
        <Field name="Country"><input className={INPUT} value={draft.country || ""} onChange={set("country")} /></Field>
        <Field name="Default service"><select className={INPUT} value={draft.default_service_type || "ASL/English Interpreting"} onChange={set("default_service_type")}><option>ASL/English Interpreting</option><option>Certified Deaf Interpreter Team</option><option>DeafBlind / ProTactile Access</option><option>ASL Video Translation</option></select></Field>
        <Field name="Default delivery"><select className={INPUT} value={draft.default_delivery_mode || "On-site"} onChange={set("default_delivery_mode")}><option>On-site</option><option>VRI</option><option>Hybrid</option></select></Field>
        <Field name="Communication preferences" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-24")} value={draft.communication_preferences || ""} onChange={set("communication_preferences")} /></Field>
        <Field name="Billing notes" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-24")} value={draft.billing_notes || ""} onChange={set("billing_notes")} /></Field>
      </div>
      <SaveButton saving={saving} />
    </form>
  );
}

export function InterpreterProfileForm({ draft, setDraft, submit, saving, admin = false }) {
  const set = (name) => (event) => setDraft({ ...draft, [name]: event.target.value });
  return (
    <form onSubmit={submit} className="space-y-7">
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="First name" required><input className={INPUT} required value={draft.first_name || ""} onChange={set("first_name")} /></Field>
        <Field name="Last name" required><input className={INPUT} required value={draft.last_name || ""} onChange={set("last_name")} /></Field>
        <Field name="Email"><input className={INPUT} type="email" disabled={!admin} value={draft.email || ""} onChange={set("email")} /></Field>
        <Field name="Phone"><input className={INPUT} value={draft.phone || ""} onChange={set("phone")} /></Field>
        <Field name="City"><input className={INPUT} value={draft.city || ""} onChange={set("city")} /></Field>
        <Field name="State"><input className={INPUT} value={draft.state || ""} onChange={set("state")} /></Field>
        <Field name="Current location" className="md:col-span-2"><input className={INPUT} value={draft.current_location || ""} onChange={set("current_location")} /></Field>
        <Field name="Preferred contact"><select className={INPUT} value={draft.preferred_contact_method || "Email"} onChange={set("preferred_contact_method")}><option>Email</option><option>Phone</option><option>Text</option></select></Field>
        <Field name="Years of experience"><select className={INPUT} value={draft.years_experience || ""} onChange={set("years_experience")}><option value="">Choose</option>{EXPERIENCE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></Field>
        <Field name="Credentials" className="md:col-span-2" help="Use the same wording shown on the MLS roster form."><textarea className={cx(INPUT, "min-h-24")} value={draft.credentials || ""} onChange={set("credentials")} /></Field>
        <Field name="Modalities" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-24")} value={draft.modalities || ""} onChange={set("modalities")} /></Field>
        <Field name="Settings / experience" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-24")} value={draft.areas_of_experience || ""} onChange={set("areas_of_experience")} /></Field>
        <Field name="State license"><input className={INPUT} value={draft.state_license || ""} onChange={set("state_license")} /></Field>
        <Field name="License details"><input className={INPUT} value={draft.state_license_details || ""} onChange={set("state_license_details")} /></Field>
        <Field name="Assignment preference"><select className={INPUT} value={draft.assignment_type_preference || ""} onChange={set("assignment_type_preference")}><option value="">Choose</option><option>On-site</option><option>VRI</option><option>Both</option></select></Field>
        <Field name="Willing to travel"><select className={INPUT} value={draft.willing_to_travel || ""} onChange={set("willing_to_travel")}><option value="">Choose</option><option>Yes</option><option>No</option><option>Limited</option></select></Field>
        <Field name="Travel radius"><input className={INPUT} value={draft.travel_radius || ""} onChange={set("travel_radius")} placeholder="Example: 50 miles" /></Field>
        <Field name="VRI readiness"><select className={INPUT} value={draft.technical_readiness_confirmed || ""} onChange={set("technical_readiness_confirmed")}><option value="">Choose</option><option>Confirmed</option><option>Needs review</option><option>Not available</option></select></Field>
        <Field name="Professional liability insurance"><select className={INPUT} value={draft.professional_liability_insurance || ""} onChange={set("professional_liability_insurance")}><option value="">Choose</option><option>Current</option><option>Pending</option><option>Not currently held</option></select></Field>
        <Field name="On-site rate"><input className={INPUT} value={draft.onsite_rate || ""} onChange={set("onsite_rate")} placeholder="$75/hr" /></Field>
        <Field name="VRI rate"><input className={INPUT} value={draft.vri_rate || ""} onChange={set("vri_rate")} placeholder="$65/hr" /></Field>
        {admin && <Field name="Roster status"><select className={INPUT} value={draft.roster_status || "pending_profile"} onChange={set("roster_status")}><option value="pending_profile">Pending profile</option><option value="pending_documents">Pending documents</option><option value="pending_screening">Pending screening</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="removed">Removed</option></select></Field>}
        {admin && <Field name="Admin notes" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-28")} value={draft.admin_notes || ""} onChange={set("admin_notes")} /></Field>}
      </div>
      <SaveButton saving={saving} />
    </form>
  );
}

export function AssignmentRequestForm({ draft, setDraft, submit, saving }) {
  const timeZone = draft.timezone || getPortalTimeZone();
  const zone = timeZoneAbbreviation(timeZone);
  const set = (name) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setDraft({ ...draft, [name]: value });
  };
  return (
    <form onSubmit={submit} className="space-y-7">
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="Service" required><select className={INPUT} required value={draft.service_type} onChange={set("service_type")}><option>ASL/English Interpreting</option><option>Certified Deaf Interpreter Team</option><option>DeafBlind / ProTactile Access</option><option>ASL Video Translation</option></select></Field>
        <Field name="Delivery" required><select className={INPUT} required value={draft.delivery_mode} onChange={set("delivery_mode")}><option>On-site</option><option>VRI</option><option>Hybrid</option></select></Field>
        <Field name={`Start · ${zone}`} required><input className={INPUT} type="datetime-local" required value={draft.start_at} onChange={set("start_at")} /></Field>
        <Field name={`End · ${zone}`}><input className={INPUT} type="datetime-local" value={draft.end_at || ""} onChange={set("end_at")} /></Field>
        <Field name="Time zone"><TimeZoneSelect className={INPUT} value={timeZone} onChange={(value) => setDraft({ ...draft, timezone: value })} /></Field>
        <Field name="Specialty"><select className={INPUT} value={draft.specialty} onChange={set("specialty")}><option>General / Community</option><option>Medical</option><option>Legal</option><option>Mental Health</option><option>K-12 Education</option><option>Post-Secondary Education</option><option>Platform / Conference</option><option>Performance / Arts</option><option>Cruise</option></select></Field>
        {draft.delivery_mode !== "VRI" && <Field name="Location"><input className={INPUT} value={draft.location_name || ""} onChange={set("location_name")} placeholder="Facility or venue" /></Field>}
        {draft.delivery_mode === "VRI" && <Field name="Meeting link"><input className={INPUT} type="url" value={draft.meeting_link || ""} onChange={set("meeting_link")} /></Field>}
        {draft.delivery_mode !== "VRI" && <Field name="Address" className="md:col-span-2"><input className={INPUT} value={draft.address_line_1 || ""} onChange={set("address_line_1")} /></Field>}
        {draft.delivery_mode !== "VRI" && <Field name="City"><input className={INPUT} value={draft.city || ""} onChange={set("city")} /></Field>}
        {draft.delivery_mode !== "VRI" && <Field name="State"><input className={INPUT} value={draft.state || ""} onChange={set("state")} /></Field>}
        <Field name="Deaf participants"><input className={INPUT} type="number" min="0" value={draft.deaf_participants} onChange={set("deaf_participants")} /></Field>
        <Field name="Hearing participants"><input className={INPUT} type="number" min="0" value={draft.hearing_participants} onChange={set("hearing_participants")} /></Field>
        <Field name="Language preferences" className="md:col-span-2"><input className={INPUT} value={draft.language_preferences || ""} onChange={set("language_preferences")} placeholder="ASL, tactile ASL, Spanish, etc." /></Field>
        <Field name="On-site contact"><input className={INPUT} value={draft.onsite_contact_name || ""} onChange={set("onsite_contact_name")} /></Field>
        <Field name="Contact phone"><input className={INPUT} value={draft.onsite_contact_phone || ""} onChange={set("onsite_contact_phone")} /></Field>
        <Field name="Purchase order"><input className={INPUT} value={draft.purchase_order_number || ""} onChange={set("purchase_order_number")} /></Field>
        <Field name="Client reference"><input className={INPUT} value={draft.client_reference || ""} onChange={set("client_reference")} /></Field>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={Boolean(draft.team_requested)} onChange={set("team_requested")} /> Interpreter team requested</label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={Boolean(draft.cdi_requested)} onChange={set("cdi_requested")} /> Certified Deaf Interpreter requested</label>
        <Field name="Assignment details" className="md:col-span-2" required><textarea className={cx(INPUT, "min-h-32")} required value={draft.description || ""} onChange={set("description")} /></Field>
        <Field name="Preparation materials" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-24")} value={draft.preparation_materials || ""} onChange={set("preparation_materials")} placeholder="Links, agenda, names, terminology, scripts, or other context" /></Field>
      </div>
      <SaveButton saving={saving} label="Submit request" icon={Send} className="bg-[#dd7d00]" />
    </form>
  );
}

export function FeedbackForm({ draft, setDraft, assignments, submit, saving }) {
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field name="Assignment"><select className={INPUT} value={draft.assignmentId || ""} onChange={(event) => setDraft({ ...draft, assignmentId: event.target.value })}><option value="">General feedback</option>{assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.service_type} · {assignment.start_at ? formatDate(assignment.start_at) : "No date"}</option>)}</select></Field>
      <Field name="Rating" required><select className={INPUT} value={draft.rating} onChange={(event) => setDraft({ ...draft, rating: Number(event.target.value) })}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}</select></Field>
      <Field name="Comments"><textarea className={cx(INPUT, "min-h-32")} value={draft.comments || ""} onChange={(event) => setDraft({ ...draft, comments: event.target.value })} /></Field>
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={Boolean(draft.followUpRequested)} onChange={(event) => setDraft({ ...draft, followUpRequested: event.target.checked })} /> I would like MLS to follow up with me.</label>
      <SaveButton saving={saving} label="Submit feedback" icon={Send} />
    </form>
  );
}

export function InviteUserForm({ draft, setDraft, submit, saving }) {
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field name="Role"><select className={INPUT} value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })}><option value="client">Client</option><option value="interpreter">Interpreter</option></select></Field>
      <Field name="Email" required><input className={INPUT} type="email" required value={draft.email || ""} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></Field>
      {draft.role === "client" && <Field name="Organization"><input className={INPUT} value={draft.organizationName || ""} onChange={(event) => setDraft({ ...draft, organizationName: event.target.value })} /></Field>}
      <SaveButton saving={saving} label="Send invitation" icon={Send} />
    </form>
  );
}

export function DocumentRequestForm({ draft, setDraft, workspace, submit, saving }) {
  const records = draft.audienceType === "client" ? workspace.admin?.clients || [] : workspace.admin?.interpreters || [];
  const documentOptions = draft.audienceType === "client" ? CLIENT_DOCUMENTS : INTERPRETER_DOCUMENTS;
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field name="Audience"><select className={INPUT} value={draft.audienceType} onChange={(event) => setDraft({ ...draft, audienceType: event.target.value, ownerId: "", documentType: event.target.value === "client" ? "service_agreement" : "resume" })}><option value="client">Client</option><option value="interpreter">Interpreter</option></select></Field>
      <Field name="Recipient" required><select className={INPUT} required value={draft.ownerId || ""} onChange={(event) => setDraft({ ...draft, ownerId: event.target.value })}><option value="">Choose a recipient</option>{records.map((record) => <option key={record.id} value={record.id}>{draft.audienceType === "client" ? record.organization_name || record.email : `${record.first_name || ""} ${record.last_name || ""}`.trim() || record.email}</option>)}</select></Field>
      <Field name="Document type"><select className={INPUT} value={draft.documentType} onChange={(event) => setDraft({ ...draft, documentType: event.target.value })}>{documentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field name="Title" required><input className={INPUT} required value={draft.title || ""} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field>
      <Field name="Due date"><input className={INPUT} type="date" value={draft.dueDate || ""} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} /></Field>
      <Field name="Instructions"><textarea className={cx(INPUT, "min-h-28")} value={draft.instructions || ""} onChange={(event) => setDraft({ ...draft, instructions: event.target.value })} /></Field>
      <SaveButton saving={saving} label="Create request" icon={Send} />
    </form>
  );
}

export function CourseForm({ draft, setDraft, submit, saving }) {
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field name="Course title" required><input className={INPUT} required value={draft.title || ""} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field>
      <Field name="Category"><input className={INPUT} value={draft.category || ""} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></Field>
      <Field name="Description"><textarea className={cx(INPUT, "min-h-28")} value={draft.description || ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field>
      <Field name="Content URL"><input className={INPUT} type="url" value={draft.contentUrl || ""} onChange={(event) => setDraft({ ...draft, contentUrl: event.target.value })} /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="Duration in minutes"><input className={INPUT} type="number" min="0" value={draft.durationMinutes || ""} onChange={(event) => setDraft({ ...draft, durationMinutes: event.target.value })} /></Field>
        <Field name="Sort order"><input className={INPUT} type="number" value={draft.sortOrder || 0} onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })} /></Field>
      </div>
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={draft.isPublished !== false} onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })} /> Published for interpreters</label>
      <SaveButton saving={saving} label="Save course" />
    </form>
  );
}

export function OpportunityForm({ draft, setDraft, assignments, submit, saving }) {
  const zone = timeZoneAbbreviation(getPortalTimeZone());
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field name="Assignment" required><select className={INPUT} required value={draft.assignmentId || ""} onChange={(event) => setDraft({ ...draft, assignmentId: event.target.value })}><option value="">Choose an assignment</option>{assignments.filter((assignment) => !["completed", "cancelled"].includes(assignment.status)).map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.clients?.organization_name || assignment.clients?.email} · {assignment.service_type} · {assignment.start_at ? formatDate(assignment.start_at) : "No date"}</option>)}</select></Field>
      <Field name={`Closes at · ${zone}`}><input className={INPUT} type="datetime-local" value={draft.closesAt || ""} onChange={(event) => setDraft({ ...draft, closesAt: event.target.value })} /></Field>
      <Field name="Notes"><textarea className={cx(INPUT, "min-h-28")} value={draft.notes || ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></Field>
      <SaveButton saving={saving} label="Publish opportunity" icon={Send} />
    </form>
  );
}
