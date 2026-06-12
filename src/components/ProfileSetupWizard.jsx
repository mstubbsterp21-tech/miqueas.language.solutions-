import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, MapPin, Save, Sparkles } from "lucide-react";

const credentialOptions = [
  "National Interpreter Certification (NIC)",
  "Certified Deaf Interpreter (CDI)",
  "Board for Evaluation of Interpreters (BEI)",
  "Educational Interpreter Performance Assessment (EIPA)",
  "Uncertified",
  "Other",
];

const modalityOptions = [
  "ASL (American Sign Language)",
  "PTASL (Pro-Tactile ASL)",
  "CASE (Conceptually Accurate Signed English)",
  "Trilingual (ASL, English, Spanish)",
  "MCE (Manually Coded English)",
  "Cued Speech",
  "Other",
];

const experienceOptions = [
  "Medical",
  "Legal",
  "Edu.(K-12)",
  "Edu.(Post-Secondary)",
  "Mental Health",
  "Community / Freelance",
  "Platform / Conference",
  "Performance / Arts",
  "Cruise",
  "Video Relay Service (VRS)",
  "Video Remote Interpreting (VRI)",
  "English > ASL Translation",
  "ASL > English Translation",
];

const availabilityBlocks = [
  "Morning (6AM-12PM EST)",
  "Afternoon (12PM-6PM EST)",
  "Evening (6PM-12AM EST)",
  "Overnight (12AM-6AM EST)",
  "Unavailable",
];

const dayFields = [
  ["Sunday", "availability_sunday"],
  ["Monday", "availability_monday"],
  ["Tuesday", "availability_tuesday"],
  ["Wednesday", "availability_wednesday"],
  ["Thursday", "availability_thursday"],
  ["Friday", "availability_friday"],
  ["Saturday", "availability_saturday"],
];

const requiredMatchingFields = [
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

function splitValues(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinValues(values) {
  return [...new Set(values.filter(Boolean))].join(", ");
}

function hasValue(value, option) {
  return splitValues(value).includes(option);
}

function toggleValue(value, option) {
  const values = splitValues(value);
  if (option === "Unavailable") return values.includes(option) ? "" : option;
  const withoutUnavailable = values.filter((item) => item !== "Unavailable");
  return withoutUnavailable.includes(option)
    ? joinValues(withoutUnavailable.filter((item) => item !== option))
    : joinValues([...withoutUnavailable, option]);
}

function hasAvailability(profile) {
  return dayFields.some(([, key]) => Boolean(profile?.[key]));
}

export function profileNeedsSetup(profile = {}) {
  return !requiredMatchingFields.every((field) => {
    if (field === "cityOrLocation") return Boolean(profile.city || profile.current_location);
    if (field === "availability") return hasAvailability(profile);
    return Boolean(profile[field]);
  });
}

export default function ProfileSetupWizard({ profile, primaryEmail, user, palette, portalRequest, onComplete }) {
  const [draft, setDraft] = useState({ ...profile });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isDarkMode = palette.white !== "#ffffff";
  const bodyText = isDarkMode ? "#d8c8bc" : "#555";
  const mutedText = isDarkMode ? "#bfaea2" : "#666";
  const cardBackground = isDarkMode ? "#1b1411" : "#ffffff";
  const softBackground = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
  const pageBackground = isDarkMode
    ? "radial-gradient(circle at 12% 18%, rgba(221,125,0,0.16), transparent 30%), radial-gradient(circle at 88% 12%, rgba(114,17,0,0.24), transparent 28%), linear-gradient(180deg, #15100e 0%, #211714 100%)"
    : "radial-gradient(circle at 12% 18%, rgba(114,17,0,0.14), transparent 30%), radial-gradient(circle at 88% 12%, rgba(221,125,0,0.17), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)";

  const completion = useMemo(() => {
    const completed = requiredMatchingFields.filter((field) => {
      if (field === "cityOrLocation") return Boolean(draft.city || draft.current_location);
      if (field === "availability") return hasAvailability(draft);
      return Boolean(draft[field]);
    }).length;
    return Math.round((completed / requiredMatchingFields.length) * 100);
  }, [draft]);

  const steps = [
    { title: "Contact & location", helper: "How MLS should contact you and where assignments can be matched." },
    { title: "Credentials", helper: "Qualifications MLS should consider before offering assignments." },
    { title: "Assignment fit", helper: "Modalities, settings, and assignment types that match your experience." },
    { title: "Availability", helper: "General time windows used for assignment matching." },
  ];

  const updateDraft = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const toggleDraftValue = (name, option) => {
    setDraft((current) => ({ ...current, [name]: toggleValue(current[name], option) }));
  };

  const saveSetup = async () => {
    setSaving(true);
    setError("");
    const allAvailability = dayFields.map(([, key]) => draft[key]).join(", ");
    const { onsite_rate, vri_rate, comfortable_with_rates, education_itp, situations_successfully_navigated, challenging_situation_description, ...editableProfile } = draft;
    const profileForSave = {
      ...editableProfile,
      email: primaryEmail || draft.email,
      first_name: draft.first_name || user?.firstName || "",
      last_name: draft.last_name || user?.lastName || "",
      availability_morning: allAvailability.includes("Morning"),
      availability_afternoon: allAvailability.includes("Afternoon"),
      availability_evening: allAvailability.includes("Evening"),
      availability_overnight: allAvailability.includes("Overnight"),
    };

    try {
      const data = await portalRequest("saveProfile", { method: "POST", body: { profile: profileForSave } });
      onComplete(data.profile || profileForSave);
    } catch (saveError) {
      setError(saveError.message || "Profile setup could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 py-12 md:px-8 md:py-16" style={{ background: pageBackground }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-[2rem] border p-6 shadow-sm md:p-8" style={{ borderColor: palette.border, backgroundColor: cardBackground }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                <Sparkles size={15} /> First-time setup
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>
                Set up your matching profile
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: bodyText }}>
                MLS uses this information to match you with appropriate assignments. This setup appears only until your matching profile has the essentials.
              </p>
            </div>
            <div className="rounded-3xl border px-5 py-4 text-center" style={{ borderColor: palette.border, backgroundColor: softBackground }}>
              <div className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: mutedText }}>Profile readiness</div>
              <div className="mt-1 text-3xl font-black" style={{ color: palette.gold }}>{completion}%</div>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            {steps.map((item, index) => {
              const active = index === step;
              const done = index < step;
              return (
                <button key={item.title} type="button" onClick={() => setStep(index)} className="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5" style={{ borderColor: active ? palette.gold : palette.border, backgroundColor: active ? "rgba(221,125,0,0.12)" : softBackground }}>
                  <div className="flex items-center gap-2 text-sm font-black" style={{ color: active ? palette.burgundy : palette.charcoal }}>
                    {done ? <CheckCircle2 size={16} /> : <span>{index + 1}</span>} {item.title}
                  </div>
                  <p className="mt-2 text-xs leading-5" style={{ color: mutedText }}>{item.helper}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border p-6 shadow-sm md:p-8" style={{ borderColor: palette.border, backgroundColor: cardBackground }}>
          {step === 0 && (
            <div>
              <WizardHeading icon={<MapPin size={18} />} title="Where and how should MLS match you?" palette={palette} mutedText={bodyText} />
              <div className="grid gap-4 md:grid-cols-2">
                <WizardField label="First name" name="first_name" value={draft.first_name || user?.firstName || ""} onChange={updateDraft} palette={palette} />
                <WizardField label="Last name" name="last_name" value={draft.last_name || user?.lastName || ""} onChange={updateDraft} palette={palette} />
                <WizardField label="Email" value={primaryEmail || draft.email || ""} disabled palette={palette} />
                <WizardField label="Phone" name="phone" value={draft.phone || ""} onChange={updateDraft} palette={palette} />
                <WizardField label="City" name="city" value={draft.city || ""} onChange={updateDraft} palette={palette} />
                <WizardField label="State" name="state" value={draft.state || ""} onChange={updateDraft} palette={palette} />
                <WizardSelect label="Preferred contact method" name="preferred_contact_method" value={draft.preferred_contact_method || ""} onChange={updateDraft} options={["Email", "Phone", "Text"]} palette={palette} />
                <WizardSelect label="Willing to travel?" name="willing_to_travel" value={draft.willing_to_travel || ""} onChange={updateDraft} options={["Yes", "No", "Depends on assignment"]} palette={palette} />
                <WizardField label="Travel radius" name="travel_radius" value={draft.travel_radius || ""} onChange={updateDraft} placeholder="Example: 30 miles, statewide, negotiable" span palette={palette} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <WizardHeading title="What credentials and experience should MLS consider?" palette={palette} mutedText={bodyText} />
              <WizardPills label="Credentials" name="credentials" options={credentialOptions} value={draft.credentials} onToggle={toggleDraftValue} palette={palette} />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <WizardSelect label="Years of experience" name="years_experience" value={draft.years_experience || ""} onChange={updateDraft} options={["Less than 1 year", "1-3 years", "4-6 years", "7-10 years", "10+ years"]} palette={palette} />
                <WizardSelect label="State license?" name="state_license" value={draft.state_license || ""} onChange={updateDraft} options={["Yes", "No", "In progress", "Not applicable"]} palette={palette} />
                <WizardField label="State license details" name="state_license_details" value={draft.state_license_details || ""} onChange={updateDraft} placeholder="State, license number if appropriate, or status" span palette={palette} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <WizardHeading title="Which assignments are a good fit?" palette={palette} mutedText={bodyText} />
              <WizardPills label="Modalities" name="modalities" options={modalityOptions} value={draft.modalities} onToggle={toggleDraftValue} palette={palette} />
              <div className="mt-6"><WizardPills label="Areas of experience" name="areas_of_experience" options={experienceOptions} value={draft.areas_of_experience} onToggle={toggleDraftValue} palette={palette} /></div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <WizardSelect label="Assignment type preference" name="assignment_type_preference" value={draft.assignment_type_preference || ""} onChange={updateDraft} options={["On-site only", "VRI only", "Both", "Depends on setting"]} palette={palette} />
                <WizardSelect label="Technical readiness for VRI" name="technical_readiness_confirmed" value={draft.technical_readiness_confirmed || ""} onChange={updateDraft} options={["Yes", "No", "Needs discussion"]} palette={palette} />
                <WizardSelect label="Professional liability insurance" name="professional_liability_insurance" value={draft.professional_liability_insurance || ""} onChange={updateDraft} options={["Yes", "No", "In progress"]} palette={palette} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <WizardHeading title="When are you generally available?" palette={palette} mutedText={bodyText} />
              <div className="space-y-4">
                {dayFields.map(([day, key]) => (
                  <div key={key} className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: softBackground }}>
                    <div className="mb-3 text-sm font-black" style={{ color: palette.charcoal }}>{day}</div>
                    <div className="flex flex-wrap gap-2">
                      {availabilityBlocks.map((block) => {
                        const active = hasValue(draft[key], block);
                        return (
                          <button key={block} type="button" onClick={() => toggleDraftValue(key, block)} className="rounded-full border px-3 py-2 text-xs font-bold transition" style={{ borderColor: active ? palette.gold : palette.border, backgroundColor: active ? "rgba(221,125,0,0.12)" : cardBackground, color: active ? palette.burgundy : palette.charcoal }}>
                            {block}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="mt-6 rounded-2xl border p-4 text-sm font-bold" style={{ borderColor: palette.burgundy, color: palette.burgundy, backgroundColor: "rgba(114,17,0,0.08)" }}>{error}</div>}

          <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: palette.border }}>
            <button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-bold disabled:opacity-40" style={{ borderColor: palette.border, color: palette.charcoal }}>
              <ChevronLeft size={16} /> Back
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}>
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" disabled={saving} onClick={saveSetup} className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60" style={{ backgroundColor: palette.gold }}>
                <Save size={16} /> {saving ? "Saving setup..." : "Finish setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WizardHeading({ icon = null, title, palette, mutedText }) {
  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-2 text-2xl font-black" style={{ color: palette.charcoal }}>{icon}{title}</h2>
      <p className="mt-2 text-sm leading-6" style={{ color: mutedText }}>Keep this focused on assignment matching. You can upload documents after setup.</p>
    </div>
  );
}

function WizardField({ label, name, value, onChange, disabled = false, placeholder = "", span = false, palette }) {
  const isDarkMode = palette.white !== "#ffffff";
  return (
    <label className={`block text-sm font-bold ${span ? "md:col-span-2" : ""}`} style={{ color: palette.charcoal }}>
      {label}
      <input name={name} value={value || ""} onChange={onChange} disabled={disabled} placeholder={placeholder} className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10 disabled:opacity-70" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: isDarkMode ? "#251a16" : "#ffffff" }} />
    </label>
  );
}

function WizardSelect({ label, name, value, onChange, options, palette }) {
  const isDarkMode = palette.white !== "#ffffff";
  return (
    <label className="block text-sm font-bold" style={{ color: palette.charcoal }}>
      {label}
      <select name={name} value={value || ""} onChange={onChange} className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: isDarkMode ? "#251a16" : "#ffffff" }}>
        <option value="">Choose</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function WizardPills({ label, name, options, value, onToggle, palette }) {
  const isDarkMode = palette.white !== "#ffffff";
  return (
    <div>
      <div className="mb-3 text-sm font-black" style={{ color: palette.charcoal }}>{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = hasValue(value, option);
          return (
            <button key={option} type="button" onClick={() => onToggle(name, option)} className="rounded-full border px-3 py-2 text-xs font-bold transition" style={{ borderColor: active ? palette.gold : palette.border, backgroundColor: active ? "rgba(221,125,0,0.12)" : isDarkMode ? "#251a16" : "#ffffff", color: active ? palette.burgundy : palette.charcoal }}>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
