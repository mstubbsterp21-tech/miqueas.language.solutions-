import {
  CourseForm, FeedbackForm,
  InviteUserForm,
} from "./forms";
import DocumentRequestEmailForm from "./DocumentRequestEmailForm";
import OpportunityEmailForm from "./OpportunityEmailForm";
import PortalInterpreterRequestForm, { initialValuesFromAssignment } from "./PortalInterpreterRequestForm";
import { Modal } from "./ui";

export default function WorkflowModals({ controller, actions }) {
  const {
    modal, setModal,
    feedbackDraft, setFeedbackDraft, inviteDraft, setInviteDraft,
    courseDraft, setCourseDraft,
    app, workspace, saving, requestTemplateAssignment,
    submitFeedback, inviteUser,
    saveCourse,
  } = controller;
  const client = workspace?.client?.profile || null;

  return (
    <>
      <Modal open={modal === "request"} close={() => setModal("")} title={requestTemplateAssignment ? "Request this service again" : "Request an interpreter"} wide>
        {client
          ? <PortalInterpreterRequestForm key={`${client.id || client.email}:${requestTemplateAssignment?.id || "new"}`} client={client} source={requestTemplateAssignment ? "client_portal_repeat" : "client_portal"} initialValues={requestTemplateAssignment ? initialValuesFromAssignment(requestTemplateAssignment, client) : undefined} submitLabel={requestTemplateAssignment ? "Submit repeated request" : "Submit request"} onSubmit={(assignment) => actions.createAssignment({ assignment })} />
          : <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">Complete your client profile before submitting an Interpreter Request.</div>}
      </Modal>

      <Modal open={modal === "feedback"} close={() => setModal("")} title="Share feedback">
        <FeedbackForm draft={feedbackDraft} setDraft={setFeedbackDraft} assignments={app?.assignments || []} submit={submitFeedback} saving={saving} />
      </Modal>

      <Modal open={modal === "invite"} close={() => setModal("")} title="Invite a portal user">
        <InviteUserForm draft={inviteDraft} setDraft={setInviteDraft} submit={inviteUser} saving={saving} />
      </Modal>

      <Modal open={modal === "documentRequest"} close={() => setModal("")} title="Request a document">
        <DocumentRequestEmailForm controller={controller} />
      </Modal>

      <Modal open={modal === "course"} close={() => setModal("")} title="Training course">
        <CourseForm draft={courseDraft} setDraft={setCourseDraft} submit={saveCourse} saving={saving} />
      </Modal>

      <Modal open={modal === "opportunity"} close={() => setModal("")} title="Publish assignment opportunity">
        <OpportunityEmailForm controller={controller} />
      </Modal>
    </>
  );
}
