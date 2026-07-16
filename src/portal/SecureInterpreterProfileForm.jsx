import { Loader2, LockKeyhole, Save } from "lucide-react";
import { EXPERIENCE_OPTIONS } from "./forms";
import { Field, INPUT, cx } from "./ui";

export default function SecureInterpreterProfileForm({ draft, setDraft, submit, saving, admin = false }) {
  const set = (name) => (event) => setDraft({ ...draft, [name]: event.target.value });
  return <form onSubmit={submit} className="space-y-7"><div className="grid gap-4 md:grid-cols-2">
    <Field name="First name" required><input className={INPUT} required value={draft.first_name || ""} onChange={set("first_name")} /></Field>
    <Field name="Last name" required><input className={INPUT} required value={draft.last_name || ""} onChange={set("last_name")} /></Field>
    <Field name="Email"><input className={INPUT} type="email" disabled={!admin} value={draft.email || ""} onChange={set("email")} /></Field>
    <Field name="Phone"><input className={INPUT} value={draft.phone || ""} onChange={set("phone")} /></Field>
    <Field name="City"><input className={INPUT} value={draft.city || ""} onChange={set("city")} /></Field>
    <Field name="State"><input className={INPUT} value={draft.state || ""} onChange={set("state")} /></Field>
    <Field name="Current location" className="md:col-span-2"><input className={INPUT} value={draft.current_location || ""} onChange={set("current_location")} /></Field>
    <Field name="Preferred contact"><select className={INPUT} value={draft.preferred_contact_method || "Email"} onChange={set("preferred_contact_method")}><option>Email</option><option>Phone</option><option>Text</option></select></Field>
    <Field name="Years of experience"><select className={INPUT} value={draft.years_experience || ""} onChange={set("years_experience")}><option value="">Choose</option>{EXPERIENCE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></Field>
    <Field name="Credentials" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-24")} value={draft.credentials || ""} onChange={set("credentials")} /></Field>
    <Field name="Modalities" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-24")} value={draft.modalities || ""} onChange={set("modalities")} /></Field>
    <Field name="Settings / experience" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-24")} value={draft.areas_of_experience || ""} onChange={set("areas_of_experience")} /></Field>
    <Field name="State license"><input className={INPUT} value={draft.state_license || ""} onChange={set("state_license")} /></Field>
    <Field name="License details"><input className={INPUT} value={draft.state_license_details || ""} onChange={set("state_license_details")} /></Field>
    <Field name="Assignment preference"><select className={INPUT} value={draft.assignment_type_preference || ""} onChange={set("assignment_type_preference")}><option value="">Choose</option><option>On-site</option><option>VRI</option><option>Both</option></select></Field>
    <Field name="Willing to travel"><select className={INPUT} value={draft.willing_to_travel || ""} onChange={set("willing_to_travel")}><option value="">Choose</option><option>Yes</option><option>No</option><option>Limited</option></select></Field>
    <Field name="Travel radius"><input className={INPUT} value={draft.travel_radius || ""} onChange={set("travel_radius")} placeholder="Example: 50 miles" /></Field>
    <Field name="VRI readiness"><select className={INPUT} value={draft.technical_readiness_confirmed || ""} onChange={set("technical_readiness_confirmed")}><option value="">Choose</option><option>Confirmed</option><option>Needs review</option><option>Not available</option></select></Field>
    <Field name="Professional liability insurance"><select className={INPUT} value={draft.professional_liability_insurance || ""} onChange={set("professional_liability_insurance")}><option value="">Choose</option><option>Current</option><option>Pending</option><option>Not currently held</option></select></Field>
    <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-amber-700" size={18} /><div><p className="font-black text-amber-950">Contracted rates</p><p className="mt-1 text-xs leading-5 text-amber-800">Rates can only be changed by MLS because changes require review and renegotiation of contract terms.</p></div></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field name="On-site rate"><input className={INPUT} disabled={!admin} value={draft.onsite_rate || ""} onChange={set("onsite_rate")} placeholder="Not set" /></Field><Field name="VRI rate"><input className={INPUT} disabled={!admin} value={draft.vri_rate || ""} onChange={set("vri_rate")} placeholder="Not set" /></Field></div></div>
    {admin && <Field name="Roster status"><select className={INPUT} value={draft.roster_status || "pending_profile"} onChange={set("roster_status")}><option value="pending_profile">Pending profile</option><option value="pending_documents">Pending documents</option><option value="pending_screening">Pending screening</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="removed">Removed</option></select></Field>}
    {admin && <Field name="Admin notes" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-28")} value={draft.admin_notes || ""} onChange={set("admin_notes")} /></Field>}
  </div><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#721100] px-5 py-3 text-sm font-black text-white disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}Save changes</button></form>;
}
