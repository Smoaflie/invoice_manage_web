import { useEffect, useMemo, useState } from "react";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { moveFieldOrder } from "../application/workspaceFieldLayout";

type FieldConfigDialogProps = {
  open: boolean;
  fields: WorkspaceFieldDefinition[];
  visibleFieldIds: string[];
  fieldOrder: string[];
  onClose: () => void;
  onApply: (nextVisibleFieldIds: string[], nextFieldOrder: string[]) => void;
};

export function FieldConfigDialog({ open, fields, visibleFieldIds, fieldOrder, onClose, onApply }: FieldConfigDialogProps) {
  const [localVisibleFieldIds, setLocalVisibleFieldIds] = useState<string[]>([]);
  const [localFieldOrder, setLocalFieldOrder] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setLocalVisibleFieldIds(visibleFieldIds);
    setLocalFieldOrder(fieldOrder);
  }, [fieldOrder, open, visibleFieldIds]);

  const orderedFields = useMemo(
    () => localFieldOrder.map((fieldId) => fields.find((field) => field.id === fieldId)).filter((field): field is WorkspaceFieldDefinition => Boolean(field)),
    [fields, localFieldOrder],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="overlay-shell" role="presentation">
      <section className="dialog-panel workspace-dialog" aria-label="字段管理">
        <div className="dialog-panel__header">
          <div>
            <p className="workspace-card__eyebrow">Field Manager</p>
            <h2>字段管理</h2>
            <p>按参考工作区方式控制列显示与顺序，应用后再刷新主表。</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="workspace-dialog__list">
          {orderedFields.map((field, index) => {
            const checked = localVisibleFieldIds.includes(field.id);
            const singleVisibleField = checked && localVisibleFieldIds.length === 1;

            return (
              <div key={field.id} className="workspace-dialog__list-item">
                <label className="workspace-dialog__field-toggle">
                  <input
                    type="checkbox"
                    aria-label={`显示字段 ${field.label}`}
                    checked={checked}
                    disabled={singleVisibleField}
                    onChange={() =>
                      setLocalVisibleFieldIds((current) =>
                        current.includes(field.id) ? current.filter((item) => item !== field.id) : [...current, field.id],
                      )
                    }
                  />
                  <span className="workspace-dialog__field-name">{field.label}</span>
                </label>
                <div className="workspace-dialog__field-actions">
                  <button type="button" className="button-secondary" disabled={index === 0} onClick={() => setLocalFieldOrder((current) => moveFieldOrder(current, field.id, "up"))}>
                    上移
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={index === orderedFields.length - 1}
                    onClick={() => setLocalFieldOrder((current) => moveFieldOrder(current, field.id, "down"))}
                  >
                    下移
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="dialog-panel__actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            disabled={localVisibleFieldIds.length === 0}
            onClick={() => {
              onApply(localVisibleFieldIds, localFieldOrder);
              onClose();
            }}
          >
            应用字段
          </button>
        </div>
      </section>
    </div>
  );
}
