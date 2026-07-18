import { useEffect, useMemo, useRef, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import {
  Archive, CheckCircle2, Download, FileClock, FileText, FolderLock,
  Loader2, RefreshCw, ShieldCheck, Upload, Users,
} from "lucide-react";
import { createPortalSupabaseClient } from "../lib/supabaseClient";
import { createMLSApi } from "./api";
import { Card, EmptyState, Field, INPUT, SectionHeader, cx, formatDate, pretty } from "./ui";

const ACCEPTED_FILES = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.eml,.png,.jpg,.jpeg";
const MAX_BYTES = 15 * 1024 * 1024;

const CATEGORY_LABELS = {
  client_agreement: "Client agreement",
  interpreter_agreement: "Interpreter agreement",
  assignment_confirmation: "Assignment confirmation",
  preparation_material: "Preparation material",
  purchase_order: "Purchase order",
  timesheet: "Timesheet",
  communication_record: "Communication record",
  invoice: "Invoice",
  expense_receipt: "Expense receipt",
  incident_or_complaint: "Incident or complaint record",
  feedback: "Feedback",
  accessibility_plan: "Accessibility plan",
  other: "Other assignment document",
};

const ROLE_CATEGORIES = {
  admin: Object.keys(CATEGORY_LABELS),
  client: [
    "client_agreement", "preparation_material", "purchase_order",
    "communication_record", "accessibility_plan", "other",
  ],
  interpreter: [
    "interpreter_agreement", "timesheet", "expense_receipt", "invoice",
    "preparation_material", "communication_record", "other",
  ],
};

const CLIENT_SHAREABLE = new Set([
  "preparation_material", "communication_record", "accessibility_plan", "other",
]);

const VISIBILITY_OPTIONS = [
  ["admin_only", "MLS admin only"],
  ["client", "Client"],
  ["all_interpreters", "All assigned interpreters"],
  ["specific_interpreter", "One assigned interpreter"],
  ["client_and_interpreters", "Client and assigned interpreters"],
];

const VISIBILITY_LABELS = Object.fromEntries(VISIBILITY_OPTIONS);

function Button({ children, onClick, type = "button", tone = "primary", disabled = false, icon: Icon, className = "" }) {
  const styles = {
    primary: "bg-[#721100] text-white",
    soft: "border border-slate-200 bg-white text-[#721100]",
    danger: "bg-rose-50 text-rose-700",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        styles[tone],
        className,
      )}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function statusClass(value) {
  if (["synced", "sent"].includes(value)) return "bg-emerald-50 text-emerald-700";
  if (["failed", "partial"].includes(value)) return "bg-rose-50 text-rose-700";
  if (["not_configured", "not_synced", "not_requested"].includes(value)) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function StatusPill({ label, value }) {
  return (
    <span className={cx("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.08em]", statusClass(value))}>
      {label}: {pretty(value || "pending")}
    </span>
  );
}

function DocumentChecklist({ assignment, documents }) {
  const team = assignment.assignment_interpreters || [];
  const active = new Set(documents.map((item) => item.category));
  const items = [
    ["Client agreement", active.has("client_agreement"), "Terms, scope, cancellation, billing, and responsibilities"],
    ["Assignment confirmation", active.has("assignment_confirmation"), "Final date, time, location, staffing, and access details"],
    ["Preparation materials", active.has("preparation_material"), "Scripts, agenda, terminology, names, and presenter information"],
    ["Purchase order / billing support", active.has("purchase_order") || active.has("invoice"), "PO, authorization, invoice, or other payment record"],
    ["Communication record", active.has("communication_record"), "Material email, call, or change record not already captured in portal messages"],
    ["Interpreter agreement(s)", team.length === 0 || documents.filter((item) => item.category === "interpreter_agreement").length >= team.length, team.length ? `${team.length} assigned interpreter record${team.length === 1 ? "" : "s"}` : "Becomes applicable once staffing is assigned"],
    ["Timesheet(s)", assignment.status !== "completed" || documents.filter((item) => item.category === "timesheet").length >= team.length, assignment.status === "completed" ? "Verify actual service time for each interpreter" : "Expected after service is completed"],
  ];

  return (
    <Card className="shadow-none">
      <SectionHeader eyebrow="Agency record" title="Assignment documentation checklist" text="A practical completeness check for the records MLS may need to coordinate, pay, bill, resolve questions, and improve service quality." />
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {items.map(([label, complete, note]) => (
          <div key={label} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <span className={cx("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
              {complete ? <CheckCircle2 size={17} /> : <FileClock size={17} />}
            </span>
            <div>
              <p className="text-sm font-black text-slate-900">{label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function roleGuidance(role) {
  if (role === "client") {
    return "You can see client-facing records for this request. Interpreter agreements, rates, timesheets, internal notes, complaints, and other MLS administrative records stay private unless MLS intentionally shares a specific document with you.";
  }
  if (role === "interpreter") {
    return "You can see preparation and assignment records shared with the team, plus documents addressed specifically to you. Client billing, other interpreters’ agreements or timesheets, and confidential MLS quality records stay private.";
  }
  return "MLS administrators control each document’s audience. Keep agreements, billing, quality records, complaints, and interpreter-specific records separated from materials that the whole assignment team needs.";
}

export default function AssignmentDocumentCenter({ assignment, role }) {
  const { session } = useSession();
  const { user } = useUser();
  const storage = useMemo(() => createPortalSupabaseClient(null), []);
  const api = useMemo(() => createMLSApi(session), [session]);
  const fileInput = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [replaceDocument, setReplaceDocument] = useState(null);
  const [draft, setDraft] = useState({
    category: ROLE_CATEGORIES[role]?.[0] || "other",
    title: "",
    documentDate: "",
    notes: "",
    visibility: role === "admin" ? "admin_only" : role === "client" ? "client" : "specific_interpreter",
    interpreterId: "",
    shareWithInterpreters: false,
    file: null,
  });

  const team = assignment?.assignment_interpreters || [];
  const assignedInterpreters = team.map((link) => ({
    id: link.interpreters?.id || link.interpreter_id,
    name: `${link.interpreters?.first_name || ""} ${link.interpreters?.last_name || ""}`.trim() || link.interpreters?.email || "Interpreter",
  })).filter((item) => item.id);

  async function loadDocuments() {
    if (!session || !assignment?.id) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.automations("listDocuments", "POST", { assignmentId: assignment.id });
      setDocuments(result.documents || []);
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [session, assignment?.id]);

  useEffect(() => {
    const categories = ROLE_CATEGORIES[role] || ROLE_CATEGORIES.interpreter;
    setDraft((current) => ({
      ...current,
      category: categories.includes(current.category) ? current.category : categories[0],
      visibility: role === "admin" ? current.visibility : role === "client" ? "client" : "specific_interpreter",
      interpreterId: role === "admin" ? current.interpreterId : "",
    }));
  }, [role]);

  function clearForm() {
    setReplaceDocument(null);
    setDraft({
      category: ROLE_CATEGORIES[role]?.[0] || "other",
      title: "",
      documentDate: "",
      notes: "",
      visibility: role === "admin" ? "admin_only" : role === "client" ? "client" : "specific_interpreter",
      interpreterId: "",
      shareWithInterpreters: false,
      file: null,
    });
    if (fileInput.current) fileInput.current.value = "";
  }

  function chooseReplacement(document) {
    setReplaceDocument(document);
    setDraft({
      category: document.category,
      title: document.title,
      documentDate: document.document_date || "",
      notes: document.notes || "",
      visibility: document.visibility,
      interpreterId: document.interpreter_id || "",
      shareWithInterpreters: document.visibility === "client_and_interpreters",
      file: null,
    });
    fileInput.current?.focus();
  }

  async function submit(event) {
    event.preventDefault();
    const file = draft.file;
    if (!file) return setError("Choose a file to upload.");
    if (file.size > MAX_BYTES) return setError("Files must be 15 MB or smaller.");
    if (role === "admin" && draft.visibility === "specific_interpreter" && !draft.interpreterId) {
      return setError("Choose the assigned interpreter who should receive this document.");
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const signed = await api.automations("createDocumentUploadUrl", "POST", {
        assignmentId: assignment.id,
        category: draft.category,
        fileName: file.name,
        fileSize: file.size,
      });
      const upload = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file, {
        contentType: file.type || undefined,
      });
      if (upload.error) throw upload.error;
      const result = await api.automations("recordDocumentUpload", "POST", {
        assignmentId: assignment.id,
        category: draft.category,
        title: draft.title || CATEGORY_LABELS[draft.category] || file.name,
        documentDate: draft.documentDate || null,
        notes: draft.notes || null,
        visibility: draft.visibility,
        interpreterId: draft.interpreterId || null,
        shareWithInterpreters: draft.shareWithInterpreters,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || null,
        storagePath: signed.path,
        supersedesDocumentId: replaceDocument?.id || null,
      });
      const driveStatus = result.automation?.drive?.status;
      setMessage(`${replaceDocument ? "New version uploaded" : "Document uploaded"}.${driveStatus === "not_configured" ? " Google Drive will sync after Workspace is reconnected." : ""}`);
      clearForm();
      await loadDocuments();
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value));
    } finally {
      setSaving(false);
    }
  }

  async function openDocument(document) {
    setBusyId(document.id);
    setError("");
    try {
      const result = await api.automations("openDocument", "POST", {
        assignmentId: assignment.id,
        documentId: document.id,
      });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value));
    } finally {
      setBusyId("");
    }
  }

  async function archiveDocument(document) {
    if (!window.confirm(`Archive ${document.file_name}? The audit record will be retained.`)) return;
    setBusyId(document.id);
    try {
      await api.automations("archiveDocument", "POST", {
        assignmentId: assignment.id,
        documentId: document.id,
      });
      setMessage("Document archived. The audit history remains intact.");
      await loadDocuments();
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value));
    } finally {
      setBusyId("");
    }
  }

  async function updateVisibility(document, visibility, interpreterId = null) {
    setBusyId(document.id);
    setError("");
    try {
      await api.automations("updateDocumentVisibility", "POST", {
        assignmentId: assignment.id,
        documentId: document.id,
        visibility,
        interpreterId,
      });
      setMessage("Document access updated and the appropriate users were notified.");
      await loadDocuments();
    } catch (value) {
      setError(value instanceof Error ? value.message : String(value));
    } finally {
      setBusyId("");
    }
  }

  const categories = ROLE_CATEGORIES[role] || ROLE_CATEGORIES.interpreter;
  const canReplace = (document) => role === "admin" || document.uploaded_by_clerk_user_id === user?.id;
  const clientCanShare = role === "client" && CLIENT_SHAREABLE.has(draft.category);

  return (
    <div className="space-y-6">
      {role === "admin" && <DocumentChecklist assignment={assignment} documents={documents} />}

      <Card className="shadow-none">
        <SectionHeader
          eyebrow="Secure assignment record"
          title="Documents and records"
          text="Upload the agreements, preparation, time, billing, and communication records connected to this assignment."
          action={<Button tone="soft" icon={RefreshCw} onClick={loadDocuments} disabled={loading}>Refresh</Button>}
        />

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#dd7d00]/20 bg-[#fff9ef] p-4">
          <ShieldCheck className="mt-0.5 shrink-0 text-[#721100]" size={20} />
          <div>
            <p className="text-sm font-black text-slate-900">Role-based access</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{roleGuidance(role)}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Files stay in private storage and open through short-lived links. Gmail notifications link back to MLS Portal instead of attaching confidential files.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-black text-slate-950">{replaceDocument ? `Upload version ${Number(replaceDocument.version_number || 1) + 1}` : "Add a document"}</p>
              <p className="mt-1 text-xs text-slate-500">PDF, Word, Excel, CSV, TXT, EML, PNG, or JPG · 15 MB maximum</p>
            </div>
            {replaceDocument && <Button tone="soft" onClick={clearForm}>Cancel replacement</Button>}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field name="Category" required>
              <select className={INPUT} value={draft.category} disabled={Boolean(replaceDocument)} onChange={(event) => setDraft({ ...draft, category: event.target.value, shareWithInterpreters: false })}>
                {categories.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
              </select>
            </Field>
            <Field name="Record date">
              <input className={INPUT} type="date" value={draft.documentDate} onChange={(event) => setDraft({ ...draft, documentDate: event.target.value })} />
            </Field>
            <Field name="Document title" className="md:col-span-2">
              <input className={INPUT} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={CATEGORY_LABELS[draft.category]} />
            </Field>

            {role === "admin" && !replaceDocument && (
              <>
                <Field name="Who can see it?">
                  <select className={INPUT} value={draft.visibility} onChange={(event) => setDraft({ ...draft, visibility: event.target.value, interpreterId: event.target.value === "specific_interpreter" ? draft.interpreterId : "" })}>
                    {VISIBILITY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
                {draft.visibility === "specific_interpreter" && (
                  <Field name="Assigned interpreter" required>
                    <select className={INPUT} required value={draft.interpreterId} onChange={(event) => setDraft({ ...draft, interpreterId: event.target.value })}>
                      <option value="">Choose</option>
                      {assignedInterpreters.map((interpreter) => <option key={interpreter.id} value={interpreter.id}>{interpreter.name}</option>)}
                    </select>
                  </Field>
                )}
              </>
            )}

            {clientCanShare && !replaceDocument && (
              <label className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <input type="checkbox" className="mt-1" checked={draft.shareWithInterpreters} onChange={(event) => setDraft({ ...draft, shareWithInterpreters: event.target.checked })} />
                <span><strong className="text-slate-900">Share with assigned interpreters</strong><br /><span className="text-xs leading-5 text-slate-500">Use this for preparation or logistical material the interpreting team needs. Do not use it for private consumer, billing, or personnel information.</span></span>
              </label>
            )}

            <Field name="Notes" className="md:col-span-2">
              <textarea className={cx(INPUT, "min-h-24")} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Optional context for MLS records" />
            </Field>
            <Field name="File" required className="md:col-span-2">
              <input ref={fileInput} className={INPUT} type="file" accept={ACCEPTED_FILES} required onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] || null })} />
            </Field>
          </div>
          <div className="mt-5">
            <Button type="submit" icon={saving ? Loader2 : Upload} disabled={saving} className={saving ? "[&>svg]:animate-spin" : ""}>
              {saving ? "Securing document…" : replaceDocument ? "Upload new version" : "Upload document"}
            </Button>
          </div>
        </form>

        {message && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}
        {error && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 p-8 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={18} /> Loading secure records…</div>
          ) : documents.map((document) => (
            <div key={document.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#721100]/10 text-[#721100]"><FileText size={19} /></span>
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">{document.title}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{document.file_name}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
                      <span>{CATEGORY_LABELS[document.category] || pretty(document.category)}</span>
                      <span>·</span><span>Version {document.version_number || 1}</span>
                      <span>·</span><span>Uploaded by {pretty(document.uploaded_by_role)}</span>
                      <span>·</span><span>{formatDate(document.created_at)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#721100]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.08em] text-[#721100]">{VISIBILITY_LABELS[document.visibility] || pretty(document.visibility)}</span>
                      {role === "admin" && <StatusPill label="Drive" value={document.drive_sync_status} />}
                      {role === "admin" && <StatusPill label="Email" value={document.email_status} />}
                    </div>
                    {document.notes && <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">{document.notes}</p>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button tone="soft" icon={busyId === document.id ? Loader2 : Download} disabled={busyId === document.id} onClick={() => openDocument(document)} className={busyId === document.id ? "[&>svg]:animate-spin" : ""}>Open</Button>
                  {canReplace(document) && <Button tone="soft" icon={FileClock} onClick={() => chooseReplacement(document)}>New version</Button>}
                  {role === "admin" && <Button tone="danger" icon={Archive} disabled={busyId === document.id} onClick={() => archiveDocument(document)}>Archive</Button>}
                </div>
              </div>

              {role === "admin" && (
                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                  <Field name="Document access">
                    <select className={INPUT} value={document.visibility} disabled={busyId === document.id} onChange={(event) => updateVisibility(document, event.target.value, event.target.value === "specific_interpreter" ? document.interpreter_id : null)}>
                      {VISIBILITY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                  {document.visibility === "specific_interpreter" && (
                    <Field name="Visible to">
                      <select className={INPUT} value={document.interpreter_id || ""} disabled={busyId === document.id} onChange={(event) => updateVisibility(document, "specific_interpreter", event.target.value)}>
                        <option value="">Choose</option>
                        {assignedInterpreters.map((interpreter) => <option key={interpreter.id} value={interpreter.id}>{interpreter.name}</option>)}
                      </select>
                    </Field>
                  )}
                </div>
              )}
            </div>
          ))}
          {!loading && !documents.length && <EmptyState icon={FolderLock} title="No assignment documents yet" text="Upload the first agreement, preparation file, timesheet, or communication record for this assignment." />}
        </div>
      </Card>

      {role !== "admin" && (
        <Card className="shadow-none">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 shrink-0 text-[#721100]" size={20} />
            <div><p className="font-black text-slate-950">Need a different record?</p><p className="mt-1 text-sm leading-6 text-slate-600">Use the assignment message thread to ask MLS for a document or clarification. That keeps the request and response attached to the same assignment.</p></div>
          </div>
        </Card>
      )}
    </div>
  );
}
