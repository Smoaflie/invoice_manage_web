import type { SubmissionDraft, SubmissionPrecheckResult } from "../types/collaboration";
import type { ReceivingImportPreviewViewModel } from "../application/collaborationPanelViewModel";

export type ReceivingPanelProps = {
  draftInputText: string;
  loadedDraft: SubmissionDraft | null;
  financeTagsText: string;
  beneficiary: string;
  receivedBy: string;
  precheck: SubmissionPrecheckResult | null;
  gateReasons: string[];
  acceptanceStatusText: string;
  importPreview: ReceivingImportPreviewViewModel | null;
  reviewDecisions: Record<string, "pending" | "accept_item" | "reject_item">;
  onDraftInputTextChange: (value: string) => void;
  onLoadDraft: () => void;
  onFinanceTagsTextChange: (value: string) => void;
  onFillFinanceTags: () => void;
  onBeneficiaryChange: (value: string) => void;
  onReceivedByChange: (value: string) => void;
  onReviewDecisionChange: (invoiceId: string, value: "pending" | "accept_item" | "reject_item") => void;
  onAcceptBatch: () => void;
  onRejectBatch: () => void;
  acceptDisabled: boolean;
};

export function ReceivingPanel(props: ReceivingPanelProps) {
  return (
    <section className="workspace-card">
      <div className="workspace-card__header">
        <div>
          <p className="workspace-card__eyebrow">财务端</p>
          <h2>接收批次</h2>
        </div>
      </div>
      {props.loadedDraft ? (
        <div className="workspace-card__summary">
          <strong>批次摘要</strong>
          <p>
            发送人 {props.loadedDraft.senderName || "未填写"} / 受益人 {props.loadedDraft.beneficiaryName || "未填写"} / 共 {props.loadedDraft.invoiceIds.length} 张票
          </p>
          <p>员工提交标签：{props.loadedDraft.submissionTags.join(" ") || "未填写"}</p>
        </div>
      ) : null}
      <div className="workspace-card__summary">
        <strong>接收门控</strong>
        <p>{props.acceptanceStatusText}</p>
        <ul>
          {props.gateReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
      {props.importPreview ? (
        <div className="workspace-card__summary">
          <strong>入库预览</strong>
          <p>接收人 {props.importPreview.receivedBy || "未填写"}</p>
          <p>受益人 {props.importPreview.beneficiary || "未填写"}</p>
          <p>标签 {props.importPreview.assignedTags.join(" ") || "未填写"}</p>
          <p>票据 {props.importPreview.invoiceNumbers.join(" / ") || "暂无票据"}</p>
          <p>
            直接入库 {props.importPreview.readyImportCount} 张 / 人工复核 {props.importPreview.pendingReviewCount} 张
          </p>
        </div>
      ) : null}
      <label>
        员工端提交的标签
        <input readOnly value={props.loadedDraft?.submissionTags.join(" ") ?? ""} />
      </label>
      <button type="button" onClick={props.onFillFinanceTags} disabled={!props.loadedDraft}>
        填入员工标签
      </button>
      <label>
        加入数据库时要打上的标签
        <input value={props.financeTagsText} onChange={(event) => props.onFinanceTagsTextChange(event.target.value)} />
      </label>
      <label>
        入库后受益人
        <input value={props.beneficiary} onChange={(event) => props.onBeneficiaryChange(event.target.value)} />
      </label>
      <label>
        入库接收人
        <input value={props.receivedBy} onChange={(event) => props.onReceivedByChange(event.target.value)} />
      </label>
      {props.precheck ? (
        <div className="workspace-card__summary">
          <p>阻塞项 {props.precheck.blockedItems.length} 条，待确认项 {props.precheck.reviewRequiredItems.length} 条。</p>
          {props.precheck.blockedItems.map((item) => (
            <p key={item.invoiceId}>阻塞：{item.invoiceNumber} / {item.blockedReason}</p>
          ))}
          {props.precheck.reviewRequiredItems.map((item) => (
            <label key={item.invoiceId}>
              {item.invoiceNumber} 处理结果
              <select value={props.reviewDecisions[item.invoiceId] ?? "pending"} onChange={(event) => props.onReviewDecisionChange(item.invoiceId, event.target.value as "pending" | "accept_item" | "reject_item")}>
                <option value="pending">待处理</option>
                <option value="accept_item">接受这张票</option>
                <option value="reject_item">拒绝这张票</option>
              </select>
            </label>
          ))}
        </div>
      ) : null}
      <div className="workspace-card__summary">
        <strong>整批规则</strong>
        <p>当前流程只支持整批接收或整批打回。单票决策只用于解除门控，不会触发部分入库。</p>
      </div>
      <details>
        <summary>调试载荷</summary>
        <label>
          接收提交批次
          <textarea value={props.draftInputText} rows={10} onChange={(event) => props.onDraftInputTextChange(event.target.value)} />
        </label>
        <button type="button" onClick={props.onLoadDraft} disabled={!props.draftInputText.trim()}>
          加载提交草稿
        </button>
      </details>
      <div className="utility-panel__actions">
        <button type="button" onClick={props.onAcceptBatch} disabled={props.acceptDisabled}>
          整批接收
        </button>
        <button type="button" onClick={props.onRejectBatch} disabled={!props.loadedDraft}>
          整批打回
        </button>
      </div>
    </section>
  );
}
