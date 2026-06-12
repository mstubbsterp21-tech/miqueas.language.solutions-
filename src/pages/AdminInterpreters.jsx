import { useEffect, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Edit3, Plus, RefreshCcw, Save, Search, Trash2, X } from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";

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

const areaOptions = [
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

const experienceOptions = ["Less than 1 year", "1-3 years", "4-6 years", "7-10 years", "10+ years"];
const yesNoOptions = ["Yes", "No"];
const contactOptions = ["Email", "Phone", "Text"];
const rosterStatusOptions = ["pending_profile", "active", "inactive", "screening_required", "on_hold", "removed"];
const assignmentPreferenceOptions = ["On-site only", "VRI only", "Both", "Depends on setting"];
const vriReadinessOptions = ["Yes", "No", "Needs discussion"];
const insuranceOptions = ["Yes", "No", "In progress"];

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

const initialNewInterpreter = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  credentials: [],
  modalities: [],
  areasOfExperience: [],
  yearsExperience: "",
  assignmentTypePreference: "",
  willingToTravel: "",
  technicalReadinessConfirmed: "",
  professionalLiabilityInsurance: "",
  onsiteRate: "",
  vriRate: "",
};

function joinValues(values) {
  return Array.isArray(values) ? values.join(", ") : String(values || "");
}

function statusPill(status) {
  return (status || "pending").replaceAll("_", " ");
}

function getEditableProfile(interpreter) {
  return {
    first_name: interpreter.first_name || "",
    last_name: interpreter.last_name || "",
    email: interpreter.email || "",
    phone: interpreter.phone || "",
    city: interpreter.city || "",
    state: interpreter.state || "",
    current_location: interpreter.current_location || "",
    preferred_contact_method: interpreter.preferred_contact_method || "",
    credentials: interpreter.credentials || "",
    state_license: interpreter.state_license || "",
    state_license_details: interpreter.state_license_details || "",
    years_experience: interpreter.years_experience || "",
    modalities: interpreter.modalities || "",
    areas_of_experience: interpreter.areas_of_experience || "",
    assignment_type_preference: interpreter.assignment_type_preference || "",
    willing_to_travel: interpreter.willing_to_travel || "",
    technical_readiness_confirmed: interpreter.technical_readiness_confirmed || "",
    professional_liability_insurance: interpreter.professional_liability_insurance || "",
    travel_radius: interpreter.travel_radius || "",
    onsite_rate: interpreter.onsite_rate || "",
    vri_rate: interpreter.vri_rate || "",
    roster_status: interpreter.roster_status || "pending_profile",
    admin_notes: interpreter.admin_notes || "",
    availability_sunday: interpreter.availability_sunday || "",
    availability_monday: interpreter.availability_monday || "",
    availability_tuesday: interpreter.availability_tuesday || "",
    availability_wednesday: interpreter.availability_wednesday || "",
    availability_thursday: interpreter.availability_thursday || "",
    availability_friday: interpreter.availability_friday || "",
    availability_saturday: interpreter.availability_saturday || "",
  };
}

export default function AdminInterpreters({ palette }) {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [savingRateId, setSavingRateId] = useState("");
  const [savingProfileId, setSavingProfileId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [showAddInterpreter, setShowAddInterpreter] = useState(false);
  const [creatingInterpreter, setCreatingInterpreter] = useState(false);
  const [newInterpreter, setNewInterpreter] = useState(initialNewInterpreter);

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

  async function loadInterpreters() {
    setLoading(true);
    setMessage("");
    try {
      const data = await portalRequest("adminRoster");
      setInterpreters(data.interpreters || []);
    } catch (error) {
      setMessage(`Could not load roster: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded || !user || !session || !isSupabaseConfigured || !isAdmin) return;
    loadInterpreters();
  }, [isAdmin, isLoaded, session, user]);

  if (!isSupabaseConfigured) {
    return <PortalSetupNotice palette={palette} />;
  }

  if (isLoaded && !isAdmin) {
    return (
      <section className="px-5 py-16 md:px-8 md:py-24" style={{ background: pageBackground }}>
        <div className="mx-auto max-w-3xl rounded-[2rem] border p-8 text-center shadow-lg" style={cardStyle}>
          <AlertTriangle className="mx-auto" style={{ color: palette.gold }} />
          <h1 className="mt-4 text-3xl font-black" style={{ color: palette.charcoal }}>Admin access required</h1>
          <p className="mt-4 text-sm leading-7" style={{ color: bodyText }}>This roster is only available to MLS admin accounts configured in Vercel.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/portal" className="rounded-full px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}>Back to portal</Link>
            <PortalSignOutButton />
          </div>
        </div>
      </section>
    );
  }

  const updateInterpreterField = (id, field, value) => {
    setInterpreters((current) => current.map((interpreter) => (interpreter.id === id ? { ...interpreter, [field]: value } : interpreter)));
  };

  const updateNewInterpreter = (field, value) => {
    setNewInterpreter((current) => ({ ...current, [field]: value }));
  };

  const toggleNewInterpreterValue = (field, option) => {
    setNewInterpreter((current) => {
      const currentValues = Array.isArray(current[field]) ? current[field] : [];
      const nextValues = currentValues.includes(option)
        ? currentValues.filter((item) => item !== option)
        : [...currentValues, option];
      return { ...current, [field]: nextValues };
    });
  };

  const resetNewInterpreter = () => {
    setNewInterpreter({ ...initialNewInterpreter, credentials: [], modalities: [], areasOfExperience: [] });
  };

  const startEditing = (interpreter) => {
    setEditingId(interpreter.id);
    setInterpreters((current) => current.map((item) => (item.id === interpreter.id ? { ...item, _editProfile: getEditableProfile(item) } : item)));
  };

  const cancelEditing = (id) => {
    setEditingId("");
    setInterpreters((current) => current.map((item) => {
      if (item.id !== id) return item;
      const { _editProfile, ...rest } = item;
      return rest;
    }));
  };

  const updateEditField = (id, field, value) => {
    setInterpreters((current) => current.map((item) => (item.id === id ? { ...item, _editProfile: { ...(item._editProfile || getEditableProfile(item)), [field]: value } } : item)));
  };

  const saveRates = async (interpreter) => {
    setSavingRateId(interpreter.id);
    setMessage("");
    try {
      const data = await portalRequest("adminUpdateRates", {
        method: "POST",
        body: {
          interpreterId: interpreter.id,
          onsiteRate: interpreter.onsite_rate || "",
          vriRate: interpreter.vri_rate || "",
        },
      });
      setInterpreters((current) => current.map((item) => (item.id === interpreter.id ? { ...item, ...data.interpreter } : item)));
      setMessage("Rates updated.");
    } catch (error) {
      setMessage(`Could not update rates: ${error.message}`);
    } finally {
      setSavingRateId("");
    }
  };

  const saveInterpreterProfile = async (interpreter) => {
    const profile = interpreter._editProfile || getEditableProfile(interpreter);
    setSavingProfileId(interpreter.id);
    setMessage("");
    try {
      const data = await portalRequest("adminUpdateInterpreterProfile", {
        method: "POST",
        body: { interpreterId: interpreter.id, profile },
      });
      setInterpreters((current) => current.map((item) => {
        if (item.id !== interpreter.id) return item;
        const { _editProfile, ...rest } = item;
        return { ...rest, ...data.interpreter };
      }));
      setEditingId("");
      setMessage("Interpreter profile updated.");
    } catch (error) {
      setMessage(`Could not update interpreter: ${error.message}`);
    } finally {
      setSavingProfileId("");
    }
  };

  const deleteInterpreter = async (interpreter) => {
    const name = `${interpreter.first_name || ""} ${interpreter.last_name || ""}`.trim() || interpreter.email || "this interpreter";
    const confirmed = window.confirm(`Delete ${name} from the MLS roster? This removes the portal profile and document records. This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(interpreter.id);
    setMessage("");
    try {
      await portalRequest("adminDeleteInterpreter", {
        method: "POST",
        body: { interpreterId: interpreter.id },
      });
      setInterpreters((current) => current.filter((item) => item.id !== interpreter.id));
      setMessage(`${name} was deleted from the MLS roster.`);
    } catch (error) {
      setMessage(`Could not delete interpreter: ${error.message}`);
    } finally {
      setDeletingId("");
    }
  };

  const createInterpreter = async (event) => {
    event.preventDefault();
    setCreatingInterpreter(true);
    setMessage("");

    try {
      const payload = {
        ...newInterpreter,
        credentials: joinValues(newInterpreter.credentials),
        modalities: joinValues(newInterpreter.modalities),
        areasOfExperience: joinValues(newInterpreter.areasOfExperience),
      };
      const data = await portalRequest("adminCreateInterpreter", {
        method: "POST",
        body: payload,
      });
      setInterpreters((current) => [data.interpreter, ...current]);
      resetNewInterpreter();
      setShowAddInterpreter(false);
      setMessage(`${data.interpreter.first_name || "Interpreter"} was added to Clerk and the MLS roster.`);
    } catch (error) {
      setMessage(`Could not add interpreter: ${error.message}`);
    } finally {
      setCreatingInterpreter(false);
    }
  };

  const filtered = interpreters.filter((interpreter) => {
    const haystack = `${interpreter.first_name || ""} ${interpreter.last_name || ""} ${interpreter.email || ""} ${interpreter.city || ""} ${interpreter.state || ""} ${interpreter.credentials || ""} ${interpreter.modalities || ""} ${interpreter.areas_of_experience || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="px-5 py-12 md:px-8 md:py-16" style={{ background: pageBackground }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border p-6 shadow-sm md:flex-row md:items-center md:justify-between" style={cardStyle}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>MLS admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Interpreter roster</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7" style={{ color: bodyText }}>Review, edit, or delete matching profiles, onboarding status, document counts, and admin-managed rates.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowAddInterpreter(true)} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: palette.gold }}>
              <Plus size={16} /> Add interpreter
            </button>
            <button type="button" onClick={loadInterpreters} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold" style={{ borderColor: palette.border, color: palette.charcoal }}>
              <RefreshCcw size={16} /> Refresh
            </button>
            <Link to="/portal" className="rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: palette.burgundy }}>My portal</Link>
            <PortalSignOutButton />
          </div>
        </div>

        {message && <div className="mb-6 rounded-2xl border p-4 text-sm font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.white, color: message.toLowerCase().includes("could not") ? palette.burgundy : palette.charcoal }}>{message}</div>}

        {showAddInterpreter && (
          <section className="mb-6 rounded-[2rem] border p-6 shadow-sm md:p-8" style={cardStyle}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Add interpreter</p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>Create Clerk account + roster profile</h2>
                <p className="mt-2 text-sm leading-6" style={{ color: bodyText }}>Use this after you have approved or invited an interpreter for the MLS portal.</p>
              </div>
              <button type="button" onClick={() => setShowAddInterpreter(false)} className="rounded-full border p-2" style={{ borderColor: palette.border, color: palette.burgundy }} aria-label="Close add interpreter form">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={createInterpreter} className="grid gap-5 md:grid-cols-2">
              <AdminField label="First name" value={newInterpreter.firstName} onChange={(value) => updateNewInterpreter("firstName", value)} required palette={palette} />
              <AdminField label="Last name" value={newInterpreter.lastName} onChange={(value) => updateNewInterpreter("lastName", value)} required palette={palette} />
              <AdminField label="Email" type="email" value={newInterpreter.email} onChange={(value) => updateNewInterpreter("email", value)} required palette={palette} />
              <AdminField label="Phone" value={newInterpreter.phone} onChange={(value) => updateNewInterpreter("phone", value)} palette={palette} />
              <AdminField label="City" value={newInterpreter.city} onChange={(value) => updateNewInterpreter("city", value)} palette={palette} />
              <AdminField label="State" value={newInterpreter.state} onChange={(value) => updateNewInterpreter("state", value)} palette={palette} />

              <CheckboxPanel label="Credentials" options={credentialOptions} values={newInterpreter.credentials} onToggle={(option) => toggleNewInterpreterValue("credentials", option)} palette={palette} />
              <CheckboxPanel label="Modalities" options={modalityOptions} values={newInterpreter.modalities} onToggle={(option) => toggleNewInterpreterValue("modalities", option)} palette={palette} />
              <CheckboxPanel label="Areas of experience" options={areaOptions} values={newInterpreter.areasOfExperience} onToggle={(option) => toggleNewInterpreterValue("areasOfExperience", option)} palette={palette} span />
              <RadioPanel label="Years of experience" options={experienceOptions} value={newInterpreter.yearsExperience} onChange={(value) => updateNewInterpreter("yearsExperience", value)} palette={palette} />
              <AdminField label="Assignment preference" value={newInterpreter.assignmentTypePreference} onChange={(value) => updateNewInterpreter("assignmentTypePreference", value)} placeholder="On-site, VRI, both" palette={palette} />
              <RadioPanel label="Willing to travel" options={yesNoOptions} value={newInterpreter.willingToTravel} onChange={(value) => updateNewInterpreter("willingToTravel", value)} palette={palette} />
              <RadioPanel label="VRI ready" options={yesNoOptions} value={newInterpreter.technicalReadinessConfirmed} onChange={(value) => updateNewInterpreter("technicalReadinessConfirmed", value)} palette={palette} />
              <RadioPanel label="Professional liability insurance" options={yesNoOptions} value={newInterpreter.professionalLiabilityInsurance} onChange={(value) => updateNewInterpreter("professionalLiabilityInsurance", value)} palette={palette} />
              <AdminField label="On-site rate" value={newInterpreter.onsiteRate} onChange={(value) => updateNewInterpreter("onsiteRate", value)} placeholder="$65/hr, 2-hour minimum" palette={palette} />
              <AdminField label="VRI rate" value={newInterpreter.vriRate} onChange={(value) => updateNewInterpreter("vriRate", value)} placeholder="$55/hr, 1-hour minimum" palette={palette} />
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button type="submit" disabled={creatingInterpreter} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: palette.burgundy }}>
                  <Plus size={16} /> {creatingInterpreter ? "Adding..." : "Add to roster"}
                </button>
                <button type="button" onClick={resetNewInterpreter} className="rounded-full border px-5 py-3 text-sm font-bold" style={{ borderColor: palette.border, color: palette.charcoal }}>Clear</button>
              </div>
            </form>
          </section>
        )}

        <div className="mb-6 rounded-[1.5rem] border p-4 shadow-sm" style={cardStyle}>
          <label className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: softPanel }}>
            <Search size={18} style={{ color: palette.gold }} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, location, credentials, modality, or experience" className="w-full bg-transparent text-sm font-semibold outline-none" style={{ color: palette.charcoal }} />
          </label>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border p-8 text-center shadow-sm" style={cardStyle}>
            <RefreshCcw className="mx-auto animate-spin" style={{ color: palette.gold }} />
            <p className="mt-4 font-bold" style={{ color: palette.charcoal }}>Loading roster...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-[2rem] border p-7 text-sm leading-7" style={{ ...cardStyle, color: bodyText }}>No interpreters match your search.</div>
            ) : filtered.map((interpreter) => {
              const editProfile = interpreter._editProfile || getEditableProfile(interpreter);
              const editing = editingId === interpreter.id;
              return (
                <article key={interpreter.id} className="rounded-[2rem] border p-5 shadow-sm" style={cardStyle}>
                  <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr_0.9fr]">
                    <div>
                      <div className="font-black text-xl" style={{ color: palette.charcoal }}>{interpreter.first_name} {interpreter.last_name}</div>
                      <div className="mt-1 text-sm" style={{ color: mutedText }}>{interpreter.email}</div>
                      <div className="mt-2 text-sm" style={{ color: mutedText }}>{interpreter.city || "—"}{interpreter.state ? `, ${interpreter.state}` : ""}</div>
                      <span className="mt-3 inline-flex rounded-full bg-[#dd7d00]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.08em]" style={{ color: palette.burgundy }}>{statusPill(interpreter.roster_status)}</span>
                    </div>

                    <div className="space-y-2 text-sm" style={{ color: mutedText }}>
                      <div><strong style={{ color: palette.charcoal }}>Credentials:</strong> {interpreter.credentials || "—"}</div>
                      <div><strong style={{ color: palette.charcoal }}>Modalities:</strong> {interpreter.modalities || "—"}</div>
                      <div><strong style={{ color: palette.charcoal }}>Experience:</strong> {interpreter.areas_of_experience || "—"}</div>
                      <div className="flex items-center gap-2 font-bold"><BadgeCheck size={17} style={{ color: palette.gold }} /> {interpreter.interpreter_documents?.length || 0} document records</div>
                    </div>

                    <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
                      <div className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: mutedText }}>Admin actions</div>
                      <label className="mt-3 block text-xs font-bold" style={{ color: palette.charcoal }}>
                        On-site rate
                        <input value={interpreter.onsite_rate || ""} onChange={(event) => updateInterpreterField(interpreter.id, "onsite_rate", event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white }} />
                      </label>
                      <label className="mt-3 block text-xs font-bold" style={{ color: palette.charcoal }}>
                        VRI rate
                        <input value={interpreter.vri_rate || ""} onChange={(event) => updateInterpreterField(interpreter.id, "vri_rate", event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white }} />
                      </label>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" disabled={savingRateId === interpreter.id} onClick={() => saveRates(interpreter)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white disabled:opacity-60" style={{ backgroundColor: palette.burgundy }}>
                          <Save size={14} /> {savingRateId === interpreter.id ? "Saving..." : "Save rates"}
                        </button>
                        <button type="button" onClick={() => editing ? cancelEditing(interpreter.id) : startEditing(interpreter)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold" style={{ borderColor: palette.border, color: palette.charcoal }}>
                          {editing ? <X size={14} /> : <Edit3 size={14} />} {editing ? "Cancel" : "Edit profile"}
                        </button>
                        <button type="button" disabled={deletingId === interpreter.id} onClick={() => deleteInterpreter(interpreter)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-60" style={{ borderColor: palette.burgundy, color: palette.burgundy }}>
                          <Trash2 size={14} /> {deletingId === interpreter.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {editing && (
                    <div className="mt-5 rounded-2xl border p-5" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
                      <div className="mb-4">
                        <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>Edit interpreter profile</h3>
                        <p className="mt-1 text-sm" style={{ color: bodyText }}>Update the matching fields MLS uses for assignments. This does not change the interpreter's Clerk login email.</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <AdminField label="First name" value={editProfile.first_name} onChange={(value) => updateEditField(interpreter.id, "first_name", value)} palette={palette} />
                        <AdminField label="Last name" value={editProfile.last_name} onChange={(value) => updateEditField(interpreter.id, "last_name", value)} palette={palette} />
                        <AdminField label="Email" type="email" value={editProfile.email} onChange={(value) => updateEditField(interpreter.id, "email", value)} palette={palette} />
                        <AdminField label="Phone" value={editProfile.phone} onChange={(value) => updateEditField(interpreter.id, "phone", value)} palette={palette} />
                        <AdminField label="City" value={editProfile.city} onChange={(value) => updateEditField(interpreter.id, "city", value)} palette={palette} />
                        <AdminField label="State" value={editProfile.state} onChange={(value) => updateEditField(interpreter.id, "state", value)} palette={palette} />
                        <AdminField label="Current location" value={editProfile.current_location} onChange={(value) => updateEditField(interpreter.id, "current_location", value)} palette={palette} />
                        <AdminSelect label="Preferred contact method" value={editProfile.preferred_contact_method} options={contactOptions} onChange={(value) => updateEditField(interpreter.id, "preferred_contact_method", value)} palette={palette} />
                        <AdminTextarea label="Credentials" value={editProfile.credentials} onChange={(value) => updateEditField(interpreter.id, "credentials", value)} placeholder="Comma-separated credentials" span palette={palette} />
                        <AdminSelect label="Years of experience" value={editProfile.years_experience} options={experienceOptions} onChange={(value) => updateEditField(interpreter.id, "years_experience", value)} palette={palette} />
                        <AdminSelect label="State license" value={editProfile.state_license} options={["Yes", "No", "In progress", "Not applicable"]} onChange={(value) => updateEditField(interpreter.id, "state_license", value)} palette={palette} />
                        <AdminField label="State license details" value={editProfile.state_license_details} onChange={(value) => updateEditField(interpreter.id, "state_license_details", value)} span palette={palette} />
                        <AdminTextarea label="Modalities" value={editProfile.modalities} onChange={(value) => updateEditField(interpreter.id, "modalities", value)} placeholder="Comma-separated modalities" span palette={palette} />
                        <AdminTextarea label="Areas of experience" value={editProfile.areas_of_experience} onChange={(value) => updateEditField(interpreter.id, "areas_of_experience", value)} placeholder="Comma-separated settings" span palette={palette} />
                        <AdminSelect label="Assignment preference" value={editProfile.assignment_type_preference} options={assignmentPreferenceOptions} onChange={(value) => updateEditField(interpreter.id, "assignment_type_preference", value)} palette={palette} />
                        <AdminSelect label="Willing to travel" value={editProfile.willing_to_travel} options={["Yes", "No", "Depends on assignment"]} onChange={(value) => updateEditField(interpreter.id, "willing_to_travel", value)} palette={palette} />
                        <AdminSelect label="VRI readiness" value={editProfile.technical_readiness_confirmed} options={vriReadinessOptions} onChange={(value) => updateEditField(interpreter.id, "technical_readiness_confirmed", value)} palette={palette} />
                        <AdminSelect label="Professional liability insurance" value={editProfile.professional_liability_insurance} options={insuranceOptions} onChange={(value) => updateEditField(interpreter.id, "professional_liability_insurance", value)} palette={palette} />
                        <AdminField label="Travel radius" value={editProfile.travel_radius} onChange={(value) => updateEditField(interpreter.id, "travel_radius", value)} span palette={palette} />
                        <AdminSelect label="Roster status" value={editProfile.roster_status} options={rosterStatusOptions} onChange={(value) => updateEditField(interpreter.id, "roster_status", value)} palette={palette} />
                        <AdminTextarea label="Admin notes" value={editProfile.admin_notes} onChange={(value) => updateEditField(interpreter.id, "admin_notes", value)} span palette={palette} />
                        {dayFields.map(([day, key]) => (
                          <AdminSelect key={key} label={`${day} availability`} value={editProfile[key]} options={availabilityBlocks} onChange={(value) => updateEditField(interpreter.id, key, value)} palette={palette} />
                        ))}
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button type="button" disabled={savingProfileId === interpreter.id} onClick={() => saveInterpreterProfile(interpreter)} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: palette.gold }}>
                          <Save size={16} /> {savingProfileId === interpreter.id ? "Saving profile..." : "Save profile changes"}
                        </button>
                        <button type="button" onClick={() => cancelEditing(interpreter.id)} className="rounded-full border px-5 py-3 text-sm font-bold" style={{ borderColor: palette.border, color: palette.charcoal }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminField({ label, value, onChange, type = "text", placeholder = "", required = false, span = false, palette }) {
  const isDarkMode = palette.white !== "#ffffff";
  return (
    <label className={`block text-sm font-bold ${span ? "md:col-span-2" : ""}`} style={{ color: palette.charcoal }}>
      {label}{required ? " *" : ""}
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10"
        style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: isDarkMode ? "#251a16" : "#ffffff" }}
      />
    </label>
  );
}

function AdminTextarea({ label, value, onChange, placeholder = "", span = false, palette }) {
  const isDarkMode = palette.white !== "#ffffff";
  return (
    <label className={`block text-sm font-bold ${span ? "md:col-span-2" : ""}`} style={{ color: palette.charcoal }}>
      {label}
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10"
        style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: isDarkMode ? "#251a16" : "#ffffff" }}
      />
    </label>
  );
}

function AdminSelect({ label, value, options, onChange, palette }) {
  const isDarkMode = palette.white !== "#ffffff";
  return (
    <label className="block text-sm font-bold" style={{ color: palette.charcoal }}>
      {label}
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10"
        style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: isDarkMode ? "#251a16" : "#ffffff" }}
      >
        <option value="">Choose</option>
        {options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}

function CheckboxPanel({ label, options, values, onToggle, palette, span = false }) {
  return (
    <fieldset className={`rounded-2xl border p-4 ${span ? "md:col-span-2" : ""}`} style={{ borderColor: palette.border }}>
      <legend className="px-1 text-sm font-black" style={{ color: palette.charcoal }}>{label}</legend>
      <p className="mb-3 mt-1 text-xs" style={{ color: palette.white !== "#ffffff" ? "#bfaea2" : "#666" }}>Check all that apply.</p>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-start gap-3 text-sm" style={{ color: palette.charcoal }}>
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => onToggle(option)}
              className="mt-1 h-4 w-4 rounded"
              style={{ accentColor: palette.burgundy }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RadioPanel({ label, options, value, onChange, palette }) {
  return (
    <fieldset className="rounded-2xl border p-4" style={{ borderColor: palette.border }}>
      <legend className="px-1 text-sm font-black" style={{ color: palette.charcoal }}>{label}</legend>
      <div className="mt-2 space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-start gap-3 text-sm" style={{ color: palette.charcoal }}>
            <input
              type="radio"
              checked={value === option}
              onChange={() => onChange(option)}
              className="mt-1 h-4 w-4"
              style={{ accentColor: palette.burgundy }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
