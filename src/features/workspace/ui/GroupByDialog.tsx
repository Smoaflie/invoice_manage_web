import { useEffect, useState } from "react";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";

type GroupByDialogProps = {
  open: boolean;
  fields: WorkspaceFieldDefinition[];
  groupByFieldId: string;
  onClose: () => void;
  onApply: (fieldId: string) => void;
};

export function GroupByDialog({ open, fields, groupByFieldId, onClose, onApply }: GroupByDialogProps) {
  const [localGroupByFieldId, setLocalGroupByFieldId] = useState(groupByFieldId);

  useEffect(() => {
    if (open) {
      setLocalGroupByFieldId(groupByFieldId);
    }
  }, [groupByFieldId, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="overlay-shell" role="presentation">
      <section className="dialog-panel workspace-dialog" aria-label="分组">
        <div className="dialog-panel__header">
          <div>
            <p className="workspace-card__eyebrow">Group By</p>
            <h2>分组</h2>
            <p>按参考工作区的分组入口切换表格分组字段。</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="workspace-dialog__list">
          <div className="workspace-dialog__list-item workspace-dialog__list-item--filter">
            <label className="workspace-dialog__field">
              <span>分组字段</span>
              <select aria-label="分组字段" value={localGroupByFieldId} onChange={(event) => setLocalGroupByFieldId(event.target.value)}>
                <option value="">不分组</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="dialog-panel__actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" onClick={() => { onApply(localGroupByFieldId); onClose(); }}>
            应用分组
          </button>
        </div>
      </section>
    </div>
  );
}
