import { useMemo, useState } from "react";

export const EMPTY_INTERPRETER_REQUEST = {
  formType: "request",
  requestCategory: "clientInterpreterRequest",
  emailCapture: "",
  fullName: "",
  organizationName: "",
  physicalAddress: "",
  billingSameAsPhysical: false,
  billingAddress: "",
  contactEmail: "",
  phoneNumber: "",
  serviceNeeded: "",
  setting: "",
  settingOther: "",
  assignmentDate: "",
  startTime: "",
  endTime: "",
  estimatedDuration: "",
  assignmentLocationPlatform: "",
  participantCount: "",
  consumerNames: "",
  communicationStyles: [],
  communicationStyleOther: "",
  hearingParticipantsLanguages: "",
  additionalConsiderations: [],
  additionalConsiderationsOther: "",
  workedWithInterpreterBefore: "",
  cdiOrAdditionalSupportNeeded: "",
  communicationNotes: "",
  assignmentDescription: "",
  specializedContent: "",
  specializedTopics: "",
  interactionGoal: "",
  materialsAvailable: "",
  materialsList: "",
  highStakesSensitive: "",
  exceedsTwoHours: "",
  teamInterpreterArranged: "",
  directVisualAccess: "",
  movementBetweenLocations: "",
  environmentalFactors: "",
};

const defaultPalette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#464747",
  white: "#ffffff",
  softGray: "#f5f5f5",
  border: "#e5e5e5",
};

const serviceOptions = [
  "In-Person Interpreting",
  "Video Remote Interpreting",
  "ASL Video Translation (English → ASL)",
  "ASL Content Translation (ASL → English)",
];

const settingOptions = [
  "Medical",
  "Legal",
  "Edu. K-12",
  "Edu. Post Secondary",
  "Cruise",
  "Mental Health",
  "General / Community",
  "Business",
  "Platform / Conference",
  "Performance / Artistic",
  "Other",
];

const communicationStyleOptions = [
  "ASL (American Sign Language)",
  "PTASL (Pro-Tactile ASL)",
  "CASE (Conceptually Accurate Signed English)",
  "MCE (Manually Coded English)",
  "Cued Speech",
  "Other",
];

const additionalConsiderationOptions = [
  "DeafBlind",
  "Low Vision",
  "Low Mobility",
  "Language still developing / non-standard language use",
  "Uses a foreign sign language",
  "Other",
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function to12Hour(time) {
  if (!time) return "";
  const [hourString, minute] = time.split(":");
  const hour = Number(hourString);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return "";
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const difference = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  if (difference <= 0) return "";
  const hours = Math.floor(difference / 60);
  const minutes = difference % 60;
  if (hours && minutes) return `${hours} hr ${minutes} min`;
  if (hours) return `${hours} hr`;
  return `${minutes} min`;
}

function normalizedInitialValues(values = {}) {
  const merged = { ...EMPTY_INTERPRETER_REQUEST, ...values };
  merged.communicationStyles = Array.isArray(values.communicationStyles) ? values.communicationStyles : [];
  merged.additionalConsiderations = Array.isArray(values.additionalConsiderations) ? values.additionalConsiderations : [];
  if (merged.billingSameAsPhysical && !merged.billingAddress) merged.billingAddress = merged.physicalAddress;
  return merged;
}

function ErrorText({ errors, name }) {
  if (!errors[name]) return null;
  return <p className="mt-2 text-xs font-medium form-error">{errors[name]}</p>;
}

function SectionCard({ title, subtitle, step, children, palette }) {
  return (
    <div className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={{ borderColor: palette.border }}>
      <div className="mb-6">
        <div className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ backgroundColor: palette.softGray, color: palette.gold }}>
          Section {step} of 7
        </div>
        <h2 className="mt-4 text-2xl font-bold" style={{ color: palette.charcoal }}>{title}</h2>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: palette.charcoal }}>{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function ReviewItem({ label, value, palette }) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={{ borderColor: palette.border }}>
      <dt className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: palette.gold }}>{label}</dt>
      <dd className="mt-2 whitespace-pre-wrap text-sm leading-6" style={{ color: palette.charcoal }}>{value || "—"}</dd>
    </div>
  );
}

export default function InterpreterRequestFormShared({
  palette = defaultPalette,
  initialValues = {},
  onSubmitRequest,
  successTitle = "Request Submitted",
  successMessage = "Thank you for your interest in working with Miqueas Language Solutions. Your request has been received and is ready for review.",
  resetLabel = "Submit Another Request",
  submitLabel = "Submit Request",
}) {
  const p = { ...defaultPalette, ...palette };
  const initial = useMemo(() => normalizedInitialValues(initialValues), [initialValues]);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formData, setFormData] = useState(initial);

  const inputClass = "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 form-input";
  const textareaClass = "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 form-input";
  const labelClass = "mb-2 block text-sm font-semibold";
  const derivedDuration = useMemo(() => calculateDuration(formData.startTime, formData.endTime), [formData.startTime, formData.endTime]);

  const setField = (name, value) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "billingSameAsPhysical" && value ? { billingAddress: current.physicalAddress } : {}),
      ...(name === "physicalAddress" && current.billingSameAsPhysical ? { billingAddress: value } : {}),
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData((current) => {
      const exists = current[field].includes(value);
      const next = exists ? current[field].filter((item) => item !== value) : [...current[field], value];
      return {
        ...current,
        [field]: next,
        ...(field === "communicationStyles" && exists && value === "Other" ? { communicationStyleOther: "" } : {}),
        ...(field === "additionalConsiderations" && exists && value === "Other" ? { additionalConsiderationsOther: "" } : {}),
      };
    });
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const getStepErrors = (currentStep) => {
    const next = {};
    if (currentStep === 1) {
      if (!formData.emailCapture.trim()) next.emailCapture = "Email is required.";
      else if (!isValidEmail(formData.emailCapture)) next.emailCapture = "Enter a valid email address.";
    }
    if (currentStep === 2) {
      if (!formData.fullName.trim()) next.fullName = "Full name is required.";
      if (!formData.organizationName.trim()) next.organizationName = "Organization / company name is required.";
      if (!formData.physicalAddress.trim()) next.physicalAddress = "Physical address is required.";
      if (!formData.billingSameAsPhysical && !formData.billingAddress.trim()) next.billingAddress = "Billing address is required.";
      if (!formData.contactEmail.trim()) next.contactEmail = "Email address is required.";
      else if (!isValidEmail(formData.contactEmail)) next.contactEmail = "Enter a valid email address.";
      if (!formData.phoneNumber.trim()) next.phoneNumber = "Phone number is required.";
    }
    if (currentStep === 3) {
      if (!formData.serviceNeeded) next.serviceNeeded = "Please select a service.";
      if (!formData.setting) next.setting = "Please select a setting.";
      if (formData.setting === "Other" && !formData.settingOther.trim()) next.settingOther = "Please describe the setting.";
      if (!formData.assignmentDate) next.assignmentDate = "Date is required.";
      if (!formData.startTime) next.startTime = "Start time is required.";
      if (!formData.endTime) next.endTime = "End time is required.";
      if (!formData.assignmentLocationPlatform.trim()) next.assignmentLocationPlatform = "Location / platform is required.";
      if (formData.startTime && formData.endTime && !calculateDuration(formData.startTime, formData.endTime)) next.endTime = "End time must be later than start time.";
    }
    if (currentStep === 4) {
      if (!formData.participantCount.trim()) next.participantCount = "Please enter the participant count.";
      if (!formData.hearingParticipantsLanguages.trim()) next.hearingParticipantsLanguages = "Please provide the hearing participants’ primary language(s).";
      if (!formData.communicationStyles.length) next.communicationStyles = "Select at least one communication style.";
      if (formData.communicationStyles.includes("Other") && !formData.communicationStyleOther.trim()) next.communicationStyleOther = "Please specify the other communication style.";
      if (formData.additionalConsiderations.includes("Other") && !formData.additionalConsiderationsOther.trim()) next.additionalConsiderationsOther = "Please specify the other additional consideration.";
    }
    if (currentStep === 5) {
      if (!formData.assignmentDescription.trim()) next.assignmentDescription = "Please describe the assignment.";
      if (!formData.specializedContent) next.specializedContent = "Please select an option.";
      if (!formData.materialsAvailable) next.materialsAvailable = "Please select an option.";
      if (!formData.highStakesSensitive) next.highStakesSensitive = "Please select an option.";
    }
    if (currentStep === 6) {
      if (!formData.exceedsTwoHours) next.exceedsTwoHours = "Please select an option.";
      if (!formData.teamInterpreterArranged) next.teamInterpreterArranged = "Please select an option.";
      if (!formData.environmentalFactors.trim()) next.environmentalFactors = "Please describe environmental or setup factors.";
    }
    return next;
  };

  const validateStep = (currentStep) => {
    const next = getStepErrors(currentStep);
    setErrors(next);
    return !Object.keys(next).length;
  };

  const validateAllSteps = () => {
    const all = {};
    for (let index = 1; index <= 6; index += 1) Object.assign(all, getStepErrors(index));
    setErrors(all);
    if (!Object.keys(all).length) return true;
    setStep([1, 2, 3, 4, 5, 6].find((index) => Object.keys(getStepErrors(index)).length) || 1);
    return false;
  };

  const handleSubmit = async () => {
    if (step !== 7 || !validateAllSteps()) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        ...formData,
        setting: formData.setting === "Other" ? `Other: ${formData.settingOther.trim()}` : formData.setting,
        estimatedDuration: derivedDuration,
        communicationStyles: formData.communicationStyles.includes("Other")
          ? [...formData.communicationStyles.filter((item) => item !== "Other"), `Other: ${formData.communicationStyleOther}`].join(", ")
          : formData.communicationStyles.join(", "),
        additionalConsiderations: formData.additionalConsiderations.includes("Other")
          ? [...formData.additionalConsiderations.filter((item) => item !== "Other"), `Other: ${formData.additionalConsiderationsOther}`].join(", ")
          : formData.additionalConsiderations.join(", "),
      };
      await onSubmitRequest(payload);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit request. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setFormData(initial);
    setErrors({});
    setSubmitError("");
    setSubmitted(false);
    setStep(1);
  };

  const renderInput = (name, label, type = "text", placeholder = "") => (
    <div>
      <label className={labelClass} style={{ color: p.charcoal }} htmlFor={name}>{label}</label>
      <input id={name} type={type} value={formData[name]} onChange={(event) => setField(name, event.target.value)} placeholder={placeholder} className={inputClass} />
      <ErrorText errors={errors} name={name} />
    </div>
  );

  const renderTextarea = (name, label, placeholder = "", rows = 4) => (
    <div>
      <label className={labelClass} style={{ color: p.charcoal }} htmlFor={name}>{label}</label>
      <textarea id={name} value={formData[name]} onChange={(event) => setField(name, event.target.value)} placeholder={placeholder} rows={rows} className={textareaClass} />
      <ErrorText errors={errors} name={name} />
    </div>
  );

  const renderSelect = (name, label, options) => (
    <div>
      <label className={labelClass} style={{ color: p.charcoal }} htmlFor={name}>{label}</label>
      <select id={name} value={formData[name]} onChange={(event) => setField(name, event.target.value)} className={inputClass}>
        <option value="">Select an option</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <ErrorText errors={errors} name={name} />
    </div>
  );

  const renderYesNo = (name, label, extra = []) => renderSelect(name, label, ["Yes", "No", ...extra]);

  const renderCheckboxGroup = (name, label, options, otherName) => (
    <div>
      <p className={labelClass} style={{ color: p.charcoal }}>{label}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <label key={option} className="flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm" style={{ borderColor: p.border, color: p.charcoal }}>
            <input type="checkbox" checked={formData[name].includes(option)} onChange={() => toggleMultiSelect(name, option)} className="mt-1 h-4 w-4 rounded form-checkbox" style={{ accentColor: p.burgundy }} />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <ErrorText errors={errors} name={name} />
      {otherName && formData[name].includes("Other") ? <div className="mt-3"><input value={formData[otherName]} onChange={(event) => setField(otherName, event.target.value)} placeholder="Please specify" className={inputClass} /><ErrorText errors={errors} name={otherName} /></div> : null}
    </div>
  );

  if (submitted) {
    return (
      <section className="mx-auto max-w-4xl px-1 py-8 md:px-4">
        <div className="rounded-[2rem] border bg-white p-8 text-center shadow-sm" style={{ borderColor: p.border }}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: p.softGray, color: p.burgundy }}>✓</div>
          <h1 className="text-3xl font-bold" style={{ color: p.charcoal }}>{successTitle}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6" style={{ color: p.charcoal }}>{successMessage}</p>
          <button type="button" onClick={reset} className="mt-6 rounded-full px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: p.burgundy }}>{resetLabel}</button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {step === 1 && <SectionCard step={1} title="Start Your Request" subtitle="Enter your email first so MLS can follow up if more details are needed." palette={p}>{renderInput("emailCapture", "Email Address", "email", "name@example.com")}</SectionCard>}

      {step === 2 && <SectionCard step={2} title="Contact & Billing Information" subtitle="Tell MLS who is requesting services and where billing should be directed." palette={p}>
        <div className="grid gap-5 md:grid-cols-2">{renderInput("fullName", "Full Name")}{renderInput("organizationName", "Organization / Company Name")}{renderInput("contactEmail", "Contact Email", "email")}{renderInput("phoneNumber", "Phone Number", "tel")}</div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {renderTextarea("physicalAddress", "Physical Address", "Street, city, state, ZIP", 3)}
          <div>
            <label className="mb-3 flex items-start gap-3 text-sm font-semibold" style={{ color: p.charcoal }}><input type="checkbox" checked={formData.billingSameAsPhysical} onChange={(event) => setField("billingSameAsPhysical", event.target.checked)} className="mt-1 h-4 w-4 rounded form-checkbox" style={{ accentColor: p.burgundy }} /><span>Billing address is the same as physical address</span></label>
            {renderTextarea("billingAddress", "Billing Address", "Street, city, state, ZIP", 3)}
          </div>
        </div>
      </SectionCard>}

      {step === 3 && <SectionCard step={3} title="Assignment Details" subtitle="Include the core details needed to review availability and fit." palette={p}>
        <div className="grid gap-5 md:grid-cols-2">{renderSelect("serviceNeeded", "Service Needed", serviceOptions)}{renderSelect("setting", "Setting", settingOptions)}{formData.setting === "Other" ? renderInput("settingOther", "Describe the Other Setting", "text", "Describe the community, event, or environment") : null}{renderInput("assignmentDate", "Assignment Date", "date")}{renderInput("startTime", "Start Time", "time")}{renderInput("endTime", "End Time", "time")}<div><p className={labelClass} style={{ color: p.charcoal }}>Estimated Duration</p><div className="rounded-xl border bg-white px-4 py-3 text-sm" style={{ borderColor: p.border, color: p.charcoal }}>{derivedDuration || "Enter start and end time"}</div></div></div>
        <div className="mt-5">{renderTextarea("assignmentLocationPlatform", "Assignment Location / Platform", "Address, room, link, platform, or access details", 3)}</div>
      </SectionCard>}

      {step === 4 && <SectionCard step={4} title="Communication Needs" subtitle="Share enough detail to support communication access while keeping consumer information need-to-know." palette={p}>
        <div className="grid gap-5 md:grid-cols-2">{renderInput("participantCount", "Estimated Participant Count")}{renderInput("consumerNames", "Deaf Participant Name(s), if appropriate / available")}{renderInput("hearingParticipantsLanguages", "Hearing Participants’ Primary Language(s)")}{renderYesNo("workedWithInterpreterBefore", "Has the consumer/client worked with an interpreter before?", ["Not sure"])}{renderYesNo("cdiOrAdditionalSupportNeeded", "Is a CDI or additional support needed?", ["Not sure"])}</div>
        <div className="mt-5 space-y-5">{renderCheckboxGroup("communicationStyles", "Communication Style(s)", communicationStyleOptions, "communicationStyleOther")}{renderCheckboxGroup("additionalConsiderations", "Additional Considerations", additionalConsiderationOptions, "additionalConsiderationsOther")}{renderTextarea("communicationNotes", "Additional Communication Notes", "Language preferences, accessibility needs, context, or other relevant details", 4)}</div>
      </SectionCard>}

      {step === 5 && <SectionCard step={5} title="Content & Preparation" subtitle="This helps MLS determine qualifications, teaming, and prep needs." palette={p}>
        <div className="space-y-5">{renderTextarea("assignmentDescription", "Assignment Description", "What will happen during the assignment?", 4)}<div className="grid gap-5 md:grid-cols-2">{renderYesNo("specializedContent", "Does this involve specialized content?", ["Not sure"])}{renderYesNo("materialsAvailable", "Are preparation materials available?", ["Not sure"])}{renderYesNo("highStakesSensitive", "Is this high-stakes or sensitive?", ["Not sure"])}</div>{renderTextarea("specializedTopics", "Specialized Topics / Terminology", "Medical terms, legal terms, product names, agenda topics, etc.", 3)}{renderTextarea("materialsList", "Available Materials", "Slides, scripts, agenda, speaker names, videos, product lists, etc.", 3)}{renderTextarea("interactionGoal", "Goal of the Interaction", "What should communication access support?", 3)}</div>
      </SectionCard>}

      {step === 6 && <SectionCard step={6} title="Logistics & Working Conditions" subtitle="These details help MLS promote effective and ethical service delivery." palette={p}>
        <div className="grid gap-5 md:grid-cols-2">{renderYesNo("exceedsTwoHours", "Does this exceed 2 hours?", ["Not sure"])}{renderYesNo("teamInterpreterArranged", "Is a team interpreter arranged?", ["Not sure"])}{renderYesNo("directVisualAccess", "Will there be direct visual access?", ["Not sure"])}{renderYesNo("movementBetweenLocations", "Will interpreters move between locations?", ["Not sure"])}</div>
        <div className="mt-5">{renderTextarea("environmentalFactors", "Environmental Factors", "Lighting, seating, audio, platform setup, PPE, visibility, background noise, room layout, etc.", 4)}</div>
      </SectionCard>}

      {step === 7 && <SectionCard step={7} title="Review & Submit" subtitle="Review the request before submitting. MLS will follow up after reviewing the details." palette={p}>
        <dl className="grid gap-4 md:grid-cols-2"><ReviewItem label="Requester" value={formData.fullName} palette={p} /><ReviewItem label="Organization" value={formData.organizationName} palette={p} /><ReviewItem label="Contact Email" value={formData.contactEmail || formData.emailCapture} palette={p} /><ReviewItem label="Phone" value={formData.phoneNumber} palette={p} /><ReviewItem label="Service" value={formData.serviceNeeded} palette={p} /><ReviewItem label="Setting" value={formData.setting === "Other" ? `Other: ${formData.settingOther}` : formData.setting} palette={p} /><ReviewItem label="Date" value={formData.assignmentDate} palette={p} /><ReviewItem label="Time" value={`${to12Hour(formData.startTime) || "—"} – ${to12Hour(formData.endTime) || "—"}`} palette={p} /><ReviewItem label="Duration" value={derivedDuration} palette={p} /><ReviewItem label="Location / Platform" value={formData.assignmentLocationPlatform} palette={p} /><ReviewItem label="Communication Styles" value={formData.communicationStyles.join(", ")} palette={p} /><ReviewItem label="Description" value={formData.assignmentDescription} palette={p} /></dl>
        {submitError ? <p className="mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold form-error">{submitError}</p> : null}
      </SectionCard>}

      <div className="flex flex-col gap-3 rounded-[1.5rem] border bg-white p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: p.border }}>
        <div className="text-sm font-semibold" style={{ color: p.charcoal }}>Progress: Step {step} of 7</div>
        <div className="flex gap-3">
          {step > 1 ? <button type="button" onClick={() => setStep((current) => Math.max(current - 1, 1))} className="rounded-full border px-5 py-3 text-sm font-bold" style={{ borderColor: p.border, color: p.charcoal }}>Back</button> : null}
          {step < 7 ? <button type="button" onClick={() => validateStep(step) && setStep((current) => Math.min(current + 1, 7))} className="rounded-full px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: p.burgundy }}>Continue</button> : <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="rounded-full px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: p.burgundy }}>{isSubmitting ? "Submitting..." : submitLabel}</button>}
        </div>
      </div>
    </div>
  );
}
