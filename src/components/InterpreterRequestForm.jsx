import { useMemo, useState } from 'react';

const defaultPalette = {
  burgundy: '#721100',
  gold: '#dd7d00',
  charcoal: '#464747',
  white: '#ffffff',
  softGray: '#f5f5f5',
  border: '#e5e5e5',
};

const initialFormData = {
  formType: 'request',
  requestCategory: 'clientInterpreterRequest',
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function to12Hour(time) {
  if (!time) return '';
  const [hourStr, minute] = time.split(':');
  const hour = Number(hourStr);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour % 12 || 12;
  return normalized + ':' + minute + ' ' + suffix;
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
  if (hours && minutes) return hours + ' hr ' + minutes + ' min';
  if (hours) return hours + ' hr';
  return minutes + ' min';
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

function ReviewItem({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={{ borderColor: defaultPalette.border }}>
      <dt className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: defaultPalette.gold }}>{label}</dt>
      <dd className="mt-2 whitespace-pre-wrap text-sm leading-6" style={{ color: defaultPalette.charcoal }}>{value || '—'}</dd>
    </div>
  );
}

export default function InterpreterRequestForm({ palette = defaultPalette }) {
  const p = { ...defaultPalette, ...palette };
  const scriptUrl =
    import.meta.env.VITE_GOOGLE_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbwVCk2VeLlWlMFDY5r_SIR3nSgv4vQ7mOVZ2jmF5vacH3AP50BixZh-IdVqryu0LJ0/exec';

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
      ...(name === 'billingSameAsPhysical' && value ? { billingAddress: prev.physicalAddress } : {}),
      ...(name === 'physicalAddress' && prev.billingSameAsPhysical ? { billingAddress: value } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData((prev) => {
      const exists = prev[field].includes(value);
      const nextValues = exists ? prev[field].filter((item) => item !== value) : [...prev[field], value];
      const resets = {};
      if (field === 'communicationStyles' && exists && value === 'Other') resets.communicationStyleOther = '';
      if (field === 'additionalConsiderations' && exists && value === 'Other') resets.additionalConsiderationsOther = '';
      return { ...prev, [field]: nextValues, ...resets };
    });
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const getStepErrors = (currentStep) => {
    const nextErrors = {};

    if (currentStep === 1) {
      if (!formData.emailCapture.trim()) nextErrors.emailCapture = 'Email is required.';
      else if (!isValidEmail(formData.emailCapture)) nextErrors.emailCapture = 'Enter a valid email address.';
    }

    if (currentStep === 2) {
      if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required.';
      if (!formData.organizationName.trim()) nextErrors.organizationName = 'Organization / company name is required.';
      if (!formData.physicalAddress.trim()) nextErrors.physicalAddress = 'Physical address is required.';
      if (!formData.billingSameAsPhysical && !formData.billingAddress.trim()) nextErrors.billingAddress = 'Billing address is required.';
      if (!formData.contactEmail.trim()) nextErrors.contactEmail = 'Email address is required.';
      else if (!isValidEmail(formData.contactEmail)) nextErrors.contactEmail = 'Enter a valid email address.';
      if (!formData.phoneNumber.trim()) nextErrors.phoneNumber = 'Phone number is required.';
    }

    if (currentStep === 3) {
      if (!formData.serviceNeeded) nextErrors.serviceNeeded = 'Please select a service.';
      if (!formData.setting) nextErrors.setting = 'Please select a setting.';
      if (!formData.assignmentDate) nextErrors.assignmentDate = 'Date is required.';
      if (!formData.startTime) nextErrors.startTime = 'Start time is required.';
      if (!formData.endTime) nextErrors.endTime = 'End time is required.';
      if (!formData.assignmentLocationPlatform.trim()) nextErrors.assignmentLocationPlatform = 'Location / platform is required.';
      if (formData.startTime && formData.endTime && !calculateDuration(formData.startTime, formData.endTime)) {
        nextErrors.endTime = 'End time must be later than start time.';
      }
    }

    if (currentStep === 4) {
      if (!formData.participantCount.trim()) nextErrors.participantCount = 'Please enter the participant count.';
      if (!formData.hearingParticipantsLanguages.trim()) nextErrors.hearingParticipantsLanguages = 'Please provide the hearing participants’ primary language(s).';
      if (formData.communicationStyles.length === 0) nextErrors.communicationStyles = 'Select at least one communication style.';
      if (formData.communicationStyles.includes('Other') && !formData.communicationStyleOther.trim()) nextErrors.communicationStyleOther = 'Please specify the other communication style.';
      if (formData.additionalConsiderations.includes('Other') && !formData.additionalConsiderationsOther.trim()) nextErrors.additionalConsiderationsOther = 'Please specify the other additional consideration.';
    }

    if (currentStep === 5) {
      if (!formData.assignmentDescription.trim()) nextErrors.assignmentDescription = 'Please describe the assignment.';
      if (!formData.specializedContent) nextErrors.specializedContent = 'Please select an option.';
      if (!formData.materialsAvailable) nextErrors.materialsAvailable = 'Please select an option.';
      if (!formData.highStakesSensitive) nextErrors.highStakesSensitive = 'Please select an option.';
    }

    if (currentStep === 6) {
      if (!formData.exceedsTwoHours) nextErrors.exceedsTwoHours = 'Please select an option.';
      if (!formData.teamInterpreterArranged) nextErrors.teamInterpreterArranged = 'Please select an option.';
      if (!formData.environmentalFactors.trim()) nextErrors.environmentalFactors = 'Please describe environmental or setup factors.';
    }

    return nextErrors;
  };

  const validateStep = (currentStep) => {
    const nextErrors = getStepErrors(currentStep);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAllSteps = () => {
    const allErrors = {};
    for (let i = 1; i <= 6; i += 1) Object.assign(allErrors, getStepErrors(i));
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      const firstInvalidStep = [1, 2, 3, 4, 5, 6].find((i) => Object.keys(getStepErrors(i)).length > 0);
      setStep(firstInvalidStep || 1);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((prev) => Math.min(prev + 1, 7));
  };

  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (step !== 7) return;
    if (!validateAllSteps()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const encodedData = new URLSearchParams();
      const payload = {
        ...formData,
        estimatedDuration: derivedDuration,
        communicationStyles: formData.communicationStyles.includes('Other')
          ? [...formData.communicationStyles.filter((item) => item !== 'Other'), 'Other: ' + formData.communicationStyleOther].join(', ')
          : formData.communicationStyles.join(', '),
        additionalConsiderations: formData.additionalConsiderations.includes('Other')
          ? [...formData.additionalConsiderations.filter((item) => item !== 'Other'), 'Other: ' + formData.additionalConsiderationsOther].join(', ')
          : formData.additionalConsiderations.join(', '),
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (Array.isArray(value)) encodedData.append(key, value.join(', '));
        else if (typeof value === 'boolean') encodedData.append(key, value ? 'Yes' : 'No');
        else encodedData.append(key, value ?? '');
      });

      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: encodedData,
      });

      const result = await response.json();
      if (!response.ok || result.status !== 'success') {
        setSubmitError(result?.message || 'Unable to submit request. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Request submission error', error);
      setSubmitError('Unable to submit request. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  const renderInput = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className={labelClass} style={{ color: p.charcoal }} htmlFor={name}>{label}</label>
      <input id={name} type={type} value={formData[name]} onChange={(event) => setField(name, event.target.value)} placeholder={placeholder} className={inputClass} />
      <ErrorText errors={errors} name={name} />
    </div>
  );

  const renderTextarea = (name, label, placeholder = '', rows = 4) => (
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

  const renderYesNo = (name, label, extraOptions = []) => renderSelect(name, label, ['Yes', 'No', ...extraOptions]);

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
      {otherName && formData[name].includes('Other') ? (
        <div className="mt-3">
          <input value={formData[otherName]} onChange={(event) => setField(otherName, event.target.value)} placeholder="Please specify" className={inputClass} />
          <ErrorText errors={errors} name={otherName} />
        </div>
      ) : null}
    </div>
  );

  if (submitted) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-16 md:px-8">
        <div className="rounded-[2rem] border bg-white p-8 text-center shadow-sm" style={{ borderColor: p.border }}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: p.softGray, color: p.burgundy }}>✓</div>
          <h1 className="text-3xl font-bold" style={{ color: p.charcoal }}>Request Submitted</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6" style={{ color: p.charcoal }}>
            Thank you for your interest in working with Miqueas Language Solutions. Your request has been received and is ready for review.
          </p>
          <button type="button" onClick={() => { setFormData(initialFormData); setErrors({}); setSubmitError(''); setSubmitted(false); setStep(1); }} className="mt-6 rounded-full px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: p.burgundy }}>
            Submit Another Request
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {step === 1 && (
        <SectionCard step={1} title="Start Your Request" subtitle="Enter your email first so MLS can follow up if more details are needed." palette={p}>
          {renderInput('emailCapture', 'Email Address', 'email', 'name@example.com')}
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard step={2} title="Contact & Billing Information" subtitle="Tell MLS who is requesting services and where billing should be directed." palette={p}>
          <div className="grid gap-5 md:grid-cols-2">
            {renderInput('fullName', 'Full Name')}
            {renderInput('organizationName', 'Organization / Company Name')}
            {renderInput('contactEmail', 'Contact Email', 'email')}
            {renderInput('phoneNumber', 'Phone Number', 'tel')}
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {renderTextarea('physicalAddress', 'Physical Address', 'Street, city, state, ZIP', 3)}
            <div>
              <label className="mb-3 flex items-start gap-3 text-sm font-semibold" style={{ color: p.charcoal }}>
                <input type="checkbox" checked={formData.billingSameAsPhysical} onChange={(event) => setField('billingSameAsPhysical', event.target.checked)} className="mt-1 h-4 w-4 rounded form-checkbox" style={{ accentColor: p.burgundy }} />
                <span>Billing address is the same as physical address</span>
              </label>
              {renderTextarea('billingAddress', 'Billing Address', 'Street, city, state, ZIP', 3)}
            </div>
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard step={3} title="Assignment Details" subtitle="Include the core details needed to review availability and fit." palette={p}>
          <div className="grid gap-5 md:grid-cols-2">
            {renderSelect('serviceNeeded', 'Service Needed', serviceOptions)}
            {renderSelect('setting', 'Setting', settingOptions)}
            {renderInput('assignmentDate', 'Assignment Date', 'date')}
            {renderInput('startTime', 'Start Time', 'time')}
            {renderInput('endTime', 'End Time', 'time')}
            <div>
              <p className={labelClass} style={{ color: p.charcoal }}>Estimated Duration</p>
              <div className="rounded-xl border bg-white px-4 py-3 text-sm" style={{ borderColor: p.border, color: p.charcoal }}>
                {derivedDuration || 'Enter start and end time'}
              </div>
            </div>
          </div>
          <div className="mt-5">{renderTextarea('assignmentLocationPlatform', 'Assignment Location / Platform', 'Address, room, link, platform, or access details', 3)}</div>
        </SectionCard>
      )}

      {step === 4 && (
        <SectionCard step={4} title="Communication Needs" subtitle="Share enough detail to support communication access while keeping consumer information need-to-know." palette={p}>
          <div className="grid gap-5 md:grid-cols-2">
            {renderInput('participantCount', 'Estimated Participant Count')}
            {renderInput('consumerNames', 'Deaf Participant Name(s), if appropriate / available')}
            {renderInput('hearingParticipantsLanguages', 'Hearing Participants’ Primary Language(s)')}
            {renderYesNo('workedWithInterpreterBefore', 'Has the consumer/client worked with an interpreter before?', ['Not sure'])}
            {renderYesNo('cdiOrAdditionalSupportNeeded', 'Is a CDI or additional support needed?', ['Not sure'])}
          </div>
          <div className="mt-5 space-y-5">
            {renderCheckboxGroup('communicationStyles', 'Communication Style(s)', communicationStyleOptions, 'communicationStyleOther')}
            {renderCheckboxGroup('additionalConsiderations', 'Additional Considerations', additionalConsiderationOptions, 'additionalConsiderationsOther')}
            {renderTextarea('communicationNotes', 'Additional Communication Notes', 'Language preferences, accessibility needs, context, or other relevant details', 4)}
          </div>
        </SectionCard>
      )}

      {step === 5 && (
        <SectionCard step={5} title="Content & Preparation" subtitle="This helps MLS determine qualifications, teaming, and prep needs." palette={p}>
          <div className="space-y-5">
            {renderTextarea('assignmentDescription', 'Assignment Description', 'What will happen during the assignment?', 4)}
            <div className="grid gap-5 md:grid-cols-2">
              {renderYesNo('specializedContent', 'Does this involve specialized content?', ['Not sure'])}
              {renderYesNo('materialsAvailable', 'Are preparation materials available?', ['Not sure'])}
              {renderYesNo('highStakesSensitive', 'Is this high-stakes or sensitive?', ['Not sure'])}
            </div>
            {renderTextarea('specializedTopics', 'Specialized Topics / Terminology', 'Medical terms, legal terms, product names, agenda topics, etc.', 3)}
            {renderTextarea('materialsList', 'Available Materials', 'Slides, scripts, agenda, speaker names, videos, product lists, etc.', 3)}
            {renderTextarea('interactionGoal', 'Goal of the Interaction', 'What should communication access support?', 3)}
          </div>
        </SectionCard>
      )}

      {step === 6 && (
        <SectionCard step={6} title="Logistics & Working Conditions" subtitle="These details help MLS promote effective and ethical service delivery." palette={p}>
          <div className="grid gap-5 md:grid-cols-2">
            {renderYesNo('exceedsTwoHours', 'Does this exceed 2 hours?', ['Not sure'])}
            {renderYesNo('teamInterpreterArranged', 'Is a team interpreter arranged?', ['Not sure'])}
            {renderYesNo('directVisualAccess', 'Will there be direct visual access?', ['Not sure'])}
            {renderYesNo('movementBetweenLocations', 'Will interpreters move between locations?', ['Not sure'])}
          </div>
          <div className="mt-5">{renderTextarea('environmentalFactors', 'Environmental Factors', 'Lighting, seating, audio, platform setup, PPE, visibility, background noise, room layout, etc.', 4)}</div>
        </SectionCard>
      )}

      {step === 7 && (
        <SectionCard step={7} title="Review & Submit" subtitle="Review the request before submitting. MLS will follow up after reviewing the details." palette={p}>
          <dl className="grid gap-4 md:grid-cols-2">
            <ReviewItem label="Requester" value={formData.fullName} />
            <ReviewItem label="Organization" value={formData.organizationName} />
            <ReviewItem label="Contact Email" value={formData.contactEmail || formData.emailCapture} />
            <ReviewItem label="Phone" value={formData.phoneNumber} />
            <ReviewItem label="Service" value={formData.serviceNeeded} />
            <ReviewItem label="Setting" value={formData.setting} />
            <ReviewItem label="Date" value={formData.assignmentDate} />
            <ReviewItem label="Time" value={(to12Hour(formData.startTime) || '—') + ' – ' + (to12Hour(formData.endTime) || '—')} />
            <ReviewItem label="Duration" value={derivedDuration} />
            <ReviewItem label="Location / Platform" value={formData.assignmentLocationPlatform} />
            <ReviewItem label="Communication Styles" value={formData.communicationStyles.join(', ')} />
            <ReviewItem label="Description" value={formData.assignmentDescription} />
          </dl>
          {submitError ? <p className="mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold form-error">{submitError}</p> : null}
        </SectionCard>
      )}

      <div className="flex flex-col gap-3 rounded-[1.5rem] border bg-white p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: p.border }}>
        <div className="text-sm font-semibold" style={{ color: p.charcoal }}>Progress: Step {step} of 7</div>
        <div className="flex gap-3">
          {step > 1 ? (
            <button type="button" onClick={handleBack} className="rounded-full border px-5 py-3 text-sm font-bold" style={{ borderColor: p.border, color: p.charcoal }}>
              Back
            </button>
          ) : null}
          {step < 7 ? (
            <button type="button" onClick={handleNext} className="rounded-full px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: p.burgundy }}>
              Continue
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="rounded-full px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: p.burgundy }}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
