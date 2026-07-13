import { useMemo, useState } from "react";
import { GraduationCap, ShieldCheck, UserCheck } from "lucide-react";
import { Badge, Card, EmptyState, Field, Hero, INPUT, SectionHeader, formatDate } from "../ui";
import { ActionButton, SelectField } from "./shared";

const emptyCredential = { interpreterId: "", credentialType: "certification", credentialName: "", credentialNumber: "", issuer: "", issuedOn: "", expiresOn: "", verificationStatus: "pending", notes: "" };
const emptyOnboarding = { interpreterId: "", stage: "application", status: "active", assignedReviewer: "", dueDate: "", score: "", recommendation: "", notes: "" };

export default function AdminComplianceV2({ workspace, operations, v2, actions, saving }) {
  const interpreters = (workspace.admin?.interpreters || []).filter((item) => item.roster_status !== "removed");
  const [credential, setCredential] = useState(emptyCredential);
  const [onboarding, setOnboarding] = useState(emptyOnboarding);
  const interpreterOptions = useMemo(() => interpreters.map((item) => ({ value: item.id, label: `${item.first_name || ""} ${item.last_name || ""}`.trim() || item.email })), [interpreters]);
  const credentials = v2?.credentials || [];
  const pipelines = v2?.onboarding || [];
  const now = Date.now();
  const expiring = credentials.filter((item) => item.expires_on && new Date(item.expires_on).getTime() <= now + 90 * 864e5);
  const courses = operations?.admin?.courses || [];

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

  return (
    <div className="space-y-6">
      <Hero eyebrow="Compliance" title="Credentials, onboarding, screenings, documents, and training." text="Track the entire interpreter readiness pipeline with dates, reviewers, status, notes, and an audit history instead of relying on scattered folders and email." actions={<ActionButton tone="gold" onClick={actions.openDocumentRequest}>Request document</ActionButton>} />
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
