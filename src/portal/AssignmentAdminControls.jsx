import { useState } from "react";
import { Building2, CalendarPlus, Pencil, Trash2, UserPlus } from "lucide-react";
import PortalInterpreterRequestForm, { initialValuesFromAssignment } from "./PortalInterpreterRequestForm";
import { Field, INPUT, Modal, cx } from "./ui";

function ClientPathChoice({ value, onChange }) {
  const choices = [
    { value: "existing", icon: Building2, title: "Existing client", text: "Select a saved MLS client. Their contact, billing, and request defaults will be used automatically." },
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

  return <><button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#dd7d00] px-4 py-3 text-sm font-black text-white"><CalendarPlus size={16} />New assignment</button><Modal open={open} close={close} title="Create assignment" subtitle="Use the same Interpreter Request workflow for every client and portal." wide>
    {!clientMode && <div className="space-y-5"><div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-black text-slate-950">Who is this assignment for?</p><p className="mt-1 text-sm leading-6 text-slate-500">This choice controls whether the shared request form starts with client setup or saved client defaults.</p></div><ClientPathChoice value={clientMode} onChange={changeMode} /></div>}

    {clientMode && <div className="mb-5 flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#dd7d00]">Client path</p><p className="mt-1 text-sm font-black text-slate-950">{clientMode === "existing" ? "Existing client" : "New client"}</p></div><button type="button" onClick={() => changeMode("")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#721100]">Change</button></div>}

    {clientMode === "existing" && <>
      <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-white p-5"><Field name="Existing client" required><select className={INPUT} required value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Choose a client</option>{(clients || []).map((item) => <option key={item.id} value={item.id}>{item.organization_name || item.primary_contact_name || item.email}</option>)}</select></Field></div>
      {client ? <PortalInterpreterRequestForm key={client.id} client={client} existingClient source="admin_portal" onSubmit={(assignment) => actions.createAssignment({ clientMode: "existing", clientId: client.id, assignment })} /> : <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">Choose an existing client to begin with Assignment Details.</div>}
    </>}

    {clientMode === "new" && <PortalInterpreterRequestForm key="new-client" client={null} existingClient={false} source="admin_portal" onSubmit={(assignment, request) => actions.createAssignment({ clientMode: "new", newClient: request, assignment })} />}
  </Modal></>;
}

export default function AssignmentAdminControls({ assignment, clients, actions }) {
  const [openAssignmentId, setOpenAssignmentId] = useState("");
  const open = openAssignmentId === assignment?.id;
  if (!assignment?.id) return null;
  const client = (clients || []).find((item) => item.id === assignment.client_id) || assignment.clients || {};

  async function remove() {
    const confirmation = window.prompt(`Permanently delete ${assignment.service_type}?\n\nGoogle Calendar and Drive records will also be removed. Assignments with financial, time, expense, agreement, or staffing history cannot be deleted.\n\nType DELETE to continue.`);
    if (confirmation !== "DELETE") return;
    await actions.deleteAssignment(assignment, confirmation);
  }

  async function save(updatedAssignment) {
    await actions.updateAssignment(assignment, { assignment: updatedAssignment });
    setOpenAssignmentId("");
  }

  return <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setOpenAssignmentId(assignment.id)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#721100]"><Pencil size={16} />Edit assignment</button><button type="button" onClick={remove} className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700"><Trash2 size={16} />Delete assignment</button><Modal open={open} close={() => setOpenAssignmentId("")} title="Edit assignment" subtitle="Changes stay aligned with the website’s Interpreter Request Form." wide>{open ? <PortalInterpreterRequestForm key={`${assignment.id}:${assignment.updated_at || "edit"}`} client={client} existingClient source="admin_portal_edit" initialValues={initialValuesFromAssignment(assignment, client)} submitLabel="Save and sync assignment" onSubmit={save} /> : null}</Modal></div>;
}
