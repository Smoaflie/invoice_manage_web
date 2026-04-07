import type { FilterGroup } from "../../../shared/types/filterGroup";
import type { ExposureSummaryViewModel } from "../application/collaborationPanelViewModel";

export type ExposurePanelProps = {
  filterGroups: FilterGroup[];
  selectedGroupId: string;
  snapshotText: string;
  summary: ExposureSummaryViewModel | null;
  onSelectedGroupChange: (value: string) => void;
  onGenerate: () => void;
};

export function ExposurePanel({ filterGroups, selectedGroupId, snapshotText, summary, onSelectedGroupChange, onGenerate }: ExposurePanelProps) {
  return (
    <section className="workspace-card">
      <div className="workspace-card__header">
        <div>
          <p className="workspace-card__eyebrow">财务端</p>
          <h2>暴露快照</h2>
        </div>
      </div>
      {summary ? (
        <div className="workspace-card__summary">
          <strong>快照摘要</strong>
          <p>筛选组 {summary.filterGroupName || "未命名筛选组"}</p>
          <p>票据 {summary.invoiceCount} 张</p>
          <p>创建人 {summary.createdBy || "未填写"}</p>
          <p>摘要 {summary.digest || "空快照"}</p>
        </div>
      ) : null}
      <label>
        暴露筛选组
        <select value={selectedGroupId} onChange={(event) => onSelectedGroupChange(event.target.value)}>
          <option value="">请选择</option>
          {filterGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={onGenerate} disabled={!selectedGroupId}>
        生成暴露快照
      </button>
      <details>
        <summary>调试载荷</summary>
        <label>
          暴露快照内容
          <textarea value={snapshotText} readOnly rows={8} />
        </label>
      </details>
    </section>
  );
}
