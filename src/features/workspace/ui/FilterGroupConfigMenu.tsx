import { useEffect, useState } from "react";
import type { FilterGroup } from "../../../shared/types/filterGroup";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { FilterDialogRuleRow } from "./FilterDialogRuleRow";
import type { DraftCondition } from "./filterDialogModel";

type FilterGroupConfigMenuProps = {
  drafts: DraftCondition[];
  fields: WorkspaceFieldDefinition[];
  filterGroups: FilterGroup[];
  selectedGroupId: string;
  status: string;
  onBack: () => void;
  onDraftAdd: () => void;
  onDraftChange: (index: number, nextDraft: DraftCondition) => void;
  onDraftRemove: (index: number) => void;
  onLoad: (groupId: string) => void | Promise<void>;
  onSave: (groupId: string) => void | Promise<void>;
  onSaveAs: (name: string) => void | Promise<void>;
  onSelectedGroupChange: (groupId: string) => void;
};

export function FilterGroupConfigMenu({
  drafts,
  fields,
  filterGroups,
  selectedGroupId,
  status,
  onBack,
  onDraftAdd,
  onDraftChange,
  onDraftRemove,
  onLoad,
  onSave,
  onSaveAs,
  onSelectedGroupChange,
}: FilterGroupConfigMenuProps) {
  const [saveAsName, setSaveAsName] = useState("");

  useEffect(() => {
    if (filterGroups.some((group) => group.id === selectedGroupId)) {
      return;
    }

    onSelectedGroupChange(filterGroups[0]?.id ?? "");
  }, [filterGroups, onSelectedGroupChange, selectedGroupId]);

  return (
    <div className="workspace-dialog__config-view">
      <div className="workspace-dialog__config-header">
        <div>
          <p className="workspace-card__eyebrow">Filter Groups</p>
          <h3>配置筛选组</h3>
        </div>
        <button type="button" className="button-secondary" onClick={onBack}>
          返回规则
        </button>
      </div>

      <label className="workspace-dialog__field">
        <span>已有筛选组</span>
        <select aria-label="已有筛选组" value={selectedGroupId} onChange={(event) => onSelectedGroupChange(event.target.value)}>
          <option value="">请选择筛选组</option>
          {filterGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>

      <div className="workspace-dialog__config-actions">
        <button type="button" className="button-secondary" disabled={!selectedGroupId} onClick={() => void onLoad(selectedGroupId)}>
          加载到当前规则
        </button>
        <button type="button" className="button-secondary" disabled={!selectedGroupId} onClick={() => void onSave(selectedGroupId)}>
          保存
        </button>
      </div>

      {selectedGroupId ? (
        <>
          <div className="workspace-dialog__list" role="list" aria-label="筛选组规则列表">
            {drafts.map((draft, index) => (
              <FilterDialogRuleRow
                key={`${draft.id}-${index}`}
                draft={draft}
                index={index}
                fields={fields}
                filterGroups={filterGroups}
                disableRemove={drafts.length === 1}
                onChange={(nextDraft) => onDraftChange(index, nextDraft)}
                onRemove={() => onDraftRemove(index)}
              />
            ))}
          </div>

          <div className="workspace-dialog__list-actions">
            <button type="button" className="button-secondary" onClick={onDraftAdd}>
              添加规则
            </button>
          </div>
        </>
      ) : null}

      <label className="workspace-dialog__field">
        <span>另存为名称</span>
        <input aria-label="另存为名称" value={saveAsName} onChange={(event) => setSaveAsName(event.target.value)} placeholder="输入新筛选组名称" />
      </label>

      <button
        type="button"
        className="button-secondary"
        disabled={saveAsName.trim().length === 0}
        onClick={async () => {
          await onSaveAs(saveAsName.trim());
          setSaveAsName("");
        }}
      >
        另存为
      </button>

      {status ? <p className="workspace-dialog__config-status">{status}</p> : null}
    </div>
  );
}
