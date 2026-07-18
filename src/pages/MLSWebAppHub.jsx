import { useEffect, useMemo, useRef } from "react";
import { useSession } from "@clerk/clerk-react";
import { AlertCircle, Loader2 } from "lucide-react";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { isSupabaseConfigured } from "../lib/env";
import AppShell from "../portal/shell";
import BidModal from "../portal/BidModal";
import CommunicationsCenter from "../portal/CommunicationsCenter";
import FirstLoginSetupWizard, { needsFirstLoginSetup } from "../portal/ClerkFirstLoginSetupWizard";
import PortalHomeSnapshot from "../portal/PortalHomeSnapshot";
import PortalRealtimeBridge from "../portal/PortalRealtimeBridge";
import PortalRoleSelection from "../portal/PortalRoleSelection";
import ProfileMessageShortcut from "../portal/ProfileMessageShortcut";
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
import { navBadgesFor, notificationSection } from "../portal/notificationRouting";

const allowedSections = {
  admin: new Set(["home", "assignments", "communications", "people", "finance", "compliance", "reports", "profile", "settings", "notifications"]),
  client: new Set(["home", "requests", "assignments", "communications", "billing", "documents", "profile", "notifications"]),
  interpreter: new Set(["home", "work", "payments", "communications", "schedule", "documents", "learning", "profile", "notifications"]),
};

const legacySectionMap = {
  admin: { overview: "home", schedule: "assignments", clients: "people", interpreters: "people", documents: "compliance", training: "compliance", bids: "assignments", messages: "communications", feedback: "reports" },
  client: { overview: "home", request: "requests", schedule: "assignments", messages: "communications", feedback: "assignments" },
  interpreter: { overview: "home", opportunities: "work", training: "learning", messages: "communications" },
};

function normalizeSection(role, section) {
  const mapped = legacySectionMap[role]?.[section] || section;
  return allowedSections[role]?.has(mapped) ? mapped : "home";
}

function PortalLoading({ title = "Opening the MLS app", text = "Loading your secure workspace." }) {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f3ef] p-5"><div className="rounded-[2rem] bg-white p-12 text-center shadow-2xl"><Loader2 className="mx-auto animate-spin text-[#721100]" size={34} /><h1 className="mt-5 text-2xl font-black">{title}</h1><p className="mt-2 text-sm text-slate-500">{text}</p></div></div>;
}

export default function MLSWebAppHub() {
  const { session } = useSession();
  const controller = useMLSController();
  const v2 = useOperationsV2({ initialData: controller.operationsV2, deferInitialLoad: true });
  const {
    isLoaded, workspace, operations, app, role, section, setSection,
    loading, refreshing, savingTimeZone, busyDoc, message, error, setMessage, setError,
    load, actions, setModal,
  } = controller;
  const roleSelection = usePortalRoleSelection({ enabled: Boolean(isLoaded && workspace && !workspace.user?.isAdmin) });
  const activeSection = normalizeSection(role, section);
  const markingRead = useRef(new Set());

  const unreadNotifications = useMemo(
    () => (app?.notifications || []).filter((item) => !item.is_read),
    [app?.notifications],
  );
  const navBadges = useMemo(() => navBadgesFor(role, app?.notifications || []), [app?.notifications, role]);

  useEffect(() => {
    if (!session || !app) return;
    const candidates = ["home", "communications"].includes(activeSection)
      ? []
      : unreadNotifications.filter((item) => notificationSection(role, item) === activeSection);
    const ids = candidates.map((item) => item.id).filter((id) => id && !markingRead.current.has(id));
    if (!ids.length) return;
    ids.forEach((id) => markingRead.current.add(id));

    let cancelled = false;
    (async () => {
      try {
        const bearer = await session.getToken();
        const response = await fetch("/api/portal-app?action=markNotificationRead", {
          method: "POST",
          headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: ids }),
        });
        if (!response.ok) throw new Error(`Notification update failed (${response.status}).`);
        if (!cancelled) await load(true);
      } catch (readError) {
        console.warn("MLS notification acknowledgement failed", readError);
      } finally {
        ids.forEach((id) => markingRead.current.delete(id));
      }
    })();

    return () => { cancelled = true; };
  }, [activeSection, app, load, role, session, unreadNotifications]);

  if (!isSupabaseConfigured) return <PortalSetupNotice />;
  if (!isLoaded || loading) return <PortalLoading />;
  if (!workspace || !app) return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f3ef] p-5"><EmptyState icon={AlertCircle} title="Workspace unavailable" text={error || "Refresh the app and try again."} /></div>;
  if (!workspace.user?.isAdmin && roleSelection.loading) return <PortalLoading title="Checking your account type" text="Preparing the correct MLS profile setup." />;
  if (!workspace.user?.isAdmin && roleSelection.selectionRequired) return <PortalRoleSelection user={workspace.user} saving={roleSelection.saving} error={roleSelection.error} onSelect={async (selectedRole) => { await roleSelection.selectRole(selectedRole); setModal(""); await load(true); }} />;
  if (needsFirstLoginSetup(role, workspace)) {
    const profile = role === "client" ? workspace.client?.profile : workspace.interpreter?.profile;
    return <FirstLoginSetupWizard role={role} profile={profile} user={workspace.user} onComplete={async () => { setModal(""); await load(true); }} />;
  }

  const refreshAll = () => load(true);
  const combinedActions = { ...actions, ...v2.actions, refreshPortal: refreshAll };
  const personalization = role === "admin" ? v2.data?.personalProfileCustomization : v2.data?.profileCustomization;
  const legacyClientSection = activeSection === "notifications" ? "notifications" : activeSection;
  const legacyInterpreterSection = activeSection === "learning" ? "training" : activeSection;

  return <>
    <PortalRealtimeBridge topic={v2.data?.realtimeTopic} refresh={refreshAll} />
    <AppShell role={role} section={activeSection} setSection={setSection} user={workspace.user} personalization={personalization} unread={app.unreadCount || 0} navBadges={navBadges} refreshing={refreshing || v2.loading} refresh={refreshAll} timeZone={workspace.preferences?.timeZone} onTimeZoneChange={actions.saveTimeZone} savingTimeZone={savingTimeZone}>
      {message && <Toast message={message} dismiss={() => setMessage("")} />}
      {error && <Toast message={error} type="error" dismiss={() => setError("")} />}
      {v2.message && <Toast message={v2.message} dismiss={() => v2.setMessage("")} />}
      {v2.error && <Toast message={v2.error} type="error" dismiss={() => v2.setError("")} />}

      {activeSection === "home" && <PortalHomeSnapshot role={role} workspace={workspace} operations={operations} app={app} v2={v2.data} actions={combinedActions} identityName={personalization?.display_name || [workspace.user?.firstName, workspace.user?.lastName].filter(Boolean).join(" ")} />}

      {role === "admin" && !["home", "notifications"].includes(activeSection) && <AdminV2Workspace section={activeSection} workspace={workspace} operations={operations} app={app} v2={v2.data} loading={v2.loading} saving={v2.saving} actions={combinedActions} />}
      {role === "admin" && activeSection === "notifications" && <AdminWorkspace section="notifications" workspace={workspace} operations={operations} app={app} actions={combinedActions} />}

      {role === "client" && ["requests", "assignments", "communications", "billing"].includes(activeSection) && <ClientV2Workspace section={activeSection} workspace={workspace} operations={operations} app={app} v2={v2.data} loading={v2.loading} saving={v2.saving} actions={combinedActions} />}
      {role === "client" && activeSection === "profile" && <div className="space-y-6"><ProfileMessageShortcut profileType="client" profile={workspace.client?.profile || {}} selfService onNavigate={setSection} /><ProfileStudio profileType="client" profile={workspace.client?.profile || {}} customization={v2.data?.profileCustomization} actions={combinedActions} ownerId={workspace.client?.profile?.id} /></div>}
      {role === "client" && ["documents", "notifications"].includes(activeSection) && <ClientWorkspace section={legacyClientSection} workspace={workspace} operations={operations} app={app} actions={combinedActions} busyDoc={busyDoc} />}

      {role === "interpreter" && ["work", "payments", "schedule"].includes(activeSection) && <InterpreterV2Workspace section={activeSection} workspace={workspace} operations={operations} app={app} v2={v2.data} loading={v2.loading} saving={v2.saving} actions={combinedActions} />}
      {role === "interpreter" && activeSection === "communications" && <CommunicationsCenter workspace={workspace} onRefresh={refreshAll} />}
      {role === "interpreter" && activeSection === "profile" && <div className="space-y-6"><ProfileMessageShortcut profileType="interpreter" profile={workspace.interpreter?.profile || {}} selfService onNavigate={setSection} /><ProfileStudio profileType="interpreter" profile={workspace.interpreter?.profile || {}} customization={v2.data?.profileCustomization} actions={combinedActions} ownerId={workspace.interpreter?.profile?.id} /></div>}
      {role === "interpreter" && ["documents", "learning", "notifications"].includes(activeSection) && <InterpreterWorkspace section={legacyInterpreterSection} workspace={workspace} operations={operations} app={app} actions={combinedActions} busyDoc={busyDoc} />}
    </AppShell>

    <ProfileModals controller={controller} v2={v2.data} profileActions={combinedActions} />
    <WorkflowModals controller={controller} actions={combinedActions} />
    <BidModal controller={controller} />
  </>;
}
