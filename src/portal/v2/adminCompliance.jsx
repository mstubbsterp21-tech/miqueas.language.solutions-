import { useEffect, useMemo, useState } from "react";
import { FileText, GraduationCap, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import { Badge, Card, EmptyState, Field, Hero, INPUT, SectionHeader, formatDate } from "../ui";
import { ActionButton, SelectField } from "./shared";

const emptyCredential = { interpreterId: "", credentialType: "certification", credentialName: "", credentialNumber: "", issuer: "", issuedOn: "", expiresOn: "", verificationStatus: "pending", notes: "" };
const emptyOnboarding = { interpreterId: "", stage: "application", status: "active", assignedReviewer: "", dueDate: "", score: "", recommendation: "", notes: "" };
const cancellableRequestStatuses = new Set(["requested", "viewed", "overdue"]);

export default function AdminComplianceV2({ workspace, operations, v2, actions, saving }) {
  const clients = workspace.admin?.clients || [];
  const interpreters = (workspace.admin?.interpreters || []).filter((item) => item.roster_status !== "removed");
  const [credential, setCredential] = useState(emptyCredential);
  const [onboarding, setOnboarding] = useState(emptyOnboarding);
  const [documentRequests, setDocumentRequests] = useState(workspace.admin?.documentRequests || []);
  const interpreterOptions = useMemo(() => interpreters.map((item) => ({ value: item.id, label: `${item.first_name || ""} ${item.last_name || ""}`.trim() || item.email })), [interpreters]);
  const credentials = v2?.credentials || [];
  const pipelines = v2?.onboarding || [];
  const now = Date.now();
  const expiring = credentials.filter((item) => item.expires_on && new Date(item.expires_on).getTime() <= now + 90 * 864e5);
  const courses = operations?.admin?.courses || [];

  useEffect(() => {
    setDocumentRequests(workspace.admin?.documentRequests || []);
  }, [workspace.admin?.documentRequests]);

  function requestRecipient(request) {
    if (request.audience_type === "client") {
      const client = clients.find((item) => item.id === request.client_id);
      return client?.organization_name || client?.primary_contact_name || client?.email || "Client";
    }
    const interpreter = interpreters.find((item) => item.id === request.interpreter_id);
    return `${interpreter?.first_name || ""} ${interpreter?.last_name || ""}`.trim() || interpreter?.email || "Interpreter";
  }

  async function saveCredential(event) {
    event.preventDefault();
    await actions.saveCredential(credential);
    setCredential(emptyCredential);
  }

  async function saveOnboarding(event) {
    event.preventDefault();
    await actions.updateOnboarding(onboarding);
    setOnboarding(emptyOnboarding);
  }

  async function cancelRequest(request) {
    const confirmed = window.confirm("Cancel this document request? The recipient will no longer be able to submit documents through this request.");
    if (!confirmed) return;
    const result = await actions.cancelDocumentRequest(request.id);
    if (result?.request) {
      setDocumentRequests((current) => current.map((item) => item.id === result.request.id ? result.request : item));
    }
  }

  return (
    <div className="space-y-6">
      <Hero eyebrow="Compliance" title="Credentials, onboarding, screenings, documents, and training." text="Track the entire interpreter readiness pipeline with dates, reviewers, status, notes, and an audit history instead of relying on scattered folders and email." actions={<ActionButton tone="gold" onClick={actions.openDocumentRequest}>Request document</ActionButton>} />
      <Card>
        <SectionHeader eyebrow="Documents" title="Admin document center" text={`${documentRequests.length} document request${documentRequests.length === 1 ? "" : "s"} across client and interpreter accounts.`} action={<ActionButton onClick={actions.openDocumentRequest}>New request</ActionButton>} />
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {documentRequests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#721100]/10 text-[#721100]"><FileText size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{request.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{requestRecipient(request)} · Due {request.due_date || "not set"}</p>
                    </div>
                    <Badge value={request.status} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{request.instructions || "No additional instructions."}</p>
                  {request.status === "cancelled" && (
                    <p className="mt-3 text-xs font-bold text-rose-700">Cancelled {request.cancelled_at ? formatDate(request.cancelled_at) : ""}{request.cancelled_by_email ? ` by ${request.cancelled_by_email}` : ""}</p>
                  )}
                  {cancellableRequestStatuses.has(request.status) && (
                    <button type="button" disabled={saving} onClick={() => cancelRequest(request)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
                      <XCircle size={14} /> Cancel request
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!documentRequests.length && <EmptyState icon={FileText} title="No document requests" text="Create a request when a client or interpreter file is needed." />}
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader eyebrow="Credential record" title="Add or verify credential" text="Store structured credential information and expiration dates alongside the uploaded file." />
          <form onSubmit={saveCredential} className="mt-6 grid gap-4">
            <Field name="Interpreter" required><SelectField value={credential.interpreterId} onChange={(event) => setCredential({ ...credential, interpreterId: event.target.value })} options={interpreterOptions} /></Field>
            <div className="grid gap-3 sm:grid-cols-2"><Field name="Type" required><SelectField value={credential.credentialType} onChange={(event) => setCredential({ ...credential, credentialType: event.target.value })} options={["certification", "state_license", "eipa", "insurance", "w9", "contract", "screening", "other"]} /></Field><Field name="Credential name" required><input className={INPUT} value={credential.credentialName} onChange={(event) => setCredential({ ...credential, credentialName: event.target.value })} placeholder="NIC, BEI, Florida license..." /></Field></div>
            <div className="grid gap-3 sm:grid-cols-2"><Field name="Number"><input className={INPUT} value={credential.credentialNumber} onChange={(event) => setCredential({ ...credential, credentialNumber: event.target.value })} /></Field><Field name="Issuer"><input className={INPUT} value={credential.issuer} onChange={(event) => setCredential({ ...credential, issuer: event.target.value })} /></Field></div>
            <div className="grid gap-3 sm:grid-cols-3"><Field name="Issued"><input className={INPUT} type="date" value={credential.issuedOn} onChange={(event) => setCredential({ ...credential, issuedOn: event.target.value })} /></Field><Field name="Expires"><input className={INPUT} type="date" value={credential.expiresOn} onChange={(event) => setCredential({ ...credential, expiresOn: event.target.value })} /></Field><Field name="Status"><SelectField value={credential.verificationStatus} onChange={(event) => setCredential({ ...credential, verificationStatus: event.target.value })} options={["pending", "verified", "rejected", "expired", "waived"]} /></Field></div>
            <Field name="Notes"><textarea className={INPUT} rows={3} value={credential.notes} onChange={(event) => setCredential({ ...credential, notes: event.target.value })} /></Field>
            <ActionButton type="submit" disabled={saving || !credential.interpreterId || !credential.credentialName}>Save credential</ActionButton>
          </form>
        </Card>
        <Card>
          <SectionHeader eyebrow="Onboarding pipeline" title="Move interpreter to next stage" text="Application, document review, screenings, interview, agreement, compliance, approval, and active roster." />
          <form onSubmit={saveOnboarding} className="mt-6 grid gap-4">
            <Field name="Interpreter" required><SelectField value={onboarding.interpreterId} onChange={(event) => setOnboarding({ ...onboarding, interpreterId: event.target.value })} options={interpreterOptions} /></Field>
            <div className="grid gap-3 sm:grid-cols-2"><Field name="Stage" required><SelectField value={onboarding.stage} onChange={(event) => setOnboarding({ ...onboarding, stage: event.target.value })} options={["application", "document_review", "ethics_screening", "performance_screening", "interview", "agreement", "compliance", "approved", "active", "on_hold", "declined"]} /></Field><Field name="Status"><SelectField value={onboarding.status} onChange={(event) => setOnboarding({ ...onboarding, status: event.target.value })} options={["active", "waiting", "completed", "declined", "on_hold"]} /></Field></div>
            <div className="grid gap-3 sm:grid-cols-3"><Field name="Reviewer"><input className={INPUT} value={onboarding.assignedReviewer} onChange={(event) => setOnboarding({ ...onboarding, assignedReviewer: event.target.value })} /></Field><Field name="Due date"><input className={INPUT} type="date" value={onboarding.dueDate} onChange={(event) => setOnboarding({ ...onboarding, dueDate: event.target.value })} /></Field><Field name="Score"><input className={INPUT} type="number" step="0.01" value={onboarding.score} onChange={(event) => setOnboarding({ ...onboarding, score: event.target.value })} /></Field></div>
            <Field name="Recommendation"><input className={INPUT} value={onboarding.recommendation} onChange={(event) => setOnboarding({ ...onboarding, recommendation: event.target.value })} /></Field>
            <Field name="Notes"><textarea className={INPUT} rows={3} value={onboarding.notes} onChange={(event) => setOnboarding({ ...onboarding, notes: event.target.value })} /></Field>
            <ActionButton type="submit" disabled={saving || !onboarding.interpreterId}>Update onboarding</ActionButton>
          </form>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card><SectionHeader eyebrow="Expiration watch" title="Due within 90 days" text={`${expiring.length} records`} /><div className="mt-5 space-y-3">{expiring.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{item.credential_name}</p><p className="mt-1 text-xs text-slate-500">{item.interpreters?.first_name} {item.interpreters?.last_name} · {item.expires_on || "No expiration"}</p></div><Badge value={item.verification_status} /></div></div>)}{!expiring.length && <EmptyState icon={ShieldCheck} title="No upcoming expirations" text="Verified credentials with expiration dates will appear here." />}</div></Card>
        <Card><SectionHeader eyebrow="Pipeline" title="Interpreter onboarding" text={`${pipelines.length} active records`} /><div className="mt-5 space-y-3">{pipelines.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{item.interpreters?.first_name} {item.interpreters?.last_name}</p><p className="mt-1 text-xs text-slate-500">{item.stage.replaceAll("_", " ")} · Due {item.due_date || "not set"}</p></div><Badge value={item.status} /></div></div>)}{!pipelines.length && <EmptyState icon={UserCheck} title="No onboarding records" text="Choose an interpreter above to start the pipeline." />}</div></Card>
      </div>
      <Card><SectionHeader eyebrow="Learning" title="Training library" text={`${courses.length} courses in the MLS training center`} action={<ActionButton onClick={actions.openCourse}>Add course</ActionButton>} /><div className="mt-5 grid gap-3 md:grid-cols-2">{courses.map((course) => <div key={course.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{course.title}</p><p className="mt-1 text-xs text-slate-500">{course.category} · {course.duration_minutes ? `${course.duration_minutes} min` : "Self-paced"}</p></div><Badge value={course.is_published ? "published" : "draft"} /></div></div>)}{!courses.length && <EmptyState icon={GraduationCap} title="No courses" text="Add the first onboarding or professional development course." />}</div></Card>
    </div>
  );
}
