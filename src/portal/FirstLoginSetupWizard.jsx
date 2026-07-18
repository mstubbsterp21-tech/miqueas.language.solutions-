import { useEffect, useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  UserRound,
} from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import logo from "../logo.png";
import {
  applyRequestDefaultsToClient,
  INTERPRETER_REQUEST_ADDITIONAL_CONSIDERATION_OPTIONS,
  INTERPRETER_REQUEST_COMMUNICATION_STYLE_OPTIONS,
  INTERPRETER_REQUEST_SERVICE_OPTIONS,
  INTERPRETER_REQUEST_SETTING_OPTIONS,
  requestDefaultsFromClient,
} from "../requestFormConfig";
import { createMLSApi } from "./api";
import {
  CREDENTIAL_OPTIONS,
  EMPTY_CLIENT,
  EMPTY_INTERPRETER,
  EXPERIENCE_OPTIONS,
  MODALITY_OPTIONS,
  SETTING_OPTIONS,
} from "./forms";
import { cx } from "./ui";
import TimeZoneSelect from "./TimeZoneSelect";
import { detectedUSTimeZone, normalizeUSTimeZone, timeZoneAbbreviation } from "./timezones";

const AVAILABILITY_BLOCKS = [
  "Morning (6AM-12PM)",
  "Afternoon (12PM-6PM)",
  "Evening (6PM-12AM)",
  "Overnight (12AM-6AM)",
  "Unavailable",
];

const AVAILABILITY_STATUS_OPTIONS = [
  ["scheduled", "Use my weekly schedule"],
  ["contact_me", "Contact me about opportunities"],
  ["unknown", "I’ll update this later"],
  ["not_accepting", "I’m not accepting work"],
];

const DAY_FIELDS = [
  ["Sunday", "availability_sunday"],
  ["Monday", "availability_monday"],
  ["Tuesday", "availability_tuesday"],
  ["Wednesday", "availability_wednesday"],
  ["Thursday", "availability_thursday"],
  ["Friday", "availability_friday"],
  ["Saturday", "availability_saturday"],
];

const CLIENT_STEPS = [
  { title: "Organization", helper: "Tell MLS who you represent and how to reach you.", icon: Building2 },
  { title: "Billing & location", helper: "Add the contact and address information used for service records.", icon: MapPin },
  { title: "Service preferences", helper: "Set useful defaults for future interpreter requests.", icon: ClipboardCheck },
];

const INTERPRETER_STEPS = [
  { title: "Contact & location", helper: "How MLS should contact you and where assignments can be matched.", icon: MapPin },
  { title: "Credentials", helper: "Qualifications and experience used for appropriate matching.", icon: CheckCircle2 },
  { title: "Assignment fit", helper: "Modalities, settings, travel, and technical readiness.", icon: ClipboardCheck },
  { title: "Availability", helper: "General weekly windows used when recommending work.", icon: UserRound },
];

function present(value) {
  return Boolean(String(value || "").trim());
}

function validEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || "").trim());
}

function splitValues(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinValues(values) {
  return [...new Set(values.filter(Boolean))].join(", ");
}

function normalizedExperience(value) {
  return joinValues(splitValues(value).map((item) => item === "Community / Freelance" ? "General / Community" : item));
}

function isOtherCredential(value) {
  return value === "Other" || value.startsWith("Other:");
}

function optionSelected(value, option) {
  const selected = splitValues(value);
  return option === "Other"
    ? selected.some(isOtherCredential)
    : selected.includes(option);
}

function otherCredentialFrom(value) {
  const saved = splitValues(value).find((item) => item.startsWith("Other:"));
  return saved ? saved.slice("Other:".length).trim() : "";
}

function credentialsForSubmission(value, otherCredential) {
  const selected = splitValues(value).filter((item) => !isOtherCredential(item));
  if (optionSelected(value, "Other")) {
    const custom = String(otherCredential || "").trim().replaceAll(",", ";");
    selected.push(custom ? `Other: ${custom}` : "Other");
  }
  return joinValues(selected);
}

function toggleValue(value, option) {
  const current = splitValues(value);
  if (option === "Unavailable") return current.includes(option) ? "" : option;
  if (option === "Other") {
    const selected = current.some(isOtherCredential);
    return joinValues(selected ? current.filter((item) => !isOtherCredential(item)) : [...current, "Other"]);
  }
  const available = current.filter((item) => item !== "Unavailable");
  return available.includes(option)
    ? joinValues(available.filter((item) => item !== option))
    : joinValues([...available, option]);
}

function clientStepErrors(step, draft) {
  if (step === 0) {
    return [
      ["organization_name", "Organization name"],
      ["primary_contact_name", "Primary contact"],
      ["phone", "Phone number"],
      ["preferred_contact_method", "Preferred contact method"],
    ].filter(([field]) => !present(draft[field])).map(([, label]) => label);
  }
  if (step === 1 && !present(draft.billing_email)) return ["Billing email"];
  if (step === 2) {
    const defaults = requestDefaultsFromClient(draft);
    const missing = [];
    if (!present(defaults.serviceNeeded)) missing.push("Default service");
    if (!present(defaults.setting)) missing.push("Default setting");
    if (defaults.setting === "Other" && !present(defaults.settingOther)) missing.push("Other setting description");
    if (defaults.communicationStyles.includes("Other") && !present(defaults.communicationStyleOther)) missing.push("Other communication style");
    if (defaults.additionalConsiderations.includes("Other") && !present(defaults.additionalConsiderationsOther)) missing.push("Other additional consideration");
    return missing;
  }
  return [];
}

function interpreterStepErrors(step, draft) {
  if (step === 0) {
    const missing = [
      ["first_name", "First name"],
      ["last_name", "Last name"],
      ["email", "Email"],
      ["phone", "Phone number"],
      ["preferred_contact_method", "Preferred contact method"],
      ["address_line_1", "Address line 1"],
      ["city", "City"],
      ["state", "State"],
      ["country", "Country"],
      ["postal_code", "ZIP code"],
    ].filter(([field]) => !present(draft[field])).map(([, label]) => label);
    if (present(draft.email) && !validEmail(draft.email)) missing.push("Valid email address");
    return missing;
  }
  if (step === 1) {
    const missing = [
      ["credentials", "Credentials"],
      ["years_experience", "Years of experience"],
    ].filter(([field]) => !present(draft[field])).map(([, label]) => label);
    if (optionSelected(draft.credentials, "Other") && !present(draft.other_credential)) {
      missing.push("Other credential description");
    }
    return missing;
  }
  if (step === 2) {
    return [
      ["modalities", "Modalities"],
      ["areas_of_experience", "Areas of experience"],
      ["assignment_type_preference", "Assignment preference"],
      ["willing_to_travel", "Travel preference"],
      ["technical_readiness_confirmed", "VRI readiness"],
      ["professional_liability_insurance", "Professional liability insurance status"],
    ].filter(([field]) => !present(draft[field])).map(([, label]) => label);
  }
  if (step === 3 && draft.availability_status === "scheduled" && !DAY_FIELDS.some(([, field]) => present(draft[field]))) {
    return ["At least one weekly window, or choose a different availability preference"];
  }
  return [];
}

export function needsFirstLoginSetup(role, workspace) {
  if (!workspace || role === "admin") return false;
  const profile = role === "client" ? workspace.client?.profile : workspace.interpreter?.profile;
  return !profile?.setup_completed_at;
}

function Field({ label, required = false, help, children, className = "" }) {
  return (
    <label className={cx("block text-sm font-black text-slate-800", className)}>
      <span>{label}{required && <span className="ml-1 text-[#dd7d00]">*</span>}</span>
      {help && <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">{help}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

const INPUT = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10";

function Select({ value, onChange, options, placeholder = "Choose" }) {
  return (
    <select className={INPUT} value={value || ""} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function Pills({ options, value, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = optionSelected(value, option);
        return (
          <button key={option} type="button" onClick={() => onToggle(option)} className={cx("rounded-full border px-3 py-2 text-xs font-black transition", active ? "border-[#dd7d00] bg-[#fff4df] text-[#721100] shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-[#dd7d00]/50 hover:text-[#721100]")}>
            {active && <Check size={13} className="mr-1 inline" />}{option}
          </button>
        );
      })}
    </div>
  );
}

function RequestPills({ options, values = [], onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = values.includes(option);
        return <button key={option} type="button" onClick={() => onToggle(option)} className={cx("rounded-full border px-3 py-2 text-xs font-black transition", active ? "border-[#dd7d00] bg-[#fff4df] text-[#721100] shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-[#dd7d00]/50 hover:text-[#721100]")}>{active && <Check size={13} className="mr-1 inline" />}{option}</button>;
      })}
    </div>
  );
}

function StepRail({ steps, step, setStep }) {
  return (
    <div className="mls-hide-scrollbar -mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4">
      {steps.map((item, index) => {
        const Icon = item.icon;
        const active = index === step;
        const complete = index < step;
        return (
          <button key={item.title} type="button" onClick={() => index <= step && setStep(index)} className={cx("min-w-[78%] snap-start rounded-2xl border p-4 text-left transition sm:min-w-[46%] md:min-w-0", active ? "border-[#dd7d00] bg-[#fff8ec] shadow-md" : complete ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white/65", index <= step ? "cursor-pointer hover:-translate-y-0.5" : "cursor-default")}>
            <div className="flex items-center gap-2">
              <span className={cx("flex h-8 w-8 items-center justify-center rounded-xl", active ? "bg-[#721100] text-white" : complete ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400")}>{complete ? <Check size={15} /> : <Icon size={15} />}</span>
              <span className="text-sm font-black text-slate-900">{item.title}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.helper}</p>
          </button>
        );
      })}
    </div>
  );
}

function ClientSteps({ step, draft, setDraft }) {
  const set = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  const defaults = requestDefaultsFromClient(draft);
  const setDefault = (field, value) => setDraft((current) => applyRequestDefaultsToClient(current, { ...requestDefaultsFromClient(current), [field]: value }));
  const toggleDefault = (field, option) => setDraft((current) => {
    const currentDefaults = requestDefaultsFromClient(current);
    const values = currentDefaults[field] || [];
    const next = values.includes(option) ? values.filter((item) => item !== option) : [...values, option];
    const patch = { ...currentDefaults, [field]: next };
    if (field === "communicationStyles" && option === "Other" && !next.includes("Other")) patch.communicationStyleOther = "";
    if (field === "additionalConsiderations" && option === "Other" && !next.includes("Other")) patch.additionalConsiderationsOther = "";
    return applyRequestDefaultsToClient(current, patch);
  });
  if (step === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Organization name" required><input className={INPUT} value={draft.organization_name || ""} onChange={set("organization_name")} /></Field>
        <Field label="Primary contact" required><input className={INPUT} value={draft.primary_contact_name || ""} onChange={set("primary_contact_name")} /></Field>
        <Field label="Email"><input className={INPUT} value={draft.email || ""} disabled /></Field>
        <Field label="Phone" required><input className={INPUT} value={draft.phone || ""} onChange={set("phone")} /></Field>
        <Field label="Preferred contact method" required><Select value={draft.preferred_contact_method} onChange={set("preferred_contact_method")} options={["Email", "Phone", "Text"]} /></Field>
        <Field label="Industry"><input className={INPUT} value={draft.industry || ""} onChange={set("industry")} placeholder="Healthcare, education, legal, nonprofit..." /></Field>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Billing email" required><input className={INPUT} type="email" value={draft.billing_email || ""} onChange={set("billing_email")} /></Field>
        <Field label="Billing phone"><input className={INPUT} value={draft.billing_phone || ""} onChange={set("billing_phone")} /></Field>
        <Field label="Address" className="md:col-span-2"><input className={INPUT} value={draft.address_line_1 || ""} onChange={set("address_line_1")} /></Field>
        <Field label="Address line 2" className="md:col-span-2"><input className={INPUT} value={draft.address_line_2 || ""} onChange={set("address_line_2")} /></Field>
        <Field label="City"><input className={INPUT} value={draft.city || ""} onChange={set("city")} /></Field>
        <Field label="State / province"><input className={INPUT} value={draft.state || ""} onChange={set("state")} /></Field>
        <Field label="Postal code"><input className={INPUT} value={draft.postal_code || ""} onChange={set("postal_code")} /></Field>
        <Field label="Country"><input className={INPUT} value={draft.country || ""} onChange={set("country")} /></Field>
      </div>
    );
  }
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="Default service" required help="Matches Service Needed on the Interpreter Request Form."><Select value={defaults.serviceNeeded} onChange={(event) => setDefault("serviceNeeded", event.target.value)} options={INTERPRETER_REQUEST_SERVICE_OPTIONS} /></Field>
      <Field label="Default Settings" required help="Choose the setting your organization requests most often."><Select value={defaults.setting} onChange={(event) => setDefault("setting", event.target.value)} options={INTERPRETER_REQUEST_SETTING_OPTIONS} /></Field>
      {defaults.setting === "Other" && <Field label="Describe the other default setting" required className="md:col-span-2"><input className={INPUT} value={defaults.settingOther} onChange={(event) => setDefault("settingOther", event.target.value)} placeholder="Describe the community, event, or environment" /></Field>}
      <Field label="Default communication style(s)" className="md:col-span-2" help="Choose any communication styles that are commonly requested. You can change these on every request."><RequestPills options={INTERPRETER_REQUEST_COMMUNICATION_STYLE_OPTIONS} values={defaults.communicationStyles} onToggle={(option) => toggleDefault("communicationStyles", option)} /></Field>
      {defaults.communicationStyles.includes("Other") && <Field label="Other communication style" required className="md:col-span-2"><input className={INPUT} value={defaults.communicationStyleOther} onChange={(event) => setDefault("communicationStyleOther", event.target.value)} /></Field>}
      <Field label="Hearing participants’ primary language(s)" help="Add a reusable default only if it is normally consistent."><input className={INPUT} value={defaults.hearingParticipantsLanguages} onChange={(event) => setDefault("hearingParticipantsLanguages", event.target.value)} placeholder="English, Spanish..." /></Field>
      <Field label="CDI or additional support" help="Select the answer your organization uses most often."><Select value={defaults.cdiOrAdditionalSupportNeeded} onChange={(event) => setDefault("cdiOrAdditionalSupportNeeded", event.target.value)} options={["Yes", "No", "Not sure"]} /></Field>
      <Field label="Default additional considerations" className="md:col-span-2" help="Select recurring access considerations. Do not add consumer-specific details here."><RequestPills options={INTERPRETER_REQUEST_ADDITIONAL_CONSIDERATION_OPTIONS} values={defaults.additionalConsiderations} onToggle={(option) => toggleDefault("additionalConsiderations", option)} /></Field>
      {defaults.additionalConsiderations.includes("Other") && <Field label="Other additional consideration" required className="md:col-span-2"><input className={INPUT} value={defaults.additionalConsiderationsOther} onChange={(event) => setDefault("additionalConsiderationsOther", event.target.value)} /></Field>}
      <Field label="Reusable communication & access notes" className="md:col-span-2" help="Share stable organization-level preferences, contact procedures, or access guidance."><textarea className={cx(INPUT, "min-h-28 resize-y")} value={defaults.communicationNotes} onChange={(event) => setDefault("communicationNotes", event.target.value)} /></Field>
      <div className="md:col-span-2 rounded-2xl border border-[#dd7d00]/25 bg-[#fff8ec] p-4 text-sm leading-6 text-slate-600">
        These values prefill the same fields used on the website’s <strong>Interpreter Request Form</strong>. You can change them for each request. Do not enter consumer names, dates, locations, or confidential assignment details here.
      </div>
    </div>
  );
}

function InterpreterSteps({ step, draft, setDraft }) {
  const set = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  const toggle = (field, option) => setDraft((current) => {
    const nextValue = toggleValue(current[field], option);
    const next = { ...current, [field]: nextValue };
    if (field === "credentials" && option === "Other" && !optionSelected(nextValue, "Other")) {
      next.other_credential = "";
    }
    return next;
  });
  if (step === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="First name" required><input className={INPUT} value={draft.first_name || ""} onChange={set("first_name")} /></Field>
        <Field label="Last name" required><input className={INPUT} value={draft.last_name || ""} onChange={set("last_name")} /></Field>
        <Field label="Email" required help="Prefilled from your MLS sign-in. Update it here when MLS should use a different contact email."><input className={INPUT} type="email" required value={draft.email || ""} onChange={set("email")} /></Field>
        <Field label="Phone" required><input className={INPUT} value={draft.phone || ""} onChange={set("phone")} /></Field>
        <Field label="Preferred contact method" required><Select value={draft.preferred_contact_method} onChange={set("preferred_contact_method")} options={["Email", "Phone", "Text"]} /></Field>
        <div className="hidden md:block" />
        <Field label="Address line 1" required className="md:col-span-2"><input className={INPUT} value={draft.address_line_1 || ""} onChange={set("address_line_1")} placeholder="Street address" autoComplete="address-line1" /></Field>
        <Field label="Address line 2" className="md:col-span-2"><input className={INPUT} value={draft.address_line_2 || ""} onChange={set("address_line_2")} placeholder="Apartment, suite, unit, building, floor, etc." autoComplete="address-line2" /></Field>
        <Field label="City" required><input className={INPUT} value={draft.city || ""} onChange={set("city")} autoComplete="address-level2" /></Field>
        <Field label="State" required><input className={INPUT} value={draft.state || ""} onChange={set("state")} autoComplete="address-level1" /></Field>
        <Field label="Country" required><input className={INPUT} value={draft.country || "United States"} onChange={set("country")} autoComplete="country-name" /></Field>
        <Field label="ZIP" required><input className={INPUT} value={draft.postal_code || ""} onChange={set("postal_code")} autoComplete="postal-code" /></Field>
      </div>
    );
  }
  if (step === 1) {
    const otherSelected = optionSelected(draft.credentials, "Other");
    return (
      <div className="space-y-7">
        <Field label="Credentials" required help="Select everything that currently applies."><Pills options={CREDENTIAL_OPTIONS} value={draft.credentials} onToggle={(option) => toggle("credentials", option)} /></Field>
        {otherSelected && (
          <Field label="Other credential" required help="Enter the credential, certification, qualification, or relevant status not listed above.">
            <input className={INPUT} value={draft.other_credential || ""} onChange={set("other_credential")} placeholder="Enter other credential" autoFocus />
          </Field>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Years of experience" required><Select value={draft.years_experience} onChange={set("years_experience")} options={EXPERIENCE_OPTIONS} /></Field>
          <Field label="State license status"><Select value={draft.state_license} onChange={set("state_license")} options={["Yes", "No", "In progress", "Not applicable"]} /></Field>
          <Field label="State license details" className="md:col-span-2"><input className={INPUT} value={draft.state_license_details || ""} onChange={set("state_license_details")} placeholder="State, license number, or current status" /></Field>
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="space-y-7">
        <Field label="Modalities" required><Pills options={MODALITY_OPTIONS} value={draft.modalities} onToggle={(option) => toggle("modalities", option)} /></Field>
        <Field label="Settings / areas of experience" required><Pills options={SETTING_OPTIONS} value={draft.areas_of_experience} onToggle={(option) => toggle("areas_of_experience", option)} /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Assignment preference" required><Select value={draft.assignment_type_preference} onChange={set("assignment_type_preference")} options={["On-site only", "VRI only", "Both", "Depends on setting"]} /></Field>
          <Field label="Willing to travel" required><Select value={draft.willing_to_travel} onChange={set("willing_to_travel")} options={["Yes", "No", "Depends on assignment"]} /></Field>
          <Field label="Travel radius"><input className={INPUT} value={draft.travel_radius || ""} onChange={set("travel_radius")} placeholder="30 miles, statewide, negotiable..." /></Field>
          <Field label="VRI readiness" required><Select value={draft.technical_readiness_confirmed} onChange={set("technical_readiness_confirmed")} options={["Confirmed", "Needs review", "Not available"]} /></Field>
          <Field label="Professional liability insurance" required><Select value={draft.professional_liability_insurance} onChange={set("professional_liability_insurance")} options={["Current", "Pending", "Not currently held"]} /></Field>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Availability preference" help="Availability is optional during setup and can be changed at any time.">
          <select className={INPUT} value={draft.availability_status || "contact_me"} onChange={set("availability_status")}>
            {AVAILABILITY_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="Time zone" help="Every weekly time below uses this zone.">
          <TimeZoneSelect value={draft.availability_timezone} onChange={(value) => setDraft((current) => ({ ...current, availability_timezone: value }))} className={INPUT} />
        </Field>
      </div>
      {draft.availability_status === "scheduled" ? (
        <>
          <p className="text-sm leading-6 text-slate-600">Choose every general window that normally works. These are matching preferences, not a commitment to accept every assignment.</p>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {DAY_FIELDS.map(([day, field]) => (
              <div key={field} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-black text-slate-900">{day}</p>
                <div className="grid gap-2">
                  {AVAILABILITY_BLOCKS.map((block) => {
                    const active = splitValues(draft[field]).includes(block);
                    return <button key={block} type="button" onClick={() => toggle(field, block)} className={cx("rounded-xl border px-3 py-2 text-left text-xs font-black transition", active ? "border-[#dd7d00] bg-[#fff4df] text-[#721100]" : "border-slate-200 bg-white text-slate-600 hover:border-[#dd7d00]/50")}>{active && <Check size={13} className="mr-1 inline" />}{block}{block !== "Unavailable" && <span className="ml-1 text-[10px] opacity-65">· {timeZoneAbbreviation(draft.availability_timezone)}</span>}</button>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
          You can finish setup now. MLS will use this preference until you add weekly availability from the Availability page.
        </div>
      )}
    </div>
  );
}

export default function FirstLoginSetupWizard({ role, profile, user, onComplete }) {
  const { session } = useSession();
  const api = useMemo(() => createMLSApi(session), [session]);
  const steps = role === "client" ? CLIENT_STEPS : INTERPRETER_STEPS;
  const defaults = role === "client" ? EMPTY_CLIENT : EMPTY_INTERPRETER;
  const storageKey = `mls:first-login:${user?.id || user?.email || "user"}:${role}`;
  const savedDraft = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "null") || {}; } catch { return {}; }
  })();
  const seedDraft = {
    ...defaults,
    ...(profile || {}),
    ...savedDraft,
    email: savedDraft.email || profile?.email || user?.email || "",
    country: savedDraft.country || profile?.country || defaults.country || "United States",
    first_name: savedDraft.first_name || profile?.first_name || user?.firstName || "",
    last_name: savedDraft.last_name || profile?.last_name || user?.lastName || "",
    other_credential: savedDraft.other_credential || profile?.other_credential || otherCredentialFrom(savedDraft.credentials || profile?.credentials),
    primary_contact_name: savedDraft.primary_contact_name || profile?.primary_contact_name || [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    billing_email: savedDraft.billing_email || profile?.billing_email || user?.email || "",
    availability_status: savedDraft.availability_status || profile?.availability_status || defaults.availability_status || "contact_me",
    availability_timezone: normalizeUSTimeZone(savedDraft.availability_timezone || profile?.availability_timezone || detectedUSTimeZone()),
    areas_of_experience: normalizedExperience(savedDraft.areas_of_experience || profile?.areas_of_experience || defaults.areas_of_experience),
  };
  const [draft, setDraft] = useState(role === "client" ? applyRequestDefaultsToClient(seedDraft, requestDefaultsFromClient(seedDraft)) : seedDraft);
  const initialStep = Math.min(Math.max(Number(profile?.setup_current_step || 0), 0), steps.length - 1);
  const [step, setStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const completion = Math.round((step / steps.length) * 100);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, storageKey]);

  async function saveProgress(nextStep, complete = false) {
    const missing = role === "client" ? clientStepErrors(step, draft) : interpreterStepErrors(step, draft);
    if (missing.length) {
      setError(`Complete these fields before continuing: ${missing.join(", ")}.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const profileForSave = role === "interpreter"
        ? { ...draft, credentials: credentialsForSubmission(draft.credentials, draft.other_credential) }
        : applyRequestDefaultsToClient(draft, requestDefaultsFromClient(draft));
      const result = await api.setup("save", "POST", {
        role,
        step: nextStep,
        complete,
        timeZone: role === "interpreter" ? draft.availability_timezone : detectedUSTimeZone(),
        profile: profileForSave,
      });
      setDraft((current) => ({
        ...current,
        ...(result.profile || {}),
        other_credential: current.other_credential || otherCredentialFrom(result.profile?.credentials),
      }));
      if (complete) {
        localStorage.removeItem(storageKey);
        onComplete(result.profile);
      }
      else setStep(nextStep);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f3ef] px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-slate-900 sm:px-4 sm:py-6 md:px-8 md:py-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(114,17,0,.12),transparent_30%),radial-gradient(circle_at_92%_2%,rgba(221,125,0,.17),transparent_27%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Miqueas Language Solutions" className="h-14 w-auto" />
            <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#dd7d00]">Secure MLS setup</p><p className="mt-1 text-sm font-bold text-slate-500">Your progress saves after each step.</p></div>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-xs font-black text-slate-500"><span>Setup progress</span><span>{completion}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#721100] to-[#dd7d00]" animate={{ width: `${completion}%` }} /></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/92 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-slate-100 bg-[#24130e] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-10">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-[#f6b34c]"><Sparkles size={15} /> First-time {role} setup</p>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl md:text-5xl">Welcome to Miqueas Language Solutions!</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70 md:text-base">Complete your profile before entering the workspace. MLS uses this information to support communication, billing, compliance, and appropriate assignment matching.</p>
            <div className="mt-7"><StepRail steps={steps} step={step} setStep={setStep} /></div>
          </div>

          <div className="p-4 sm:p-6 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div key={`${role}-${step}`} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2 }}>
                <div className="mb-7">
                  <p className="text-xs font-black uppercase tracking-[.14em] text-[#dd7d00]">Step {step + 1} of {steps.length}</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">{steps[step].title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{steps[step].helper}</p>
                </div>
                {role === "client" ? <ClientSteps step={step} draft={draft} setDraft={setDraft} /> : <InterpreterSteps step={step} draft={draft} setDraft={setDraft} />}
              </motion.div>
            </AnimatePresence>

            {error && <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-700">{error}</div>}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || saving} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-[#dd7d00]/50 disabled:opacity-40"><ChevronLeft size={16} /> Back</button>
              <div className="flex flex-col gap-3 sm:flex-row">
                {step < steps.length - 1 ? (
                  <button type="button" onClick={() => saveProgress(step + 1)} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#721100] px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save & continue <ChevronRight size={16} /></button>
                ) : (
                  <button type="button" onClick={() => saveProgress(steps.length, true)} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#dd7d00] px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Finish setup</button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/75 px-5 py-4 text-center text-xs text-slate-500 backdrop-blur md:flex-row md:text-left">
          <p>Need to stop? Your completed steps are already saved. Sign back in later to continue.</p>
          <PortalSignOutButton />
        </div>
      </div>
    </div>
  );
}
