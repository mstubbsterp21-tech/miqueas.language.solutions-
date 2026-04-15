import { useMemo, useState } from 'react';
import logo from '../logo.png';

const defaultPalette = {
  burgundy: '#721100',
  gold: '#dd7d00',
  charcoal: '#464747',
  white: '#ffffff',
  softGray: '#f5f5f5',
  border: '#e5e5e5',
};

const initialFormData = {
  emailCapture: '',

  fullName: '',
  organizationName: '',
  physicalAddress: '',
  billingSameAsPhysical: false,
  billingAddress: '',
  contactEmail: '',
  phoneNumber: '',

  serviceNeeded: '',
  setting: '',
  assignmentDate: '',
  startTime: '',
  endTime: '',
  estimatedDuration: '',
  assignmentLocationPlatform: '',

  participantCount: '',
  consumerNames: '',
  communicationStyles: [],
  communicationStyleOther: '',
  hearingParticipantsLanguages: '',
  additionalConsiderations: [],
  additionalConsiderationsOther: '',
  workedWithInterpreterBefore: '',
  cdiOrAdditionalSupportNeeded: '',
  communicationNotes: '',

  assignmentDescription: '',
  specializedContent: '',
  specializedTopics: '',
  interactionGoal: '',
  materialsAvailable: '',
  materialsList: '',
  highStakesSensitive: '',

  exceedsTwoHours: '',
  teamInterpreterArranged: '',
  directVisualAccess: '',
  movementBetweenLocations: '',
  environmentalFactors: '',
};

const serviceOptions = [
  'In-Person Interpreting',
  'Video Remote Interpreting',
  'ASL Video Translation (English → ASL)',
  'ASL Content Translation (ASL → English)',
];

const settingOptions = [
  'Medical',
  'Legal',
  'Edu. K-12',
  'Edu. Post Secondary',
  'Cruise',
  'Mental Health',
  'Business',
  'Platform / Conference',
  'Performance / Artistic',
  'Other',
];

const communicationStyleOptions = [
  'ASL (American Sign Language)',
  'PTASL (Pro-Tactile ASL)',
  'CASE (Conceptually Accurate Signed English)',
  'MCE (Manually Coded English)',
  'Cued Speech',
  'Other',
];

const additionalConsiderationOptions = [
  'DeafBlind',
  'Low Vision',
  'Low Mobility',
  'Language still developing / non-standard language use',
  'Uses a foreign sign language',
  'Other',
];

function to12Hour(time) {
  if (!time) return '';
  const [hourStr, minute] = time.split(':');
  const hour = Number(hourStr);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour % 12 || 12;
  return `${normalized}:${minute} ${suffix}`;
}

function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return '';
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startTotal = startHour * 60 + startMin;
  const endTotal = endHour * 60 + endMin;
  if (endTotal <= startTotal) return '';

  const diff = endTotal - startTotal;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  if (hours && minutes) return `${hours} hr ${minutes} min`;
  if (hours) return `${hours} hr`;
  return `${minutes} min`;
}

function ErrorText({ errors, name }) {
  if (!errors[name]) return null;

  return (
    <p className="mt-2 text-xs font-medium form-error">{errors[name]}</p>
  );
}

function SectionCard({ title, subtitle, children, step, borderColor, titleColor }) {
  return (
    <div
      className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8"
      style={{ borderColor }}
    >
      <div className="mb-6">
        <div
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{
            backgroundColor: defaultPalette.softGray,
            color: defaultPalette.gold,
          }}
        >
          Section {step} of 7
        </div>

        <h2 className="mt-4 text-2xl font-bold" style={{ color: titleColor }}>
          {title}
        </h2>

        {subtitle ? (
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: titleColor }}>
            {subtitle}
          </p>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function CheckboxGroup({ options, values, onChange, otherValue, onOtherChange, palette }) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const checked = values.includes(option);
        const isOther = option === 'Other';

        return (
          <div key={option}>
            <label className="flex items-start gap-3 text-sm" style={{ color: palette.charcoal }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(option)}
                className="mt-1 h-4 w-4 rounded form-checkbox"
                style={{ accentColor: palette.burgundy }}
              />
              <span>{option}</span>
            </label>

            {isOther && checked && (
              <input
                type="text"
                value={otherValue}
                onChange={(e) => onOtherChange(e.target.value)}
                placeholder="Please specify"
                className="mt-3 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function InterpreterRequestForm({ palette = defaultPalette }) {
  const p = { ...defaultPalette, ...palette };
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL ||
    'https://script.google.com/macros/s/YOUR_WEB_APP_ID/exec';

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [formData, setFormData] = useState(initialFormData);

  const inputClass = 'w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 form-input';
  const textareaClass = 'w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 form-input';
  const labelClass = 'mb-2 block text-sm font-semibold';

  const derivedDuration = useMemo(
    () => calculateDuration(formData.startTime, formData.endTime),
    [formData.startTime, formData.endTime]
  );

  const setField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'billingSameAsPhysical' && value
        ? { billingAddress: prev.physicalAddress }
        : {}),
      ...(name === 'physicalAddress' && prev.billingSameAsPhysical
        ? { billingAddress: value }
        : {}),
    }));

    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData((prev) => {
      const exists = prev[field].includes(value);
      const nextValues = exists
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value];

      return {
        ...prev,
        [field]: nextValues,
        ...(field === 'communicationStyles' &&
        value === 'Other' &&
        exists
          ? { communicationStyleOther: '' }
          : {}),
        ...(field === 'additionalConsiderations' &&
        value === 'Other' &&
        exists
          ? { additionalConsiderationsOther: '' }
          : {}),
      };
    });

    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep = (currentStep) => {
    const nextErrors = {};

    if (currentStep === 1) {
      if (!formData.emailCapture.trim()) {
        nextErrors.emailCapture = 'Email is required.';
      }
    }

    if (currentStep === 2) {
      if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required.';
      if (!formData.organizationName.trim()) {
        nextErrors.organizationName = 'Organization / company name is required.';
      }
      if (!formData.physicalAddress.trim()) {
        nextErrors.physicalAddress = 'Physical address is required.';
      }
      if (!formData.billingSameAsPhysical && !formData.billingAddress.trim()) {
        nextErrors.billingAddress = 'Billing address is required.';
      }
      if (!formData.contactEmail.trim()) nextErrors.contactEmail = 'Email address is required.';
      if (!formData.phoneNumber.trim()) nextErrors.phoneNumber = 'Phone number is required.';
    }

    if (currentStep === 3) {
      if (!formData.serviceNeeded) nextErrors.serviceNeeded = 'Please select a service.';
      if (!formData.setting) nextErrors.setting = 'Please select a setting.';
      if (!formData.assignmentDate) nextErrors.assignmentDate = 'Date is required.';
      if (!formData.startTime) nextErrors.startTime = 'Start time is required.';
      if (!formData.endTime) nextErrors.endTime = 'End time is required.';
      if (!formData.assignmentLocationPlatform.trim()) {
        nextErrors.assignmentLocationPlatform = 'Location / platform is required.';
      }

      if (
        formData.startTime &&
        formData.endTime &&
        !calculateDuration(formData.startTime, formData.endTime)
      ) {
        nextErrors.endTime = 'End time must be later than start time.';
      }
    }

    if (currentStep === 4) {
      if (!formData.participantCount.trim()) {
        nextErrors.participantCount = 'Please enter the participant count.';
      }
      if (!formData.consumerNames.trim()) {
        nextErrors.consumerNames = 'Please provide the names of Deaf participants.';
      }
      if (!formData.hearingParticipantsLanguages.trim()) {
        nextErrors.hearingParticipantsLanguages =
          'Please provide the hearing participants’ primary language(s).';
      }
      if (formData.communicationStyles.length === 0) {
        nextErrors.communicationStyles = 'Select at least one communication style.';
      }
      if (
        formData.communicationStyles.includes('Other') &&
        !formData.communicationStyleOther.trim()
      ) {
        nextErrors.communicationStyleOther = 'Please specify the other communication style.';
      }
      if (
        formData.additionalConsiderations.includes('Other') &&
        !formData.additionalConsiderationsOther.trim()
      ) {
        nextErrors.additionalConsiderationsOther =
          'Please specify the other additional consideration.';
      }
    }

    if (currentStep === 5) {
      if (!formData.assignmentDescription.trim()) {
        nextErrors.assignmentDescription = 'Please describe the assignment.';
      }
      if (!formData.specializedContent) {
        nextErrors.specializedContent = 'Please select an option.';
      }
      if (!formData.materialsAvailable) {
        nextErrors.materialsAvailable = 'Please select an option.';
      }
      if (!formData.highStakesSensitive) {
        nextErrors.highStakesSensitive = 'Please select an option.';
      }
    }

    if (currentStep === 6) {
      if (!formData.exceedsTwoHours) {
        nextErrors.exceedsTwoHours = 'Please select an option.';
      }
      if (!formData.teamInterpreterArranged) {
        nextErrors.teamInterpreterArranged = 'Please select an option.';
      }
      if (!formData.environmentalFactors.trim()) {
        nextErrors.environmentalFactors =
          'Please describe environmental or setup factors.';
      }
    }

    if (currentStep === 7) {
      // review step
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
  if (validateStep(step)) {
    setStep((prev) => Math.min(prev + 1, 7));
  }
};

  const handleBack = () => {
  setStep((prev) => Math.max(prev - 1, 1));
};

  const handleSubmit = async (e) => {
  if (e) e.preventDefault();

    if (!validateStep(6)) {
      setStep(6);
      return;
    }

    if (!scriptUrl || scriptUrl.includes('YOUR_WEB_APP_ID')) {
      setSubmitError(
        'Submission endpoint is not configured. Please set VITE_GOOGLE_SCRIPT_URL.'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const encodedData = new URLSearchParams();

Object.entries(formData).forEach(([key, value]) => {
  if (Array.isArray(value)) {
    encodedData.append(key, value.join(', '));
  } else if (typeof value === 'boolean') {
    encodedData.append(key, value ? 'true' : 'false');
  } else {
    encodedData.append(key, value ?? '');
  }
});

const response = await fetch(scriptUrl, {
  method: 'POST',
  body: encodedData,
});

      const result = await response.json();

      if (!response.ok || result.status !== 'success') {
        const message = result?.message || 'Unable to submit request. Please try again.';
        setSubmitError(message);
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
setIsSubmitting(false);

    } catch (error) {
      setSubmitError('Unable to submit request. Please check your connection and try again.');
      setIsSubmitting(false);
      console.error('Submission error', error);
    }
  };

  if (submitted) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-16 md:px-8">
        <div
          className="rounded-[2rem] border bg-white p-8 text-center shadow-sm"
          style={{ borderColor: p.border }}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: p.softGray, color: p.burgundy }}>
            ✓
          </div>

          <h1 className="text-3xl font-bold" style={{ color: p.charcoal }}>
            Request Submitted
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6" style={{ color: p.charcoal }}>
            Thank you for your interest in working with Miqueas Language Solutions.
            Your request has been received and is now ready for review. Assignment
            details, communication needs, logistics, and preparation requirements
            will be evaluated before availability is confirmed.
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6" style={{ color: p.charcoal }}>
            Rates and policies can be shared after review of the submitted information.
          </p>

          <button
            type="button"
            onClick={() => {
  setFormData(initialFormData);
  setSubmitted(false);
  setStep(1);
  setErrors({});
  setSubmitError('');
  setIsSubmitting(false);
}}
            className="btn btn-primary"
          >
            Submit Another Request
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-16 md:px-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8"
          style={{ borderColor: p.border }}
        >
          <div className="mb-6 text-center">
            <img
              src={logo}
              alt="Miqueas Language Solutions"
              className="mx-auto h-20 object-contain"
            />
          </div>

          <h1
            className="text-center text-3xl font-bold md:text-4xl"
            style={{ color: p.charcoal }}
          >
            Interpreter Request Form
          </h1>

          <div
            className="mx-auto mt-6 max-w-3xl space-y-4 text-sm leading-7 text-center"
            style={{ color: p.charcoal }}
          >
            <p>
              Thank you for your interest in working with{' '}
              <span className="font-semibold">Miqueas Language Solutions</span>.
            </p>

            <p>
              This request form allows assignment details to be reviewed for ASL ↔ English
              interpreting or ASL translation services. Providing accurate and complete
              information supports a more efficient review process and helps ensure the
              appropriate level of service, preparation, and support for your assignment.
            </p>

            <p>
              Each request is evaluated based on factors such as setting, duration,
              communication needs, assignment complexity, and logistical considerations.
              Rates and policies can be provided after review of the submitted information.
            </p>

            <p>
              All information shared will be kept confidential and handled in accordance
              with professional standards.
            </p>
          </div>

          <p className="mt-6 text-xs font-medium form-note">
            * Indicates required information
          </p>
        </div>

        {step === 1 && (
          <SectionCard
            step={step}
            borderColor={p.border}
            titleColor={p.charcoal}
            title="Email"
            subtitle="Start with the best email address to use for request follow-up."
          >
            <div>
              <label htmlFor="emailCapture" className={labelClass}>
                Email Address *
              </label>
              <input
                id="emailCapture"
                name="emailCapture"
                type="email"
                autoComplete="email"
                value={formData.emailCapture}
                onChange={(e) => setField('emailCapture', e.target.value)}
                className={inputClass}
                placeholder="name@example.com"
              />
              <ErrorText errors={errors} name="emailCapture" />
            </div>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard
            step={step}
            borderColor={p.border}
            titleColor={p.charcoal}
            title="Contact Information"
            subtitle="Provide the contact and billing details connected to this request."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="fullName" className={labelClass}>
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  className={inputClass}
                />
                <ErrorText errors={errors} name="fullName" />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="organizationName" className={labelClass}>
                  Organization / Company Name *
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  autoComplete="organization"
                  value={formData.organizationName}
                  onChange={(e) => setField('organizationName', e.target.value)}
                  className={inputClass}
                />
                <ErrorText errors={errors} name="organizationName" />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="physicalAddress" className={labelClass}>
                  Physical Address *
                </label>
                <textarea
                  id="physicalAddress"
                  name="physicalAddress"
                  rows={3}
                  autoComplete="street-address"
                  value={formData.physicalAddress}
                  onChange={(e) => setField('physicalAddress', e.target.value)}
                  className={textareaClass}
                  placeholder="1234 N Sample Street, City, State, USA"
                />
                <ErrorText errors={errors} name="physicalAddress" />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Billing Address *</label>

                <label className="mb-3 flex items-center gap-3 text-sm" style={{ color: p.charcoal }}>
                  <input
                    type="checkbox"
                    checked={formData.billingSameAsPhysical}
                    onChange={(e) => setField('billingSameAsPhysical', e.target.checked)}
                    className="h-4 w-4 rounded form-checkbox"
                    style={{ accentColor: p.burgundy }}
                  />
                  <span>Billing address is the same as physical address</span>
                </label>

                {!formData.billingSameAsPhysical && (
                  <textarea
                    id="billingAddress"
                    name="billingAddress"
                    rows={3}
                    autoComplete="billing street-address"
                    value={formData.billingAddress}
                    onChange={(e) => setField('billingAddress', e.target.value)}
                    className={textareaClass}
                    placeholder="1234 N Sample Street, City, State, USA"
                  />
                )}

                <ErrorText errors={errors} name="billingAddress" />
              </div>

              <div>
                <label htmlFor="contactEmail" className={labelClass}>
                  Email Address *
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  autoComplete="email"
                  value={formData.contactEmail}
                  onChange={(e) => setField('contactEmail', e.target.value)}
                  className={inputClass}
                />
                <ErrorText errors={errors} name="contactEmail" />
              </div>

              <div>
                <label htmlFor="phoneNumber" className={labelClass}>
                  Phone Number *
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setField('phoneNumber', e.target.value)}
                  className={inputClass}
                />
                <ErrorText errors={errors} name="phoneNumber" />
              </div>
            </div>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard
            step={step}
            borderColor={p.border}
            titleColor={p.charcoal}
            title="Assignment Overview"
            subtitle="Share the core scheduling and service details for this request. All times should be submitted in Eastern Time (New York)."
          >
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Service Needed *</label>
                <div className="space-y-3">
                  {serviceOptions.map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input
                        type="radio"
                        name="serviceNeeded"
                        value={option}
                        checked={formData.serviceNeeded === option}
                        onChange={(e) => setField('serviceNeeded', e.target.value)}
                        className="mt-1 h-4 w-4"
                        style={{ accentColor: p.burgundy }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="serviceNeeded" />
              </div>

              <div>
                <label className={labelClass}>Setting *</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {settingOptions.map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input
                        type="radio"
                        name="setting"
                        value={option}
                        checked={formData.setting === option}
                        onChange={(e) => setField('setting', e.target.value)}
                        className="mt-1 h-4 w-4"
                        style={{ accentColor: p.burgundy }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="setting" />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="assignmentDate" className={labelClass}>
                    Date of Assignment *
                  </label>
                  <input
                    id="assignmentDate"
                    name="assignmentDate"
                    type="date"
                    autoComplete="bday"
                    value={formData.assignmentDate}
                    onChange={(e) => setField('assignmentDate', e.target.value)}
                    className={inputClass}
                  />
                  <ErrorText errors={errors} name="assignmentDate" />
                </div>

                <div>
                  <label htmlFor="estimatedDuration" className={labelClass}>
                    Estimated Duration
                  </label>
                  <input
                    id="estimatedDuration"
                    name="estimatedDuration"
                    type="text"
                    value={formData.estimatedDuration || derivedDuration}
                    onChange={(e) => setField('estimatedDuration', e.target.value)}
                    className={inputClass}
                    placeholder="Example: 1 hr, 2.5 hrs, half day"
                  />
                </div>

                <div>
                  <label htmlFor="startTime" className={labelClass}>
                    Start Time (Eastern Time) *
                  </label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setField('startTime', e.target.value)}
                    className={inputClass}
                  />
                  <ErrorText errors={errors} name="startTime" />
                </div>

                <div>
                  <label htmlFor="endTime" className={labelClass}>
                    Estimated End Time (Eastern Time) *
                  </label>
                  <input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setField('endTime', e.target.value)}
                    className={inputClass}
                  />
                  <ErrorText errors={errors} name="endTime" />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="assignmentLocationPlatform" className={labelClass}>
                    Assignment Location / Platform *
                  </label>
                  <textarea
                    id="assignmentLocationPlatform"
                    name="assignmentLocationPlatform"
                    rows={3}
                    value={formData.assignmentLocationPlatform}
                    onChange={(e) =>
                      setField('assignmentLocationPlatform', e.target.value)
                    }
                    className={textareaClass}
                    placeholder="Street address, room/facility details, or virtual meeting link / platform information"
                  />
                  <ErrorText errors={errors} name="assignmentLocationPlatform" />
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {step === 4 && (
          <SectionCard
            step={step}
            borderColor={p.border}
            titleColor={p.charcoal}
            title="Consumer & Language Needs"
            subtitle="This information helps determine communication access needs, preparation requirements, and whether additional support may be needed."
          >
            <div className="space-y-6">
              <div>
                <label htmlFor="participantCount" className={labelClass}>
                  How many Deaf / Hard of Hearing participants? *
                </label>
                <input
                  id="participantCount"
                  name="participantCount"
                  type="text"
                  autoComplete="off"
                  value={formData.participantCount}
                  onChange={(e) => setField('participantCount', e.target.value)}
                  className={inputClass}
                  placeholder="Provide the exact number if known"
                />
                <ErrorText errors={errors} name="participantCount" />
              </div>

              <div>
                <label htmlFor="consumerNames" className={labelClass}>
                  Name(s) of Deaf participant(s) (if relevant for preparation) *
                </label>
                <textarea
                  id="consumerNames"
                  name="consumerNames"
                  rows={3}
                  autoComplete="off"
                  value={formData.consumerNames}
                  onChange={(e) => setField('consumerNames', e.target.value)}
                  className={textareaClass}
                />
                <ErrorText errors={errors} name="consumerNames" />
              </div>

              <div>
                <label className={labelClass}>
                  Preferred communication style of the consumer(s)? *
                </label>
                <CheckboxGroup
                  options={communicationStyleOptions}
                  values={formData.communicationStyles}
                  onChange={(value) => toggleMultiSelect('communicationStyles', value)}
                  otherValue={formData.communicationStyleOther}
                  onOtherChange={(value) => setField('communicationStyleOther', value)}
                  palette={p}
                />
                <ErrorText errors={errors} name="communicationStyles" />
                <ErrorText errors={errors} name="communicationStyleOther" />
              </div>

              <div>
                <label htmlFor="hearingParticipantsLanguages" className={labelClass}>
                  Primary language(s) of hearing participants *
                </label>
                <input
                  id="hearingParticipantsLanguages"
                  name="hearingParticipantsLanguages"
                  type="text"
                  autoComplete="off"
                  value={formData.hearingParticipantsLanguages}
                  onChange={(e) =>
                    setField('hearingParticipantsLanguages', e.target.value)
                  }
                  className={inputClass}
                  placeholder="Example: English, Spanish, bilingual English/Spanish"
                />
                <ErrorText errors={errors} name="hearingParticipantsLanguages" />
              </div>

              <div>
                <label className={labelClass}>
                  Additional communication considerations?
                </label>
                <CheckboxGroup
                  options={additionalConsiderationOptions}
                  values={formData.additionalConsiderations}
                  onChange={(value) =>
                    toggleMultiSelect('additionalConsiderations', value)
                  }
                  otherValue={formData.additionalConsiderationsOther}
                  onOtherChange={(value) =>
                    setField('additionalConsiderationsOther', value)
                  }
                  palette={p}
                />
                <ErrorText errors={errors} name="additionalConsiderationsOther" />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Has the Deaf participant worked with this interpreter before?
                  </label>
                  <select
                    name="workedWithInterpreterBefore"
                    value={formData.workedWithInterpreterBefore}
                    onChange={(e) => setField('workedWithInterpreterBefore', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select one</option>
                    <option>Yes</option>
                    <option>No</option>
                    <option>Not sure</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Will a Certified Deaf Interpreter (CDI) or additional support be needed?
                  </label>
                  <select
                    name="cdiOrAdditionalSupportNeeded"
                    value={formData.cdiOrAdditionalSupportNeeded}
                    onChange={(e) =>
                      setField('cdiOrAdditionalSupportNeeded', e.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Select one</option>
                    <option>Yes</option>
                    <option>No</option>
                    <option>Not sure</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="communicationNotes" className={labelClass}>
                  Anything else I should know to support effective communication access?
                </label>
                <textarea
                  id="communicationNotes"
                  name="communicationNotes"
                  rows={4}
                  autoComplete="off"
                  value={formData.communicationNotes}
                  onChange={(e) => setField('communicationNotes', e.target.value)}
                  className={textareaClass}
                />
              </div>
            </div>
          </SectionCard>
        )}

        {step === 5 && (
          <SectionCard
            step={step}
            borderColor={p.border}
            titleColor={p.charcoal}
            title="Assignment Complexity"
            subtitle="This section helps identify preparation needs, specialized content, and whether materials should be reviewed in advance."
          >
            <div className="space-y-6">
              <div>
                <label htmlFor="assignmentDescription" className={labelClass}>
                  Please describe the assignment in as much detail as possible. *
                </label>
                <textarea
                  id="assignmentDescription"
                  name="assignmentDescription"
                  rows={5}
                  autoComplete="off"
                  value={formData.assignmentDescription}
                  onChange={(e) => setField('assignmentDescription', e.target.value)}
                  className={textareaClass}
                />
                <ErrorText errors={errors} name="assignmentDescription" />
              </div>

              <div>
                <label className={labelClass}>
                  Will this assignment involve specialized or technical content? *
                </label>
                <div className="space-y-3">
                  {['Yes', 'No', 'Not sure'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input
                        type="radio"
                        name="specializedContent"
                        value={option}
                        checked={formData.specializedContent === option}
                        onChange={(e) => setField('specializedContent', e.target.value)}
                        className="mt-1 h-4 w-4"
                        style={{ accentColor: p.burgundy }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="specializedContent" />
              </div>

              <div>
                <label htmlFor="specializedTopics" className={labelClass}>
                  If applicable, what topics or terminology should the interpreter be familiar with?
                </label>
                <input
                  id="specializedTopics"
                  name="specializedTopics"
                  type="text"
                  autoComplete="off"
                  value={formData.specializedTopics}
                  onChange={(e) => setField('specializedTopics', e.target.value)}
                  className={inputClass}
                  placeholder="Examples: oncology, IEP terminology, legal procedure, technical training vocabulary"
                />
              </div>

              <div>
                <label htmlFor="interactionGoal" className={labelClass}>
                  What is the goal of the interaction?
                </label>
                <input
                  id="interactionGoal"
                  name="interactionGoal"
                  type="text"
                  autoComplete="off"
                  value={formData.interactionGoal}
                  onChange={(e) => setField('interactionGoal', e.target.value)}
                  className={inputClass}
                  placeholder="Example: appointment, presentation, meeting, training, interview, performance"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Will you be able to provide materials in advance? *
                </label>

                <div className="mb-3 rounded-2xl border p-4 text-sm leading-6 form-hint">
                  <p className="font-medium">Examples may include:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Agendas or schedules</li>
                    <li>Presentation slides (PowerPoint, PDF, etc.)</li>
                    <li>Meeting topics or outlines</li>
                    <li>Names of participants and roles</li>
                    <li>Technical vocabulary or terminology</li>
                    <li>Scripts, announcements, or written content</li>
                    <li>Educational materials</li>
                    <li>Medical or legal documents, if appropriate and permitted</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  {['Yes', 'No', 'Not yet, but will later'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input
                        type="radio"
                        name="materialsAvailable"
                        value={option}
                        checked={formData.materialsAvailable === option}
                        onChange={(e) => setField('materialsAvailable', e.target.value)}
                        className="mt-1 h-4 w-4"
                        style={{ accentColor: p.burgundy }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="materialsAvailable" />
              </div>

              {formData.materialsAvailable &&
                formData.materialsAvailable !== 'No' && (
                  <div>
                    <label htmlFor="materialsList" className={labelClass}>
                      What materials do you expect to share?
                    </label>
                    <textarea
                      id="materialsList"
                      name="materialsList"
                      rows={4}
                      autoComplete="off"
                      value={formData.materialsList}
                      onChange={(e) => setField('materialsList', e.target.value)}
                      className={textareaClass}
                    />
                  </div>
                )}

              <div>
                <label className={labelClass}>
                  Is this a high-stakes or sensitive interaction? *
                </label>
                <div className="space-y-3">
                  {['Yes', 'No', 'Not sure'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input
                        type="radio"
                        name="highStakesSensitive"
                        value={option}
                        checked={formData.highStakesSensitive === option}
                        onChange={(e) => setField('highStakesSensitive', e.target.value)}
                        className="mt-1 h-4 w-4"
                        style={{ accentColor: p.burgundy }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="highStakesSensitive" />
              </div>
            </div>
          </SectionCard>
        )}

        {step === 6 && (
          <SectionCard
            step={step}
            borderColor={p.border}
            titleColor={p.charcoal}
            title="Teaming & Logistics"
            subtitle="This section helps identify whether the assignment setup supports effective communication access and whether team support may be needed."
          >
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Will this assignment exceed 2 hours? *</label>
                <div className="space-y-3">
                  {['Yes', 'No', 'Not sure'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input
                        type="radio"
                        name="exceedsTwoHours"
                        value={option}
                        checked={formData.exceedsTwoHours === option}
                        onChange={(e) => setField('exceedsTwoHours', e.target.value)}
                        className="mt-1 h-4 w-4"
                        style={{ accentColor: p.burgundy }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="exceedsTwoHours" />
              </div>

              <div>
                <label className={labelClass}>
                  Has a team interpreter already been requested or arranged? *
                </label>
                <p className="mb-3 text-sm leading-6" style={{ color: p.charcoal }}>
                  Team interpreting is industry standard for live in person or video interpreting assignments of
                  great complexity and/or duration longer than 1 hour.
                </p>

                <div className="space-y-3">
                  {['Yes', 'No', 'Not sure'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input
                        type="radio"
                        name="teamInterpreterArranged"
                        value={option}
                        checked={formData.teamInterpreterArranged === option}
                        onChange={(e) =>
                          setField('teamInterpreterArranged', e.target.value)
                        }
                        className="mt-1 h-4 w-4"
                        style={{ accentColor: p.burgundy }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="teamInterpreterArranged" />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Will the interpreter have direct visual access to all participants?
                  </label>
                  <select
                    value={formData.directVisualAccess}
                    onChange={(e) => setField('directVisualAccess', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select one</option>
                    <option>Yes</option>
                    <option>No</option>
                    <option>Not sure</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Will the interpreter be expected to move or travel between locations during the assignment?
                  </label>
                  <select
                    value={formData.movementBetweenLocations}
                    onChange={(e) =>
                      setField('movementBetweenLocations', e.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Select one</option>
                    <option>Yes</option>
                    <option>No</option>
                    <option>Not sure</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="environmentalFactors" className={labelClass}>
                  Please describe any environmental or setup factors that may impact communication access or interpreter visibility. *
                </label>

                <div className="mb-3 rounded-2xl border p-4 text-sm leading-6 form-hint">
                  <p className="font-medium">This may include:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Room size or layout</li>
                    <li>Lighting conditions</li>
                    <li>Background distractions or noise levels</li>
                    <li>Audio setup (microphones, speakers, amplification)</li>
                    <li>Visibility barriers, distance, or obstructions</li>
                    <li>Movement of speakers or participants</li>
                    <li>Virtual platform issues (camera placement, screen sharing, internet stability)</li>
                    <li>Positioning of the interpreter, if already determined</li>
                    <li>Safety or access concerns</li>
                  </ul>
                </div>

                <textarea
                  id="environmentalFactors"
                  name="environmentalFactors"
                  rows={6}
                  autoComplete="off"
                  value={formData.environmentalFactors}
                  onChange={(e) => setField('environmentalFactors', e.target.value)}
                  className={textareaClass}
                />
                <ErrorText errors={errors} name="environmentalFactors" />
              </div>
            </div>
          </SectionCard>
        )}

        {step === 7 && (
          <SectionCard
            step={step}
            borderColor={p.border}
            titleColor={p.charcoal}
            title="Review Your Request"
            subtitle="Review your information before submitting. You can go back to make changes if needed."
          >
            <div className="space-y-6 text-sm" style={{ color: p.charcoal }}>
              <div className="rounded-2xl border p-5 form-hint">
                <h3 className="mb-3 text-base font-bold">Quick Summary</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <p><span className="font-semibold">Requester:</span> {formData.fullName || '—'}</p>
                  <p><span className="font-semibold">Organization:</span> {formData.organizationName || '—'}</p>
                  <p><span className="font-semibold">Service:</span> {formData.serviceNeeded || '—'}</p>
                  <p><span className="font-semibold">Setting:</span> {formData.setting || '—'}</p>
                  <p><span className="font-semibold">Date:</span> {formData.assignmentDate || '—'}</p>
                  <p>
                    <span className="font-semibold">Time:</span>{' '}
                    {formData.startTime && formData.endTime
                      ? `${to12Hour(formData.startTime)} – ${to12Hour(formData.endTime)}`
                      : '—'}
                  </p>
                  <p><span className="font-semibold">Duration:</span> {formData.estimatedDuration || derivedDuration || '—'}</p>
                  <p><span className="font-semibold">Participants:</span> {formData.participantCount || '—'}</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {Object.entries({
                  Email: formData.emailCapture,
                  'Contact Email': formData.contactEmail,
                  Phone: formData.phoneNumber,
                  'Physical Address': formData.physicalAddress,
                  'Billing Address': formData.billingSameAsPhysical
                    ? formData.physicalAddress
                    : formData.billingAddress,
                  'Assignment Location / Platform': formData.assignmentLocationPlatform,
                  'Communication Styles': formData.communicationStyles
                    .map((item) =>
                      item === 'Other' && formData.communicationStyleOther
                        ? `Other: ${formData.communicationStyleOther}`
                        : item
                    )
                    .join(', '),
                  'Additional Considerations': formData.additionalConsiderations
                    .map((item) =>
                      item === 'Other' && formData.additionalConsiderationsOther
                        ? `Other: ${formData.additionalConsiderationsOther}`
                        : item
                    )
                    .join(', '),
                  'Hearing Participant Languages': formData.hearingParticipantsLanguages,
                  'Worked With Interpreter Before': formData.workedWithInterpreterBefore,
                  'Certified Deaf Interpreter (CDI) / Additional Support Needed': formData.cdiOrAdditionalSupportNeeded,
                  'Assignment Description': formData.assignmentDescription,
                  'Specialized Content': formData.specializedContent,
                  'Specialized Topics': formData.specializedTopics,
                  'Interaction Goal': formData.interactionGoal,
                  'Materials Available': formData.materialsAvailable,
                  'Materials to Share': formData.materialsList,
                  'High-Stakes / Sensitive': formData.highStakesSensitive,
                  'Exceeds 2 Hours': formData.exceedsTwoHours,
                  'Team Interpreter Arranged': formData.teamInterpreterArranged,
                  'Direct Visual Access': formData.directVisualAccess,
                  'Movement Between Locations': formData.movementBetweenLocations,
                  'Environmental Factors': formData.environmentalFactors,
                  'Additional Communication Notes': formData.communicationNotes,
                }).map(([label, value]) => (
                  <div key={label} className="rounded-2xl border p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: p.gold }}>
                      {label}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap leading-6">
                      {value || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        <div
          className="sticky bottom-4 rounded-2xl border bg-white/95 p-4 shadow-lg backdrop-blur"
          style={{ borderColor: p.border }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div aria-live="polite" role="status">
  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: p.gold }}>
    Progress
  </p>
  <p className="mt-1 text-sm font-medium" style={{ color: p.charcoal }}>
    Step {step} of 7
  </p>
</div>

            {submitError && (
              <p className="mb-3 text-sm font-medium form-error">{submitError}</p>
            )}

            <div className="flex flex-wrap gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary"
                  style={{ borderColor: p.border, color: p.charcoal }}
                  disabled={isSubmitting}
                >
                  Back
                </button>
              )}

              {step < 7 ? (
  <button
    type="button"
    onClick={handleNext}
    className="btn btn-primary"
    disabled={isSubmitting}
  >
    Continue
  </button>
) : (
  <button
    type="button"
    onClick={handleSubmit}
    className="btn btn-primary"
    disabled={isSubmitting}
  >
    {isSubmitting ? 'Submitting...' : 'Submit Request'}
  </button>
)}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
