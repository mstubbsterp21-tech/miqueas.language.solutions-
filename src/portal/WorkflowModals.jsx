import {
  AssignmentRequestForm, CourseForm, DocumentRequestForm, FeedbackForm,
  InviteUserForm, OpportunityForm,
} from "./forms";
import { Modal } from "./ui";

export default function WorkflowModals({ controller }) {
  const {
    modal, setModal, assignmentDraft, setAssignmentDraft,
    feedbackDraft, setFeedbackDraft, inviteDraft, setInviteDraft,
    documentRequestDraft, setDocumentRequestDraft, courseDraft, setCourseDraft,
    opportunityDraft, setOpportunityDraft, workspace, app, saving,
    submitAssignment, submitFeedback, inviteUser, createDocumentRequest,
    saveCourse, publishOpportunity,
  } = controller;

  return (
    <>
      <Modal open={modal === "request"} close={() => setModal("")} title="Request an interpreter" subtitle="Submit one complete request to the MLS staffing pipeline." wide>
        <AssignmentRequestForm draft={assignmentDraft} setDraft={setAssignmentDraft} submit={submitAssignment} saving={saving} />
      </Modal>

      <Modal open={modal === "feedback"} close={() => setModal("")} title="Share feedback">
        <FeedbackForm draft={feedbackDraft} setDraft={setFeedbackDraft} assignments={app?.assignments || []} submit={submitFeedback} saving={saving} />
      </Modal>

      <Modal open={modal === "invite"} close={() => setModal("")} title="Invite a portal user">
        <InviteUserForm draft={inviteDraft} setDraft={setInviteDraft} submit={inviteUser} saving={saving} />
      </Modal>

      <Modal open={modal === "documentRequest"} close={() => setModal("")} title="Request a document">
        <DocumentRequestForm draft={documentRequestDraft} setDraft={setDocumentRequestDraft} workspace={workspace} submit={createDocumentRequest} saving={saving} />
      </Modal>

      <Modal open={modal === "course"} close={() => setModal("")} title="Training course">
        <CourseForm draft={courseDraft} setDraft={setCourseDraft} submit={saveCourse} saving={saving} />
      </Modal>

      <Modal open={modal === "opportunity"} close={() => setModal("")} title="Publish assignment opportunity">
        <OpportunityForm draft={opportunityDraft} setDraft={setOpportunityDraft} assignments={app?.assignments || []} submit={publishOpportunity} saving={saving} />
      </Modal>
    </>
  );
}
