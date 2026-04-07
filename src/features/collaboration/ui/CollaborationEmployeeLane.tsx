import { CollaborationLane } from "./CollaborationLane";
import { ReconciliationPanel, type ReconciliationPanelProps } from "./ReconciliationPanel";
import { SubmissionPanel, type SubmissionPanelProps } from "./SubmissionPanel";

type CollaborationEmployeeLaneProps = {
  reconciliationPanel: ReconciliationPanelProps;
  submissionPanel: SubmissionPanelProps;
};

export function CollaborationEmployeeLane(props: CollaborationEmployeeLaneProps) {
  return (
    <CollaborationLane
      testId="collaboration-lane-employee"
      tone="employee"
      stage="阶段 02 / 员工清点并回传"
      title="员工处理通道"
      description="导入快照比对差异、补标签并生成可发送的提交批次。"
    >
      <ReconciliationPanel {...props.reconciliationPanel} />
      <SubmissionPanel {...props.submissionPanel} />
    </CollaborationLane>
  );
}
