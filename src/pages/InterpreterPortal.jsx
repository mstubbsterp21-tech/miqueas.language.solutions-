import { useEffect, useMemo, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { AlertCircle, CheckCircle2, FileText, RefreshCcw, Save, Trash2, UploadCloud } from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";
import { createPortalSupabaseClient, interpreterDocumentBucket } from "../lib/supabaseClient";

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

const situationOptions = [
  "Language deprivation or minimal language",
  "Atypical or non-standard ASL users",
  "Fast-paced or information-dense communication",
  "Emotionally charged situations",
  "Medical or informed-consent settings",
  "Legal or quasi-legal settings",
  "Power dynamics such as doctor/patient or employer/employee",
  "Team interpreting settings",
  "VRI with technical challenges",
  "Other",
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

const documentTypes = [
  { value: "resume", label: "Résumé", required: true, description: "Current interpreting résumé or professional CV." },
  { value: "w9", label: "W-9", required: true, description: "Needed before paid subcontractor work is assigned." },
  { value: "credential_proof", label: "Credential proof", required: true, description: "RID, BEI, EIPA, state license, or verification letter." },
  { value: "liability_insurance", label: "Liability insurance", required: true, description: "Professional liability policy certificate or proof of coverage." },
  { value: "state_license", label: "State license", required: false, description: "Upload if you hold a license in a state that requires one." },
  { value: "work_sample", label: "Work sample", required: false, description: "Optional sample for screening or assignment matching." },
];

const defaultProfile = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  current_location: "",
  preferred_contact_method: "",
  credentials: "",
  state_license: "",
  state_license_details: "",
  years_experience: "",
  education_itp: "",
  modalities: "",
  areas_of_experience: "",
  situations_successfully_navigated: "",
  challenging_situation_description: "",
  assignment_type_preference: "",
  willing_to_travel: "",
  technical_readiness_confirmed: "",
  professional_liability_insurance: "",
  comfortable_with_rates: "",
  onsite_rate: "",
  vri_rate: "",
  travel_radius: "",
  availability_sunday: "",
  availability_monday: "",
  availability_tuesday: "",
  availability_wednesday: "",
  availability_thursday: "",
  availability_friday: "",
  availability_saturday: "",
  availability_morning: false,
  availability_afternoon: false,
  availability_evening: false,
  availability_overnight: false,
};

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

function statusPill(status) {
  return (status || "pending").replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function InterpreterPortal({ palette }) {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [profile, setProfile] = useState(defaultProfile);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documentFiles, setDocumentFiles] = useState({});
  const [documentBusy, setDocumentBusy] = useState("");
  const [message, setMessage] = useState("");

  const uploadSupabase = useMemo(() => createPortalSupabaseClient(null), []);
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isAdmin = adminEmails.includes(primaryEmail);
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };

  const documentsByType = useMemo(() => {
    return documentTypes.reduce((acc, type) => {
      acc[type.value] = documents.find((document) => document.document_type === type.value) || null;
      return acc;
    }, {});
  }, [documents]);

  const requiredDocs = documentTypes.filter((document) => document.required);
  const completedRequiredDocs = requiredDocs.filter((document) => documentsByType[document.value]).length;
  const completionItems = [
    profile.phone,
    profile.city || profile.current_location,
    profile.credentials,
    profile.modalities,
    profile.areas_of_experience,
    profile.assignment_type_preference,
    completedRequiredDocs === requiredDocs.length ? "docs" : "",
  ];
  const completionPercent = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);

  async function portalRequest(action, options = {}) {
    const token = await session?.getToken();
    const response = await fetch(`/api/portal?action=${action}`, {
      method: options.method || "GET",
      headers: {
        authorization: `Bearer ${token}`,
        ...(options.body ? { "content-type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Portal request failed.");
    return data;
  }

  useEffect(() => {
    if (!isLoaded || !user || !session || !isSupabaseConfigured) return;
    let cancelled = false;

    async function loadPortal() {
      try {
        setLoading(true);
        setMessage("");
        const data = await portalRequest("load");
        if (cancelled) return;
        setProfile({ ...defaultProfile, ...(data.profile || {}) });
        setDocuments(data.documents || []);
      } catch (error) {
        if (!cancelled) setMessage(`Could not load your profile: ${error.message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPortal();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, primaryEmail, session, user]);

  if (!isSupabaseConfigured) return <PortalSetupNotice palette={palette} />;

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setProfile((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleToggle = (name, option) => {
    setProfile((current) => ({ ...current, [name]: toggleValue(current[name], option) }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const allAvailability = dayFields.map(([, key]) => profile[key]).join(", ");
    const profileForSave = {
      ...profile,
      availability_morning: allAvailability.includes("Morning"),
      availability_afternoon: allAvailability.includes("Afternoon"),
      availability_evening: allAvailability.includes("Evening"),
      availability_overnight: allAvailability.includes("Overnight"),
    };

    try {
      const data = await portalRequest("saveProfile", { method: "POST", body: { profile: profileForSave } });
      setProfile({ ...defaultProfile, ...(data.profile || {}) });
      setMessage("Profile saved. MLS can use these details for assignment matching.");
    } catch (error) {
      setMessage(`Profile could not be saved: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (documentType, existingDocumentId = null) => {
    const file = documentFiles[documentType];
    if (!profile.id) {
      setMessage("Save your profile before uploading documents.");
      return;
    }
    if (!file) {
      setMessage("Choose a file before uploading.");
      return;
    }

    setDocumentBusy(documentType);
    setMessage("");

    try {
      const uploadData = await portalRequest("createUploadUrl", {
        method: "POST",
        body: { documentType, fileName: file.name },
      });

      const { error: uploadError } = await uploadSupabase.storage
        .from(interpreterDocumentBucket)
        .uploadToSignedUrl(uploadData.path, uploadData.token, file);

      if (uploadError) throw uploadError;

      const recordData = await portalRequest("recordUpload", {
        method: "POST",
        body: {
          documentType,
          fileName: file.name,
          storagePath: uploadData.path,
          replaceDocumentId: existingDocumentId,
        },
      });

      setDocuments((current) => {
        if (existingDocumentId) return current.map((document) => (document.id === existingDocumentId ? recordData.document : document));
        return [recordData.document, ...current];
      });
      setDocumentFiles((current) => ({ ...current, [documentType]: null }));
      setMessage(existingDocumentId ? "Document replaced." : "Document uploaded.");
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setDocumentBusy("");
    }
  };

  const deleteDocument = async (document) => {
    if (!document?.id) return;
    const confirmed = window.confirm(`Delete ${document.file_name}? This removes the portal record and file from storage.`);
    if (!confirmed) return;

    setDocumentBusy(document.document_type);
    setMessage("");
    try {
      await portalRequest("deleteDocument", { method: "POST", body: { documentId: document.id } });
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setMessage("Document deleted.");
    } catch (error) {
      setMessage(`Delete failed: ${error.message}`);
    } finally {
      setDocumentBusy("");
    }
  };

  if (loading) {
    return (
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] border bg-white p-8 text-center shadow-sm" style={cardStyle}>
          <RefreshCcw className="mx-auto animate-spin" style={{ color: palette.gold }} />
          <p className="mt-4 font-bold" style={{ color: palette.charcoal }}>Loading your portal...</p>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-[#f7f3ef] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={{ borderColor: palette.border }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Interpreter portal</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>
                Welcome, {profile.first_name || user.firstName || "Interpreter"}.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f6368]">
                Keep your matching profile and onboarding documents current. MLS uses this information to identify appropriate assignments, credentials, modality fit, availability, and logistics.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && <a href="/admin/interpreters" className="rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: palette.burgundy }}>Admin roster</a>}
              <PortalSignOutButton />
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <StatusCard label="Profile readiness" value={`${completionPercent}%`} helper="Based on matching details and required docs" palette={palette} />
            <StatusCard label="Required documents" value={`${completedRequiredDocs}/${requiredDocs.length}`} helper="Résumé, W-9, credential proof, insurance" palette={palette} />
            <StatusCard label="Roster status" value={statusPill(profile.roster_status)} helper="MLS admin controls roster approval" palette={palette} />
          </div>
        </header>

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border bg-white p-4 text-sm font-semibold shadow-sm" style={{ borderColor: palette.border, color: message.toLowerCase().includes("failed") || message.toLowerCase().includes("could not") ? palette.burgundy : palette.charcoal }}>
            <AlertCircle size={18} style={{ color: palette.gold, flexShrink: 0 }} />
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={saveProfile} className="space-y-6">
            <PortalSection title="Contact & logistics" eyebrow="Assignment matching" palette={palette}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="First name" name="first_name" value={profile.first_name} onChange={handleChange} />
                <Field label="Last name" name="last_name" value={profile.last_name} onChange={handleChange} />
                <Field label="Email" name="email" value={primaryEmail} disabled />
                <Field label="Phone" name="phone" value={profile.phone || ""} onChange={handleChange} />
                <Field label="City" name="city" value={profile.city || ""} onChange={handleChange} />
                <Field label="State" name="state" value={profile.state || ""} onChange={handleChange} />
                <Field label="Current location summary" name="current_location" value={profile.current_location || ""} onChange={handleChange} placeholder="City, State, USA" span />
                <SelectField label="Preferred contact method" name="preferred_contact_method" value={profile.preferred_contact_method || ""} onChange={handleChange} options={["Email", "Phone", "Text"]} />
                <SelectField label="Willing to travel?" name="willing_to_travel" value={profile.willing_to_travel || ""} onChange={handleChange} options={["Yes", "No", "Depends on assignment"]} />
                <Field label="Travel radius" name="travel_radius" value={profile.travel_radius || ""} onChange={handleChange} placeholder="Example: 30 miles, statewide, negotiable" span />
              </div>
            </PortalSection>

            <PortalSection title="Credentials & qualifications" eyebrow="Qualification fit" palette={palette}>
              <CheckboxPills label="Credentials" name="credentials" options={credentialOptions} value={profile.credentials} onToggle={handleToggle} palette={palette} />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <SelectField label="Years of experience" name="years_experience" value={profile.years_experience || ""} onChange={handleChange} options={["Less than 1 year", "1-3 years", "4-6 years", "7-10 years", "10+ years"]} />
                <SelectField label="State license?" name="state_license" value={profile.state_license || ""} onChange={handleChange} options={["Yes", "No", "In progress", "Not applicable"]} />
                <Field label="State license details" name="state_license_details" value={profile.state_license_details || ""} onChange={handleChange} span />
                <TextArea label="Education / Interpreter Training Program" name="education_itp" value={profile.education_itp || ""} onChange={handleChange} span />
              </div>
            </PortalSection>

            <PortalSection title="Skills & assignment fit" eyebrow="Matching preferences" palette={palette}>
              <CheckboxPills label="Modalities" name="modalities" options={modalityOptions} value={profile.modalities} onToggle={handleToggle} palette={palette} />
              <div className="mt-6"><CheckboxPills label="Areas of experience" name="areas_of_experience" options={experienceOptions} value={profile.areas_of_experience} onToggle={handleToggle} palette={palette} /></div>
              <div className="mt-6"><CheckboxPills label="Situations successfully navigated" name="situations_successfully_navigated" options={situationOptions} value={profile.situations_successfully_navigated} onToggle={handleToggle} palette={palette} /></div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <SelectField label="Assignment type preference" name="assignment_type_preference" value={profile.assignment_type_preference || ""} onChange={handleChange} options={["On-site only", "VRI only", "Both", "Depends on setting"]} />
                <SelectField label="Technical readiness for VRI" name="technical_readiness_confirmed" value={profile.technical_readiness_confirmed || ""} onChange={handleChange} options={["Yes", "No", "Needs discussion"]} />
                <TextArea label="Notes on challenging situations handled" name="challenging_situation_description" value={profile.challenging_situation_description || ""} onChange={handleChange} span />
              </div>
            </PortalSection>

            <PortalSection title="Weekly availability" eyebrow="Scheduling" palette={palette}>
              <div className="space-y-4">
                {dayFields.map(([day, key]) => (
                  <div key={key} className="rounded-2xl border bg-black/[0.02] p-4" style={{ borderColor: palette.border }}>
                    <div className="mb-3 text-sm font-black" style={{ color: palette.charcoal }}>{day}</div>
                    <div className="flex flex-wrap gap-2">
                      {availabilityBlocks.map((block) => {
                        const active = hasValue(profile[key], block);
                        return (
                          <button key={block} type="button" onClick={() => handleToggle(key, block)} className="rounded-full border px-3 py-2 text-xs font-bold transition" style={{ borderColor: active ? palette.gold : palette.border, backgroundColor: active ? "rgba(221,125,0,0.12)" : palette.white, color: active ? palette.burgundy : palette.charcoal }}>
                            {block}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </PortalSection>

            <PortalSection title="Rates & subcontractor readiness" eyebrow="Business details" palette={palette}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="On-site rate" name="onsite_rate" value={profile.onsite_rate || ""} onChange={handleChange} placeholder="Example: $65/hr, 2-hour minimum" />
                <Field label="VRI rate" name="vri_rate" value={profile.vri_rate || ""} onChange={handleChange} placeholder="Example: $55/hr, 1-hour minimum" />
                <SelectField label="Professional liability insurance" name="professional_liability_insurance" value={profile.professional_liability_insurance || ""} onChange={handleChange} options={["Yes", "No", "In progress"]} />
                <SelectField label="Comfortable discussing MLS assignment rates?" name="comfortable_with_rates" value={profile.comfortable_with_rates || ""} onChange={handleChange} options={["Yes", "No", "Would like to discuss"]} />
              </div>
              <button type="submit" disabled={saving} className="mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60" style={{ backgroundColor: palette.gold }}>
                <Save size={17} /> {saving ? "Saving..." : "Save matching profile"}
              </button>
            </PortalSection>
          </form>

          <aside className="space-y-6">
            <PortalSection title="Document center" eyebrow="Private onboarding files" palette={palette}>
              <p className="mb-5 text-sm leading-7 text-[#5f6368]">Upload, replace, or delete onboarding files. Do not upload assignment-specific, consumer-specific, medical, legal, or educational records.</p>
              <div className="space-y-4">
                {documentTypes.map((type) => {
                  const existing = documentsByType[type.value];
                  const busy = documentBusy === type.value;
                  return (
                    <article key={type.value} className="rounded-2xl border p-4" style={{ borderColor: palette.border }}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            {existing ? <CheckCircle2 size={17} style={{ color: palette.gold }} /> : <FileText size={17} style={{ color: palette.burgundy }} />}
                            <h3 className="font-black" style={{ color: palette.charcoal }}>{type.label}</h3>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-[#666]">{type.description}</p>
                          <span className="mt-2 inline-flex rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#666]">{type.required ? "Required" : "Optional"}</span>
                        </div>
                      </div>

                      {existing && (
                        <div className="mt-4 rounded-xl bg-black/[0.03] p-3 text-xs text-[#666]">
                          <div className="font-bold" style={{ color: palette.charcoal }}>{existing.file_name}</div>
                          <div className="mt-1">Uploaded {formatDate(existing.uploaded_at)} · {existing.status}</div>
                        </div>
                      )}

                      <div className="mt-4 space-y-3">
                        <input type="file" onChange={(event) => setDocumentFiles((current) => ({ ...current, [type.value]: event.target.files?.[0] || null }))} className="w-full rounded-2xl border bg-white px-4 py-3 text-xs" style={{ borderColor: palette.border }} />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={busy} onClick={() => uploadDocument(type.value, existing?.id || null)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white disabled:opacity-60" style={{ backgroundColor: existing ? palette.gold : palette.burgundy }}>
                            <UploadCloud size={14} /> {busy ? "Working..." : existing ? "Replace" : "Upload"}
                          </button>
                          {existing && (
                            <button type="button" disabled={busy} onClick={() => deleteDocument(existing)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-60" style={{ borderColor: palette.border, color: palette.burgundy }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </PortalSection>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, helper, palette }) {
  return (
    <div className="rounded-2xl border bg-black/[0.02] p-4" style={{ borderColor: palette.border }}>
      <div className="text-xs font-black uppercase tracking-[0.14em] text-[#666]">{label}</div>
      <div className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>{value}</div>
      <div className="mt-1 text-xs text-[#666]">{helper}</div>
    </div>
  );
}

function PortalSection({ eyebrow, title, children, palette }) {
  return (
    <section className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={{ borderColor: palette.border }}>
      <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, name, value, onChange, disabled = false, placeholder = "", span = false }) {
  return (
    <label className={`block text-sm font-bold text-[#464747] ${span ? "md:col-span-2" : ""}`}>
      {label}
      <input name={name} value={value || ""} onChange={onChange} disabled={disabled} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-[#d1c6bc] bg-white px-4 py-3 text-sm font-medium text-[#464747] outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10 disabled:bg-black/[0.03]" />
    </label>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="block text-sm font-bold text-[#464747]">
      {label}
      <select name={name} value={value || ""} onChange={onChange} className="mt-2 w-full rounded-2xl border border-[#d1c6bc] bg-white px-4 py-3 text-sm font-medium text-[#464747] outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10">
        <option value="">Choose</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, name, value, onChange, span = false }) {
  return (
    <label className={`block text-sm font-bold text-[#464747] ${span ? "md:col-span-2" : ""}`}>
      {label}
      <textarea name={name} value={value || ""} onChange={onChange} rows={4} className="mt-2 w-full rounded-2xl border border-[#d1c6bc] bg-white px-4 py-3 text-sm font-medium text-[#464747] outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10" />
    </label>
  );
}

function CheckboxPills({ label, name, options, value, onToggle, palette }) {
  return (
    <div>
      <div className="mb-3 text-sm font-black" style={{ color: palette.charcoal }}>{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = hasValue(value, option);
          return (
            <button key={option} type="button" onClick={() => onToggle(name, option)} className="rounded-full border px-3 py-2 text-xs font-bold transition" style={{ borderColor: active ? palette.gold : palette.border, backgroundColor: active ? "rgba(221,125,0,0.12)" : palette.white, color: active ? palette.burgundy : palette.charcoal }}>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
