import {
  AssignmentRequestForm, CourseForm, FeedbackForm,
  InviteUserForm,
} from "./forms";
import DocumentRequestEmailForm from "./DocumentRequestEmailForm";
import OpportunityEmailForm from "./OpportunityEmailForm";
import { Modal } from "./ui";

export default function WorkflowModals({ controller }) {
  const {
    modal, setModal, assignmentDraft, setAssignmentDraft,
    feedbackDraft, setFeedbackDraft, inviteDraft, setInviteDraft,
    courseDraft, setCourseDraft,
    app, saving,
    submitAssignment, submitFeedback, inviteUser,
    saveCourse,
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

      <Modal open={modal === "documentRequest"} close={() => setModal("")} title="Request a document" subtitle="Create the portal request and email the recipient in one step.">
        <DocumentRequestEmailForm controller={controller} />
      </Modal>

      <Modal open={modal === "course"} close={() => setModal("")} title="Training course">
        <CourseForm draft={courseDraft} setDraft={setCourseDraft} submit={saveCourse} saving={saving} />
      </Modal>

      <Modal open={modal === "opportunity"} close={() => setModal("")} title="Publish assignment opportunity" subtitle="Email only interpreters whose saved availability matches the assignment.">
        <OpportunityEmailForm controller={controller} />
      </Modal>
    </>
  );
}
