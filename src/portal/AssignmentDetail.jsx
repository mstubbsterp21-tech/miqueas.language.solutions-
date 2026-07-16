import AssignmentAdminControls from "./AssignmentAdminControls";
import AssignmentDocumentCenter from "./AssignmentDocumentCenter";
import { AssignmentDetail as CoreAssignmentDetail } from "./views";

export function AssignmentDetail(props) {
  return (
    <div className="space-y-6">
      {props.role === "admin" && <AssignmentAdminControls assignment={props.assignment} clients={props.clients || []} actions={props.actions} />}
      <CoreAssignmentDetail {...props} />
      <AssignmentDocumentCenter assignment={props.assignment} role={props.role} />
    </div>
  );
}
