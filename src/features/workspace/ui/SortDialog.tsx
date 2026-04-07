import { useEffect, useState } from "react";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";

type SortDialogProps = {
  open: boolean;
  fields: WorkspaceFieldDefinition[];
  sortFieldId: string;
  sortDirection: "asc" | "desc";
  onClose: () => void;
  onApply: (fieldId: string, direction: "asc" | "desc") => void;
};

export function SortDialog({ open, fields, sortFieldId, sortDirection, onClose, onApply }: SortDialogProps) {
  const [localFieldId, setLocalFieldId] = useState(sortFieldId);
  const [localDirection, setLocalDirection] = useState<"asc" | "desc">(sortDirection);

  useEffect(() => {
    if (open) {
      setLocalFieldId(sortFieldId);
      setLocalDirection(sortDirection);
    }
  }, [open, sortDirection, sortFieldId]);

  if (!open) {
    return null;
  }

  return (
    <div className="overlay-shell" role="presentation">
      <section className="dialog-panel workspace-dialog" aria-label="排序">
        <div className="dialog-panel__header">
          <div>
            <p className="workspace-card__eyebrow">Sort</p>
            <h2>排序</h2>
            <p>按参考工作区的按钮式交互设置当前记录集排序。</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="workspace-dialog__list">
          <div className="workspace-dialog__list-item workspace-dialog__list-item--filter">
            <label className="workspace-dialog__field">
              <span>排序字段</span>
              <select aria-label="排序字段" value={localFieldId} onChange={(event) => setLocalFieldId(event.target.value)}>
                <option value="updatedAt">更新时间</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="workspace-dialog__field">
              <span>排序方向</span>
              <select aria-label="排序方向" value={localDirection} onChange={(event) => setLocalDirection(event.target.value as "asc" | "desc")}>
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </label>
          </div>
        </div>

        <div className="dialog-panel__actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" onClick={() => { onApply(localFieldId, localDirection); onClose(); }}>
            应用排序
          </button>
        </div>
      </section>
    </div>
  );
}
