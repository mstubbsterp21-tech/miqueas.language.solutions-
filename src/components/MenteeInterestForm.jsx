import { useMemo, useState } from "react";
import logo from "../logo.png";

const defaultPalette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#464747",
  white: "#ffffff",
  softGray: "#f5f5f5",
  border: "#d1c6bc",
};
const statusOptions = ["Interpreting student", "Recent ITP/IPP graduate", "Working interpreter", "Returning to the interpreting profession", "Other / Exploring interpreting"];
const credentialOptions = ["NIC (RID)", "CDI (RID)", "BEI", "EIPA", "None", "Other"];
const developmentOptions = [
  "ASL expressive and receptive skills",
  "English-to-ASL interpreting",
  "ASL-to-English interpreting",
  "Processing and message equivalence",
  "Ethical decision-making",
  "Certification preparation",
  "Professional confidence",
  "Business and career development",
  "Other",
];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const periods = ["Morning", "Afternoon", "Evening"];
const initialValues = {
  fullName: "", emailAddress: "", phoneNumber: "", locationTimeZone: "",
  interpreterStatus: "", educationExperience: "", certifications: [], otherCertification: "",
  developmentAreas: [], otherDevelopmentArea: "", mentorshipGoals: "",
  availability: {}, schedulingNotes: "", recordingConsent: false,
  youtubeObservationConsent: false, website: "",
};

function ErrorText({ error }) {
  return error ? <p role="alert" className="mt-1 text-sm font-medium form-error">{error}</p> : null;
}
function Field({ label, id, error, children }) {
  return <div>
    <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
    {children}
    <ErrorText error={error} />
  </div>;
}
function Panel({ number, title, children, palette }) {
  return <section className="min-w-0 max-w-full rounded-[2rem] border bg-white p-4 shadow-sm sm:p-6 md:p-8" style={{ borderColor: palette.border }}>
    <span className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: palette.gold }}>Section {number}</span>
    <h2 className="mt-2 mb-6 text-2xl font-bold" style={{ color: palette.charcoal }}>{title}</h2>
    <div className="min-w-0 space-y-6 break-words">{children}</div>
  </section>;
}
function consentError(values, errors) {
  return Boolean(!values.recordingConsent || !values.youtubeObservationConsent || Object.keys(errors).length);
}

export default function MenteeInterestForm({ palette = defaultPalette }) {
  const p = { ...defaultPalette, ...palette };
  const [page, setPage] = useState(1);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [complete, setComplete] = useState(false);
  const inputClass = "form-input w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2";
  const boxClass = "h-4 w-4 shrink-0 rounded form-checkbox";
  const consentVersion = "mentee-practicum-nov-2026-v1";

  const selectedSlots = useMemo(() => Object.values(values.availability).filter(Boolean).length, [values.availability]);
  const update = (name, value) => {
    setValues((before) => ({ ...before, [name]: value }));
    setErrors((before) => {
      if (!before[name]) return before;
      const next = { ...before };
      delete next[name];
      return next;
    });
  };
  const toggleCert = (choice) => {
    setValues((before) => {
      const selected = before.certifications.includes(choice);
      const certifications = selected
        ? before.certifications.filter((item) => item !== choice)
        : choice === "None"
          ? ["None"]
          : [...before.certifications.filter((item) => item !== "None"), choice];
      return { ...before, certifications, otherCertification: certifications.includes("Other") ? before.otherCertification : "" };
    });
    setErrors((before) => ({ ...before, certifications: undefined }));
  };
  const toggleDevelopment = (choice) => {
    setValues((before) => {
      const selected = before.developmentAreas.includes(choice);
      if (!selected && before.developmentAreas.length >= 3) return before;
      const developmentAreas = selected ? before.developmentAreas.filter((item) => item !== choice) : [...before.developmentAreas, choice];
      return { ...before, developmentAreas, otherDevelopmentArea: developmentAreas.includes("Other") ? before.otherDevelopmentArea : "" };
    });
    setErrors((before) => ({ ...before, developmentAreas: undefined }));
  };
  const toggleAvailability = (day, period) => {
    setValues((before) => ({ ...before, availability: { ...before.availability, [day + ":" + period]: !before.availability[day + ":" + period] } }));
    setErrors((before) => ({ ...before, availability: undefined }));
  };

  const validateFirstPage = () => {
    const next = {};
    if (!values.fullName.trim()) next.fullName = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.emailAddress.trim())) next.emailAddress = "Please enter a valid email address.";
    if (!values.locationTimeZone.trim()) next.locationTimeZone = "Please include your city, state, and time zone.";
    if (!values.interpreterStatus) next.interpreterStatus = "Please select your current status.";
    if (!values.educationExperience.trim()) next.educationExperience = "Please describe your education and experience.";
    if (!values.certifications.length) next.certifications = "Please select at least one option (including None, if applicable).";
    if (values.certifications.includes("Other") && !values.otherCertification.trim()) next.otherCertification = "Please specify the other credential.";
    if (!values.developmentAreas.length || values.developmentAreas.length > 3) next.developmentAreas = "Choose one to three development areas.";
    if (values.developmentAreas.includes("Other") && !values.otherDevelopmentArea.trim()) next.otherDevelopmentArea = "Please describe the other area.";
    if (!values.mentorshipGoals.trim()) next.mentorshipGoals = "Please share what you hope to gain.";
    if (!selectedSlots) next.availability = "Please select at least one available time.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (validateFirstPage()) {
      setPage(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const goBack = () => {
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!validateFirstPage()) { setPage(1); return; }
    if (!values.recordingConsent || !values.youtubeObservationConsent) {
      setErrors((before) => ({ ...before, consents: "Both acknowledgments are required for recorded practicum sessions." }));
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/operations-v2?action=submitMenteeInterest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, consentVersion }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status !== "success") throw new Error(result.message || "Your application could not be submitted. Please try again.");
      setComplete(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  if (complete) {
    return <section className="mx-auto max-w-4xl px-5 py-8 md:px-8">
      <div className="rounded-[2rem] border bg-white p-8 text-center shadow-sm" style={{ borderColor: p.border }}>
        <img src={logo} alt="Miqueas Language Solutions" className="mx-auto mb-6 h-20 object-contain" />
        <h1 className="text-3xl font-bold" style={{ color: p.charcoal }}>Interest Form Submitted</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7">
          Thank you for your interest in free, virtual interpreting mentorship through Miqueas Language Solutions.
          Your application and recording acknowledgments have been received. Submission does not guarantee placement.
        </p>
        <button type="button" className="btn btn-primary mt-7" onClick={() => { setValues(initialValues); setComplete(false); setPage(1); setErrors({}); }}>Submit Another Application</button>
      </div>
    </section>;
  }
  return <section className="mx-auto max-w-4xl px-5 py-6 md:px-8">
    <form onSubmit={submit} className="min-w-0 max-w-full space-y-6" noValidate>
      <header className="rounded-[2rem] border bg-white p-6 text-center shadow-sm md:p-8" style={{ borderColor: p.border }}>
        <img src={logo} alt="Miqueas Language Solutions" className="mx-auto h-20 max-w-full object-contain" />
        <p className="mx-auto mt-3 max-w-full px-1 text-center text-xs font-medium leading-relaxed whitespace-normal break-words" style={{ color: p.gold }}>Bridging Perspectives. Delivering Understanding.</p>
        <h1 className="mx-auto mt-6 max-w-full text-center text-2xl font-bold leading-tight whitespace-normal break-words sm:text-3xl md:text-4xl" style={{ color: p.charcoal }}>Mentorship Interest Form</h1>
        <div className="mt-6 flex items-center justify-between gap-4 text-left text-xs font-bold" style={{ color: p.charcoal }}>
          <span>Step {page} of 2</span><span>{page === 1 ? "Mentee Application" : "Recording & Consent"}</span>
        </div>
        <div role="progressbar" aria-label="Form progress" aria-valuenow={page} aria-valuemin={1} aria-valuemax={2} className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: p.softGray }}>
          <div className="h-full rounded-full transition-all" style={{ width: page === 1 ? "50%" : "100%", backgroundColor: p.burgundy }} />
        </div>
        <p className="mt-4 text-xs form-note">* Indicates required information</p>
      </header>

      {page === 1 ? <>
        <Panel number="01" title="About This Mentorship Opportunity" palette={p}>
          <p className="text-sm leading-7">Thank you for your interest in mentorship with Miqueas Language Solutions!</p>
          <p className="text-sm leading-7">I'm currently completing the <em>So You Want to Be an Interpreter Mentor</em> course. As part of the practicum, I'm offering <strong>free, live virtual mentorship sessions</strong> to individuals interested in developing their interpreting skills and growing professionally.</p>
          <p className="text-sm leading-7">Sessions offer opportunities for discussion, constructive feedback, skill development, and professional reflection. They take place live through video conferencing; in-person sessions are not available.</p>
          <aside className="rounded-2xl p-5 text-sm leading-7" style={{ backgroundColor: p.softGray }}>
            <strong>Important recording information:</strong> The practicum requires me to record four live mentorship sessions. Fellow practicum participants will watch the recordings and provide feedback on my development as a mentor. You'll review the complete recording and consent policy on the next page before submitting.
          </aside>
        </Panel>
        <Panel number="02" title="Personal Information" palette={p}>
          <Field id="fullName" label="1. Full Name *" error={errors.fullName}>
            <input id="fullName" maxLength={160} className={inputClass} value={values.fullName} onChange={(e) => update("fullName", e.target.value)} autoComplete="name" />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="emailAddress" label="2. Email Address *" error={errors.emailAddress}>
              <input id="emailAddress" maxLength={254} type="email" className={inputClass} value={values.emailAddress} onChange={(e) => update("emailAddress", e.target.value)} autoComplete="email" />
            </Field>
            <Field id="phoneNumber" label="3. Phone Number (Optional)" error={errors.phoneNumber}>
              <input id="phoneNumber" maxLength={60} type="tel" className={inputClass} value={values.phoneNumber} onChange={(e) => update("phoneNumber", e.target.value)} autoComplete="tel" />
            </Field>
          </div>
          <Field id="locationTimeZone" label="4. Where are you located? *" error={errors.locationTimeZone}>
            <input id="locationTimeZone" maxLength={160} className={inputClass} value={values.locationTimeZone} onChange={(e) => update("locationTimeZone", e.target.value)} placeholder="City, state, and time zone" />
          </Field>
        </Panel>
        <Panel number="03" title="Your Interpreting Journey" palette={p}>
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">5. Which best describes your current status? *</legend>
            <div className="space-y-3">{statusOptions.map((option) => <label key={option} className="flex items-start gap-3 text-sm">
              <input type="radio" name="interpreterStatus" value={option} checked={values.interpreterStatus === option} onChange={() => update("interpreterStatus", option)} className={boxClass} style={{ accentColor: p.burgundy }} /><span>{option}</span>
            </label>)}</div>
            <ErrorText error={errors.interpreterStatus} />
          </fieldset>
          <Field id="educationExperience" label="6. Briefly describe your interpreting education and experience. *" error={errors.educationExperience}>
            <p className="mb-2 text-xs form-note">Include relevant training, interpreter preparation programs, graduation dates, or professional experience.</p>
            <textarea id="educationExperience" maxLength={3000} rows={4} className={inputClass} value={values.educationExperience} onChange={(e) => update("educationExperience", e.target.value)} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">7. What interpreting certifications or assessment results do you currently hold? *</legend>
            <p className="mb-3 text-xs form-note">Check all that apply.</p>
            <div className="grid gap-3 md:grid-cols-2">{credentialOptions.map((option) => <label key={option} className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={values.certifications.includes(option)} onChange={() => toggleCert(option)} className={boxClass} style={{ accentColor: p.burgundy }} /><span>{option}</span>
            </label>)}</div>
            <ErrorText error={errors.certifications} />
            {values.certifications.includes("Other") && <Field id="otherCertification" label="Please specify your other credential(s) or assessment results. *" error={errors.otherCertification}>
              <input id="otherCertification" maxLength={350} className={inputClass + " mt-3"} value={values.otherCertification} onChange={(e) => update("otherCertification", e.target.value)} />
            </Field>}
          </fieldset>
        </Panel>
        <Panel number="04" title="Mentorship Goals" palette={p}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">8. Which areas of your interpreting skills or professional development would you most like to strengthen? *</legend>
            <p className="mb-3 text-xs form-note">Select up to three ({values.developmentAreas.length} of 3 selected).</p>
            <div className="grid gap-3 md:grid-cols-2">{developmentOptions.map((option) => <label key={option} className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={values.developmentAreas.includes(option)} disabled={values.developmentAreas.length >= 3 && !values.developmentAreas.includes(option)} onChange={() => toggleDevelopment(option)} className={boxClass} style={{ accentColor: p.burgundy }} /><span>{option}</span>
            </label>)}</div>
            <ErrorText error={errors.developmentAreas} />
            {values.developmentAreas.includes("Other") && <Field id="otherDevelopmentArea" label="Please specify. *" error={errors.otherDevelopmentArea}>
              <input id="otherDevelopmentArea" maxLength={350} className={inputClass + " mt-3"} value={values.otherDevelopmentArea} onChange={(e) => update("otherDevelopmentArea", e.target.value)} />
            </Field>}
          </fieldset>
          <Field id="mentorshipGoals" label="9. What are you hoping to gain from mentorship? *" error={errors.mentorshipGoals}>
            <p className="mb-2 text-xs form-note">Tell us what motivated you to seek mentorship and what you would like to accomplish.</p>
            <textarea id="mentorshipGoals" maxLength={3000} rows={4} className={inputClass} value={values.mentorshipGoals} onChange={(e) => update("mentorshipGoals", e.target.value)} />
          </Field>
        </Panel>
        <Panel number="05" title="Virtual Sessions & Availability" palette={p}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">10. What days and times are you generally available for live virtual mentorship sessions? *</legend>
            <p className="mb-3 text-xs form-note">Choose all that apply, using your local time zone from question 4.</p>
            <div className="grid gap-3 md:hidden">
              {days.map((day) => <fieldset key={day} className="min-w-0 rounded-xl border p-3" style={{ borderColor: p.border }}>
                <legend className="px-1 text-sm font-bold">{day}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {periods.map((period) => <label key={period} className="flex min-w-0 flex-col items-center gap-2 rounded-lg px-1 py-3 text-center text-xs" style={{ backgroundColor: p.softGray }}>
                    <span className="break-words">{period}</span>
                    <input type="checkbox" aria-label={day + " " + period} checked={!!values.availability[day + ":" + period]} onChange={() => toggleAvailability(day, period)} className={boxClass} style={{ accentColor: p.burgundy }} />
                  </label>)}
                </div>
              </fieldset>)}
            </div>
            <div className="hidden max-w-full overflow-x-auto rounded-xl border md:block" style={{ borderColor: p.border }}>
              <table className="w-full min-w-[650px] border-collapse text-center text-xs">
                <thead><tr style={{ backgroundColor: p.softGray }}><th className="p-3 text-left">Time</th>{days.map((day) => <th className="p-3" key={day}>{day.slice(0, 3)}</th>)}</tr></thead>
                <tbody>{periods.map((period) => <tr key={period} className="border-t" style={{ borderColor: p.border }}>
                  <th className="p-3 text-left">{period}</th>
                  {days.map((day) => <td className="p-3" key={day}>
                    <input type="checkbox" aria-label={day + " " + period} checked={!!values.availability[day + ":" + period]} onChange={() => toggleAvailability(day, period)} className={boxClass} style={{ accentColor: p.burgundy }} />
                  </td>)}
                </tr>)}</tbody>
              </table>
            </div>
            <p className="mt-2 text-xs form-note">{selectedSlots} time slots selected</p>
            <ErrorText error={errors.availability} />
          </fieldset>
          <Field id="schedulingNotes" label="Additional scheduling information (optional)" error={errors.schedulingNotes}>
            <textarea id="schedulingNotes" maxLength={1000} rows={2} className={inputClass} value={values.schedulingNotes} onChange={(e) => update("schedulingNotes", e.target.value)} placeholder="Any scheduling preferences or limitations..." />
          </Field>
        </Panel>
        <div className="flex min-w-0 justify-stretch sm:justify-end"><button type="button" className="btn btn-primary w-full max-w-full whitespace-normal break-words text-center sm:w-auto" onClick={goNext}>Next: Recording &amp; Consent</button></div>
      </> : <>
        <Panel number="06" title="Practicum Recording & Observation Consent" palette={p}>
          <div className="space-y-3 text-sm leading-7">
            <h3 className="text-lg font-bold">Why Sessions Are Recorded</h3>
            <p>As part of my participation in the <em>So You Want to Be an Interpreter Mentor</em> course, I'm completing a practicum that requires recordings of four live mentorship sessions.</p>
            <p>Fellow practicum participants will review the recordings and provide feedback on my mentoring techniques, communication, and approach to supporting mentees.</p>
            <p><strong>The main purpose of these observations is to provide feedback on my development as a mentor, not to formally evaluate your interpreting performance.</strong></p>
            <h3 className="pt-3 text-lg font-bold">How Recordings Will Be Shared</h3>
            <p>Our live virtual sessions will be recorded. Recordings may include your video, audio, signing, interpreting exercises, and feedback discussions.</p>
            <p>Recordings will be uploaded to YouTube as <strong>unlisted videos</strong>. I'll share the links with designated practicum participants so they can watch and provide feedback.</p>
            <p>Unlisted videos do not normally appear in YouTube searches or on the channel's public video listing. However, <strong>anyone with the link may be able to view or reshare the recording</strong>.</p>
            <p>The recordings aren't intended for public distribution, social media, marketing, or promotional use. Any such use would require separate permission.</p>
            <h3 className="pt-3 text-lg font-bold">How Long Recordings Will Be Kept</h3>
            <p>Recordings will be retained for practicum observation and feedback until <strong>June 2027</strong>. At that time, I'll remove the videos from YouTube and delete any copies under my control. Copies saved or shared independently by others may not be recoverable.</p>
            <h3 className="pt-3 text-lg font-bold">Participation & Recording Agreement</h3>
            <p>Because these mentorship sessions are part of my practicum, <strong>recording and sharing sessions with fellow practicum participants is a required part of this opportunity.</strong></p>
            <p>If you're not comfortable being recorded or having your sessions reviewed by others, I completely understand. This particular mentorship opportunity may not be the right fit, and I encourage you to explore other mentoring options.</p>
            <p>You're always free to stop participating in future sessions. However, recordings already made and shared may still be used for practicum feedback, subject to applicable requirements.</p>
          </div>
          <div className="space-y-5 border-t pt-6" style={{ borderColor: p.border }}>
            <h3 className="text-lg font-bold">Your Consent</h3>
            <p className="text-sm">Please read and acknowledge both statements below.</p>
            <label className="flex items-start gap-3 text-sm leading-7">
              <input className={boxClass + " mt-1"} type="checkbox" style={{ accentColor: p.burgundy }} checked={values.recordingConsent} onChange={(e) => update("recordingConsent", e.target.checked)} />
              <span><strong>Recording Consent *</strong><br />I understand that my participation in live virtual mentorship sessions will be recorded as part of the mentor's professional development practicum, and I voluntarily consent to being recorded.</span>
            </label>
            <label className="flex items-start gap-3 text-sm leading-7">
              <input className={boxClass + " mt-1"} type="checkbox" style={{ accentColor: p.burgundy }} checked={values.youtubeObservationConsent} onChange={(e) => update("youtubeObservationConsent", e.target.checked)} />
              <span><strong>YouTube Sharing &amp; Observation Consent *</strong><br />I understand that recordings containing my participation will be uploaded to YouTube as unlisted videos and shared with fellow practicum participants for observation and feedback. I understand that anyone who obtains an unlisted link may be able to view or share the recording, and I consent to this method of sharing.</span>
            </label>
            <ErrorText error={errors.consents} />
            <aside className="rounded-2xl p-4 text-sm leading-7" style={{ backgroundColor: p.softGray }}>
              Submitting this form expresses interest in free virtual mentorship through Miqueas Language Solutions. Submission does not guarantee placement.
            </aside>
          </div>
        </Panel>
        <div className="hidden" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => update("website", e.target.value)} /></div>
        {submitError && <p className="rounded-xl p-4 text-sm font-semibold form-error" role="alert">{submitError}</p>}
        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
          <button type="button" className="btn btn-secondary" onClick={goBack} disabled={submitting}>Back</button>
          <button type="submit" className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50" disabled={submitting || !values.recordingConsent || !values.youtubeObservationConsent}>
            {submitting ? "Submitting…" : "Submit Mentee Interest Form"}
          </button>
        </div>
      </>}
    </form>
  </section>;
}
