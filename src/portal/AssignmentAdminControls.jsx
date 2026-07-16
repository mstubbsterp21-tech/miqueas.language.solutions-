import { useEffect, useState } from "react";
import { CalendarPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { EMPTY_ASSIGNMENT } from "./forms";
import { Field, INPUT, Modal, cx } from "./ui";

function toLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function initialDraft(assignment) {
  if (!assignment) return { ...EMPTY_ASSIGNMENT };
  return {
    ...EMPTY_ASSIGNMENT,
    ...assignment,
    start_at: toLocal(assignment.start_at),
    end_at: toLocal(assignment.end_at),
  };
}

function AssignmentForm({ assignment, clients, actions, close }) {
  const [clientId, setClientId] = useState(assignment?.client_id || clients?.[0]?.id || "");
  const [draft, setDraft] = useState(() => initialDraft(assignment));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(assignment?.id);
  const set = (name) => (event) => setDraft((current) => ({ ...current, [name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...draft,
        deaf_participants: draft.deaf_participants === "" ? null : Number(draft.deaf_participants),
        hearing_participants: draft.hearing_participants === "" ? null : Number(draft.hearing_participants),
      };
      if (editing) await actions.updateAssignment(assignment, { assignment: payload });
      else await actions.createAssignment({ clientId, assignment: payload });
      close();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : String(actionError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="Client" required><select className={INPUT} required disabled={editing} value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Choose a client</option>{(clients || []).map((client) => <option key={client.id} value={client.id}>{client.organization_name || client.primary_contact_name || client.email}</option>)}</select></Field>
        <Field name="Service type" required><input className={INPUT} required value={draft.service_type || ""} onChange={set("service_type")} /></Field>
        <Field name="Delivery mode" required><select className={INPUT} required value={draft.delivery_mode || "On-site"} onChange={set("delivery_mode")}><option>On-site</option><option>VRI</option><option>Hybrid</option></select></Field>
        <Field name="Timezone"><input className={INPUT} value={draft.timezone || "America/New_York"} onChange={set("timezone")} /></Field>
        <Field name="Start" required><input className={INPUT} type="datetime-local" required value={draft.start_at || ""} onChange={set("start_at")} /></Field>
        <Field name="End"><input className={INPUT} type="datetime-local" value={draft.end_at || ""} onChange={set("end_at")} /></Field>
        <Field name="Location name"><input className={INPUT} value={draft.location_name || ""} onChange={set("location_name")} /></Field>
        <Field name="Meeting link"><input className={INPUT} type="url" value={draft.meeting_link || ""} onChange={set("meeting_link")} /></Field>
        <Field name="Address" className="md:col-span-2"><input className={INPUT} value={draft.address_line_1 || ""} onChange={set("address_line_1")} /></Field>
        <Field name="Address line 2" className="md:col-span-2"><input className={INPUT} value={draft.address_line_2 || ""} onChange={set("address_line_2")} /></Field>
        <Field name="City"><input className={INPUT} value={draft.city || ""} onChange={set("city")} /></Field>
        <Field name="State"><input className={INPUT} value={draft.state || ""} onChange={set("state")} /></Field>
        <Field name="Postal code"><input className={INPUT} value={draft.postal_code || ""} onChange={set("postal_code")} /></Field>
        <Field name="Specialty"><input className={INPUT} value={draft.specialty || ""} onChange={set("specialty")} /></Field>
        <Field name="Language preferences"><input className={INPUT} value={draft.language_preferences || ""} onChange={set("language_preferences")} /></Field>
        <Field name="Deaf participants"><input className={INPUT} type="number" min="0" value={draft.deaf_participants ?? ""} onChange={set("deaf_participants")} /></Field>
        <Field name="Hearing participants"><input className={INPUT} type="number" min="0" value={draft.hearing_participants ?? ""} onChange={set("hearing_participants")} /></Field>
        <Field name="On-site contact"><input className={INPUT} value={draft.onsite_contact_name || ""} onChange={set("onsite_contact_name")} /></Field>
        <Field name="On-site phone"><input className={INPUT} value={draft.onsite_contact_phone || ""} onChange={set("onsite_contact_phone")} /></Field>
        <Field name="Purchase order"><input className={INPUT} value={draft.purchase_order_number || ""} onChange={set("purchase_order_number")} /></Field>
        <Field name="Client reference"><input className={INPUT} value={draft.client_reference || ""} onChange={set("client_reference")} /></Field>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={Boolean(draft.team_requested)} onChange={set("team_requested")} /> Team requested</label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={Boolean(draft.cdi_requested)} onChange={set("cdi_requested")} /> CDI requested</label>
        <Field name="Assignment details" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-32")} value={draft.description || ""} onChange={set("description")} /></Field>
        <Field name="Preparation materials / notes" className="md:col-span-2"><textarea className={cx(INPUT, "min-h-28")} value={draft.preparation_materials || ""} onChange={set("preparation_materials")} /></Field>
      </div>
      <div className="flex justify-end"><button type="submit" disabled={saving || !clientId} className="inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={16} /> : editing ? <Pencil size={16} /> : <CalendarPlus size={16} />}{editing ? "Save and sync assignment" : "Create and sync assignment"}</button></div>
    </form>
  );
}

export function NewAssignmentControl({ clients, actions }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#dd7d00] px-4 py-3 text-sm font-black text-white"><CalendarPlus size={16} />New assignment</button><Modal open={open} close={() => setOpen(false)} title="Create assignment" wide><AssignmentForm clients={clients} actions={actions} close={() => setOpen(false)} /></Modal></>;
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
  return (
    <div className="flex flex-wrap justify-end gap-3">
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#721100]"><Pencil size={16} />Edit assignment</button>
      <button type="button" onClick={remove} className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700"><Trash2 size={16} />Delete assignment</button>
      <Modal open={open} close={() => setOpen(false)} title="Edit assignment" wide><AssignmentForm assignment={assignment} clients={clients} actions={actions} close={() => setOpen(false)} /></Modal>
    </div>
  );
}
