import { useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { Loader2, Mail, Send } from "lucide-react";
import { CLIENT_DOCUMENTS, INTERPRETER_DOCUMENTS } from "./forms";
import { createMLSApi } from "./api";
import { Field, INPUT, cx } from "./ui";
import { EMPTY_DOCUMENT_REQUEST } from "./useMLSController";

export default function DocumentRequestEmailForm({ controller }) {
  const { session } = useSession();
  const api = useMemo(() => createMLSApi(session), [session]);
  const {
    documentRequestDraft: draft,
    setDocumentRequestDraft: setDraft,
    workspace,
    setModal,
    setMessage,
    setError,
    load,
  } = controller;
  const [saving, setSaving] = useState(false);
  const sendEmail = draft.sendEmail !== false;
  const records = draft.audienceType === "client" ? workspace.admin?.clients || [] : workspace.admin?.interpreters || [];
  const documentOptions = draft.audienceType === "client" ? CLIENT_DOCUMENTS : INTERPRETER_DOCUMENTS;
  const selected = records.find((record) => record.id === draft.ownerId) || null;
  const recipientEmail = selected?.email || "";
  const recipientName = draft.audienceType === "client"
    ? selected?.primary_contact_name || selected?.organization_name || ""
    : `${selected?.first_name || ""} ${selected?.last_name || ""}`.trim();

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const requestResult = await api.core("adminCreateDocumentRequest", "POST", draft);
      const requestId = requestResult.request?.id;
      await api.app("notifyDocumentRequest", "POST", { ...draft, requestId }).catch(() => null);

      let emailResult = null;
      if (sendEmail && requestId) {
        emailResult = await api.documentRequestEmail("send", "POST", { requestId });
      }

      setDocumentRequestDraft({ ...EMPTY_DOCUMENT_REQUEST, sendEmail: true });
      setModal("");
      if (!sendEmail) {
        setMessage("Document request created without email delivery.");
      } else if (emailResult?.sent) {
        setMessage(`Document request emailed to ${recipientEmail}.`);
      } else if (emailResult?.configured === false) {
        setMessage("Document request created. Email delivery still needs to be configured in Vercel.");
      } else {
        setMessage("Document request created, but the email could not be delivered. You can resend it after correcting the recipient or email settings.");
      }
      window.setTimeout(() => setMessage(""), 5500);
      await load(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field name="Audience">
        <select className={INPUT} value={draft.audienceType} onChange={(event) => setDraft({ ...draft, audienceType: event.target.value, ownerId: "", documentType: event.target.value === "client" ? "service_agreement" : "resume" })}>
          <option value="client">Client</option>
          <option value="interpreter">Interpreter</option>
        </select>
      </Field>
      <Field name="Recipient" required>
        <select className={INPUT} required value={draft.ownerId || ""} onChange={(event) => setDraft({ ...draft, ownerId: event.target.value })}>
          <option value="">Choose a recipient</option>
          {records.map((record) => (
            <option key={record.id} value={record.id}>
              {draft.audienceType === "client" ? record.organization_name || record.email : `${record.first_name || ""} ${record.last_name || ""}`.trim() || record.email}
            </option>
          ))}
        </select>
      </Field>
      {selected && (
        <div className={cx("rounded-2xl border p-4 text-sm", recipientEmail ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800")}>
          <p className="font-black">{recipientName || "Selected recipient"}</p>
          <p className="mt-1 text-xs">{recipientEmail || "No email address is saved for this recipient."}</p>
        </div>
      )}
      <Field name="Document type">
        <select className={INPUT} value={draft.documentType} onChange={(event) => setDraft({ ...draft, documentType: event.target.value })}>
          {documentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Field>
      <Field name="Title" required><input className={INPUT} required value={draft.title || ""} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field>
      <Field name="Due date"><input className={INPUT} type="date" value={draft.dueDate || ""} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} /></Field>
      <Field name="Instructions"><textarea className={cx(INPUT, "min-h-28")} value={draft.instructions || ""} onChange={(event) => setDraft({ ...draft, instructions: event.target.value })} /></Field>
      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={sendEmail} onChange={(event) => setDraft({ ...draft, sendEmail: event.target.checked })} />
        <span><span className="font-black">Email this request now</span><span className="mt-1 block text-xs leading-5 text-slate-500">The email directs the recipient to sign in and upload securely. It does not ask them to reply with an attachment.</span></span>
      </label>
      <button type="submit" disabled={saving || (sendEmail && selected && !recipientEmail)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#721100] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
        {saving ? <Loader2 className="animate-spin" size={16} /> : sendEmail ? <Mail size={16} /> : <Send size={16} />}
        {sendEmail ? "Create request & email" : "Create request"}
      </button>
    </form>
  );
}
