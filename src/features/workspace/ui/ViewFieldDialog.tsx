import { useEffect, useState } from "react";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";

type ViewFieldDialogProps = {
  open: boolean;
  title: string;
  label: string;
  fields: WorkspaceFieldDefinition[];
  fieldId: string;
  onClose: () => void;
  onApply: (fieldId: string) => void;
};

export function ViewFieldDialog({ open, title, label, fields, fieldId, onClose, onApply }: ViewFieldDialogProps) {
  const [localFieldId, setLocalFieldId] = useState(fieldId);

  useEffect(() => {
    if (open) {
      setLocalFieldId(fieldId);
    }
  }, [fieldId, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="overlay-shell" role="presentation">
      <section className="dialog-panel workspace-dialog" aria-label={title}>
        <div className="dialog-panel__header">
          <div>
            <p className="workspace-card__eyebrow">View Field</p>
            <h2>{title}</h2>
            <p>选择当前视图用于分组展示的字段。</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="workspace-dialog__list">
          <div className="workspace-dialog__list-item workspace-dialog__list-item--filter">
            <label className="workspace-dialog__field">
              <span>{label}</span>
              <select aria-label={label} value={localFieldId} onChange={(event) => setLocalFieldId(event.target.value)}>
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
          <button type="button" onClick={() => { onApply(localFieldId); onClose(); }}>
            应用
          </button>
        </div>
      </section>
    </div>
  );
}
