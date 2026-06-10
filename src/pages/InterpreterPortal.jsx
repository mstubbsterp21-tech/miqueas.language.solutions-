import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { AlertCircle, BadgeCheck, CheckCircle2, FileUp, RefreshCcw, Save, UploadCloud } from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";
import { interpreterDocumentBucket, supabase } from "../lib/supabaseClient";

const documentTypes = [
  { value: "resume", label: "Résumé" },
  { value: "w9", label: "W-9" },
  { value: "credential_proof", label: "Credential proof" },
  { value: "liability_insurance", label: "Liability insurance" },
  { value: "state_license", label: "State license" },
  { value: "work_sample", label: "Work sample" },
];

const availabilityFields = [
  ["availability_morning", "Morning", "6 AM–12 PM EST"],
  ["availability_afternoon", "Afternoon", "12 PM–6 PM EST"],
  ["availability_evening", "Evening", "6 PM–12 AM EST"],
  ["availability_overnight", "Overnight", "12 AM–6 AM EST"],
];

const defaultProfile = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  credentials: "",
  modalities: "",
  areas_of_experience: "",
  onsite_rate: "",
  vri_rate: "",
  travel_radius: "",
  availability_morning: false,
  availability_afternoon: false,
  availability_evening: false,
  availability_overnight: false,
};

function statusPill(status) {
  const normalized = status || "pending";
  return normalized.replaceAll("_", " ");
}

export default function InterpreterPortal({ palette }) {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState(defaultProfile);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState("resume");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isAdmin = adminEmails.includes(primaryEmail);

  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };

  const missingDocuments = useMemo(() => {
    const uploadedTypes = new Set(documents.map((document) => document.document_type));
    return ["resume", "w9", "credential_proof", "liability_insurance"].filter((type) => !uploadedTypes.has(type));
  }, [documents]);

  useEffect(() => {
    if (!isLoaded || !user || !isSupabaseConfigured || !supabase) return;

    async function loadPortal() {
      setLoading(true);
      setMessage("");

      const { data: profileData, error: profileError } = await supabase
        .from("interpreters")
        .select("*")
        .eq("clerk_user_id", user.id)
        .maybeSingle();

      if (profileError) {
        setMessage(`Could not load your profile: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile({ ...defaultProfile, ...profileData });

        const { data: documentData, error: documentError } = await supabase
          .from("interpreter_documents")
          .select("*")
          .eq("interpreter_id", profileData.id)
          .order("uploaded_at", { ascending: false });

        if (documentError) {
          setMessage(`Profile loaded, but documents could not load: ${documentError.message}`);
        } else {
          setDocuments(documentData || []);
        }
      } else {
        setProfile({
          ...defaultProfile,
          clerk_user_id: user.id,
          email: primaryEmail,
          first_name: user.firstName || "",
          last_name: user.lastName || "",
          roster_status: "pending_profile",
          screening_status: "not_started",
        });
      }

      setLoading(false);
    }

    loadPortal();
  }, [isLoaded, primaryEmail, user]);

  if (!isSupabaseConfigured) {
    return <PortalSetupNotice palette={palette} />;
  }

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setProfile((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      ...profile,
      clerk_user_id: user.id,
      email: primaryEmail,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("interpreters")
      .upsert(payload, { onConflict: "clerk_user_id" })
      .select()
      .single();

    if (error) {
      setMessage(`Profile could not be saved: ${error.message}`);
    } else {
      setProfile({ ...defaultProfile, ...data });
      setMessage("Profile saved.");
    }

    setSaving(false);
  };

  const uploadDocument = async (event) => {
    event.preventDefault();
    if (!profile.id) {
      setMessage("Save your profile before uploading documents.");
      return;
    }
    if (!file) {
      setMessage("Choose a file before uploading.");
      return;
    }

    setUploading(true);
    setMessage("");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${profile.id}/${documentType}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(interpreterDocumentBucket)
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setMessage(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("interpreter_documents")
      .insert({
        interpreter_id: profile.id,
        document_type: documentType,
        file_name: file.name,
        storage_path: path,
        status: "uploaded",
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      setMessage(`File uploaded, but document record failed: ${insertError.message}`);
    } else {
      setDocuments((current) => [data, ...current]);
      setFile(null);
      setMessage("Document uploaded.");
    }

    setUploading(false);
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
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between" style={{ borderColor: palette.border }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Interpreter portal</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>
              Welcome, {profile.first_name || user.firstName || "Interpreter"}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5f6368]">
              Keep your MLS profile, availability, rates, and onboarding documents current. Avoid uploading assignment-specific or consumer-specific information here.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && <a href="/admin/interpreters" className="rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: palette.burgundy }}>Admin roster</a>}
            <PortalSignOutButton />
          </div>
        </div>

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border bg-white p-4 text-sm font-semibold shadow-sm" style={{ borderColor: palette.border, color: message.includes("failed") || message.includes("could not") ? palette.burgundy : palette.charcoal }}>
            <AlertCircle size={18} style={{ color: palette.gold, flexShrink: 0 }} />
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={saveProfile} className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={cardStyle}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Profile</p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>Interpreter details</h2>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.08em]" style={{ backgroundColor: "rgba(221,125,0,0.14)", color: palette.burgundy }}>{statusPill(profile.roster_status)}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="First name" name="first_name" value={profile.first_name} onChange={handleChange} />
              <Field label="Last name" name="last_name" value={profile.last_name} onChange={handleChange} />
              <Field label="Email" name="email" value={primaryEmail} disabled />
              <Field label="Phone" name="phone" value={profile.phone || ""} onChange={handleChange} />
              <Field label="City" name="city" value={profile.city || ""} onChange={handleChange} />
              <Field label="State" name="state" value={profile.state || ""} onChange={handleChange} />
              <Field label="Credentials" name="credentials" value={profile.credentials || ""} onChange={handleChange} />
              <Field label="Modalities" name="modalities" value={profile.modalities || ""} onChange={handleChange} />
              <Field label="Onsite rate" name="onsite_rate" value={profile.onsite_rate || ""} onChange={handleChange} />
              <Field label="VRI rate" name="vri_rate" value={profile.vri_rate || ""} onChange={handleChange} />
              <Field label="Travel radius" name="travel_radius" value={profile.travel_radius || ""} onChange={handleChange} />
              <Field label="Areas of experience" name="areas_of_experience" value={profile.areas_of_experience || ""} onChange={handleChange} />
            </div>

            <div className="mt-7 rounded-[1.4rem] border p-5" style={{ borderColor: palette.border }}>
              <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>Availability windows</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {availabilityFields.map(([name, label, time]) => (
                  <label key={name} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-black/[0.03] p-4 text-sm">
                    <input type="checkbox" name={name} checked={Boolean(profile[name])} onChange={handleChange} className="mt-1 h-4 w-4" />
                    <span><strong>{label}</strong><br /><span className="text-[#666]">{time}</span></span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving} className="mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60" style={{ backgroundColor: palette.gold }}>
              <Save size={17} /> {saving ? "Saving..." : "Save profile"}
            </button>
          </form>

          <div className="space-y-6">
            <section className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={cardStyle}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Documents</p>
              <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>Upload files</h2>
              <p className="mt-3 text-sm leading-7 text-[#5f6368]">Use private uploads for onboarding files only: W-9, credential proof, résumé, insurance, and similar documents.</p>

              <form onSubmit={uploadDocument} className="mt-5 space-y-4">
                <div>
                  <label className="text-sm font-bold" style={{ color: palette.charcoal }}>Document type</label>
                  <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm" style={{ borderColor: palette.border }}>
                    {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold" style={{ color: palette.charcoal }}>File</label>
                  <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm" style={{ borderColor: palette.border }} />
                </div>
                <button type="submit" disabled={uploading} className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60" style={{ backgroundColor: palette.burgundy }}>
                  <UploadCloud size={17} /> {uploading ? "Uploading..." : "Upload document"}
                </button>
              </form>
            </section>

            <section className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={cardStyle}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Checklist</p>
              <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>Onboarding status</h2>
              <div className="mt-5 space-y-3">
                {["resume", "w9", "credential_proof", "liability_insurance"].map((type) => {
                  const uploaded = !missingDocuments.includes(type);
                  const label = documentTypes.find((document) => document.value === type)?.label || type;
                  return (
                    <div key={type} className="flex items-center gap-3 rounded-2xl bg-black/[0.03] p-4 text-sm font-bold" style={{ color: palette.charcoal }}>
                      {uploaded ? <CheckCircle2 size={18} style={{ color: palette.gold }} /> : <FileUp size={18} style={{ color: palette.burgundy }} />}
                      {label}: {uploaded ? "Uploaded" : "Missing"}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={cardStyle}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Uploaded</p>
              <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>Document history</h2>
              <div className="mt-5 space-y-3">
                {documents.length === 0 ? (
                  <p className="text-sm leading-7 text-[#666]">No documents uploaded yet.</p>
                ) : documents.map((document) => (
                  <div key={document.id} className="rounded-2xl border p-4 text-sm" style={{ borderColor: palette.border }}>
                    <div className="font-black" style={{ color: palette.charcoal }}>{document.file_name}</div>
                    <div className="mt-1 text-[#666]">{document.document_type?.replaceAll("_", " ")} · {document.status}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, disabled = false }) {
  return (
    <label className="block text-sm font-bold text-[#464747]">
      {label}
      <input
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-2 w-full rounded-2xl border border-[#d1c6bc] bg-white px-4 py-3 text-sm font-medium text-[#464747] outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10 disabled:bg-black/[0.03]"
      />
    </label>
  );
}
