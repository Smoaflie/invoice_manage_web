import { useEffect, useMemo, useState } from "react";
import type { ConditionGroup } from "../../../shared/types/filterGroup";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import type { FilterGroup } from "../../../shared/types/filterGroup";
import { listFilterGroups, saveFilterGroup } from "../../filters/application/filterGroups";
import { buildConditionRootFromDrafts, createDefaultDraft, createDraftsFromConditionRoot, operatorOptions, type DraftCondition } from "./filterDialogModel";

type FilterDialogProps = {
  open: boolean;
  fields: WorkspaceFieldDefinition[];
  conditionRoot: ConditionGroup;
  onClose: () => void;
  onApply: (conditionRoot: ConditionGroup) => void;
  onFilterGroupsChange?: () => void | Promise<void>;
};

function getRuleLabel(baseLabel: string, index: number) {
  return index === 0 ? baseLabel : `${baseLabel} ${index + 1}`;
}

export function FilterDialog({ open, fields, conditionRoot, onClose, onApply, onFilterGroupsChange }: FilterDialogProps) {
  const [drafts, setDrafts] = useState<DraftCondition[]>([]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    void listFilterGroups().then((groups) => {
      if (active) {
        setFilterGroups(groups);
      }
    });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDrafts(createDraftsFromConditionRoot(fields, conditionRoot));
  }, [conditionRoot, fields, open]);

  const availableFields = useMemo(() => fields, [fields]);

  if (!open) {
    return null;
  }

  const handleSaveAsFilterGroup = async () => {
    const name = window.prompt("请输入筛选组名称");
    if (!name || name.trim().length === 0) {
      return;
    }

    await saveFilterGroup({
      name,
      root: buildConditionRootFromDrafts(availableFields, drafts, `group-root-${Date.now()}`),
      now: () => new Date().toISOString(),
    });

    const groups = await listFilterGroups();
    setFilterGroups(groups);
    await onFilterGroupsChange?.();
  };

  return (
    <div className="overlay-shell" role="presentation">
      <section className="dialog-panel workspace-dialog" aria-label="数据筛选">
        <div className="dialog-panel__header">
          <div>
            <p className="workspace-card__eyebrow">Data Filter</p>
            <h2>数据筛选</h2>
            <p>先在弹层里配置筛选规则，再把结果集应用到当前工作区。</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="workspace-dialog__list">
          {drafts.map((draft, index) => {
            const selectedField = availableFields.find((field) => field.id === draft.fieldId);
            const operators = operatorOptions(selectedField);
            const valueDisabled = draft.type !== "field" || draft.operator === "is_not_empty";
            const ruleTypeLabel = getRuleLabel("规则类型", index);
            const fieldLabel = getRuleLabel("筛选字段", index);
            const operatorLabel = getRuleLabel("筛选条件", index);
            const valueLabel = getRuleLabel("筛选值", index);
            const groupLabel = getRuleLabel("筛选组", index);

            return (
              <div key={`${draft.id}-${index}`} className="workspace-dialog__list-item workspace-dialog__list-item--filter">
                <label className="workspace-dialog__field">
                  <span>{ruleTypeLabel}</span>
                  <select
                    aria-label={ruleTypeLabel}
                    value={draft.type}
                    onChange={(event) =>
                      setDrafts((current) =>
                        current.map((item, itemIndex) => {
                          if (itemIndex !== index) {
                            return item;
                          }
                          return event.target.value === "filter_group"
                            ? { ...item, type: "filter_group", fieldId: "", textValue: "", multiValue: [], filterGroupId: filterGroups[0]?.id ?? "" }
                            : createDefaultDraft(availableFields, index);
                        }),
                      )
                    }
                  >
                    <option value="field">字段条件</option>
                    <option value="filter_group">应用筛选组</option>
                  </select>
                </label>

                {draft.type === "filter_group" ? (
                  <label className="workspace-dialog__field">
                    <span>{groupLabel}</span>
                    <select
                      aria-label={groupLabel}
                      value={draft.filterGroupId}
                      onChange={(event) =>
                        setDrafts((current) =>
                          current.map((item, itemIndex) => (itemIndex === index ? { ...item, filterGroupId: event.target.value } : item)),
                        )
                      }
                    >
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
                    <label className="workspace-dialog__field">
                      <span>{fieldLabel}</span>
                      <select
                        aria-label={fieldLabel}
                        value={draft.fieldId}
                        onChange={(event) =>
                          setDrafts((current) =>
                            current.map((item, itemIndex) => {
                              if (itemIndex !== index) {
                                return item;
                              }
                              const nextField = availableFields.find((field) => field.id === event.target.value);
                              return {
                                ...item,
                                fieldId: event.target.value,
                                operator: operatorOptions(nextField)[0].value,
                                textValue: "",
                                multiValue: [],
                              };
                            }),
                          )
                        }
                      >
                        {availableFields.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="workspace-dialog__field">
                      <span>{operatorLabel}</span>
                      <select
                        aria-label={operatorLabel}
                        value={draft.operator}
                        onChange={(event) =>
                          setDrafts((current) =>
                            current.map((item, itemIndex) => (itemIndex === index ? { ...item, operator: event.target.value as DraftCondition["operator"] } : item)),
                          )
                        }
                      >
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
                            setDrafts((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, multiValue: [...event.currentTarget.selectedOptions].map((option) => option.value) }
                                  : item,
                              ),
                            )
                          }
                        >
                          {selectedField.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
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
                          onChange={(event) =>
                            setDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, textValue: event.target.value } : item)))
                          }
                        />
                      )}
                    </label>
                  </>
                )}

                <button
                  type="button"
                  className="button-secondary"
                  disabled={drafts.length === 1}
                  onClick={() => setDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                >
                  删除规则
                </button>
              </div>
            );
          })}
        </div>

        <div className="dialog-panel__actions">
          <button type="button" className="button-secondary" onClick={() => setDrafts((current) => [...current, createDefaultDraft(availableFields, current.length)])}>
            添加规则
          </button>
          <button type="button" className="button-secondary" onClick={() => setDrafts([createDefaultDraft(availableFields)])}>
            清空
          </button>
          <button type="button" className="button-secondary" onClick={() => void handleSaveAsFilterGroup()}>
            保存为筛选组
          </button>
          <button type="button" className="button-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(buildConditionRootFromDrafts(availableFields, drafts));
              onClose();
            }}
          >
            应用筛选
          </button>
        </div>
      </section>
    </div>
  );
}
