import { useEffect, useMemo, useRef, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, ArrowRight, Building2, CalendarDays, CheckCircle2, CircleDollarSign,
  Clock3, Download, FileCheck2, FileText, LayoutDashboard, Loader2, Plus,
  RefreshCcw, Save, Send, Settings2, ShieldCheck, Trash2, UploadCloud, Users, X,
} from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { isSupabaseConfigured } from "../lib/env";
import { createPortalSupabaseClient } from "../lib/supabaseClient";
import logo from "../logo.png";

const BRAND = { burgundy: "#721100", gold: "#dd7d00" };
const INPUT = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10";
const CLIENT_DOCS = [
  ["service_agreement", "Service agreement"], ["purchase_order", "Purchase order"],
  ["tax_exempt", "Tax-exempt certificate"], ["accessibility_plan", "Accessibility plan"],
  ["prep_materials", "Preparation materials"], ["other", "Other document"],
];
const INTERPRETER_DOCS = [
  ["resume", "Résumé"], ["w9", "W-9"], ["credential_proof", "Credential proof"],
  ["liability_insurance", "Liability insurance"], ["ic_agreement", "IC agreement"],
  ["state_license", "State license"], ["work_sample", "Work sample"],
];
const EMPTY_CLIENT = {
  organization_name: "", primary_contact_name: "", phone: "", preferred_contact_method: "Email",
  billing_email: "", billing_phone: "", address_line_1: "", address_line_2: "", city: "",
  state: "", postal_code: "", country: "United States", industry: "",
  default_service_type: "ASL/English Interpreting", default_delivery_mode: "On-site",
  communication_preferences: "", billing_notes: "",
};
const EMPTY_INTERPRETER = {
  first_name: "", last_name: "", email: "", phone: "", current_location: "",
  preferred_contact_method: "Email", credentials: "", state_license: "", state_license_details: "",
  years_experience: "", modalities: "", areas_of_experience: "", assignment_type_preference: "",
  willing_to_travel: "", technical_readiness_confirmed: "", professional_liability_insurance: "",
  travel_radius: "", availability_sunday: "", availability_monday: "", availability_tuesday: "",
  availability_wednesday: "", availability_thursday: "", availability_friday: "", availability_saturday: "",
};
const EMPTY_ASSIGNMENT = {
  service_type: "ASL/English Interpreting", delivery_mode: "On-site", start_at: "", end_at: "",
  timezone: "America/New_York", location_name: "", address_line_1: "", city: "", state: "",
  postal_code: "", meeting_link: "", deaf_participants: 1, hearing_participants: 1,
  language_preferences: "ASL", specialty: "General / Community", team_requested: false,
  cdi_requested: false, onsite_contact_name: "", onsite_contact_phone: "", description: "",
  preparation_materials: "", purchase_order_number: "", client_reference: "",
};

const label = (value) => String(value || "Not set").replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());
const formatDate = (value) => value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "Not scheduled";
const join = (...items) => items.filter(Boolean).join(" ");

function Field({ name, required, children, className = "" }) {
  return <label className={className}><span className="mb-2 block text-xs font-black uppercase tracking-[.1em] text-slate-500">{name}{required && <b className="text-[#721100]"> *</b>}</span>{children}</label>;
}

function SectionTitle({ eyebrow, title, text, action }) {
  return <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#dd7d00]">{eyebrow}</p><h2 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">{title}</h2>{text && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{text}</p>}</div>{action}</div>;
}

function Badge({ value }) {
  const style = {
    pending_confirmation: "bg-amber-50 text-amber-800 border-amber-200", confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    completed: "bg-slate-100 text-slate-700 border-slate-200", cancelled: "bg-rose-50 text-rose-800 border-rose-200",
    not_invoiced: "bg-slate-50 text-slate-600 border-slate-200", pending_payment: "bg-orange-50 text-orange-800 border-orange-200",
    paid: "bg-emerald-50 text-emerald-800 border-emerald-200", requested: "bg-amber-50 text-amber-800 border-amber-200",
    viewed: "bg-blue-50 text-blue-800 border-blue-200", fulfilled: "bg-emerald-50 text-emerald-800 border-emerald-200",
    overdue: "bg-rose-50 text-rose-800 border-rose-200", uploaded: "bg-blue-50 text-blue-800 border-blue-200",
    under_review: "bg-violet-50 text-violet-800 border-violet-200", approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  }[value] || "bg-slate-50 text-slate-600 border-slate-200";
  return <span className={join("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.08em]", style)}>{label(value)}</span>;
}

function Metric({ icon: Icon, name, value, note, color = BRAND.burgundy }) {
  return <motion.div whileHover={{ y: -3 }} className="rounded-[1.6rem] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(40,25,18,.07)]"><div className="flex justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">{name}</p><p className="mt-3 text-3xl font-black text-slate-900">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{note}</p></div><span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: color }}><Icon size={20} /></span></div></motion.div>;
}

function Modal({ open, close, title, children, wide = false }) {
  return <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c100c]/65 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && close()}><motion.div initial={{ y: 22, opacity: 0, scale: .98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 15, opacity: 0 }} className={join("max-h-[92vh] w-full overflow-y-auto rounded-[2rem] bg-[#f8f5f1] shadow-2xl", wide ? "max-w-5xl" : "max-w-4xl")}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-[#f8f5f1]/95 px-6 py-5 backdrop-blur"><h2 className="text-2xl font-black text-slate-900">{title}</h2><button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow"><X size={18} /></button></div><div className="p-6 md:p-8">{children}</div></motion.div></motion.div>}</AnimatePresence>;
}

function Empty({ icon: Icon = FileText, title, text, action }) {
  return <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Icon size={22} /></span><h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{text}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function DocumentCard({ type, title, document, request, busy, upload, open, remove }) {
  const ref = useRef(null);
  const accept = (file) => file && upload(type, file, document?.id || null);
  return <motion.div layout className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#dd7d00]/40 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className={join("flex h-11 w-11 items-center justify-center rounded-2xl", document ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{document ? <FileCheck2 size={20} /> : <FileText size={20} />}</span><div><h3 className="font-black text-slate-900">{request?.title || title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{request?.instructions || "Upload the latest requested version."}</p></div></div>{request && <Badge value={request.status} />}</div>{document && <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3"><p className="truncate text-sm font-bold text-slate-700">{document.file_name}</p><p className="mt-1 text-xs text-slate-400">Uploaded {formatDate(document.uploaded_at)}</p></div>}<div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); accept(e.dataTransfer.files?.[0]); }}><input ref={ref} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ""; }} /><button type="button" disabled={busy === type} onClick={() => ref.current?.click()} className="inline-flex items-center gap-2 text-sm font-black text-[#721100] disabled:opacity-50">{busy === type ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}{document ? "Replace file" : "Choose or drop a file"}</button><p className="mt-1 text-[11px] text-slate-400">PDF, Word, PNG, or JPG · 15 MB max</p></div>{document && <div className="mt-4 flex gap-2"><button type="button" onClick={() => open(document)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600"><Download size={14} /> Open</button><button type="button" onClick={() => remove(document)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"><Trash2 size={14} /> Delete</button></div>}</motion.div>;
}

export default function InterpreterPortal({ palette }) {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const storage = useMemo(() => createPortalSupabaseClient(null), []);
  const [workspace, setWorkspace] = useState(null);
  const [portal, setPortal] = useState("interpreter");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyDoc, setBusyDoc] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [interpreterOpen, setInterpreterOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [clientDraft, setClientDraft] = useState(EMPTY_CLIENT);
  const [interpreterDraft, setInterpreterDraft] = useState(EMPTY_INTERPRETER);
  const [assignmentDraft, setAssignmentDraft] = useState(EMPTY_ASSIGNMENT);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedInterpreter, setSelectedInterpreter] = useState("");
  const [saving, setSaving] = useState(false);
  const [invite, setInvite] = useState({ role: "client", email: "", organizationName: "" });
  const [docRequest, setDocRequest] = useState({ audienceType: "client", ownerId: "", documentType: "service_agreement", title: "", instructions: "", dueDate: "" });
  const [adminBusy, setAdminBusy] = useState("");

  async function api(action, method = "GET", body) {
    const token = await session?.getToken();
    const res = await fetch(`/api/portal?action=${action}`, { method, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Portal request failed.");
    return data;
  }

  async function load(quiet = false) {
    if (!session) return;
    try {
      quiet ? setRefreshing(true) : setLoading(true);
      setError("");
      const data = await api("loadWorkspace");
      setWorkspace(data);
      const saved = localStorage.getItem("mls-active-portal");
      setPortal(data.availablePortals?.includes(saved) ? saved : data.defaultPortal || data.availablePortals?.[0] || "interpreter");
      if (data.client?.profile) setClientDraft({ ...EMPTY_CLIENT, ...data.client.profile });
      if (data.interpreter?.profile) setInterpreterDraft({ ...EMPTY_INTERPRETER, ...data.interpreter.profile });
      setSelectedClient((current) => current || data.admin?.clients?.[0]?.id || "");
      setSelectedInterpreter((current) => current || data.admin?.interpreters?.[0]?.id || "");
      if (data.client?.profile && !data.client.profile.onboarding_complete) setClientOpen(true);
    } catch (e) { setError(e.message); } finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { if (isLoaded && user && session && isSupabaseConfigured) load(); }, [isLoaded, user?.id, session]);
  useEffect(() => { if (workspace) { localStorage.setItem("mls-active-portal", portal); api("savePortalPreference", "POST", { defaultPortal: portal }).catch(() => {}); } }, [portal]);

  const clients = workspace?.admin?.clients || [];
  const interpreters = workspace?.admin?.interpreters || [];
  const assignments = workspace?.admin?.assignments || [];
  const adminClient = clients.find((x) => x.id === selectedClient) || clients[0];
  const adminInterpreter = interpreters.find((x) => x.id === selectedInterpreter) || interpreters[0];
  const clientView = workspace?.user?.isAdmin
    ? (adminClient ? { profile: adminClient, documents: adminClient.client_documents || [], assignments: assignments.filter((x) => x.client_id === adminClient.id), documentRequests: (workspace.admin?.documentRequests || []).filter((x) => x.client_id === adminClient.id) } : null)
    : workspace?.client;
  const interpreterView = workspace?.user?.isAdmin
    ? (adminInterpreter ? { profile: adminInterpreter, documents: adminInterpreter.interpreter_documents || [], documentRequests: (workspace.admin?.documentRequests || []).filter((x) => x.interpreter_id === adminInterpreter.id) } : null)
    : workspace?.interpreter;

  useEffect(() => { if (workspace?.user?.isAdmin && clientView?.profile) setClientDraft({ ...EMPTY_CLIENT, ...clientView.profile }); }, [clientView?.profile?.id]);
  useEffect(() => { if (workspace?.user?.isAdmin && interpreterView?.profile) setInterpreterDraft({ ...EMPTY_INTERPRETER, ...interpreterView.profile }); }, [interpreterView?.profile?.id]);

  const flash = (text) => { setSuccess(text); setTimeout(() => setSuccess(""), 4500); };
  const ownerId = (audience) => workspace?.user?.isAdmin ? (audience === "client" ? clientView?.profile?.id : interpreterView?.profile?.id) : undefined;

  async function saveClient(e) {
    e.preventDefault(); setSaving(true); setError("");
    try { const data = await api("saveClientProfile", "POST", { profile: clientDraft, ...(ownerId("client") ? { clientId: ownerId("client") } : {}) }); if (data.profile?.onboarding_complete) setClientOpen(false); flash("Client profile saved."); await load(true); } catch (x) { setError(x.message); } finally { setSaving(false); }
  }
  async function saveInterpreter(e) {
    e.preventDefault(); setSaving(true); setError("");
    try { workspace.user?.isAdmin ? await api("adminUpdateInterpreterProfile", "POST", { interpreterId: ownerId("interpreter"), profile: interpreterDraft }) : await api("saveProfile", "POST", { profile: interpreterDraft }); setInterpreterOpen(false); flash("Interpreter profile saved."); await load(true); } catch (x) { setError(x.message); } finally { setSaving(false); }
  }
  async function submitAssignment(e) {
    e.preventDefault(); setSaving(true); setError("");
    try { await api("createAssignment", "POST", { assignment: { ...assignmentDraft, start_at: new Date(assignmentDraft.start_at).toISOString(), end_at: assignmentDraft.end_at ? new Date(assignmentDraft.end_at).toISOString() : null, deaf_participants: Number(assignmentDraft.deaf_participants || 0), hearing_participants: Number(assignmentDraft.hearing_participants || 0) }, ...(ownerId("client") ? { clientId: ownerId("client") } : {}) }); setAssignmentDraft(EMPTY_ASSIGNMENT); setAssignmentOpen(false); flash("Interpreter request submitted."); await load(true); } catch (x) { setError(x.message); } finally { setSaving(false); }
  }
  async function upload(audience, type, file, replaceDocumentId) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return setError("Files must be 15 MB or smaller.");
    setBusyDoc(type); setError("");
    try {
      const signed = await api("createUploadUrl", "POST", { audienceType: audience, ownerId: ownerId(audience), documentType: type, fileName: file.name, fileSize: file.size });
      const result = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file);
      if (result.error) throw result.error;
      await api("recordUpload", "POST", { audienceType: audience, ownerId: ownerId(audience), documentType: type, fileName: file.name, storagePath: signed.path, replaceDocumentId });
      flash(replaceDocumentId ? "Document replaced." : "Document uploaded."); await load(true);
    } catch (x) { setError(x.message); } finally { setBusyDoc(""); }
  }
  async function openDoc(audience, doc) {
    try { const data = await api("createDocumentOpenLink", "POST", { audienceType: audience, ownerId: ownerId(audience), documentId: doc.id }); window.open(data.url, "_blank", "noopener,noreferrer"); } catch (x) { setError(x.message); }
  }
  async function removeDoc(audience, doc) {
    if (!confirm(`Delete ${doc.file_name}?`)) return;
    try { await api("deleteDocument", "POST", { audienceType: audience, ownerId: ownerId(audience), documentId: doc.id }); flash("Document deleted."); await load(true); } catch (x) { setError(x.message); }
  }
  async function inviteUser(e) {
    e.preventDefault(); setAdminBusy("invite");
    try { await api("invitePortalUser", "POST", invite); flash(`Invitation sent to ${invite.email}.`); setInvite({ role: "client", email: "", organizationName: "" }); } catch (x) { setError(x.message); } finally { setAdminBusy(""); }
  }
  async function requestDocument(e) {
    e.preventDefault(); setAdminBusy("request");
    try { await api("adminCreateDocumentRequest", "POST", docRequest); flash("Document request created."); setDocRequest({ audienceType: "client", ownerId: "", documentType: "service_agreement", title: "", instructions: "", dueDate: "" }); await load(true); } catch (x) { setError(x.message); } finally { setAdminBusy(""); }
  }
  async function updateAssignment(item, patch) {
    setAdminBusy(item.id);
    try { await api("adminUpdateAssignment", "POST", { assignmentId: item.id, ...patch }); flash("Assignment updated."); await load(true); } catch (x) { setError(x.message); } finally { setAdminBusy(""); }
  }

  if (!isSupabaseConfigured) return <PortalSetupNotice palette={palette} />;
  if (loading) return <div className="min-h-[70vh] bg-[#f7f3ef] px-5 py-16"><div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-16 text-center shadow-xl"><Loader2 className="mx-auto animate-spin text-[#721100]" size={32} /><h1 className="mt-5 text-2xl font-black">Preparing your MLS workspace</h1></div></div>;
  if (!workspace) return <div className="bg-[#f7f3ef] px-5 py-16"><Empty icon={AlertCircle} title="Portal unavailable" text={error || "Refresh and try again."} action={<button onClick={() => load()} className="rounded-full bg-[#721100] px-5 py-3 text-sm font-black text-white">Try again</button>} /></div>;

  const nav = [
    ["admin", "Admin", ShieldCheck], ["client", "Client", Building2], ["interpreter", "Interpreter", Users],
  ].filter(([value]) => workspace.availablePortals?.includes(value));

  return <section className="relative min-h-screen overflow-hidden bg-[#f7f3ef]"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(114,17,0,.08),transparent_26%),radial-gradient(circle_at_90%_5%,rgba(221,125,0,.12),transparent_24%)]" /><div className="relative mx-auto grid max-w-[96rem] gap-5 px-4 py-5 lg:grid-cols-[270px_minmax(0,1fr)] lg:px-6 lg:py-7"><aside className="self-start overflow-hidden rounded-[2rem] bg-[#24130e] text-white shadow-2xl lg:sticky lg:top-28"><div className="border-b border-white/10 p-5"><div className="flex items-center gap-3 rounded-2xl bg-white p-3"><img src={logo} alt="MLS" className="h-12 w-auto" /><div><p className="text-sm font-black text-[#464747]">Miqueas Language Solutions</p><p className="text-[10px] font-bold text-[#721100]">Bridging Perspectives. Delivering Understanding.</p></div></div><p className="mt-5 text-[10px] font-black uppercase tracking-[.18em] text-[#dd7d00]">Signed in as</p><p className="mt-1 truncate text-sm font-bold">{workspace.user.firstName || workspace.user.email}</p><p className="truncate text-xs text-white/50">{workspace.user.email}</p></div><nav className="space-y-2 p-4">{nav.map(([value, text, Icon]) => <button key={value} onClick={() => setPortal(value)} className={join("flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition", portal === value ? "bg-[#dd7d00] text-white shadow-lg" : "text-white/70 hover:bg-white/10")}><Icon size={18} /><span className="flex-1 text-left">{text} Portal</span><ArrowRight size={15} /></button>)}</nav><div className="border-t border-white/10 p-4"><button onClick={() => load(true)} disabled={refreshing} className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/75"><RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh</button><PortalSignOutButton /></div></aside><main className="min-w-0"><AnimatePresence mode="wait"><motion.div key={portal} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
    {error && <div className="mb-5 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} /><span className="flex-1">{error}</span><button onClick={() => setError("")}><X size={16} /></button></div>}
    {success && <div className="mb-5 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle2 size={18} />{success}</div>}
    {portal === "admin" && <AdminView workspace={workspace} invite={invite} setInvite={setInvite} inviteUser={inviteUser} docRequest={docRequest} setDocRequest={setDocRequest} requestDocument={requestDocument} updateAssignment={updateAssignment} adminBusy={adminBusy} openClient={(id) => { setSelectedClient(id); setPortal("client"); }} openInterpreter={(id) => { setSelectedInterpreter(id); setPortal("interpreter"); }} />}
    {portal === "client" && <ClientView view={clientView} isAdmin={workspace.user.isAdmin} records={clients} selected={selectedClient} setSelected={setSelectedClient} setup={() => setClientOpen(true)} request={() => setAssignmentOpen(true)} busy={busyDoc} upload={(t, f, id) => upload("client", t, f, id)} open={(d) => openDoc("client", d)} remove={(d) => removeDoc("client", d)} />}
    {portal === "interpreter" && <InterpreterView view={interpreterView} isAdmin={workspace.user.isAdmin} records={interpreters} selected={selectedInterpreter} setSelected={setSelectedInterpreter} setup={() => setInterpreterOpen(true)} busy={busyDoc} upload={(t, f, id) => upload("interpreter", t, f, id)} open={(d) => openDoc("interpreter", d)} remove={(d) => removeDoc("interpreter", d)} />}
  </motion.div></AnimatePresence></main></div>

  <Modal open={clientOpen} close={() => setClientOpen(false)} title="Client account setup"><ClientForm draft={clientDraft} setDraft={setClientDraft} submit={saveClient} saving={saving} /></Modal>
  <Modal open={interpreterOpen} close={() => setInterpreterOpen(false)} title="Interpreter profile"><InterpreterForm draft={interpreterDraft} setDraft={setInterpreterDraft} submit={saveInterpreter} saving={saving} /></Modal>
  <Modal open={assignmentOpen} close={() => setAssignmentOpen(false)} title="Request an interpreter" wide><AssignmentForm draft={assignmentDraft} setDraft={setAssignmentDraft} submit={submitAssignment} saving={saving} /></Modal>
  </section>;
}

function Hero({ eyebrow, title, text, children }) {
  return <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#721100] via-[#5b180b] to-[#2c1710] p-6 text-white shadow-2xl md:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#f6b34c]">{eyebrow}</p><h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{title}</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">{text}</p></div><div className="flex flex-wrap gap-3">{children}</div></div></div>;
}

function AdminView({ workspace, invite, setInvite, inviteUser, docRequest, setDocRequest, requestDocument, updateAssignment, adminBusy, openClient, openInterpreter }) {
  const clients = workspace.admin?.clients || [], interpreters = workspace.admin?.interpreters || [], assignments = workspace.admin?.assignments || [];
  return <div className="space-y-7"><Hero eyebrow="MLS operations center" title="Everything in one command center." text="Switch between portals, invite users, review assignment flow, and keep requested documents moving." />
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={Building2} name="Clients" value={clients.length} note="Active client profiles" /><Metric icon={Users} name="Interpreters" value={interpreters.length} note="Roster profiles" color={BRAND.gold} /><Metric icon={Clock3} name="Pending" value={assignments.filter((x) => x.status === "pending_confirmation").length} note="Awaiting confirmation" /><Metric icon={CheckCircle2} name="Confirmed" value={assignments.filter((x) => x.status === "confirmed").length} note="Upcoming work" color="#15803d" /><Metric icon={CircleDollarSign} name="Payment due" value={assignments.filter((x) => x.payment_status === "pending_payment").length} note="Pending payment" color="#c2410c" /></div>
  <div className="grid gap-5 xl:grid-cols-2"><form onSubmit={inviteUser} className="rounded-[2rem] bg-white p-6 shadow-xl"><SectionTitle eyebrow="Access" title="Send a portal invitation" text="The Clerk invitation assigns the correct portal role automatically." /><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field name="Role"><select className={INPUT} value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}><option value="client">Client</option><option value="interpreter">Interpreter</option></select></Field><Field name="Email" required><input className={INPUT} type="email" required value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} /></Field>{invite.role === "client" && <Field name="Organization" className="sm:col-span-2"><input className={INPUT} value={invite.organizationName} onChange={(e) => setInvite({ ...invite, organizationName: e.target.value })} /></Field>}</div><button disabled={adminBusy === "invite"} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-5 py-3 text-sm font-black text-white">{adminBusy === "invite" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Send invitation</button></form>
  <form onSubmit={requestDocument} className="rounded-[2rem] bg-white p-6 shadow-xl"><SectionTitle eyebrow="Documents" title="Request a file" text="The request appears in the recipient's upload center." /><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field name="Audience"><select className={INPUT} value={docRequest.audienceType} onChange={(e) => setDocRequest({ ...docRequest, audienceType: e.target.value, ownerId: "", documentType: e.target.value === "client" ? "service_agreement" : "resume" })}><option value="client">Client</option><option value="interpreter">Interpreter</option></select></Field><Field name="Recipient" required><select className={INPUT} required value={docRequest.ownerId} onChange={(e) => setDocRequest({ ...docRequest, ownerId: e.target.value })}><option value="">Choose</option>{(docRequest.audienceType === "client" ? clients : interpreters).map((x) => <option key={x.id} value={x.id}>{docRequest.audienceType === "client" ? x.organization_name || x.email : `${x.first_name || ""} ${x.last_name || ""}`.trim() || x.email}</option>)}</select></Field><Field name="Type"><select className={INPUT} value={docRequest.documentType} onChange={(e) => setDocRequest({ ...docRequest, documentType: e.target.value })}>{(docRequest.audienceType === "client" ? CLIENT_DOCS : INTERPRETER_DOCS).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></Field><Field name="Due date"><input className={INPUT} type="date" value={docRequest.dueDate} onChange={(e) => setDocRequest({ ...docRequest, dueDate: e.target.value })} /></Field><Field name="Title" className="sm:col-span-2" required><input className={INPUT} required value={docRequest.title} onChange={(e) => setDocRequest({ ...docRequest, title: e.target.value })} /></Field><Field name="Instructions" className="sm:col-span-2"><textarea className={join(INPUT, "min-h-20")} value={docRequest.instructions} onChange={(e) => setDocRequest({ ...docRequest, instructions: e.target.value })} /></Field></div><button disabled={adminBusy === "request"} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#dd7d00] px-5 py-3 text-sm font-black text-white">{adminBusy === "request" ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />} Create request</button></form></div>
  <div className="rounded-[2rem] bg-white p-6 shadow-xl"><SectionTitle eyebrow="Pipeline" title="Assignment requests" text="Update confirmation and payment states from one place." /><div className="mt-5 overflow-x-auto"><table className="min-w-full border-separate border-spacing-y-2 text-left text-sm"><thead><tr className="text-[11px] uppercase tracking-[.1em] text-slate-400"><th className="px-3">Client</th><th className="px-3">Assignment</th><th className="px-3">Date</th><th className="px-3">Status</th><th className="px-3">Payment</th></tr></thead><tbody>{assignments.slice(0, 20).map((x) => <tr key={x.id} className="bg-slate-50"><td className="rounded-l-2xl p-3 font-black">{x.clients?.organization_name || x.clients?.email}</td><td className="p-3"><b>{x.service_type}</b><p className="text-xs text-slate-400">{x.delivery_mode}</p></td><td className="p-3 text-xs font-bold">{formatDate(x.start_at)}</td><td className="p-3"><select disabled={adminBusy === x.id} className="rounded-xl border border-slate-200 p-2 text-xs font-bold" value={x.status} onChange={(e) => updateAssignment(x, { status: e.target.value })}><option value="pending_confirmation">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td><td className="rounded-r-2xl p-3"><select disabled={adminBusy === x.id} className="rounded-xl border border-slate-200 p-2 text-xs font-bold" value={x.payment_status} onChange={(e) => updateAssignment(x, { paymentStatus: e.target.value })}><option value="not_invoiced">Not invoiced</option><option value="pending_payment">Pending payment</option><option value="paid">Paid</option><option value="void">Void</option></select></td></tr>)}</tbody></table>{!assignments.length && <Empty icon={CalendarDays} title="No requests yet" text="Client requests will appear here." />}</div></div>
  <div className="grid gap-5 xl:grid-cols-2"><Directory title="Clients" records={clients} type="client" open={openClient} /><Directory title="Interpreters" records={interpreters} type="interpreter" open={openInterpreter} /></div></div>;
}

function Directory({ title, records, type, open }) {
  return <div className="rounded-[2rem] bg-white p-6 shadow-xl"><SectionTitle eyebrow="Directory" title={title} text={`${records.length} profiles`} /><div className="mt-5 space-y-3">{records.slice(0, 8).map((x) => { const main = type === "client" ? x.organization_name || x.email : `${x.first_name || ""} ${x.last_name || ""}`.trim() || x.email; return <button key={x.id} onClick={() => open(x.id)} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-white hover:shadow"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#721100]/10 font-black text-[#721100]">{main?.[0]}</span><span className="flex-1 truncate text-sm font-black text-slate-800">{main}</span><ArrowRight size={15} /></button>; })}{!records.length && <Empty icon={type === "client" ? Building2 : Users} title={`No ${type}s yet`} text="Use the invitation form above to get started." />}</div></div>;
}

function ClientView({ view, isAdmin, records, selected, setSelected, setup, request, busy, upload, open, remove }) {
  if (!view?.profile) return <Empty icon={Building2} title="No client selected" text="Invite or select a client to open this portal." />;
  const p = view.profile, assignments = view.assignments || [], docs = Object.fromEntries((view.documents || []).map((x) => [x.document_type, x])), requests = Object.fromEntries((view.documentRequests || []).map((x) => [x.document_type, x]));
  return <div className="space-y-7">{isAdmin && <div className="rounded-2xl bg-[#fff8eb] p-4"><Field name="Viewing client"><select className={INPUT} value={selected} onChange={(e) => setSelected(e.target.value)}>{records.map((x) => <option key={x.id} value={x.id}>{x.organization_name || x.email}</option>)}</select></Field></div>}<Hero eyebrow="Client portal" title={`Welcome, ${p.organization_name || p.primary_contact_name || "MLS client"}.`} text="Request communication access, upload preparation materials, and track assignments from request through payment."><button onClick={setup} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black"><Settings2 size={16} /> Account setup</button><button onClick={request} className="inline-flex items-center gap-2 rounded-2xl bg-[#dd7d00] px-5 py-3 text-sm font-black"><Plus size={16} /> Request interpreter</button></Hero>{!p.onboarding_complete && !isAdmin && <button onClick={setup} className="flex w-full items-center gap-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-left"><AlertCircle /><span><b>Complete your first-time setup</b><small className="mt-1 block text-amber-700">Add contact and billing information to prevent confirmation delays.</small></span></button>}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Clock3} name="Pending" value={assignments.filter((x) => x.status === "pending_confirmation").length} note="Awaiting confirmation" /><Metric icon={CheckCircle2} name="Confirmed" value={assignments.filter((x) => x.status === "confirmed").length} note="Upcoming work" color="#15803d" /><Metric icon={CircleDollarSign} name="Payment due" value={assignments.filter((x) => x.payment_status === "pending_payment").length} note="Invoices pending" color="#c2410c" /><Metric icon={FileCheck2} name="Paid" value={assignments.filter((x) => x.payment_status === "paid").length} note="Payment complete" color={BRAND.gold} /></div>
  <div className="rounded-[2rem] bg-white p-6 shadow-xl"><SectionTitle eyebrow="Assignments" title="Requests and status" text="Every request stays visible through confirmation and payment." action={<button onClick={request} className="rounded-2xl bg-[#721100] px-4 py-3 text-sm font-black text-white">New request</button>} /><div className="mt-5 space-y-3">{assignments.map((x) => <div key={x.id} className="rounded-[1.4rem] bg-slate-50 p-5"><div className="flex flex-wrap gap-2"><b>{x.service_type}</b><Badge value={x.status} /><Badge value={x.payment_status} /></div><p className="mt-2 text-sm font-bold text-slate-600">{formatDate(x.start_at)} · {x.delivery_mode}</p><p className="mt-1 text-xs text-slate-400">{x.location_name || x.meeting_link || x.description}</p></div>)}{!assignments.length && <Empty icon={CalendarDays} title="No assignments yet" text="Submit your first request when communication access is needed." />}</div></div>
  <div className="rounded-[2rem] bg-white p-6 shadow-xl"><SectionTitle eyebrow="Documents" title="Secure upload center" text="Drag and drop requested documents or preparation materials." /><div className="mt-5 grid gap-4 lg:grid-cols-2">{CLIENT_DOCS.map(([type, title]) => <DocumentCard key={type} type={type} title={title} document={docs[type]} request={requests[type]} busy={busy} upload={upload} open={open} remove={remove} />)}</div></div></div>;
}

function InterpreterView({ view, isAdmin, records, selected, setSelected, setup, busy, upload, open, remove }) {
  if (!view?.profile) return <Empty icon={Users} title="No interpreter selected" text="Save or select an interpreter profile." action={!isAdmin && <button onClick={setup} className="rounded-full bg-[#721100] px-5 py-3 text-sm font-black text-white">Start profile</button>} />;
  const p = view.profile, docs = Object.fromEntries((view.documents || []).map((x) => [x.document_type, x])), requests = Object.fromEntries((view.documentRequests || []).map((x) => [x.document_type, x]));
  const complete = Math.round(([p.phone, p.current_location, p.credentials, p.modalities, p.areas_of_experience, p.assignment_type_preference].filter(Boolean).length / 6) * 100);
  return <div className="space-y-7">{isAdmin && <div className="rounded-2xl bg-[#fff8eb] p-4"><Field name="Viewing interpreter"><select className={INPUT} value={selected} onChange={(e) => setSelected(e.target.value)}>{records.map((x) => <option key={x.id} value={x.id}>{`${x.first_name || ""} ${x.last_name || ""}`.trim() || x.email}</option>)}</select></Field></div>}<Hero eyebrow="Interpreter portal" title={`${p.first_name || "Interpreter"}, keep your MLS profile assignment-ready.`} text="Manage credentials, availability, requested documents, and assignment-matching details."><button onClick={setup} className="inline-flex items-center gap-2 rounded-2xl bg-[#dd7d00] px-5 py-3 text-sm font-black"><Settings2 size={16} /> Edit profile</button></Hero>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={LayoutDashboard} name="Profile" value={`${complete}%`} note="Core details complete" /><Metric icon={ShieldCheck} name="Roster" value={label(p.roster_status)} note="Current status" color={BRAND.gold} /><Metric icon={FileCheck2} name="Documents" value={(view.documents || []).length} note="Secure files" color="#15803d" /><Metric icon={Clock3} name="Requests" value={(view.documentRequests || []).filter((x) => ["requested", "viewed", "overdue"].includes(x.status)).length} note="Outstanding" color="#c2410c" /></div>
  <div className="rounded-[2rem] bg-white p-6 shadow-xl"><SectionTitle eyebrow="Profile" title="Assignment-matching snapshot" text="MLS uses this information to match skill, modality, location, and setting appropriately." /><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Credentials", p.credentials], ["Location", p.current_location], ["Modalities", p.modalities], ["Experience", p.years_experience], ["Settings", p.areas_of_experience], ["Preference", p.assignment_type_preference], ["Travel", p.willing_to_travel], ["PLI", p.professional_liability_insurance]].map(([n, v]) => <div key={n} className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[.1em] text-slate-400">{n}</p><p className="mt-2 text-sm font-bold text-slate-700">{v || "Not provided"}</p></div>)}</div></div>
  <div className="rounded-[2rem] bg-white p-6 shadow-xl"><SectionTitle eyebrow="Documents" title="Requested onboarding files" text="Upload only what MLS requests, then replace the file whenever a new version is needed." /><div className="mt-5 grid gap-4 lg:grid-cols-2">{INTERPRETER_DOCS.map(([type, title]) => <DocumentCard key={type} type={type} title={title} document={docs[type]} request={requests[type]} busy={busy} upload={upload} open={open} remove={remove} />)}</div></div></div>;
}

function ClientForm({ draft, setDraft, submit, saving }) {
  const set = (name) => (e) => setDraft({ ...draft, [name]: e.target.value });
  return <form onSubmit={submit} className="space-y-7"><SectionTitle eyebrow="First-time setup" title="Organization and contact" text="Complete this once so requests, billing, and confirmations route correctly." /><div className="grid gap-4 md:grid-cols-2"><Field name="Organization" required><input className={INPUT} required value={draft.organization_name} onChange={set("organization_name")} /></Field><Field name="Primary contact" required><input className={INPUT} required value={draft.primary_contact_name} onChange={set("primary_contact_name")} /></Field><Field name="Phone" required><input className={INPUT} required value={draft.phone} onChange={set("phone")} /></Field><Field name="Preferred contact"><select className={INPUT} value={draft.preferred_contact_method} onChange={set("preferred_contact_method")}><option>Email</option><option>Phone</option><option>Text</option></select></Field><Field name="Industry"><input className={INPUT} value={draft.industry} onChange={set("industry")} /></Field><Field name="Billing email" required><input className={INPUT} type="email" required value={draft.billing_email} onChange={set("billing_email")} /></Field><Field name="Billing phone"><input className={INPUT} value={draft.billing_phone} onChange={set("billing_phone")} /></Field><Field name="Address" className="md:col-span-2"><input className={INPUT} value={draft.address_line_1} onChange={set("address_line_1")} /></Field><Field name="City"><input className={INPUT} value={draft.city} onChange={set("city")} /></Field><Field name="State"><input className={INPUT} value={draft.state} onChange={set("state")} /></Field><Field name="Postal code"><input className={INPUT} value={draft.postal_code} onChange={set("postal_code")} /></Field><Field name="Default service"><select className={INPUT} value={draft.default_service_type} onChange={set("default_service_type")}><option>ASL/English Interpreting</option><option>Certified Deaf Interpreter Team</option><option>DeafBlind / ProTactile Access</option><option>ASL Video Translation</option></select></Field><Field name="Default delivery"><select className={INPUT} value={draft.default_delivery_mode} onChange={set("default_delivery_mode")}><option>On-site</option><option>VRI</option><option>Hybrid</option></select></Field><Field name="Communication preferences" className="md:col-span-2"><textarea className={join(INPUT, "min-h-24")} value={draft.communication_preferences} onChange={set("communication_preferences")} /></Field><Field name="Billing notes" className="md:col-span-2"><textarea className={join(INPUT, "min-h-24")} value={draft.billing_notes} onChange={set("billing_notes")} /></Field></div><button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-6 py-3.5 text-sm font-black text-white">{saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />} Save setup</button></form>;
}

function InterpreterForm({ draft, setDraft, submit, saving }) {
  const set = (name) => (e) => setDraft({ ...draft, [name]: e.target.value });
  return <form onSubmit={submit} className="space-y-7"><SectionTitle eyebrow="Professional profile" title="Contact and qualifications" text="Keep details current for ethical assignment matching." /><div className="grid gap-4 md:grid-cols-2"><Field name="First name" required><input className={INPUT} required value={draft.first_name} onChange={set("first_name")} /></Field><Field name="Last name" required><input className={INPUT} required value={draft.last_name} onChange={set("last_name")} /></Field><Field name="Phone"><input className={INPUT} value={draft.phone} onChange={set("phone")} /></Field><Field name="Location"><input className={INPUT} value={draft.current_location} onChange={set("current_location")} /></Field><Field name="Credentials"><textarea className={join(INPUT, "min-h-20")} value={draft.credentials} onChange={set("credentials")} /></Field><Field name="Modalities"><textarea className={join(INPUT, "min-h-20")} value={draft.modalities} onChange={set("modalities")} /></Field><Field name="Years of experience"><input className={INPUT} value={draft.years_experience} onChange={set("years_experience")} /></Field><Field name="State license"><input className={INPUT} value={draft.state_license} onChange={set("state_license")} /></Field><Field name="Areas of experience" className="md:col-span-2"><textarea className={join(INPUT, "min-h-28")} value={draft.areas_of_experience} onChange={set("areas_of_experience")} /></Field><Field name="Assignment preferences" className="md:col-span-2"><textarea className={join(INPUT, "min-h-24")} value={draft.assignment_type_preference} onChange={set("assignment_type_preference")} /></Field><Field name="Travel willingness"><input className={INPUT} value={draft.willing_to_travel} onChange={set("willing_to_travel")} /></Field><Field name="Travel radius"><input className={INPUT} value={draft.travel_radius} onChange={set("travel_radius")} /></Field><Field name="Liability insurance"><input className={INPUT} value={draft.professional_liability_insurance} onChange={set("professional_liability_insurance")} /></Field><Field name="Technical readiness"><input className={INPUT} value={draft.technical_readiness_confirmed} onChange={set("technical_readiness_confirmed")} /></Field>{["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => <Field key={day} name={`${label(day)} availability`}><input className={INPUT} value={draft[`availability_${day}`]} onChange={set(`availability_${day}`)} placeholder="Example: 8 AM–2 PM ET" /></Field>)}</div><button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-6 py-3.5 text-sm font-black text-white">{saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />} Save profile</button></form>;
}

function AssignmentForm({ draft, setDraft, submit, saving }) {
  const set = (name) => (e) => setDraft({ ...draft, [name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  return <form onSubmit={submit} className="space-y-7"><SectionTitle eyebrow="New request" title="Assignment basics" text="Share enough context for the right interpreter configuration without unnecessary confidential information." /><div className="grid gap-4 md:grid-cols-2"><Field name="Service" required><select className={INPUT} value={draft.service_type} onChange={set("service_type")}><option>ASL/English Interpreting</option><option>Certified Deaf Interpreter Team</option><option>DeafBlind / ProTactile Access</option><option>Trilingual Interpreting</option></select></Field><Field name="Delivery" required><select className={INPUT} value={draft.delivery_mode} onChange={set("delivery_mode")}><option>On-site</option><option>VRI</option><option>Hybrid</option></select></Field><Field name="Start" required><input className={INPUT} type="datetime-local" required value={draft.start_at} onChange={set("start_at")} /></Field><Field name="End"><input className={INPUT} type="datetime-local" value={draft.end_at} onChange={set("end_at")} /></Field><Field name="Time zone"><select className={INPUT} value={draft.timezone} onChange={set("timezone")}><option value="America/New_York">Eastern</option><option value="America/Chicago">Central</option><option value="America/Denver">Mountain</option><option value="America/Los_Angeles">Pacific</option><option value="America/Puerto_Rico">Atlantic</option><option value="America/Santo_Domingo">Dominican Republic</option></select></Field><Field name="Specialty"><select className={INPUT} value={draft.specialty} onChange={set("specialty")}><option>General / Community</option><option>Medical</option><option>Legal</option><option>Mental Health</option><option>Education K-12</option><option>Post-Secondary</option><option>Conference / Platform</option><option>Employment / Corporate</option></select></Field>{draft.delivery_mode === "VRI" ? <Field name="Meeting link" className="md:col-span-2"><input className={INPUT} value={draft.meeting_link} onChange={set("meeting_link")} /></Field> : <><Field name="Location" className="md:col-span-2"><input className={INPUT} value={draft.location_name} onChange={set("location_name")} /></Field><Field name="Address" className="md:col-span-2"><input className={INPUT} value={draft.address_line_1} onChange={set("address_line_1")} /></Field><Field name="City"><input className={INPUT} value={draft.city} onChange={set("city")} /></Field><Field name="State"><input className={INPUT} value={draft.state} onChange={set("state")} /></Field></>}<Field name="Deaf / HOH participants"><input className={INPUT} type="number" min="0" value={draft.deaf_participants} onChange={set("deaf_participants")} /></Field><Field name="Hearing participants"><input className={INPUT} type="number" min="0" value={draft.hearing_participants} onChange={set("hearing_participants")} /></Field><Field name="Language preferences"><input className={INPUT} value={draft.language_preferences} onChange={set("language_preferences")} /></Field><Field name="Client reference"><input className={INPUT} value={draft.client_reference} onChange={set("client_reference")} /></Field><label className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4"><input type="checkbox" checked={draft.team_requested} onChange={set("team_requested")} /><span className="text-sm font-black">Interpreter team requested</span></label><label className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4"><input type="checkbox" checked={draft.cdi_requested} onChange={set("cdi_requested")} /><span className="text-sm font-black">Certified Deaf Interpreter requested</span></label><Field name="Description" className="md:col-span-2" required><textarea className={join(INPUT, "min-h-32")} required value={draft.description} onChange={set("description")} /></Field><Field name="Preparation materials" className="md:col-span-2"><textarea className={join(INPUT, "min-h-24")} value={draft.preparation_materials} onChange={set("preparation_materials")} /></Field><Field name="Purchase order"><input className={INPUT} value={draft.purchase_order_number} onChange={set("purchase_order_number")} /></Field></div><button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-6 py-3.5 text-sm font-black text-white">{saving ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} Submit request</button></form>;
}
