import { ClientProfileForm, InterpreterProfileForm } from "./forms";
import { Modal } from "./ui";
import { AccountDetail, AssignmentDetail } from "./views";

export default function ProfileModals({ controller }) {
  const {
    modal, setModal, profileType, clientDraft, setClientDraft,
    interpreterDraft, setInterpreterDraft, selectedAssignment,
    accountType, accountRecord, workspace, role, saving, busyDoc,
    actions, saveProfile,
  } = controller;

  return (
    <>
      <Modal open={modal === "profile"} close={() => setModal("")} title={profileType === "client" ? "Client profile" : "Interpreter profile"} wide>
        {profileType === "client"
          ? <ClientProfileForm draft={clientDraft} setDraft={setClientDraft} submit={saveProfile} saving={saving} admin={role === "admin"} />
          : <InterpreterProfileForm draft={interpreterDraft} setDraft={setInterpreterDraft} submit={saveProfile} saving={saving} admin={role === "admin"} />}
      </Modal>

      <Modal open={modal === "assignment"} close={() => setModal("")} title="Assignment" wide>
        <AssignmentDetail assignment={selectedAssignment} role={role} interpreters={(workspace?.admin?.interpreters || []).filter((item) => item.roster_status !== "removed")} actions={actions} />
      </Modal>

      <Modal open={modal === "account"} close={() => setModal("")} title={accountType === "client" ? "Client account" : "Interpreter profile"} wide>
        <AccountDetail type={accountType} record={accountRecord} workspace={workspace} actions={actions} busyDoc={busyDoc} />
      </Modal>
    </>
  );
}
