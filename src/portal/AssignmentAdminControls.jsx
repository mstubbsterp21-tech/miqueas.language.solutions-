import { useEffect, useState } from "react";
import { Building2, CalendarPlus, Check, Loader2, MapPin, MonitorPlay, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { EMPTY_ASSIGNMENT } from "./forms";
import PortalInterpreterRequestForm from "./PortalInterpreterRequestForm";
import { Field, INPUT, Modal, cx } from "./ui";

const SERVICES = ["ASL/English Interpreting", "Certified Deaf Interpreter Team", "DeafBlind / ProTactile Access", "ASL Video Translation"];
const DELIVERY = [["On-site", MapPin], ["VRI", MonitorPlay], ["Hybrid", Users]];
const SPECIALTIES = ["General / Community", "Medical", "Legal", "Mental Health", "K-12 Education", "Post-Secondary Education", "Platform / Conference", "Performance / Arts", "Cruise", "Other"];
const LANGUAGES = ["ASL", "Tactile ASL / ProTactile", "English", "Spanish", "Other"];

function toLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function initialDraft(assignment) {
  if (!assignment) return { ...EMPTY_ASSIGNMENT };
  return { ...EMPTY_ASSIGNMENT, ...assignment, start_at: toLocal(assignment.start_at), end_at: toLocal(assignment.end_at) };
}

function RadioCards({ value, options, onChange, columns = "sm:grid-cols-2" }) {
  return <div className={cx("grid gap-3", columns)}>{options.map((option) => { const label = Array.isArray(option) ? option[0] : option; const Icon = Array.isArray(option) ? option[1] : null; const active = value === label; return <button key={label} type="button" onClick={() => onChange(label)} className={cx("flex items-center gap-3 rounded-2xl border p-4 text-left transition", active ? "border-[#dd7d00] bg-[#fff6e8] text-[#721100] shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-[#dd7d00]/45")}><span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", active ? "bg-[#721100] text-white" : "bg-slate-100 text-slate-500")}>{active ? <Check size={16} /> : Icon ? <Icon size={16} /> : <span className="h-3 w-3 rounded-full border-2 border-current" />}</span><span className="text-sm font-black">{label}</span></button>; })}</div>;
}

function CheckPills({ value, options, onChange }) {
  const selected = String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  const toggle = (option) => onChange(selected.includes(option) ? selected.filter((item) => item !== option).join(", ") : [...selected, option].join(", "));
  return <div className="flex flex-wrap gap-2">{options.map((option) => { const active = selected.includes(option); return <button key={option} type="button" onClick={() => toggle(option)} className={cx("rounded-full border px-3 py-2 text-xs font-black transition", active ? "border-[#dd7d00] bg-[#fff4df] text-[#721100]" : "border-slate-200 bg-white text-slate-600")}><span className="mr-1 inline-block w-3">{active ? "✓" : ""}</span>{option}</button>; })}</div>;
}

function Section({ title, text, children }) {
  return <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5"><h3 className="text-lg font-black text-slate-950">{title}</h3>{text && <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>}<div className="mt-5">{children}</div></section>;
}

function AssignmentForm({ assignment, clients, actions, close }) {
  const [clientId, setClientId] = useState(assignment?.client_id || clients?.[0]?.id || "");
  const [draft, setDraft] = useState(() => initialDraft(assignment));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(assignment?.id);
  const set = (name) => (event) => setDraft((current) => ({ ...current, [name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const choose = (name, value) => setDraft((current) => ({ ...current, [name]: value }));

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...draft, specialty: draft.specialty === "Other" ? `Other: ${String(draft.specialty_other || "").trim()}` : draft.specialty, deaf_participants: draft.deaf_participants === "" ? null : Number(draft.deaf_participants), hearing_participants: draft.hearing_participants === "" ? null : Number(draft.hearing_participants) };
      delete payload.specialty_other;
      if (editing) await actions.updateAssignment(assignment, { assignment: payload });
      else await actions.createAssignment({ clientId, assignment: payload });
      close();
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : String(actionError)); }
    finally { setSaving(false); }
  }

  return <form onSubmit={submit} className="space-y-5">{error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div>}
    <Section title="Client and service" text="Choose the same core details used in the Interpreter Request Form."><div className="space-y-5"><Field name="Client" required><select className={INPUT} required disabled={editing} value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Choose a client</option>{(clients || []).map((client) => <option key={client.id} value={client.id}>{client.organization_name || client.primary_contact_name || client.email}</option>)}</select></Field><div><p className="mb-2 text-sm font-bold text-slate-600">Service type *</p><RadioCards value={draft.service_type} options={SERVICES} onChange={(value) => choose("service_type", value)} /></div><div><p className="mb-2 text-sm font-bold text-slate-600">Delivery mode *</p><RadioCards value={draft.delivery_mode} options={DELIVERY} onChange={(value) => choose("delivery_mode", value)} columns="sm:grid-cols-3" /></div></div></Section>
    <Section title="Schedule" text="Times are stored with the selected assignment time zone."><div className="grid gap-4 md:grid-cols-2"><Field name="Start" required><input className={INPUT} type="datetime-local" required value={draft.start_at || ""} onChange={set("start_at")} /></Field><Field name="End"><input className={INPUT} type="datetime-local" value={draft.end_at || ""} onChange={set("end_at")} /></Field><Field name="Timezone"><select className={INPUT} value={draft.timezone || "America/New_York"} onChange={set("timezone")}><option value="America/New_York">Eastern</option><option value="America/Chicago">Central</option><option value="America/Denver">Mountain</option><option value="America/Los_Angeles">Pacific</option><option value="America/Puerto_Rico">Atlantic</option></select></Field><Field name="Specialty"><select className={INPUT} value={draft.specialty || "General / Community"} onChange={set("specialty")}>{SPECIALTIES.map((item) => <option key={item}>{item}</option>)}</select></Field>{draft.specialty === "Other" && <Field name="Describe the other setting" required><input className={INPUT} required value={draft.specialty_other || ""} onChange={set("specialty_other")} placeholder="Describe the community, event, or environment" /></Field>}</div></Section>
    <Section title={draft.delivery_mode === "VRI" ? "Virtual access" : "Location"}><div className="grid gap-4 md:grid-cols-2">{draft.delivery_mode !== "VRI" && <><Field name="Location name"><input className={INPUT} value={draft.location_name || ""} onChange={set("location_name")} placeholder="Facility or venue" /></Field>{draft.delivery_mode === "Hybrid" && <Field name="Meeting link"><input className={INPUT} type="url" value={draft.meeting_link || ""} onChange={set("meeting_link")} /></Field>}<Field name="Address" className="md:col-span-2"><input className={INPUT} value={draft.address_line_1 || ""} onChange={set("address_line_1")} /></Field><Field name="Address line 2" className="md:col-span-2"><input className={INPUT} value={draft.address_line_2 || ""} onChange={set("address_line_2")} /></Field><Field name="City"><input className={INPUT} value={draft.city || ""} onChange={set("city")} /></Field><Field name="State"><input className={INPUT} value={draft.state || ""} onChange={set("state")} /></Field><Field name="Postal code"><input className={INPUT} value={draft.postal_code || ""} onChange={set("postal_code")} /></Field></>}{draft.delivery_mode === "VRI" && <Field name="Meeting link" className="md:col-span-2"><input className={INPUT} type="url" value={draft.meeting_link || ""} onChange={set("meeting_link")} /></Field>}</div></Section>
    <Section title="Participants and access"><div className="grid gap-5 md:grid-cols-2"><Field name="Deaf participants"><input className={INPUT} type="number" min="0" value={draft.deaf_participants ?? ""} onChange={set("deaf_participants")} /></Field><Field name="Hearing participants"><input className={INPUT} type="number" min="0" value={draft.hearing_participants ?? ""} onChange={set("hearing_participants")} /></Field><div className="md:col-span-2"><p className="mb-2 text-sm font-bold text-slate-600">Language and communication preferences</p><CheckPills value={draft.language_preferences} options={LANGUAGES} onChange={(value) => choose("language_preferences", value)} /></div><label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={Boolean(draft.team_requested)} onChange={set("team_requested")} />Interpreter team requested</label><label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={Boolean(draft.cdi_requested)} onChange={set("cdi_requested")} />Certified Deaf Interpreter requested</label></div></Section>
    <Section title="Contacts and preparation"><div className="grid gap-4 md:grid-cols-2"><Field name="On-site contact"><input className={INPUT} value={draft.onsite_contact_name || ""} onChange={set("onsite_contact_name")} /></Field><Field name="On-site phone"><input className={INPUT} value={draft.onsite_contact_phone || ""} onChange={set("onsite_contact_phone")} /></Field><Field name="Purchase order"><input className={INPUT} value={draft.purchase_order_number || ""} onChange={set("purchase_order_number")} /></Field><Field name="Client reference"><input className={INPUT} value={draft.client_reference || ""} onChange={set("client_reference")} /></Field><Field name="Assignment details" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-32")} value={draft.description || ""} onChange={set("description")} /></Field><Field name="Preparation materials / notes" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-28")} value={draft.preparation_materials || ""} onChange={set("preparation_materials")} /></Field></div></Section>
    <div className="sticky bottom-3 flex justify-end rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur"><button type="submit" disabled={saving || !clientId} className="inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={16} /> : <Pencil size={16} />}Save and sync assignment</button></div>
  </form>;
}

function ClientPathChoice({ value, onChange }) {
  const choices = [
    { value: "existing", icon: Building2, title: "Existing client", text: "Select a saved MLS client. Their contact, billing, and communication preferences will be used automatically." },
    { value: "new", icon: UserPlus, title: "New client", text: "Create the client profile and assignment together, starting with complete contact and billing details." },
  ];
  return <div className="grid gap-4 md:grid-cols-2">{choices.map(({ value: optionValue, icon: Icon, title, text }) => <button key={optionValue} type="button" onClick={() => onChange(optionValue)} className={cx("rounded-[1.5rem] border p-5 text-left transition", value === optionValue ? "border-[#dd7d00] bg-[#fff6e8] shadow-md" : "border-slate-200 bg-white hover:border-[#dd7d00]/50")}><span className={cx("flex h-11 w-11 items-center justify-center rounded-2xl", value === optionValue ? "bg-[#721100] text-white" : "bg-slate-100 text-slate-600")}><Icon size={20} /></span><p className="mt-4 text-base font-black text-slate-950">{title}</p><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></button>)}</div>;
}

export function NewAssignmentControl({ clients, actions }) {
  const [open, setOpen] = useState(false);
  const [clientMode, setClientMode] = useState("");
  const [clientId, setClientId] = useState("");
  const client = (clients || []).find((item) => item.id === clientId) || null;

  function close() {
    setOpen(false);
    setClientMode("");
    setClientId("");
  }

  function changeMode(mode) {
    setClientMode(mode);
    setClientId("");
  }

  return <><button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#dd7d00] px-4 py-3 text-sm font-black text-white"><CalendarPlus size={16} />New assignment</button><Modal open={open} close={close} title="Create assignment" subtitle="Begin by choosing whether MLS is working with a new or existing client." wide>
    {!clientMode && <div className="space-y-5"><div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-black text-slate-950">Who is this assignment for?</p><p className="mt-1 text-sm leading-6 text-slate-500">This choice controls whether the form starts with client setup or goes directly to assignment details.</p></div><ClientPathChoice value={clientMode} onChange={changeMode} /></div>}

    {clientMode && <div className="mb-5 flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#dd7d00]">Client path</p><p className="mt-1 text-sm font-black text-slate-950">{clientMode === "existing" ? "Existing client" : "New client"}</p></div><button type="button" onClick={() => changeMode("")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#721100]">Change</button></div>}

    {clientMode === "existing" && <>
      <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-white p-5"><Field name="Existing client" required><select className={INPUT} required value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Choose a client</option>{(clients || []).map((item) => <option key={item.id} value={item.id}>{item.organization_name || item.primary_contact_name || item.email}</option>)}</select></Field></div>
      {client ? <PortalInterpreterRequestForm key={client.id} client={client} existingClient source="admin_portal" onSubmit={(assignment) => actions.createAssignment({ clientMode: "existing", clientId: client.id, assignment })} /> : <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">Choose an existing client to begin with Assignment Details.</div>}
    </>}

    {clientMode === "new" && <PortalInterpreterRequestForm key="new-client" client={null} existingClient={false} source="admin_portal" onSubmit={(assignment, request) => actions.createAssignment({ clientMode: "new", newClient: request, assignment })} />}
  </Modal></>;
}

export default function AssignmentAdminControls({ assignment, clients, actions }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [assignment?.id]);
  if (!assignment?.id) return null;
  async function remove() {
    const confirmation = window.prompt(`Permanently delete ${assignment.service_type}?\n\nGoogle Calendar and Drive records will also be removed. Assignments with financial, time, expense, agreement, or staffing history cannot be deleted.\n\nType DELETE to continue.`);
    if (confirmation !== "DELETE") return;
    await actions.deleteAssignment(assignment, confirmation);
  }
  return <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#721100]"><Pencil size={16} />Edit assignment</button><button type="button" onClick={remove} className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700"><Trash2 size={16} />Delete assignment</button><Modal open={open} close={() => setOpen(false)} title="Edit assignment" wide><AssignmentForm assignment={assignment} clients={clients} actions={actions} close={() => setOpen(false)} /></Modal></div>;
}
