import { useMemo, useState } from "react";
import TimeZoneSelect from "../portal/TimeZoneSelect";
import { getPortalTimeZone, timeZoneAbbreviation, timeZoneLabel } from "../portal/timezones";
import {
  INTERPRETER_REQUEST_ADDITIONAL_CONSIDERATION_OPTIONS,
  INTERPRETER_REQUEST_COMMUNICATION_STYLE_OPTIONS,
  INTERPRETER_REQUEST_SERVICE_OPTIONS,
  INTERPRETER_REQUEST_SETTING_OPTIONS,
} from "../requestFormConfig";

const defaultPalette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#464747",
  white: "#ffffff",
  softGray: "#f5f5f5",
  border: "#e5e5e5",
};

const serviceOptions = INTERPRETER_REQUEST_SERVICE_OPTIONS;

const settingOptions = INTERPRETER_REQUEST_SETTING_OPTIONS;

const communicationStyleOptions = INTERPRETER_REQUEST_COMMUNICATION_STYLE_OPTIONS;

const additionalConsiderationOptions = INTERPRETER_REQUEST_ADDITIONAL_CONSIDERATION_OPTIONS;

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

function to12Hour(time) {
  if (!time) return "";
  const [hourString, minute] = time.split(":");
  const hour = Number(hourString);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function ErrorText({ errors, name }) {
  if (!errors[name]) return null;
  return <p className="mt-2 text-xs font-medium form-error">{errors[name]}</p>;
}

function SectionCard({ title, subtitle, step, children, palette }) {
  return <div className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={{ borderColor: palette.border }}>
    <div className="mb-6">
      <div className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ backgroundColor: palette.softGray, color: palette.gold }}>Section {step} of 5</div>
      <h2 className="mt-4 text-2xl font-bold" style={{ color: palette.charcoal }}>{title}</h2>
      {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: palette.charcoal }}>{subtitle}</p> : null}
    </div>
    {children}
  </div>;
}

function ReviewItem({ label, value, palette }) {
  return <div className="rounded-2xl border bg-white p-4" style={{ borderColor: palette.border }}>
    <dt className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: palette.gold }}>{label}</dt>
    <dd className="mt-2 whitespace-pre-wrap text-sm leading-6" style={{ color: palette.charcoal }}>{value || "—"}</dd>
  </div>;
}

export default function ExistingClientInterpreterRequestForm({
  palette = defaultPalette,
  initialValues,
  onSubmitRequest,
  submitLabel = "Submit Request",
  successTitle = "Request Submitted",
  successMessage = "Your request has been added to the MLS Portal and is ready for review.",
}) {
  const p = { ...defaultPalette, ...palette };
  const initial = useMemo(() => ({
    ...initialValues,
    timeZone: initialValues?.timeZone || getPortalTimeZone(),
    settingOther: initialValues?.settingOther || "",
    communicationStyles: Array.isArray(initialValues?.communicationStyles) ? initialValues.communicationStyles : [],
    additionalConsiderations: Array.isArray(initialValues?.additionalConsiderations) ? initialValues.additionalConsiderations : [],
  }), [initialValues]);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initial);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const inputClass = "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 form-input";
  const textareaClass = `${inputClass} min-h-24`;
  const labelClass = "mb-2 block text-sm font-semibold";
  const derivedDuration = useMemo(() => calculateDuration(formData.startTime, formData.endTime), [formData.startTime, formData.endTime]);

  const setField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
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
      if (!formData.serviceNeeded) next.serviceNeeded = "Please select a service.";
      if (!formData.setting) next.setting = "Please select a setting.";
      if (formData.setting === "Other" && !formData.settingOther?.trim()) next.settingOther = "Please describe the setting.";
      if (!formData.assignmentDate) next.assignmentDate = "Date is required.";
      if (!formData.startTime) next.startTime = "Start time is required.";
      if (!formData.endTime) next.endTime = "End time is required.";
      if (!formData.timeZone) next.timeZone = "Time zone is required.";
      if (!formData.assignmentLocationPlatform?.trim()) next.assignmentLocationPlatform = "Location / platform is required.";
      if (formData.startTime && formData.endTime && !derivedDuration) next.endTime = "End time must be later than start time.";
    }
    if (currentStep === 2) {
      if (!String(formData.participantCount || "").trim()) next.participantCount = "Please enter the participant count.";
      if (!formData.hearingParticipantsLanguages?.trim()) next.hearingParticipantsLanguages = "Please provide the hearing participants’ primary language(s).";
      if (!formData.communicationStyles.length) next.communicationStyles = "Select at least one communication style.";
      if (formData.communicationStyles.includes("Other") && !formData.communicationStyleOther?.trim()) next.communicationStyleOther = "Please specify the other communication style.";
      if (formData.additionalConsiderations.includes("Other") && !formData.additionalConsiderationsOther?.trim()) next.additionalConsiderationsOther = "Please specify the other additional consideration.";
    }
    if (currentStep === 3) {
      if (!formData.assignmentDescription?.trim()) next.assignmentDescription = "Please describe the assignment.";
      if (!formData.specializedContent) next.specializedContent = "Please select an option.";
      if (!formData.materialsAvailable) next.materialsAvailable = "Please select an option.";
      if (!formData.highStakesSensitive) next.highStakesSensitive = "Please select an option.";
    }
    if (currentStep === 4) {
      if (!formData.exceedsTwoHours) next.exceedsTwoHours = "Please select an option.";
      if (!formData.teamInterpreterArranged) next.teamInterpreterArranged = "Please select an option.";
      if (!formData.environmentalFactors?.trim()) next.environmentalFactors = "Please describe environmental or setup factors.";
    }
    return next;
  };

  const validateStep = (currentStep) => {
    const next = getStepErrors(currentStep);
    setErrors(next);
    return !Object.keys(next).length;
  };

  const handleSubmit = async () => {
    const all = {};
    for (let index = 1; index <= 4; index += 1) Object.assign(all, getStepErrors(index));
    if (Object.keys(all).length) {
      setErrors(all);
      setStep([1, 2, 3, 4].find((index) => Object.keys(getStepErrors(index)).length) || 1);
      return;
    }
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
      setSubmitError(error instanceof Error ? error.message : "Unable to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (name, label, type = "text", placeholder = "") => <div><label className={labelClass} style={{ color: p.charcoal }} htmlFor={name}>{label}</label><input id={name} type={type} value={formData[name] || ""} onChange={(event) => setField(name, event.target.value)} placeholder={placeholder} className={inputClass} /><ErrorText errors={errors} name={name} /></div>;
  const renderTextarea = (name, label, placeholder = "", rows = 4) => <div><label className={labelClass} style={{ color: p.charcoal }} htmlFor={name}>{label}</label><textarea id={name} value={formData[name] || ""} onChange={(event) => setField(name, event.target.value)} placeholder={placeholder} rows={rows} className={textareaClass} /><ErrorText errors={errors} name={name} /></div>;
  const renderSelect = (name, label, options) => <div><label className={labelClass} style={{ color: p.charcoal }} htmlFor={name}>{label}</label><select id={name} value={formData[name] || ""} onChange={(event) => setField(name, event.target.value)} className={inputClass}><option value="">Select an option</option>{options.map((option) => <option key={option}>{option}</option>)}</select><ErrorText errors={errors} name={name} /></div>;
  const renderYesNo = (name, label, extra = []) => renderSelect(name, label, ["Yes", "No", ...extra]);
  const renderCheckboxGroup = (name, label, options, otherName) => <div><p className={labelClass} style={{ color: p.charcoal }}>{label}</p><div className="grid gap-3 md:grid-cols-2">{options.map((option) => <label key={option} className="flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm" style={{ borderColor: p.border, color: p.charcoal }}><input type="checkbox" checked={formData[name].includes(option)} onChange={() => toggleMultiSelect(name, option)} className="mt-1 h-4 w-4 rounded form-checkbox" style={{ accentColor: p.burgundy }} /><span>{option}</span></label>)}</div><ErrorText errors={errors} name={name} />{otherName && formData[name].includes("Other") ? <div className="mt-3"><input value={formData[otherName] || ""} onChange={(event) => setField(otherName, event.target.value)} placeholder="Please specify" className={inputClass} /><ErrorText errors={errors} name={otherName} /></div> : null}</div>;

  if (submitted) return <section className="mx-auto max-w-4xl px-1 py-8 md:px-4"><div className="rounded-[2rem] border bg-white p-8 text-center shadow-sm" style={{ borderColor: p.border }}><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: p.softGray, color: p.burgundy }}>✓</div><h1 className="text-3xl font-bold" style={{ color: p.charcoal }}>{successTitle}</h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-6" style={{ color: p.charcoal }}>{successMessage}</p></div></section>;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-950">Using saved client profile</p><p className="mt-1 text-xs leading-5 text-emerald-800">Contact, billing, and saved communication preferences were filled from this client’s MLS profile. Complete only the assignment-specific sections below.</p></div>

    {step === 1 && <SectionCard step={1} title="Assignment Details" subtitle="Include the core details needed to review availability and fit." palette={p}><div className="grid gap-5 md:grid-cols-2">{renderSelect("serviceNeeded", "Service Needed", serviceOptions)}{renderSelect("setting", "Setting", settingOptions)}{formData.setting === "Other" ? renderInput("settingOther", "Describe the Other Setting", "text", "Describe the community, event, or environment") : null}{renderInput("assignmentDate", "Assignment Date", "date")}{renderInput("startTime", `Start Time · ${timeZoneAbbreviation(formData.timeZone)}`, "time")}{renderInput("endTime", `End Time · ${timeZoneAbbreviation(formData.timeZone)}`, "time")}<div><label className={labelClass} style={{ color: p.charcoal }} htmlFor="timeZone">Time Zone</label><TimeZoneSelect value={formData.timeZone} onChange={(value) => setField("timeZone", value)} className={inputClass} /><ErrorText errors={errors} name="timeZone" /></div><div><p className={labelClass} style={{ color: p.charcoal }}>Estimated Duration</p><div className="rounded-xl border bg-white px-4 py-3 text-sm" style={{ borderColor: p.border, color: p.charcoal }}>{derivedDuration || "Enter start and end time"}</div></div></div><div className="mt-5">{renderTextarea("assignmentLocationPlatform", "Assignment Location / Platform", "Address, room, link, platform, or access details", 3)}</div></SectionCard>}

    {step === 2 && <SectionCard step={2} title="Communication Needs" subtitle="Share enough detail to support communication access while keeping consumer information need-to-know." palette={p}><div className="grid gap-5 md:grid-cols-2">{renderInput("participantCount", "Estimated Participant Count")}{renderInput("consumerNames", "Deaf Participant Name(s), if appropriate / available")}{renderInput("hearingParticipantsLanguages", "Hearing Participants’ Primary Language(s)")}{renderYesNo("workedWithInterpreterBefore", "Has the consumer/client worked with an interpreter before?", ["Not sure"])}{renderYesNo("cdiOrAdditionalSupportNeeded", "Is a CDI or additional support needed?", ["Not sure"])}</div><div className="mt-5 space-y-5">{renderCheckboxGroup("communicationStyles", "Communication Style(s)", communicationStyleOptions, "communicationStyleOther")}{renderCheckboxGroup("additionalConsiderations", "Additional Considerations", additionalConsiderationOptions, "additionalConsiderationsOther")}{renderTextarea("communicationNotes", "Additional Communication Notes", "Language preferences, accessibility needs, context, or other relevant details", 4)}</div></SectionCard>}

    {step === 3 && <SectionCard step={3} title="Content & Preparation" subtitle="This helps MLS determine qualifications, teaming, and prep needs." palette={p}><div className="space-y-5">{renderTextarea("assignmentDescription", "Assignment Description", "What will happen during the assignment?", 4)}<div className="grid gap-5 md:grid-cols-2">{renderYesNo("specializedContent", "Does this involve specialized content?", ["Not sure"])}{renderYesNo("materialsAvailable", "Are preparation materials available?", ["Not sure"])}{renderYesNo("highStakesSensitive", "Is this high-stakes or sensitive?", ["Not sure"])}</div>{renderTextarea("specializedTopics", "Specialized Topics / Terminology", "Medical terms, legal terms, product names, agenda topics, etc.", 3)}{renderTextarea("materialsList", "Available Materials", "Slides, scripts, agenda, speaker names, videos, product lists, etc.", 3)}{renderTextarea("interactionGoal", "Goal of the Interaction", "What should communication access support?", 3)}</div></SectionCard>}

    {step === 4 && <SectionCard step={4} title="Logistics & Working Conditions" subtitle="These details help MLS promote effective and ethical service delivery." palette={p}><div className="grid gap-5 md:grid-cols-2">{renderYesNo("exceedsTwoHours", "Does this exceed 2 hours?", ["Not sure"])}{renderYesNo("teamInterpreterArranged", "Is a team interpreter arranged?", ["Not sure"])}{renderYesNo("directVisualAccess", "Will there be direct visual access?", ["Not sure"])}{renderYesNo("movementBetweenLocations", "Will interpreters move between locations?", ["Not sure"])}</div><div className="mt-5">{renderTextarea("environmentalFactors", "Environmental Factors", "Lighting, seating, audio, platform setup, PPE, visibility, background noise, room layout, etc.", 4)}</div></SectionCard>}

    {step === 5 && <SectionCard step={5} title="Review & Submit" subtitle="Review the request before submitting. MLS will follow up after reviewing the details." palette={p}><dl className="grid gap-4 md:grid-cols-2"><ReviewItem label="Requester" value={formData.fullName} palette={p} /><ReviewItem label="Organization" value={formData.organizationName} palette={p} /><ReviewItem label="Contact Email" value={formData.contactEmail || formData.emailCapture} palette={p} /><ReviewItem label="Phone" value={formData.phoneNumber} palette={p} /><ReviewItem label="Service" value={formData.serviceNeeded} palette={p} /><ReviewItem label="Setting" value={formData.setting === "Other" ? `Other: ${formData.settingOther}` : formData.setting} palette={p} /><ReviewItem label="Date" value={formData.assignmentDate} palette={p} /><ReviewItem label="Time" value={`${to12Hour(formData.startTime) || "—"} – ${to12Hour(formData.endTime) || "—"} · ${timeZoneLabel(formData.timeZone)}`} palette={p} /><ReviewItem label="Duration" value={derivedDuration} palette={p} /><ReviewItem label="Location / Platform" value={formData.assignmentLocationPlatform} palette={p} /><ReviewItem label="Communication Styles" value={Array.isArray(formData.communicationStyles) ? formData.communicationStyles.join(", ") : formData.communicationStyles} palette={p} /><ReviewItem label="Description" value={formData.assignmentDescription} palette={p} /></dl>{submitError ? <p className="mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold form-error">{submitError}</p> : null}</SectionCard>}

    <div className="flex flex-col gap-3 rounded-[1.5rem] border bg-white p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: p.border }}><div className="text-sm font-semibold" style={{ color: p.charcoal }}>Progress: Step {step} of 5</div><div className="flex gap-3">{step > 1 ? <button type="button" onClick={() => setStep((current) => current - 1)} className="rounded-full border px-5 py-3 text-sm font-bold" style={{ borderColor: p.border, color: p.charcoal }}>Back</button> : null}{step < 5 ? <button type="button" onClick={() => validateStep(step) && setStep((current) => current + 1)} className="rounded-full px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: p.burgundy }}>Continue</button> : <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="rounded-full px-5 py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: p.burgundy }}>{isSubmitting ? "Submitting..." : submitLabel}</button>}</div></div>
  </div>;
}
