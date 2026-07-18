import { AlertCircle, Loader2 } from "lucide-react";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { isSupabaseConfigured } from "../lib/env";
import AppShell from "../portal/shell";
import BidModal from "../portal/BidModal";
import FirstLoginSetupWizard, { needsFirstLoginSetup } from "../portal/ClerkFirstLoginSetupWizard";
import PortalRoleSelection from "../portal/PortalRoleSelection";
import PortalFeedback from "../portal/PortalFeedback";
import ProfileModals from "../portal/ProfileModals";
import ProfileStudio from "../portal/ProfileStudio";
import WorkflowModals from "../portal/WorkflowModals";
import useMLSController from "../portal/useMLSController";
import useOperationsV2 from "../portal/useOperationsV2";
import usePortalRoleSelection from "../portal/usePortalRoleSelection";
import { EmptyState, Toast } from "../portal/ui";
import { AdminWorkspace, ClientWorkspace, InterpreterWorkspace } from "../portal/views";
import AdminV2Workspace from "../portal/v2/admin";
import ClientV2Workspace from "../portal/v2/client";
import InterpreterV2Workspace from "../portal/v2/interpreter";

const allowedSections = {
  admin: new Set(["home", "assignments", "people", "finance", "compliance", "reports", "feedback", "profile", "settings", "notifications"]),
  client: new Set(["home", "requests", "assignments", "billing", "documents", "feedback", "profile", "notifications"]),
  interpreter: new Set(["home", "work", "schedule", "documents", "learning", "feedback", "profile", "notifications"]),
};

const legacySectionMap = {
  admin: {
    overview: "home",
    schedule: "assignments",
    clients: "people",
    interpreters: "people",
    documents: "compliance",
    training: "compliance",
    bids: "assignments",
    messages: "assignments",
  },
  client: {
    overview: "home",
    request: "requests",
    schedule: "assignments",
    messages: "assignments",
  },
  interpreter: {
    overview: "home",
    opportunities: "work",
    training: "learning",
    messages: "work",
  },
};

function normalizeSection(role, section) {
  const mapped = legacySectionMap[role]?.[section] || section;
  return allowedSections[role]?.has(mapped) ? mapped : "home";
}

function PortalLoading({ title = "Opening the MLS app", text = "Loading your secure workspace." }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f3ef] p-5">
      <div className="rounded-[2rem] bg-white p-12 text-center shadow-2xl">
        <Loader2 className="mx-auto animate-spin text-[#721100]" size={34} />
        <h1 className="mt-5 text-2xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}

export default function MLSWebApp() {
  const controller = useMLSController();
  const v2 = useOperationsV2({ initialData: controller.operationsV2, deferInitialLoad: true });
  const {
    isLoaded, workspace, operations, app, role, section, setSection,
    loading, refreshing, saving, busyDoc, message, error, setMessage, setError,
    load, actions, setModal,
  } = controller;
  const roleSelection = usePortalRoleSelection({
    enabled: Boolean(isLoaded && workspace && !workspace.user?.isAdmin),
  });

  if (!isSupabaseConfigured) return <PortalSetupNotice />;

  if (!isLoaded || loading) return <PortalLoading />;

  if (!workspace || !app) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f3ef] p-5">
        <EmptyState icon={AlertCircle} title="Workspace unavailable" text={error || "Refresh the app and try again."} />
      </div>
    );
  }

  if (!workspace.user?.isAdmin && roleSelection.loading) {
    return <PortalLoading title="Checking your account type" text="Preparing the correct MLS profile setup." />;
  }

  if (!workspace.user?.isAdmin && roleSelection.selectionRequired) {
    return (
      <PortalRoleSelection
        user={workspace.user}
        saving={roleSelection.saving}
        error={roleSelection.error}
        onSelect={async (selectedRole) => {
          await roleSelection.selectRole(selectedRole);
          setModal("");
          await load(true);
          await roleSelection.load();
        }}
      />
    );
  }

  if (needsFirstLoginSetup(role, workspace)) {
    const profile = role === "client" ? workspace.client?.profile : workspace.interpreter?.profile;
    return (
      <FirstLoginSetupWizard
        role={role}
        profile={profile}
        user={workspace.user}
        onComplete={async () => {
          setModal("");
          await load(true);
        }}
      />
    );
  }

  const activeSection = normalizeSection(role, section);
  const combinedActions = { ...actions, ...v2.actions };
  const refreshAll = () => load(true);
  const personalization = role === "admin" ? v2.data?.personalProfileCustomization : v2.data?.profileCustomization;

  const legacyClientSection = activeSection === "notifications" ? "notifications" : activeSection;
  const legacyInterpreterSection = activeSection === "learning" ? "training" : activeSection;

  return (
    <>
      <AppShell
        role={role}
        section={activeSection}
        setSection={setSection}
        user={workspace.user}
        personalization={personalization}
        unread={app.unreadCount || 0}
        refreshing={refreshing || v2.loading}
        refresh={refreshAll}
      >
        {message && <Toast message={message} dismiss={() => setMessage("")} />}
        {error && <Toast message={error} type="error" dismiss={() => setError("")} />}
        {v2.message && <Toast message={v2.message} dismiss={() => v2.setMessage("")} />}
        {v2.error && <Toast message={v2.error} type="error" dismiss={() => v2.setError("")} />}

        {activeSection === "feedback" && <PortalFeedback role={role} saving={saving} submit={actions.submitPortalFeedback} />}

        {role === "admin" && !["feedback", "notifications"].includes(activeSection) && (
          <AdminV2Workspace
            section={activeSection}
            workspace={workspace}
            operations={operations}
            app={app}
            v2={v2.data}
            loading={v2.loading}
            saving={v2.saving}
            actions={combinedActions}
          />
        )}
        {role === "admin" && activeSection === "notifications" && (
          <AdminWorkspace section="notifications" workspace={workspace} operations={operations} app={app} actions={combinedActions} />
        )}

        {role === "client" && ["home", "requests", "assignments", "billing"].includes(activeSection) && (
          <ClientV2Workspace
            section={activeSection}
            workspace={workspace}
            operations={operations}
            app={app}
            v2={v2.data}
            loading={v2.loading}
            saving={v2.saving}
            actions={combinedActions}
          />
        )}
        {role === "client" && activeSection === "profile" && (
          <ProfileStudio
            profileType="client"
            profile={workspace.client?.profile || {}}
            customization={v2.data?.profileCustomization}
            actions={combinedActions}
            ownerId={workspace.client?.profile?.id}
          />
        )}
        {role === "client" && ["documents", "notifications"].includes(activeSection) && (
          <ClientWorkspace section={legacyClientSection} workspace={workspace} operations={operations} app={app} actions={combinedActions} busyDoc={busyDoc} />
        )}

        {role === "interpreter" && ["home", "work", "schedule"].includes(activeSection) && (
          <InterpreterV2Workspace
            section={activeSection}
            workspace={workspace}
            operations={operations}
            app={app}
            v2={v2.data}
            loading={v2.loading}
            saving={v2.saving}
            actions={combinedActions}
          />
        )}
        {role === "interpreter" && activeSection === "profile" && (
          <ProfileStudio
            profileType="interpreter"
            profile={workspace.interpreter?.profile || {}}
            customization={v2.data?.profileCustomization}
            actions={combinedActions}
            ownerId={workspace.interpreter?.profile?.id}
          />
        )}
        {role === "interpreter" && ["documents", "learning", "notifications"].includes(activeSection) && (
          <InterpreterWorkspace section={legacyInterpreterSection} workspace={workspace} operations={operations} app={app} actions={combinedActions} busyDoc={busyDoc} />
        )}
      </AppShell>

      <ProfileModals controller={controller} v2={v2.data} profileActions={combinedActions} />
      <WorkflowModals controller={controller} />
      <BidModal controller={controller} />
    </>
  );
}
