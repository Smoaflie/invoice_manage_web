import { CollaborationLane } from "./CollaborationLane";
import { ExposurePanel, type ExposurePanelProps } from "./ExposurePanel";
import { ReceivingPanel, type ReceivingPanelProps } from "./ReceivingPanel";

type CollaborationFinanceLaneProps = {
  exposurePanel: ExposurePanelProps;
  receivingPanel: ReceivingPanelProps;
};

export function CollaborationFinanceLane(props: CollaborationFinanceLaneProps) {
  return (
    <CollaborationLane
      testId="collaboration-lane-finance"
      tone="finance"
      stage="阶段 01 / 财务建立暴露范围"
      title="财务处理通道"
      description="从暴露筛选开始，接住员工端提交后的批次并整批处理。"
    >
      <ExposurePanel {...props.exposurePanel} />
      <ReceivingPanel {...props.receivingPanel} />
    </CollaborationLane>
  );
}
