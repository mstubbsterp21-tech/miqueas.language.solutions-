import { useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { ClientProfileForm, InterpreterProfileForm } from "./forms";
import { Modal } from "./ui";
import ProfileStudio from "./ProfileStudio";
import { AccountDetail } from "./views";
import { AssignmentDetail } from "./AssignmentDetail";

export default function ProfileModals({ controller, v2, profileActions }) {
  const { session } = useSession();
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const {
    modal, setModal, profileType, clientDraft, setClientDraft,
    interpreterDraft, setInterpreterDraft, selectedAssignment,
    accountType, accountRecord, workspace, role, saving, busyDoc,
    actions, saveProfile, load, setMessage, setError,
  } = controller;
  const combinedActions = profileActions || actions;
  const accountCustomization = (v2?.profileCustomizations || []).find((item) => (
    accountType === "client" ? item.client_id === accountRecord?.id : item.interpreter_id === accountRecord?.id
  ));
  const accountProfileActions = {
    ...combinedActions,
    openProfile: () => accountRecord && actions.editAccount(accountType, accountRecord),
  };

  async function deleteAccountProfile() {
    if (!session || !accountRecord?.id || !["client", "interpreter"].includes(accountType)) return;
    const label = accountType === "client"
      ? accountRecord.organization_name || accountRecord.primary_contact_name || accountRecord.email || "this client"
      : `${accountRecord.first_name || ""} ${accountRecord.last_name || ""}`.trim() || accountRecord.email || "this interpreter";
    const confirmation = window.prompt(
      `Permanently delete ${label} from the MLS Portal?\n\nThis removes the profile, uploaded profile documents, picture, banner, onboarding data, and other profile-only records. Profiles with assignment or financial history cannot be deleted.\n\nType DELETE to continue.`,
    );
    if (confirmation !== "DELETE") return;

    setDeletingProfile(true);
    setDeleteError("");
    try {
      const bearer = await session.getToken();
      const response = await fetch("/api/portal-operations?action=adminDeleteProfile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bearer}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileType: accountType, profileId: accountRecord.id, confirmation }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Profile deletion failed (${response.status}).`);
      setModal("");
      setMessage(`${result.label || label} deleted.`);
      setError("");
      await load(true);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : String(error));
    } finally {
      setDeletingProfile(false);
    }
  }

  return (
    <>
      <Modal open={modal === "profile"} close={() => setModal("")} title={profileType === "client" ? "Client profile" : "Interpreter profile"} wide>
        {profileType === "client"
          ? <ClientProfileForm draft={clientDraft} setDraft={setClientDraft} submit={saveProfile} saving={saving} admin={role === "admin"} />
          : <InterpreterProfileForm draft={interpreterDraft} setDraft={setInterpreterDraft} submit={saveProfile} saving={saving} admin={role === "admin"} />}
      </Modal>

      <Modal open={modal === "assignment"} close={() => setModal("")} title="Assignment" wide>
        <AssignmentDetail
          assignment={selectedAssignment}
          role={role}
          clients={workspace?.admin?.clients || []}
          interpreters={(workspace?.admin?.interpreters || []).filter((item) => item.roster_status !== "removed")}
          actions={combinedActions}
        />
      </Modal>

      <Modal open={modal === "account"} close={() => { setDeleteError(""); setModal(""); }} title={accountType === "client" ? "Client account" : "Interpreter profile"} wide>
        <div className="space-y-6">
          <ProfileStudio
            profileType={accountType || "interpreter"}
            profile={accountRecord || {}}
            customization={accountCustomization}
            actions={accountProfileActions}
            ownerId={accountRecord?.id}
          />
          <AccountDetail type={accountType} record={accountRecord} workspace={workspace} actions={actions} busyDoc={busyDoc} />

          {role === "admin" && accountRecord?.id && (
            <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700"><AlertTriangle size={20} /></span>
                  <div>
                    <h3 className="font-black text-rose-950">Delete profile</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-rose-800">Permanently removes profiles that have no assignment, payment, bid, time, expense, or feedback history. Profiles with records must be marked inactive instead.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={deleteAccountProfile}
                  disabled={deletingProfile}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-rose-700 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingProfile ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete {accountType} profile
                </button>
              </div>
              {deleteError && <p className="mt-4 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-rose-800">{deleteError}</p>}
            </section>
          )}
        </div>
      </Modal>
    </>
  );
}
