import type { FilterGroup } from "../../../shared/types/filterGroup";

export type SubmissionPanelProps = {
  filterGroups: FilterGroup[];
  selectedGroupId: string;
  senderName: string;
  beneficiaryName: string;
  submissionTagsText: string;
  successAckLocalTag: string;
  successAckLocalTagEnabled: boolean;
  includeSourceFiles: boolean;
  draftText: string;
  summaryPayloadText: string;
  recordsPayloadText: string;
  matchedInvoiceNumbers: string[];
  pendingSubmissionInvoiceNumbers: string[];
  onSelectedGroupChange: (value: string) => void;
  onSenderNameChange: (value: string) => void;
  onBeneficiaryNameChange: (value: string) => void;
  onSubmissionTagsTextChange: (value: string) => void;
  onSuccessAckLocalTagChange: (value: string) => void;
  onSuccessAckLocalTagEnabledChange: (value: boolean) => void;
  onIncludeSourceFilesChange: (value: boolean) => void;
  onGenerate: () => void;
};

export function SubmissionPanel(props: SubmissionPanelProps) {
  return (
    <section className="workspace-card">
      <div className="workspace-card__header">
        <div>
          <p className="workspace-card__eyebrow">员工端</p>
          <h2>提交批次</h2>
        </div>
      </div>
      <div className="workspace-card__summary">
        <strong>本次将提交</strong>
        <p>{props.pendingSubmissionInvoiceNumbers.length > 0 ? props.pendingSubmissionInvoiceNumbers.join(" / ") : "当前筛选结果没有待提交票据。"}</p>
      </div>
      <div className="workspace-card__summary">
        <strong>命中快照后不再提交</strong>
        <p>{props.matchedInvoiceNumbers.length > 0 ? props.matchedInvoiceNumbers.map((invoiceNumber) => `${invoiceNumber}（已命中）`).join(" / ") : "暂无已命中快照的票据。"}</p>
      </div>
      <div className="workspace-card__summary">
        <strong>成功回写规则</strong>
        <p>
          {props.successAckLocalTagEnabled
            ? `仅在财务整批接收成功后，为本批次票据写入标签：${props.successAckLocalTag || "已发送财务"}`
            : "当前未启用成功接收后的本地标签回写。"}
        </p>
      </div>
      <div className="workspace-card__summary">
        <strong>提交后会发生什么</strong>
        <p>当前动作只会生成待发送批次，不会立刻改动财务端台账。真正落库要等财务加载批次并完成整批接收。</p>
      </div>
      <label>
        提交筛选组
        <select value={props.selectedGroupId} onChange={(event) => props.onSelectedGroupChange(event.target.value)}>
          <option value="">请选择</option>
          {props.filterGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        发送人
        <input value={props.senderName} onChange={(event) => props.onSenderNameChange(event.target.value)} />
      </label>
      <label>
        受益人
        <input value={props.beneficiaryName} onChange={(event) => props.onBeneficiaryNameChange(event.target.value)} />
      </label>
      <label>
        提交标签
        <input value={props.submissionTagsText} onChange={(event) => props.onSubmissionTagsTextChange(event.target.value)} />
      </label>
      <label>
        <input checked={props.includeSourceFiles} type="checkbox" onChange={(event) => props.onIncludeSourceFilesChange(event.target.checked)} />
        包含源文件
      </label>
      <label>
        <input
          checked={props.successAckLocalTagEnabled}
          type="checkbox"
          onChange={(event) => props.onSuccessAckLocalTagEnabledChange(event.target.checked)}
        />
        成功接收后本地打标签
      </label>
      <label>
        成功接收后本地标签
        <input value={props.successAckLocalTag} onChange={(event) => props.onSuccessAckLocalTagChange(event.target.value)} />
      </label>
      <button type="button" onClick={props.onGenerate} disabled={!props.selectedGroupId}>
        生成提交批次
      </button>
      <details>
        <summary>调试载荷</summary>
        <label>
          提交批次内容
          <textarea value={props.draftText} readOnly rows={10} />
        </label>
        <label>
          摘要载荷
          <textarea value={props.summaryPayloadText} readOnly rows={5} />
        </label>
        <label>
          记录载荷
          <textarea value={props.recordsPayloadText} readOnly rows={5} />
        </label>
      </details>
    </section>
  );
}
