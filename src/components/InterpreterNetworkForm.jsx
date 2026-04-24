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
  formType: 'interpreter',
  fullName: '',
  organizationName: '',
  emailAddress: '',
  phoneNumber: '',
  currentLocation: '',
  preferredMethodOfContact: [],

  credentials: [],
  otherCredential: '',
  stateLicense: '',
  stateLicenseDetails: '',
  yearsExperience: '',
  educationITP: '',

  primaryModalities: [],
  otherModality: '',
  areasOfExperience: [],
  situationsSuccessfullyNavigated: [],
  situationOther: '',
  challengingSituationDescription: '',

  sundayAvailability: [],
  mondayAvailability: [],
  tuesdayAvailability: [],
  wednesdayAvailability: [],
  thursdayAvailability: [],
  fridayAvailability: [],
  saturdayAvailability: [],
  assignmentTypePreference: '',
  willingToTravel: '',
  technicalReadinessConfirmed: '',

  resumeLink: '',
  certificationsLink: '',
  workSampleLink: '',

  openToIndependentContractor: '',
  professionalLiabilityInsurance: '',
  comfortableWithStandardIndustryRates: '',
  certificationAgreement: false,
};

const contactOptions = ['Email', 'Phone', 'Text'];
const credentialOptions = [
  'National Interpreter Certification (NIC)',
  'Certified Deaf Interpreter (CDI)',
  'Board for Evaluation of Interpreters (BEI)',
  'Educational Interpreter Performance Assessment (EIPA)',
  'Uncertified',
  'Other',
];
const modalityOptions = [
  'ASL (American Sign Language)',
  'PTASL (Pro-Tactile ASL)',
  'CASE (Conceptually Accurate Signed English)',
  'Trilingual (ASL, English, Spanish)',
  'MCE (Manually Coded English)',
  'Cued Speech',
  'Other',
];
const experienceOptions = [
  'Medical',
  'Legal',
  'Edu.(K-12)',
  'Edu.(Post-Secondary)',
  'Mental Health',
  'Community / Freelance',
  'Platform / Conference',
  'Performance / Arts',
  'Cruise',
  'Video Relay Service (VRS)',
  'Video Remote Interpreting (VRI)',
  'English > ASL Translation',
  'ASL > English Translation',
];
const situationOptions = [
  'Interpreting for individuals with language deprivation or minimal language',
  'Working with atypical or non-standard ASL users',
  'Managing fast-paced or information-dense communication',
  'Interpreting in emotionally charged situations (conflict, medical, etc.)',
  'Navigating power dynamics (e.g., doctor/patient, employer/employee)',
  'Deciding when to request clarification or intervene',
  'Working in team interpreting settings',
  'Interpreting via VRI with technical challenges',
  'Other',
];
const availabilityBlocks = ['Morning (6AM-12PM EST)', 'Afternoon (1PM-5PM EST)', 'Evening (6PM-9PM EST)', 'Overnight (12AM-6AM EST)', 'Unavailable'];
const dayConfigs = [
  ['Sunday', 'sundayAvailability'],
  ['Monday', 'mondayAvailability'],
  ['Tuesday', 'tuesdayAvailability'],
  ['Wednesday', 'wednesdayAvailability'],
  ['Thursday', 'thursdayAvailability'],
  ['Friday', 'fridayAvailability'],
  ['Saturday', 'saturdayAvailability'],
];

function ErrorText({ errors, name }) {
  if (!errors[name]) return null;
  return <p className="mt-2 text-xs font-medium form-error">{errors[name]}</p>;
}

function SectionCard({ title, subtitle, children, step, totalSteps, borderColor, titleColor }) {
  return (
    <div className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={{ borderColor }}>
      <div className="mb-6">
        <div
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ backgroundColor: defaultPalette.softGray, color: defaultPalette.gold }}
        >
          Section {step} of {totalSteps}
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

function CheckboxGroup({ options, values, onToggle, otherValue, onOtherChange, palette }) {
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
                onChange={() => onToggle(option)}
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
                className="mt-3 w-full rounded-xl border px-4 py-3 text-sm outline-none transition form-input"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatJoined(values, otherValue) {
  return values
    .map((value) => (value === 'Other' && otherValue ? `Other: ${otherValue}` : value))
    .join(', ');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export default function InterpreterNetworkForm({ palette = defaultPalette }) {
  const p = { ...defaultPalette, ...palette };
  const totalSteps = 7;
  const scriptUrl =
    import.meta.env.VITE_GOOGLE_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbwVCk2VeLlWlMFDY5r_SIR3nSgv4vQ7mOVZ2jmF5vacH3AP50BixZh-IdVqryu0LJ0/exec';

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const inputClass = 'w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 form-input';
  const textareaClass = 'w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 form-input';
  const labelClass = 'mb-2 block text-sm font-semibold';

  const preferredContactJoined = useMemo(
    () => formData.preferredMethodOfContact.join(', '),
    [formData.preferredMethodOfContact]
  );

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData((prev) => {
      const exists = prev[field].includes(value);
      const nextValues = exists ? prev[field].filter((item) => item !== value) : [...prev[field], value];
      const resets = {};
      if (field === 'credentials' && exists && value === 'Other') resets.otherCredential = '';
      if (field === 'primaryModalities' && exists && value === 'Other') resets.otherModality = '';
      if (field === 'situationsSuccessfullyNavigated' && exists && value === 'Other') resets.situationOther = '';
      return { ...prev, [field]: nextValues, ...resets };
    });
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep = (currentStep) => {
    const nextErrors = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required.';
      if (!formData.emailAddress.trim()) {
        nextErrors.emailAddress = 'Email address is required.';
      } else if (!isValidEmail(formData.emailAddress)) {
        nextErrors.emailAddress = 'Enter a valid email address.';
      }
      if (!formData.phoneNumber.trim()) nextErrors.phoneNumber = 'Phone number is required.';
      if (!formData.currentLocation.trim()) nextErrors.currentLocation = 'Current location is required.';
      if (formData.preferredMethodOfContact.length === 0) {
        nextErrors.preferredMethodOfContact = 'Select at least one preferred contact method.';
      }
    }

    if (currentStep === 2) {
      if (formData.credentials.length === 0) nextErrors.credentials = 'Select at least one credential option.';
      if (formData.credentials.includes('Other') && !formData.otherCredential.trim()) {
        nextErrors.otherCredential = 'Please specify your other credential.';
      }
      if (!formData.stateLicense) nextErrors.stateLicense = 'Please select whether you hold a state license.';
      if (formData.stateLicense === 'Yes' && !formData.stateLicenseDetails.trim()) {
        nextErrors.stateLicenseDetails = 'Please specify your state license.';
      }
      if (!formData.yearsExperience) nextErrors.yearsExperience = 'Please select your experience level.';
      if (!formData.educationITP.trim()) nextErrors.educationITP = 'Education / interpreter training information is required.';
    }

    if (currentStep === 3) {
      if (formData.primaryModalities.length === 0) nextErrors.primaryModalities = 'Select at least one modality.';
      if (formData.primaryModalities.includes('Other') && !formData.otherModality.trim()) {
        nextErrors.otherModality = 'Please specify the other modality.';
      }
      if (formData.areasOfExperience.length === 0) nextErrors.areasOfExperience = 'Select at least one area of experience.';
      if (formData.situationsSuccessfullyNavigated.length === 0) {
        nextErrors.situationsSuccessfullyNavigated = 'Select at least one interpreting situation.';
      }
      if (formData.situationsSuccessfullyNavigated.includes('Other') && !formData.situationOther.trim()) {
        nextErrors.situationOther = 'Please specify the other situation.';
      }
      if (!formData.challengingSituationDescription.trim()) {
        nextErrors.challengingSituationDescription = 'Please describe one challenging situation you handled.';
      }
    }

    if (currentStep === 4) {
      const missingDays = dayConfigs.filter(([, key]) => formData[key].length === 0).map(([label]) => label);
      if (missingDays.length > 0) {
        nextErrors.availability = `Select availability for: ${missingDays.join(', ')}.`;
      }
      if (!formData.assignmentTypePreference) {
        nextErrors.assignmentTypePreference = 'Please select your assignment type preference.';
      }
      if (!formData.willingToTravel) nextErrors.willingToTravel = 'Please select whether you are willing to travel.';
      if (!formData.technicalReadinessConfirmed) nextErrors.technicalReadinessConfirmed = 'Please confirm your technical readiness.';
    }

    if (currentStep === 5) {
      if (!formData.resumeLink.trim()) nextErrors.resumeLink = 'Resume link is required.';
      if (!formData.certificationsLink.trim()) nextErrors.certificationsLink = 'Certifications / licenses link is required.';
      if (!formData.workSampleLink.trim()) nextErrors.workSampleLink = 'Work sample link is required.';
    }

    if (currentStep === 6) {
      if (!formData.openToIndependentContractor) {
        nextErrors.openToIndependentContractor = 'Please select an option.';
      }
      if (!formData.professionalLiabilityInsurance) {
        nextErrors.professionalLiabilityInsurance = 'Please select an option.';
      }
      if (!formData.comfortableWithStandardIndustryRates) {
        nextErrors.comfortableWithStandardIndustryRates = 'Please select an option.';
      }
    }

    if (currentStep === 7) {
      if (!formData.certificationAgreement) {
        nextErrors.certificationAgreement = 'You must certify the information before submitting.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(7)) {
      setStep(7);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const encodedData = new URLSearchParams();
      const payload = {
        ...formData,
        preferredMethodOfContact: preferredContactJoined,
        credentials: formatJoined(formData.credentials, formData.otherCredential),
        primaryModalities: formatJoined(formData.primaryModalities, formData.otherModality),
        areasOfExperience: formData.areasOfExperience.join(', '),
        situationsSuccessfullyNavigated: formatJoined(formData.situationsSuccessfullyNavigated, formData.situationOther),
      };

      dayConfigs.forEach(([, key]) => {
        payload[key] = formData[key].join(', ');
      });

      Object.entries(payload).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          encodedData.append(key, value ? 'Yes' : 'No');
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
        setSubmitError(result?.message || 'Unable to submit form. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Interpreter submission error', error);
      setSubmitError('Unable to submit form. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-6 md:px-8">
        <div className="rounded-[2rem] border bg-white p-8 text-center shadow-sm" style={{ borderColor: p.border }}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: p.softGray, color: p.burgundy }}>✓</div>
          <h2 className="text-3xl font-bold" style={{ color: p.charcoal }}>Application Submitted</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6" style={{ color: p.charcoal }}>
            Thank you for your interest in joining the Miqueas Language Solutions interpreter network.
            Your submission has been received and will be reviewed based on qualifications, experience,
            availability, and overall fit for future subcontracting opportunities.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6" style={{ color: p.charcoal }}>
            Only qualified applicants will be contacted when opportunities arise or when additional follow-up is needed.
          </p>
          <button
            type="button"
            onClick={() => {
              setFormData(initialFormData);
              setErrors({});
              setSubmitError('');
              setSubmitted(false);
              setStep(1);
              setIsSubmitting(false);
            }}
            className="btn btn-primary mt-6"
          >
            Submit Another Application
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-6 md:px-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={{ borderColor: p.border }}>
          <div className="mb-6 text-center">
            <img src={logo} alt="Miqueas Language Solutions" className="mx-auto h-20 object-contain" />
          </div>
          <h2 className="text-center text-3xl font-bold md:text-4xl" style={{ color: p.charcoal }}>
            Join Our Interpreter Network
          </h2>
          <div className="mx-auto mt-6 max-w-3xl space-y-4 text-center text-sm leading-7" style={{ color: p.charcoal }}>
            <p>
              Thank you for your interest in providing subcontracted interpreting services with <span className="font-semibold">Miqueas Language Solutions</span>.
            </p>
            <p>
              We are committed to providing high-quality, ethical interpreting services and are seeking qualified interpreters and translators who uphold professional standards. Please complete the form below. Only qualified applicants will be contacted for next steps.
            </p>
            <p>
              Instead of uploading files directly, please share secure links to your resume, credentials, and sample work so they can be reviewed efficiently.
            </p>
          </div>
          <p className="mt-6 text-xs font-medium form-note">* Indicates required information</p>
        </div>

        {step === 1 && (
          <SectionCard step={1} totalSteps={totalSteps} borderColor={p.border} titleColor={p.charcoal} title="Contact Information" subtitle="Start with the best contact details to use for future subcontracting opportunities.">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="fullName" className={labelClass}>Full Name *</label>
                <input id="fullName" type="text" value={formData.fullName} onChange={(e) => setField('fullName', e.target.value)} className={inputClass} />
                <ErrorText errors={errors} name="fullName" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="organizationName" className={labelClass}>Organization / Company Name</label>
                <input id="organizationName" type="text" value={formData.organizationName} onChange={(e) => setField('organizationName', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="emailAddress" className={labelClass}>Email Address *</label>
                <input id="emailAddress" type="email" value={formData.emailAddress} onChange={(e) => setField('emailAddress', e.target.value)} className={inputClass} />
                <ErrorText errors={errors} name="emailAddress" />
              </div>
              <div>
                <label htmlFor="phoneNumber" className={labelClass}>Phone Number *</label>
                <input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} className={inputClass} />
                <ErrorText errors={errors} name="phoneNumber" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="currentLocation" className={labelClass}>Current Location *</label>
                <input id="currentLocation" type="text" value={formData.currentLocation} onChange={(e) => setField('currentLocation', e.target.value)} className={inputClass} placeholder="City, State, USA" />
                <ErrorText errors={errors} name="currentLocation" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Preferred Method of Contact *</label>
                <div className="space-y-3">
                  {contactOptions.map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input type="checkbox" checked={formData.preferredMethodOfContact.includes(option)} onChange={() => toggleMultiSelect('preferredMethodOfContact', option)} className="mt-1 h-4 w-4 rounded form-checkbox" style={{ accentColor: p.burgundy }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="preferredMethodOfContact" />
              </div>
            </div>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard step={2} totalSteps={totalSteps} borderColor={p.border} titleColor={p.charcoal} title="Credentials & Qualifications" subtitle="Share the core qualification details that help determine fit for future assignments.">
            <div className="space-y-6">
              <div>
                <label className={labelClass}>What are your credentials? *</label>
                <p className="mb-3 text-sm italic" style={{ color: p.charcoal }}>(Please check all that apply.)</p>
                <CheckboxGroup options={credentialOptions} values={formData.credentials} onToggle={(value) => toggleMultiSelect('credentials', value)} otherValue={formData.otherCredential} onOtherChange={(value) => setField('otherCredential', value)} palette={p} />
                <ErrorText errors={errors} name="credentials" />
                <ErrorText errors={errors} name="otherCredential" />
              </div>
              <div>
                <label className={labelClass}>Do you hold any state license? *</label>
                <div className="space-y-3">
                  {['Yes', 'No'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input type="radio" name="stateLicense" value={option} checked={formData.stateLicense === option} onChange={(e) => setField('stateLicense', e.target.value)} className="mt-1 h-4 w-4" style={{ accentColor: p.burgundy }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="stateLicense" />
              </div>
              {formData.stateLicense === 'Yes' && (
                <div>
                  <label htmlFor="stateLicenseDetails" className={labelClass}>If yes, please specify *</label>
                  <input id="stateLicenseDetails" type="text" value={formData.stateLicenseDetails} onChange={(e) => setField('stateLicenseDetails', e.target.value)} className={inputClass} />
                  <ErrorText errors={errors} name="stateLicenseDetails" />
                </div>
              )}
              <div>
                <label htmlFor="yearsExperience" className={labelClass}>Years of interpreting / translating experience *</label>
                <select id="yearsExperience" value={formData.yearsExperience} onChange={(e) => setField('yearsExperience', e.target.value)} className={inputClass}>
                  <option value="">Choose</option>
                  <option>Less than 1 year</option>
                  <option>1-3 years</option>
                  <option>4-6 years</option>
                  <option>7-10 years</option>
                  <option>10+ years</option>
                </select>
                <ErrorText errors={errors} name="yearsExperience" />
              </div>
              <div>
                <label htmlFor="educationITP" className={labelClass}>Education / Interpreter Training Program *</label>
                <textarea id="educationITP" rows={4} value={formData.educationITP} onChange={(e) => setField('educationITP', e.target.value)} className={textareaClass} />
                <ErrorText errors={errors} name="educationITP" />
              </div>
            </div>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard step={3} totalSteps={totalSteps} borderColor={p.border} titleColor={p.charcoal} title="Skills & Specializations" subtitle="This section helps identify what settings and communication demands you are best equipped to handle.">
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Primary interpreting / transliterating / translation modalities *</label>
                <CheckboxGroup options={modalityOptions} values={formData.primaryModalities} onToggle={(value) => toggleMultiSelect('primaryModalities', value)} otherValue={formData.otherModality} onOtherChange={(value) => setField('otherModality', value)} palette={p} />
                <ErrorText errors={errors} name="primaryModalities" />
                <ErrorText errors={errors} name="otherModality" />
              </div>
              <div>
                <label className={labelClass}>Areas of experience *</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {experienceOptions.map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input type="checkbox" checked={formData.areasOfExperience.includes(option)} onChange={() => toggleMultiSelect('areasOfExperience', option)} className="mt-1 h-4 w-4 rounded form-checkbox" style={{ accentColor: p.burgundy }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="areasOfExperience" />
              </div>
              <div>
                <label className={labelClass}>Which interpreting situations have you successfully navigated? *</label>
                <CheckboxGroup options={situationOptions} values={formData.situationsSuccessfullyNavigated} onToggle={(value) => toggleMultiSelect('situationsSuccessfullyNavigated', value)} otherValue={formData.situationOther} onOtherChange={(value) => setField('situationOther', value)} palette={p} />
                <ErrorText errors={errors} name="situationsSuccessfullyNavigated" />
                <ErrorText errors={errors} name="situationOther" />
              </div>
              <div>
                <label htmlFor="challengingSituationDescription" className={labelClass}>Briefly describe one challenging interpreting situation you've handled. *</label>
                <textarea id="challengingSituationDescription" rows={5} value={formData.challengingSituationDescription} onChange={(e) => setField('challengingSituationDescription', e.target.value)} className={textareaClass} />
                <ErrorText errors={errors} name="challengingSituationDescription" />
              </div>
            </div>
          </SectionCard>
        )}

        {step === 4 && (
          <SectionCard step={4} totalSteps={totalSteps} borderColor={p.border} titleColor={p.charcoal} title="Availability & Preferences" subtitle="Share when and how you are generally available so future requests can be matched more efficiently.">
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Availability *</label>
                <div className="space-y-5 rounded-2xl border p-5" style={{ borderColor: p.border }}>
                  {dayConfigs.map(([label, key]) => (
                    <div key={key} className="border-b pb-4 last:border-b-0 last:pb-0" style={{ borderColor: p.border }}>
                      <p className="mb-3 text-sm font-semibold" style={{ color: p.charcoal }}>{label}</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {availabilityBlocks.map((option) => (
                          <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                            <input type="checkbox" checked={formData[key].includes(option)} onChange={() => toggleMultiSelect(key, option)} className="mt-1 h-4 w-4 rounded form-checkbox" style={{ accentColor: p.burgundy }} />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <ErrorText errors={errors} name="availability" />
              </div>
              <div>
                <label className={labelClass}>Preferred assignment type *</label>
                <div className="space-y-3">
                  {['In-Person', 'VRI', 'Both'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input type="radio" name="assignmentTypePreference" value={option} checked={formData.assignmentTypePreference === option} onChange={(e) => setField('assignmentTypePreference', e.target.value)} className="mt-1 h-4 w-4" style={{ accentColor: p.burgundy }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="assignmentTypePreference" />
              </div>
              <div>
                <label className={labelClass}>I am willing to travel for my assignments. *</label>
                <div className="space-y-3">
                  {['Yes', 'No'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input type="radio" name="willingToTravel" value={option} checked={formData.willingToTravel === option} onChange={(e) => setField('willingToTravel', e.target.value)} className="mt-1 h-4 w-4" style={{ accentColor: p.burgundy }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="willingToTravel" />
              </div>
              <div>
                <label className={labelClass}>I confirm that I meet these technical requirements and can maintain a professional VRI workspace. *</label>
                <div className="rounded-2xl border p-5 text-sm leading-6 form-hint">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Minimum 25 Mbps download / 10 Mbps upload</li>
                    <li>Stable wired Ethernet connection preferred</li>
                    <li>HD webcam at eye level with clear signing space</li>
                    <li>Clear headset audio with minimal background noise</li>
                    <li>Professional lighting and a neutral, distraction-free background</li>
                    <li>Laptop or desktop capable of running VRI platforms smoothly</li>
                  </ul>
                </div>
                <div className="mt-4 space-y-3">
                  {['Yes', 'No'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input type="radio" name="technicalReadinessConfirmed" value={option} checked={formData.technicalReadinessConfirmed === option} onChange={(e) => setField('technicalReadinessConfirmed', e.target.value)} className="mt-1 h-4 w-4" style={{ accentColor: p.burgundy }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="technicalReadinessConfirmed" />
              </div>
            </div>
          </SectionCard>
        )}

        {step === 5 && (
          <SectionCard step={5} totalSteps={totalSteps} borderColor={p.border} titleColor={p.charcoal} title="Documents & Sample Links" subtitle="Share direct links to your materials so they can be reviewed without file uploads.">
            <div className="space-y-6">
              <div>
                <label htmlFor="resumeLink" className={labelClass}>Resume link *</label>
                <input id="resumeLink" type="url" value={formData.resumeLink} onChange={(e) => setField('resumeLink', e.target.value)} className={inputClass} placeholder="Google Drive, Dropbox, OneDrive, etc." />
                <ErrorText errors={errors} name="resumeLink" />
              </div>
              <div>
                <label htmlFor="certificationsLink" className={labelClass}>Certifications / licenses link *</label>
                <input id="certificationsLink" type="url" value={formData.certificationsLink} onChange={(e) => setField('certificationsLink', e.target.value)} className={inputClass} placeholder="Google Drive, Dropbox, OneDrive, etc." />
                <ErrorText errors={errors} name="certificationsLink" />
              </div>
              <div>
                <label className={labelClass}>Work sample link *</label>
                <div className="mb-3 rounded-2xl border p-5 text-sm leading-6 form-hint">
                  <p className="font-medium">Submission guidelines:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Keep the sample concise and professional.</li>
                    <li>Do not include identifying or sensitive consumer information.</li>
                    <li>Use clear visibility of face, hands, and signing space.</li>
                    <li>Provide original source material links when relevant.</li>
                    <li>Submissions should reflect your own independent work.</li>
                  </ul>
                </div>
                <input id="workSampleLink" type="url" value={formData.workSampleLink} onChange={(e) => setField('workSampleLink', e.target.value)} className={inputClass} placeholder="Google Drive, YouTube unlisted, Dropbox, OneDrive, etc." />
                <ErrorText errors={errors} name="workSampleLink" />
              </div>
            </div>
          </SectionCard>
        )}

        {step === 6 && (
          <SectionCard step={6} totalSteps={totalSteps} borderColor={p.border} titleColor={p.charcoal} title="Work Preferences" subtitle="These answers help determine whether a future opportunity is operationally aligned before outreach happens.">
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Are you open to working as an independent contractor? *</label>
                <div className="space-y-3">
                  {['Yes', 'No', 'Maybe; I would like more information'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input type="radio" name="openToIndependentContractor" value={option} checked={formData.openToIndependentContractor === option} onChange={(e) => setField('openToIndependentContractor', e.target.value)} className="mt-1 h-4 w-4" style={{ accentColor: p.burgundy }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="openToIndependentContractor" />
              </div>
              <div>
                <label className={labelClass}>Do you currently carry professional liability insurance? *</label>
                <div className="space-y-3">
                  {['Yes', 'No', 'Planning to obtain'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input type="radio" name="professionalLiabilityInsurance" value={option} checked={formData.professionalLiabilityInsurance === option} onChange={(e) => setField('professionalLiabilityInsurance', e.target.value)} className="mt-1 h-4 w-4" style={{ accentColor: p.burgundy }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="professionalLiabilityInsurance" />
              </div>
              <div>
                <label className={labelClass}>Are you comfortable with standard industry rates based on experience and assignment type? *</label>
                <div className="space-y-3">
                  {['Yes', 'No', 'Would like to discuss'].map((option) => (
                    <label key={option} className="flex items-start gap-3 text-sm" style={{ color: p.charcoal }}>
                      <input type="radio" name="comfortableWithStandardIndustryRates" value={option} checked={formData.comfortableWithStandardIndustryRates === option} onChange={(e) => setField('comfortableWithStandardIndustryRates', e.target.value)} className="mt-1 h-4 w-4" style={{ accentColor: p.burgundy }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <ErrorText errors={errors} name="comfortableWithStandardIndustryRates" />
              </div>
            </div>
          </SectionCard>
        )}

        {step === 7 && (
          <SectionCard step={7} totalSteps={totalSteps} borderColor={p.border} titleColor={p.charcoal} title="Final Agreement & Review" subtitle="Give everything one last check before submitting your interpreter network application.">
            <div className="space-y-6 text-sm" style={{ color: p.charcoal }}>
              <div className="rounded-2xl border p-5 form-hint">
                <h3 className="mb-3 text-base font-bold">Quick Summary</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <p><span className="font-semibold">Name:</span> {formData.fullName || '—'}</p>
                  <p><span className="font-semibold">Email:</span> {formData.emailAddress || '—'}</p>
                  <p><span className="font-semibold">Location:</span> {formData.currentLocation || '—'}</p>
                  <p><span className="font-semibold">Assignment Type:</span> {formData.assignmentTypePreference || '—'}</p>
                  <p><span className="font-semibold">Credentials:</span> {formatJoined(formData.credentials, formData.otherCredential) || '—'}</p>
                  <p><span className="font-semibold">Areas of Experience:</span> {formData.areasOfExperience.join(', ') || '—'}</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {Object.entries({
                  'Preferred Contact': preferredContactJoined,
                  'Years Experience': formData.yearsExperience,
                  'Education / ITP': formData.educationITP,
                  Modalities: formatJoined(formData.primaryModalities, formData.otherModality),
                  'Situations Successfully Navigated': formatJoined(formData.situationsSuccessfullyNavigated, formData.situationOther),
                  'Challenging Situation': formData.challengingSituationDescription,
                  'Willing To Travel': formData.willingToTravel,
                  'Technical Readiness': formData.technicalReadinessConfirmed,
                  'Resume Link': formData.resumeLink,
                  'Certifications Link': formData.certificationsLink,
                  'Work Sample Link': formData.workSampleLink,
                  'Independent Contractor': formData.openToIndependentContractor,
                  Insurance: formData.professionalLiabilityInsurance,
                  Rates: formData.comfortableWithStandardIndustryRates,
                }).map(([label, value]) => (
                  <div key={label} className="rounded-2xl border p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: p.gold }}>{label}</p>
                    <p className="mt-2 break-words whitespace-pre-wrap leading-6">{value || '—'}</p>
                  </div>
                ))}
              </div>

              <div>
                <label className="flex items-start gap-3 text-sm font-medium" style={{ color: p.charcoal }}>
                  <input type="checkbox" checked={formData.certificationAgreement} onChange={(e) => setField('certificationAgreement', e.target.checked)} className="mt-1 h-4 w-4 rounded form-checkbox" style={{ accentColor: p.burgundy }} />
                  <span>I certify that the information provided is accurate and that I will represent my qualifications honestly. *</span>
                </label>
                <ErrorText errors={errors} name="certificationAgreement" />
              </div>
            </div>
          </SectionCard>
        )}

        <div className="sticky bottom-4 rounded-2xl border bg-white/95 p-4 shadow-lg backdrop-blur" style={{ borderColor: p.border }}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: p.gold }}>Progress</p>
              <p className="mt-1 text-sm font-medium" style={{ color: p.charcoal }}>Step {step} of {totalSteps}</p>
            </div>
            {submitError ? <p className="text-sm font-medium form-error">{submitError}</p> : null}
            <div className="flex flex-wrap gap-3">
              {step > 1 && (
                <button type="button" onClick={handleBack} className="btn btn-secondary" style={{ borderColor: p.border, color: p.charcoal }} disabled={isSubmitting}>
                  Back
                </button>
              )}
              {step < totalSteps ? (
                <button type="button" onClick={handleNext} className="btn btn-primary" disabled={isSubmitting}>
                  Continue
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
