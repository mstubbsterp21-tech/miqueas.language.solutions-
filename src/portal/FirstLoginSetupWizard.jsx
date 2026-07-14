import { useMemo, useState } from "react";
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

const AVAILABILITY_BLOCKS = [
  "Morning (6AM-12PM EST)",
  "Afternoon (12PM-6PM EST)",
  "Evening (6PM-12AM EST)",
  "Overnight (12AM-6AM EST)",
  "Unavailable",
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
  if (step === 3 && !DAY_FIELDS.some(([, field]) => present(draft[field]))) return ["Weekly availability"];
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

function StepRail({ steps, step, setStep }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      {steps.map((item, index) => {
        const Icon = item.icon;
        const active = index === step;
        const complete = index < step;
        return (
          <button key={item.title} type="button" onClick={() => index <= step && setStep(index)} className={cx("rounded-2xl border p-4 text-left transition", active ? "border-[#dd7d00] bg-[#fff8ec] shadow-md" : complete ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white/65", index <= step ? "cursor-pointer hover:-translate-y-0.5" : "cursor-default")}>
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
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Default service"><Select value={draft.default_service_type} onChange={set("default_service_type")} options={["ASL/English Interpreting", "Certified Deaf Interpreter Team", "DeafBlind / ProTactile Access", "ASL Video Translation"]} /></Field>
      <Field label="Default delivery"><Select value={draft.default_delivery_mode} onChange={set("default_delivery_mode")} options={["On-site", "VRI", "Hybrid"]} /></Field>
      <Field label="Communication preferences" className="md:col-span-2" help="Share anything MLS should know about how your organization prefers to communicate."><textarea className={cx(INPUT, "min-h-32 resize-y")} value={draft.communication_preferences || ""} onChange={set("communication_preferences")} /></Field>
      <div className="md:col-span-2 rounded-2xl border border-[#dd7d00]/25 bg-[#fff8ec] p-4 text-sm leading-6 text-slate-600">
        After setup, use <strong>Requests</strong> to submit assignment details. You do not need to enter consumer-specific or confidential assignment information here.
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
    <div>
      <p className="mb-5 text-sm leading-6 text-slate-600">Choose every general window that normally works. You can update this later, and it does not guarantee that you will accept every assignment during that window.</p>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {DAY_FIELDS.map(([day, field]) => (
          <div key={field} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-black text-slate-900">{day}</p>
            <div className="grid gap-2">
              {AVAILABILITY_BLOCKS.map((block) => {
                const active = splitValues(draft[field]).includes(block);
                return <button key={block} type="button" onClick={() => toggle(field, block)} className={cx("rounded-xl border px-3 py-2 text-left text-xs font-black transition", active ? "border-[#dd7d00] bg-[#fff4df] text-[#721100]" : "border-slate-200 bg-white text-slate-600 hover:border-[#dd7d00]/50")}>{active && <Check size={13} className="mr-1 inline" />}{block}</button>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FirstLoginSetupWizard({ role, profile, user, onComplete }) {
  const { session } = useSession();
  const api = useMemo(() => createMLSApi(session), [session]);
  const steps = role === "client" ? CLIENT_STEPS : INTERPRETER_STEPS;
  const defaults = role === "client" ? EMPTY_CLIENT : EMPTY_INTERPRETER;
  const [draft, setDraft] = useState({
    ...defaults,
    ...(profile || {}),
    email: profile?.email || user?.email || "",
    country: profile?.country || defaults.country || "United States",
    first_name: profile?.first_name || user?.firstName || "",
    last_name: profile?.last_name || user?.lastName || "",
    other_credential: profile?.other_credential || otherCredentialFrom(profile?.credentials),
    primary_contact_name: profile?.primary_contact_name || [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    billing_email: profile?.billing_email || user?.email || "",
  });
  const initialStep = Math.min(Math.max(Number(profile?.setup_current_step || 0), 0), steps.length - 1);
  const [step, setStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const completion = Math.round((step / steps.length) * 100);

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
        : draft;
      const result = await api.setup("save", "POST", {
        role,
        step: nextStep,
        complete,
        profile: profileForSave,
      });
      setDraft((current) => ({
        ...current,
        ...(result.profile || {}),
        other_credential: current.other_credential || otherCredentialFrom(result.profile?.credentials),
      }));
      if (complete) onComplete(result.profile);
      else setStep(nextStep);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f3ef] px-4 py-6 text-slate-900 md:px-8 md:py-10">
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
          <div className="border-b border-slate-100 bg-[#24130e] px-6 py-8 text-white md:px-10">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-[#f6b34c]"><Sparkles size={15} /> First-time {role} setup</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Welcome to Miqueas Language Solutions!</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70 md:text-base">Complete your profile before entering the workspace. MLS uses this information to support communication, billing, compliance, and appropriate assignment matching.</p>
            <div className="mt-7"><StepRail steps={steps} step={step} setStep={setStep} /></div>
          </div>

          <div className="p-6 md:p-10">
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
