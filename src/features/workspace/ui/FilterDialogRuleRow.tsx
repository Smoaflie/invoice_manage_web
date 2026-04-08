import type { FilterGroup } from "../../../shared/types/filterGroup";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { formatFieldOptionLabel } from "./filterDialogOptionLabels";
import { applyDraftTargetValue, getDraftTargetValue, operatorOptions, type DraftCondition } from "./filterDialogModel";

type FilterDialogRuleRowProps = {
  draft: DraftCondition;
  index: number;
  fields: WorkspaceFieldDefinition[];
  filterGroups: FilterGroup[];
  onChange: (nextDraft: DraftCondition) => void;
  onRemove: () => void;
  disableRemove: boolean;
};

function getRuleLabel(baseLabel: string, index: number) {
  return index === 0 ? baseLabel : `${baseLabel} ${index + 1}`;
}

export function FilterDialogRuleRow({ draft, index, fields, filterGroups, onChange, onRemove, disableRemove }: FilterDialogRuleRowProps) {
  const selectedField = fields.find((field) => field.id === draft.fieldId);
  const operators = operatorOptions(selectedField);
  const valueDisabled = draft.type !== "field" || draft.operator === "is_not_empty";
  const targetLabel = getRuleLabel("规则目标", index);
  const operatorLabel = getRuleLabel("筛选条件", index);
  const valueLabel = getRuleLabel("筛选值", index);
  const groupLabel = getRuleLabel("筛选组", index);

  return (
    <div className="workspace-dialog__list-item workspace-dialog__list-item--filter workspace-dialog__list-item--filter-1-1-2 workspace-dialog__list-item--filter-compact" role="listitem">
      <label className="workspace-dialog__field">
        <span>{targetLabel}</span>
        <select
          aria-label={targetLabel}
          value={getDraftTargetValue(draft)}
          onChange={(event) => onChange(applyDraftTargetValue(fields, draft, event.target.value, filterGroups[0]?.id ?? ""))}
        >
          <option value="filter_group">应用筛选组</option>
          {fields.map((field) => (
            <option key={field.id} value={`field:${field.id}`}>
              {field.label}
            </option>
          ))}
        </select>
      </label>

      {draft.type === "filter_group" ? (
        <label className="workspace-dialog__field workspace-dialog__field--span-2">
          <span>{groupLabel}</span>
          <select aria-label={groupLabel} value={draft.filterGroupId} onChange={(event) => onChange({ ...draft, filterGroupId: event.target.value })}>
            <option value="">请选择筛选组</option>
            {filterGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <label className="workspace-dialog__field workspace-dialog__field--operator">
            <span>{operatorLabel}</span>
            <select aria-label={operatorLabel} value={draft.operator} onChange={(event) => onChange({ ...draft, operator: event.target.value as DraftCondition["operator"] })}>
              {operators.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="workspace-dialog__field">
            <span>{valueLabel}</span>
            {selectedField?.type === "multi_select" ? (
              <select
                multiple
                aria-label={valueLabel}
                value={draft.multiValue}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    multiValue: [...event.currentTarget.selectedOptions].map((option) => option.value),
                  })
                }
              >
                {selectedField.options.map((option) => (
                  <option key={option} value={option}>
                    {formatFieldOptionLabel(selectedField, option)}
                  </option>
                ))}
              </select>
            ) : selectedField?.type === "single_select" ? (
              <select aria-label={valueLabel} value={draft.textValue} onChange={(event) => onChange({ ...draft, textValue: event.target.value })}>
                <option value="">请选择筛选值</option>
                {selectedField.options.map((option) => (
                  <option key={option} value={option}>
                    {formatFieldOptionLabel(selectedField, option)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-label={valueLabel}
                type={selectedField?.type === "number" ? "number" : "text"}
                disabled={valueDisabled}
                placeholder={valueDisabled ? "无需填写" : undefined}
                value={draft.textValue}
                onChange={(event) => onChange({ ...draft, textValue: event.target.value })}
              />
            )}
          </label>
        </>
      )}

      <div className="workspace-dialog__row-actions workspace-dialog__row-actions--centered">
        <button
          type="button"
          className="button-secondary workspace-dialog__remove-button workspace-dialog__remove-button--compact"
          aria-label="X"
          disabled={disableRemove}
          onClick={onRemove}
        >
          X
        </button>
      </div>
    </div>
  );
}
