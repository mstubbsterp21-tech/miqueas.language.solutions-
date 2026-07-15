import AdminHomeV2 from "./adminHome";
import AdminAssignmentsV2 from "./adminAssignments";
import AdminPeopleV2 from "./adminPeople";
import AdminFinanceV2 from "./adminFinance";
import AdminComplianceV2 from "./adminCompliance";
import { AdminReportsV2, AdminSettingsV2 } from "./adminInsights";
import ProfileStudio from "../ProfileStudio";
import { LoadingPanel } from "./shared";

export default function AdminV2Workspace({ section, workspace, operations, app, v2, loading, saving, actions }) {
  if (loading && !v2) return <LoadingPanel />;
  if (section === "home") return <AdminHomeV2 workspace={workspace} app={app} v2={v2} actions={actions} />;
  if (section === "assignments") return <AdminAssignmentsV2 workspace={workspace} app={app} v2={v2} actions={actions} />;
  if (section === "people") return <AdminPeopleV2 workspace={workspace} v2={v2} actions={actions} />;
  if (section === "finance") return <AdminFinanceV2 workspace={workspace} app={app} v2={v2} actions={actions} saving={saving} />;
  if (section === "compliance") return <AdminComplianceV2 workspace={workspace} operations={operations} v2={v2} actions={actions} saving={saving} />;
  if (section === "reports") return <AdminReportsV2 workspace={workspace} app={app} v2={v2} />;
  if (section === "profile") {
    const profile = v2?.personalInterpreter || workspace.interpreter?.profile || {
      email: workspace.user?.email,
      first_name: workspace.user?.firstName,
      last_name: workspace.user?.lastName,
      roster_status: "active",
    };
    return <ProfileStudio profileType="interpreter" profile={profile} customization={v2?.personalProfileCustomization} actions={actions} ownerId={profile.id} adminPersonal />;
  }
  if (section === "settings") return <AdminSettingsV2 v2={v2} loading={loading} />;
  return <AdminHomeV2 workspace={workspace} app={app} v2={v2} actions={actions} />;
}
