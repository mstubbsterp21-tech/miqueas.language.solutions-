import { useEffect, useMemo, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, AlertCircle, BadgeCheck, CheckCircle2, Download, FileText, RefreshCcw, Save, Trash2, UploadCloud } from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";
import { createPortalSupabaseClient, interpreterDocumentBucket } from "../lib/supabaseClient";
import { deriveRosterStatus, getDocumentsByType, getOverallProfileCompletion, getRequiredDocumentCompletion, normalizeRosterStatus, requiredDocumentTypes, rosterStatusLabel, rosterStatusOptions } from "../lib/profileCompletion";

const documentTypes = [
  ["resume", "Résumé", "Required before the profile is complete."],
  ["w9", "W-9", "Required before the profile is complete."],
  ["credential_proof", "Credential proof", "RID, BEI, EIPA, state license, or verification letter."],
  ["liability_insurance", "Liability insurance", "Professional liability certificate or proof of coverage."],
  ["ic_agreement", "IC Agreement", "Signed independent contractor agreement."],
  ["state_license", "State license", "Optional unless required by jurisdiction."],
  ["work_sample", "Work sample", "Optional screening or assignment-matching sample."],
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

const profileFields = [
  ["First name", "first_name"],
  ["Last name", "last_name"],
  ["Email", "email"],
  ["Phone", "phone"],
  ["City", "city"],
  ["State", "state"],
  ["Current location", "current_location"],
  ["Preferred contact method", "preferred_contact_method"],
  ["Credentials", "credentials", "textarea"],
  ["State license", "state_license"],
  ["State license details", "state_license_details"],
  ["Years experience", "years_experience"],
  ["Modalities", "modalities", "textarea"],
  ["Areas of experience", "areas_of_experience", "textarea"],
  ["Assignment preference", "assignment_type_preference"],
  ["Willing to travel", "willing_to_travel"],
  ["VRI readiness", "technical_readiness_confirmed"],
  ["Professional liability insurance", "professional_liability_insurance"],
  ["Travel radius", "travel_radius"],
  ["On-site rate", "onsite_rate"],
  ["VRI rate", "vri_rate"],
  ["Admin notes", "admin_notes", "textarea"],
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

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function getEditableProfile(interpreter = {}) {
  return [...profileFields, ...dayFields.map(([label, field]) => [label, field]), ["Roster status", "roster_status"]].reduce((profile, [, field]) => {
    profile[field] = field === "roster_status" ? normalizeRosterStatus(interpreter[field]) : interpreter[field] || "";
    return profile;
  }, {});
}

export default function AdminInterpreterProfile({ palette }) {
  const { interpreterId } = useParams();
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const uploadClient = useMemo(() => createPortalSupabaseClient(null), []);
  const [interpreter, setInterpreter] = useState(null);
  const [editProfile, setEditProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [documentFiles, setDocumentFiles] = useState({});
  const [documentBusy, setDocumentBusy] = useState("");
  const [openingDocumentId, setOpeningDocumentId] = useState("");

  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isAdmin = adminEmails.includes(primaryEmail);
  const isDarkMode = palette.white !== "#ffffff";
  const pageBackground = isDarkMode
    ? "radial-gradient(circle at 12% 18%, rgba(221,125,0,0.16), transparent 30%), radial-gradient(circle at 88% 12%, rgba(114,17,0,0.24), transparent 28%), linear-gradient(180deg, #15100e 0%, #211714 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)";
  const bodyText = isDarkMode ? "#d8c8bc" : "#5f6368";
  const mutedText = isDarkMode ? "#bfaea2" : "#666";
  const softPanel = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };

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

  async function adminFileRequest(mode, body = {}) {
    const token = await session?.getToken();
    const response = await fetch("/api/admin-assets", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ mode, ...body }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Admin file request failed.");
    return data;
  }

  async function loadInterpreter() {
    setLoading(true);
    setMessage("");
    try {
      const data = await portalRequest("adminRoster");
      const found = (data.interpreters || []).find((item) => item.id === interpreterId);
      if (!found) throw new Error("Interpreter profile not found.");
      const documents = found.interpreter_documents || [];
      const derivedStatus = deriveRosterStatus(found, documents);
      const hydrated = { ...found, roster_status: derivedStatus };
      setInterpreter(hydrated);
      setEditProfile(getEditableProfile(hydrated));
    } catch (error) {
      setMessage(`Could not load interpreter profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded || !user || !session || !isSupabaseConfigured || !isAdmin) return;
    loadInterpreter();
  }, [isAdmin, isLoaded, session, user, interpreterId]);

  if (!isSupabaseConfigured) return <PortalSetupNotice palette={palette} />;

  if (isLoaded && !isAdmin) {
    return (
      <section className="px-5 py-16 md:px-8 md:py-24" style={{ background: pageBackground }}>
        <div className="mx-auto max-w-3xl rounded-[2rem] border p-8 text-center shadow-lg" style={cardStyle}>
          <h1 className="text-3xl font-black" style={{ color: palette.charcoal }}>Admin access required</h1>
          <p className="mt-4 text-sm leading-7" style={{ color: bodyText }}>This profile page is only available to MLS admin accounts.</p>
          <div className="mt-7 flex justify-center gap-3"><PortalSignOutButton /></div>
        </div>
      </section>
    );
  }

  const documents = interpreter?.interpreter_documents || [];
  const documentsByType = getDocumentsByType(documents);
  const completion = getOverallProfileCompletion({ ...(interpreter || {}), ...editProfile }, documentsByType);
  const derivedStatus = deriveRosterStatus({ ...(interpreter || {}), ...editProfile }, documentsByType);
  const selectedStatus = normalizeRosterStatus(editProfile.roster_status || derivedStatus);
  const docsComplete = getRequiredDocumentCompletion(documentsByType);
  const isComplete = completion.isComplete;

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");

    const allAvailability = dayFields.map(([, key]) => editProfile[key]).join(", ");
    const draftProfile = {
      ...editProfile,
      availability_morning: allAvailability.includes("Morning"),
      availability_afternoon: allAvailability.includes("Afternoon"),
      availability_evening: allAvailability.includes("Evening"),
      availability_overnight: allAvailability.includes("Overnight"),
    };
    const statusToSave = deriveRosterStatus({ ...(interpreter || {}), ...draftProfile }, documentsByType);
    const profileForSave = { ...draftProfile, roster_status: statusToSave };

    try {
      const data = await portalRequest("adminUpdateInterpreterProfile", {
        method: "POST",
        body: { interpreterId, profile: profileForSave },
      });
      const nextInterpreter = { ...data.interpreter, roster_status: deriveRosterStatus(data.interpreter, data.interpreter?.interpreter_documents || documents) };
      setInterpreter(nextInterpreter);
      setEditProfile(getEditableProfile(nextInterpreter));
      setMessage(`Interpreter profile saved. Status is ${rosterStatusLabel(nextInterpreter.roster_status)}.`);
    } catch (error) {
      setMessage(`Could not save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditProfile((current) => ({ ...current, [field]: value }));
  };

  const updateRosterStatus = (value) => {
    setEditProfile((current) => ({ ...current, roster_status: value }));
  };

  const handleAvailabilityToggle = (field, block) => {
    setEditProfile((current) => ({ ...current, [field]: toggleValue(current[field], block) }));
  };

  const refreshInterpreterWithDocuments = (nextDocuments) => {
    setInterpreter((current) => {
      const nextStatus = deriveRosterStatus({ ...(current || {}), ...editProfile }, nextDocuments);
      setEditProfile((draft) => ({ ...draft, roster_status: nextStatus }));
      return { ...current, roster_status: nextStatus, interpreter_documents: nextDocuments };
    });
  };

  const updateDocument = (document) => {
    const currentDocuments = interpreter?.interpreter_documents || [];
    const nextDocuments = currentDocuments.some((item) => item.id === document.id)
      ? currentDocuments.map((item) => (item.id === document.id ? document : item))
      : [document, ...currentDocuments];
    refreshInterpreterWithDocuments(nextDocuments);
  };

  const openDocument = async (document) => {
    setOpeningDocumentId(document.id);
    setMessage("");
    try {
      const data = await adminFileRequest("open", { documentId: document.id });
      if (!data.url) throw new Error("Could not create file link.");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(`Could not open file: ${error.message}`);
    } finally {
      setOpeningDocumentId("");
    }
  };

  const removeDocument = async (document) => {
    if (!document?.id) return;
    const confirmed = window.confirm(`Delete ${document.file_name || "this document"}? This removes the file from the admin/interpreter portal.`);
    if (!confirmed) return;
    setDocumentBusy(document.document_type);
    setMessage("");
    try {
      const data = await adminFileRequest("drop", { documentId: document.id });
      const nextDocuments = documents.filter((item) => item.id !== data.documentId);
      refreshInterpreterWithDocuments(nextDocuments);
      setMessage("Document deleted. Status recalculated.");
    } catch (error) {
      setMessage(`Could not delete file: ${error.message}`);
    } finally {
      setDocumentBusy("");
    }
  };

  const uploadDocument = async (documentType) => {
    const file = documentFiles[documentType];
    if (!file) {
      setMessage("Choose a file before uploading.");
      return;
    }
    setDocumentBusy(documentType);
    setMessage("");
    try {
      const uploadData = await adminFileRequest("ticket", { interpreterId, documentType, fileName: file.name });
      const { error: uploadError } = await uploadClient.storage
        .from(interpreterDocumentBucket)
        .uploadToSignedUrl(uploadData.path, uploadData.token, file);
      if (uploadError) throw uploadError;
      const recordData = await adminFileRequest("save", { interpreterId, documentType, fileName: file.name, storagePath: uploadData.path });
      updateDocument(recordData.document);
      setDocumentFiles((current) => ({ ...current, [documentType]: null }));
      setMessage("Document uploaded. Status recalculated.");
    } catch (error) {
      setMessage(`Could not upload file: ${error.message}`);
    } finally {
      setDocumentBusy("");
    }
  };

  return (
    <div className="px-5 py-12 md:px-8 md:py-16" style={{ background: pageBackground }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/admin/interpreters" className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white }}>
            <ArrowLeft size={16} /> Back to roster
          </Link>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={loadInterpreter} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white }}>
              <RefreshCcw size={16} /> Refresh
            </button>
            <PortalSignOutButton />
          </div>
        </div>

        {message && <div className="mb-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.white, color: message.toLowerCase().includes("could not") ? palette.burgundy : palette.charcoal }}><AlertCircle size={18} style={{ color: palette.gold, flexShrink: 0 }} /> {message}</div>}

        {loading ? (
          <div className="rounded-[2rem] border p-8 text-center shadow-sm" style={cardStyle}>
            <RefreshCcw className="mx-auto animate-spin" style={{ color: palette.gold }} />
            <p className="mt-4 font-bold" style={{ color: palette.charcoal }}>Loading interpreter profile...</p>
          </div>
        ) : interpreter ? (
          <>
            <header className="mb-6 rounded-[2rem] border p-6 shadow-sm md:p-8" style={cardStyle}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Interpreter profile</p>
                  <h1 className="mt-2 text-3xl font-black md:text-5xl" style={{ color: palette.charcoal }}>{interpreter.first_name} {interpreter.last_name}</h1>
                  <p className="mt-3 text-sm leading-7" style={{ color: bodyText }}>{interpreter.email}</p>
                </div>
                <div className="rounded-2xl border px-4 py-3 text-sm font-black" style={{ borderColor: derivedStatus === "active" ? palette.gold : palette.burgundy, backgroundColor: derivedStatus === "active" ? "rgba(221,125,0,0.12)" : "rgba(114,17,0,0.08)", color: palette.burgundy }}>
                  {rosterStatusLabel(derivedStatus)}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <StatCard label="Completion" value={`${completion.percent}%`} helper={`${completion.completed}/${completion.total} complete`} palette={palette} mutedText={mutedText} />
                <StatCard label="Profile setup" value={`${completion.setup.percent}%`} helper={`${completion.setup.completed}/${completion.setup.total} fields`} palette={palette} mutedText={mutedText} />
                <StatCard label="Required files" value={`${docsComplete.completed}/${docsComplete.total}`} helper={`${docsComplete.percent}% uploaded`} palette={palette} mutedText={mutedText} />
                <StatCard label="Roster status" value={rosterStatusLabel(derivedStatus)} helper="Auto-enforced on save" palette={palette} mutedText={mutedText} />
              </div>
            </header>

            <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
              <section className="rounded-[2rem] border p-6 shadow-sm md:p-8" style={cardStyle}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Edit profile</p>
                    <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>Assignment matching details</h2>
                    <p className="mt-2 text-sm leading-6" style={{ color: bodyText }}>The status toggle is available, but status is auto-enforced: missing required documents means Pending Documentation; complete documents plus complete setup can become Active.</p>
                  </div>
                  <button type="button" disabled={saving} onClick={saveProfile} className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: palette.gold }}>
                    <Save size={16} /> {saving ? "Saving..." : "Save profile"}
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
                  <div className="mb-3 text-sm font-black" style={{ color: palette.charcoal }}>Roster status</div>
                  <div className="flex flex-wrap gap-2">
                    {rosterStatusOptions.map(([value, label]) => {
                      const active = selectedStatus === value;
                      const blocked = value === "active" && !completion.isComplete;
                      return (
                        <button key={value} type="button" disabled={blocked} onClick={() => updateRosterStatus(value)} className="rounded-full border px-4 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: active ? palette.gold : palette.border, backgroundColor: active ? "rgba(221,125,0,0.12)" : palette.white, color: active ? palette.burgundy : palette.charcoal }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs leading-5" style={{ color: mutedText }}>
                    Current effective status: <strong>{rosterStatusLabel(derivedStatus)}</strong>. Active unlocks only when all setup fields and all required uploads are complete. Missing required documents forces Pending Documentation.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {profileFields.map(([label, field, type]) => (
                    <ProfileField key={field} label={label} value={editProfile[field] || ""} type={type} onChange={(value) => updateField(field, value)} palette={palette} />
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border p-5" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Scheduling</p>
                    <h3 className="mt-2 text-xl font-black" style={{ color: palette.charcoal }}>Weekly availability</h3>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: palette.border }}>
                    <div className="min-w-[760px] divide-y" style={{ borderColor: palette.border }}>
                      {dayFields.map(([day, key]) => (
                        <div key={key} className="grid grid-cols-[120px_1fr] items-center gap-4 p-3" style={{ backgroundColor: softPanel, borderColor: palette.border }}>
                          <div className="text-sm font-black" style={{ color: palette.charcoal }}>{day}</div>
                          <div className="flex flex-nowrap gap-2">
                            {availabilityBlocks.map((block) => {
                              const active = hasValue(editProfile[key], block);
                              return (
                                <button key={block} type="button" onClick={() => handleAvailabilityToggle(key, block)} className="min-w-[112px] rounded-full border px-3 py-2 text-center text-[11px] font-bold leading-tight transition" style={{ borderColor: active ? palette.gold : palette.border, backgroundColor: active ? "rgba(221,125,0,0.12)" : palette.white, color: active ? palette.burgundy : palette.charcoal }}>
                                  {block.replace(" (", "\n(").split("\n").map((part) => <span key={part} className="block">{part}</span>)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <section className="rounded-[2rem] border p-6 shadow-sm md:p-8" style={cardStyle}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Required checklist</p>
                  <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>Profile completion</h2>
                  <p className="mt-2 text-sm leading-7" style={{ color: bodyText }}>Completion is calculated from {completion.setup.total} setup fields and {docsComplete.total} required uploads.</p>
                  <div className="mt-5 grid gap-2">
                    {requiredDocumentTypes.map((documentType) => {
                      const documentMeta = documentTypes.find(([value]) => value === documentType);
                      const existing = documentsByType[documentType];
                      return (
                        <div key={documentType} className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
                          <span className="font-bold" style={{ color: palette.charcoal }}>{documentMeta?.[1] || documentType}</span>
                          <span className="inline-flex items-center gap-1 text-xs font-black" style={{ color: existing ? palette.gold : palette.burgundy }}>{existing ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {existing ? "Uploaded" : "Missing"}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[2rem] border p-6 shadow-sm md:p-8" style={cardStyle}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Documents</p>
                  <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>Uploaded files</h2>
                  <p className="mt-2 text-sm leading-7" style={{ color: bodyText }}>View what the interpreter uploaded, download files, upload/replace a file, or delete an uploaded file as admin.</p>

                  <div className="mt-6 space-y-4">
                    {documentTypes.map(([documentType, label, description]) => {
                      const document = documentsByType[documentType];
                      const required = requiredDocumentTypes.includes(documentType);
                      return (
                        <div key={documentType} className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
                          <div className="flex items-start gap-3">
                            {document ? <BadgeCheck size={18} style={{ color: palette.gold, flexShrink: 0 }} /> : <FileText size={18} style={{ color: palette.burgundy, flexShrink: 0 }} />}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-black" style={{ color: palette.charcoal }}>{label}</div>
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em]" style={{ backgroundColor: palette.white, color: required ? palette.burgundy : mutedText }}>{required ? "Required" : "Optional"}</span>
                              </div>
                              <div className="mt-1 break-words text-xs leading-5" style={{ color: mutedText }}>{document?.file_name || description || "No file uploaded"}</div>
                              {document?.uploaded_at && <div className="mt-1 text-[11px]" style={{ color: mutedText }}>Uploaded {formatDate(document.uploaded_at)}</div>}
                            </div>
                          </div>

                          <input type="file" onChange={(event) => setDocumentFiles((current) => ({ ...current, [documentType]: event.target.files?.[0] || null }))} className="mt-3 w-full rounded-xl border px-3 py-2 text-xs" style={{ borderColor: palette.border, backgroundColor: palette.white, color: palette.charcoal }} />

                          <div className="mt-3 flex flex-wrap gap-2">
                            {document && (
                              <button type="button" disabled={openingDocumentId === document.id} onClick={() => openDocument(document)} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold disabled:opacity-60" style={{ borderColor: palette.border, color: palette.charcoal }}>
                                <Download size={13} /> {openingDocumentId === document.id ? "Opening..." : "Download"}
                              </button>
                            )}
                            <button type="button" disabled={documentBusy === documentType} onClick={() => uploadDocument(documentType)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-white disabled:opacity-60" style={{ backgroundColor: document ? palette.gold : palette.burgundy }}>
                              <UploadCloud size={13} /> {documentBusy === documentType ? "Uploading..." : document ? "Replace" : "Upload"}
                            </button>
                            {document && (
                              <button type="button" disabled={documentBusy === documentType} onClick={() => removeDocument(document)} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold disabled:opacity-60" style={{ borderColor: palette.border, color: palette.burgundy }}>
                                <Trash2 size={13} /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value, helper, palette, mutedText }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
      <div className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: mutedText }}>{label}</div>
      <div className="mt-2 text-2xl font-black capitalize" style={{ color: palette.charcoal }}>{value}</div>
      {helper && <div className="mt-1 text-xs" style={{ color: mutedText }}>{helper}</div>}
    </div>
  );
}

function ProfileField({ label, value, onChange, type, palette }) {
  const isDarkMode = palette.white !== "#ffffff";
  const span = ["credentials", "modalities", "areas of experience", "admin notes"].some((field) => label.toLowerCase().includes(field));
  return (
    <label className={`block text-sm font-bold ${type === "textarea" || span ? "md:col-span-2" : ""}`} style={{ color: palette.charcoal }}>
      {label}
      {type === "textarea" ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: isDarkMode ? "#251a16" : "#ffffff" }} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: isDarkMode ? "#251a16" : "#ffffff" }} />
      )}
    </label>
  );
}
