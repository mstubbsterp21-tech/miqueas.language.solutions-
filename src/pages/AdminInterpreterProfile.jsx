import { useEffect, useMemo, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Download, FileText, RefreshCcw, Save, UploadCloud } from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";
import { createPortalSupabaseClient, interpreterDocumentBucket } from "../lib/supabaseClient";

const documentTypes = [
  ["resume", "Résumé"],
  ["w9", "W-9"],
  ["credential_proof", "Credential proof"],
  ["liability_insurance", "Liability insurance"],
  ["ic_agreement", "IC Agreement"],
  ["state_license", "State license"],
  ["work_sample", "Work sample"],
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
  ["Roster status", "roster_status"],
  ["Admin notes", "admin_notes", "textarea"],
];

function statusLabel(value) {
  return (value || "pending_profile").replaceAll("_", " ");
}

function getEditableProfile(interpreter = {}) {
  return [...profileFields, ...dayFields.map(([label, field]) => [label, field])].reduce((profile, [, field]) => {
    profile[field] = interpreter[field] || "";
    return profile;
  }, {});
}

function readiness(interpreter = {}) {
  const required = [
    interpreter.phone,
    interpreter.city || interpreter.current_location,
    interpreter.credentials,
    interpreter.modalities,
    interpreter.areas_of_experience,
    interpreter.assignment_type_preference,
    dayFields.some(([, field]) => Boolean(interpreter[field])),
  ];
  return Math.round((required.filter(Boolean).length / required.length) * 100);
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

  async function loadInterpreter() {
    setLoading(true);
    setMessage("");
    try {
      const data = await portalRequest("adminRoster");
      const found = (data.interpreters || []).find((item) => item.id === interpreterId);
      if (!found) throw new Error("Interpreter profile not found.");
      setInterpreter(found);
      setEditProfile(getEditableProfile(found));
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

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      const data = await portalRequest("adminUpdateInterpreterProfile", {
        method: "POST",
        body: { interpreterId, profile: editProfile },
      });
      setInterpreter(data.interpreter);
      setEditProfile(getEditableProfile(data.interpreter));
      setMessage("Interpreter profile saved.");
    } catch (error) {
      setMessage(`Could not save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditProfile((current) => ({ ...current, [field]: value }));
  };

  const updateDocument = (document) => {
    setInterpreter((current) => {
      const docs = current?.interpreter_documents || [];
      const nextDocs = docs.some((item) => item.id === document.id)
        ? docs.map((item) => (item.id === document.id ? document : item))
        : [document, ...docs];
      return { ...current, interpreter_documents: nextDocs };
    });
  };

  const openDocument = async (document) => {
    setOpeningDocumentId(document.id);
    setMessage("");
    try {
      const data = await portalRequest("adminCreateDocumentLink", { method: "POST", body: { documentId: document.id } });
      if (!data.url) throw new Error("Could not create file link.");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(`Could not open file: ${error.message}`);
    } finally {
      setOpeningDocumentId("");
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
      const uploadData = await portalRequest("adminCreateDocumentUploadUrl", {
        method: "POST",
        body: { interpreterId, documentType, fileName: file.name },
      });
      const { error: uploadError } = await uploadClient.storage
        .from(interpreterDocumentBucket)
        .uploadToSignedUrl(uploadData.path, uploadData.token, file);
      if (uploadError) throw uploadError;
      const recordData = await portalRequest("adminRecordDocumentUpload", {
        method: "POST",
        body: { interpreterId, documentType, fileName: file.name, storagePath: uploadData.path },
      });
      updateDocument(recordData.document);
      setDocumentFiles((current) => ({ ...current, [documentType]: null }));
      setMessage("Document uploaded.");
    } catch (error) {
      setMessage(`Could not upload file: ${error.message}`);
    } finally {
      setDocumentBusy("");
    }
  };

  const documentsByType = (interpreter?.interpreter_documents || []).reduce((acc, document) => {
    acc[document.document_type] = document;
    return acc;
  }, {});

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

        {message && <div className="mb-6 rounded-2xl border p-4 text-sm font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.white, color: message.toLowerCase().includes("could not") ? palette.burgundy : palette.charcoal }}>{message}</div>}

        {loading ? (
          <div className="rounded-[2rem] border p-8 text-center shadow-sm" style={cardStyle}>
            <RefreshCcw className="mx-auto animate-spin" style={{ color: palette.gold }} />
            <p className="mt-4 font-bold" style={{ color: palette.charcoal }}>Loading interpreter profile...</p>
          </div>
        ) : interpreter ? (
          <>
            <header className="mb-6 rounded-[2rem] border p-6 shadow-sm md:p-8" style={cardStyle}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Interpreter profile</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl" style={{ color: palette.charcoal }}>{interpreter.first_name} {interpreter.last_name}</h1>
              <p className="mt-3 text-sm leading-7" style={{ color: bodyText }}>{interpreter.email}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <StatCard label="Readiness" value={`${readiness(interpreter)}%`} palette={palette} mutedText={mutedText} />
                <StatCard label="Documents" value={`${interpreter.interpreter_documents?.length || 0}`} palette={palette} mutedText={mutedText} />
                <StatCard label="Roster status" value={statusLabel(interpreter.roster_status)} palette={palette} mutedText={mutedText} />
              </div>
            </header>

            <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
              <section className="rounded-[2rem] border p-6 shadow-sm md:p-8" style={cardStyle}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Edit profile</p>
                    <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>Assignment matching details</h2>
                  </div>
                  <button type="button" disabled={saving} onClick={saveProfile} className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: palette.gold }}>
                    <Save size={16} /> {saving ? "Saving..." : "Save profile"}
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {profileFields.map(([label, field, type]) => (
                    <ProfileField key={field} label={label} value={editProfile[field] || ""} type={type} onChange={(value) => updateField(field, value)} palette={palette} />
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border p-5" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
                  <h3 className="font-black" style={{ color: palette.charcoal }}>Weekly availability</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {dayFields.map(([day, field]) => (
                      <label key={field} className="block text-sm font-bold" style={{ color: palette.charcoal }}>
                        {day}
                        <select value={editProfile[field] || ""} onChange={(event) => updateField(field, event.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white }}>
                          <option value="">Choose</option>
                          {availabilityBlocks.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border p-6 shadow-sm md:p-8" style={cardStyle}>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Documents</p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>Uploaded files</h2>
                <p className="mt-2 text-sm leading-7" style={{ color: bodyText }}>View what the interpreter uploaded, download files, or upload/replace a file as admin.</p>

                <div className="mt-6 space-y-4">
                  {documentTypes.map(([documentType, label]) => {
                    const document = documentsByType[documentType];
                    return (
                      <div key={documentType} className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
                        <div className="flex items-start gap-3">
                          {document ? <BadgeCheck size={18} style={{ color: palette.gold, flexShrink: 0 }} /> : <FileText size={18} style={{ color: palette.burgundy, flexShrink: 0 }} />}
                          <div className="min-w-0 flex-1">
                            <div className="font-black" style={{ color: palette.charcoal }}>{label}</div>
                            <div className="mt-1 break-words text-xs leading-5" style={{ color: mutedText }}>{document?.file_name || "No file uploaded"}</div>
                            {document?.uploaded_at && <div className="mt-1 text-[11px]" style={{ color: mutedText }}>Uploaded {new Date(document.uploaded_at).toLocaleDateString()}</div>}
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value, palette, mutedText }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
      <div className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: mutedText }}>{label}</div>
      <div className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>{value}</div>
    </div>
  );
}

function ProfileField({ label, value, onChange, type, palette }) {
  const isDarkMode = palette.white !== "#ffffff";
  const span = ["credentials", "modalities", "areas_of_experience", "admin_notes"].some((field) => label.toLowerCase().includes(field.replaceAll("_", " ")));
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
