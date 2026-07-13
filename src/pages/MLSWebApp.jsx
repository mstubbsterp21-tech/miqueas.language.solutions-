import { AlertCircle, Loader2 } from "lucide-react";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { isSupabaseConfigured } from "../lib/env";
import AppShell from "../portal/shell";
import BidModal from "../portal/BidModal";
import ProfileModals from "../portal/ProfileModals";
import WorkflowModals from "../portal/WorkflowModals";
import useMLSController from "../portal/useMLSController";
import { EmptyState, Toast } from "../portal/ui";
import {
  AdminWorkspace, ClientWorkspace, InterpreterWorkspace,
} from "../portal/views";

export default function MLSWebApp() {
  const controller = useMLSController();
  const {
    isLoaded, workspace, operations, app, role, section, setSection,
    loading, refreshing, busyDoc, message, error, setMessage, setError,
    load, actions,
  } = controller;

  if (!isSupabaseConfigured) return <PortalSetupNotice />;

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f3ef] p-5">
        <div className="rounded-[2rem] bg-white p-12 text-center shadow-2xl">
          <Loader2 className="mx-auto animate-spin text-[#721100]" size={34} />
          <h1 className="mt-5 text-2xl font-black">Opening the MLS app</h1>
          <p className="mt-2 text-sm text-slate-500">Loading your secure workspace.</p>
        </div>
      </div>
    );
  }

  if (!workspace || !app) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f3ef] p-5">
        <EmptyState
          icon={AlertCircle}
          title="Workspace unavailable"
          text={error || "Refresh the app and try again."}
        />
      </div>
    );
  }

  return (
    <>
      <AppShell
        role={role}
        section={section}
        setSection={setSection}
        user={workspace.user}
        unread={app.unreadCount || 0}
        refreshing={refreshing}
        refresh={() => load(true)}
      >
        {message && <Toast message={message} dismiss={() => setMessage("")} />}
        {error && <Toast message={error} type="error" dismiss={() => setError("")} />}

        {role === "admin" && (
          <AdminWorkspace
            section={section}
            workspace={workspace}
            operations={operations}
            app={app}
            actions={actions}
          />
        )}
        {role === "client" && (
          <ClientWorkspace
            section={section}
            workspace={workspace}
            operations={operations}
            app={app}
            actions={actions}
            busyDoc={busyDoc}
          />
        )}
        {role === "interpreter" && (
          <InterpreterWorkspace
            section={section}
            workspace={workspace}
            operations={operations}
            app={app}
            actions={actions}
            busyDoc={busyDoc}
          />
        )}
      </AppShell>

      <ProfileModals controller={controller} />
      <WorkflowModals controller={controller} />
      <BidModal controller={controller} />
    </>
  );
}
