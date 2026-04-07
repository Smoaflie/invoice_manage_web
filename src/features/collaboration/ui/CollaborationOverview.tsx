type CollaborationOverviewProps = {
  message: string;
  invoiceCount: number;
  matchedCount: number;
  activeDraftCount: number;
  reviewRequiredCount: number;
};

const WORKFLOW_STEPS = [
  { label: "01", title: "暴露快照", description: "财务先筛选需要核验的票据范围并生成快照。" },
  { label: "02", title: "本地对账", description: "员工导入快照、比对差异并补齐标签。" },
  { label: "03", title: "生成提交批次", description: "员工从本地结果中生成可发送的提交批次。" },
  { label: "04", title: "财务接收", description: "财务加载批次、确认冲突并整批接收或打回。" },
];

export function CollaborationOverview(props: CollaborationOverviewProps) {
  return (
    <section className="collaboration-workspace__overview workspace-card" data-testid="collaboration-overview">
      <div className="collaboration-workspace__overview-hero">
        <div className="collaboration-workspace__overview-copy">
          <p className="workspace-card__eyebrow">协作 / 同步</p>
          <h2>零服务端报销协作</h2>
          <p className="workspace-card__copy">{props.message}</p>
          <div className="collaboration-workspace__overview-tags" aria-label="协作设计特征">
            <span>双泳道交接</span>
            <span>整批门控</span>
            <span>本地批次回执</span>
          </div>
        </div>
        <div className="collaboration-workspace__overview-metrics" aria-label="协作状态概览">
          <article>
            <span>本地票据</span>
            <strong>{props.invoiceCount}</strong>
          </article>
          <article>
            <span>快照命中</span>
            <strong>{props.matchedCount}</strong>
          </article>
          <article>
            <span>待接收批次</span>
            <strong>{props.activeDraftCount}</strong>
          </article>
          <article>
            <span>人工复核</span>
            <strong>{props.reviewRequiredCount}</strong>
          </article>
        </div>
      </div>

      <div className="collaboration-workspace__overview-flow">
        {WORKFLOW_STEPS.map((step) => (
          <article key={step.label} className="collaboration-workspace__flow-step">
            <p>{step.label}</p>
            <strong>{step.title}</strong>
            <span>{step.description}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
