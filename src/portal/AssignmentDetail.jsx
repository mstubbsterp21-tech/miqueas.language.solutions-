import AssignmentDocumentCenter from "./AssignmentDocumentCenter";
import { AssignmentDetail as CoreAssignmentDetail } from "./views";

export function AssignmentDetail(props) {
  return (
    <div className="space-y-6">
      <CoreAssignmentDetail {...props} />
      <AssignmentDocumentCenter assignment={props.assignment} role={props.role} />
    </div>
  );
}
