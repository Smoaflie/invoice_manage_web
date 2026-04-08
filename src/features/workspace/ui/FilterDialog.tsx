import { useEffect, useState } from "react";
import type { ConditionGroup, FilterGroup } from "../../../shared/types/filterGroup";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { listFilterGroups, saveFilterGroup } from "../../filters/application/filterGroups";
import { FilterDialogRuleRow } from "./FilterDialogRuleRow";
import { FilterGroupConfigMenu } from "./FilterGroupConfigMenu";
import { buildConditionRootFromDrafts, createDefaultDraft, createDraftsFromConditionRoot, type DraftCondition } from "./filterDialogModel";

type FilterDialogProps = {
  open: boolean;
  fields: WorkspaceFieldDefinition[];
  conditionRoot: ConditionGroup;
  onClose: () => void;
  onApply: (conditionRoot: ConditionGroup) => void;
  onFilterGroupsChange?: () => void | Promise<void>;
};

function buildDraftRoot(fields: WorkspaceFieldDefinition[], drafts: DraftCondition[]) {
  return buildConditionRootFromDrafts(fields, drafts, `group-root-${Date.now()}`);
}

function cloneDrafts(drafts: DraftCondition[]) {
  return drafts.map((draft) => ({ ...draft, multiValue: [...draft.multiValue] }));
}

export function FilterDialog({ open, fields, conditionRoot, onClose, onApply, onFilterGroupsChange }: FilterDialogProps) {
  const [drafts, setDrafts] = useState<DraftCondition[]>([]);
  const [groupDrafts, setGroupDrafts] = useState<DraftCondition[]>([createDefaultDraft(fields)]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [configStatus, setConfigStatus] = useState("");
  const [view, setView] = useState<"rules" | "groups">("rules");

  function selectGroupForConfig(groupId: string, groups: FilterGroup[] = filterGroups) {
    const group = groups.find((item) => item.id === groupId);
    setSelectedGroupId(groupId);
    setGroupDrafts(group ? createDraftsFromConditionRoot(fields, group.root) : [createDefaultDraft(fields)]);
  }

  async function refreshFilterGroups(preferredGroupId?: string) {
    const groups = await listFilterGroups();
    const nextSelectedGroupId =
      preferredGroupId && groups.some((group) => group.id === preferredGroupId)
        ? preferredGroupId
        : groups.some((group) => group.id === selectedGroupId)
          ? selectedGroupId
          : groups[0]?.id ?? "";

    setFilterGroups(groups);
    setSelectedGroupId(nextSelectedGroupId);
    if (nextSelectedGroupId && nextSelectedGroupId !== selectedGroupId) {
      selectGroupForConfig(nextSelectedGroupId, groups);
    }
    if (!nextSelectedGroupId) {
      setGroupDrafts([createDefaultDraft(fields)]);
    }
    return groups;
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setConfigStatus("");
    setView("rules");
    void listFilterGroups().then((groups) => {
      if (!active) {
        return;
      }

      setFilterGroups(groups);
      const initialGroupId = groups[0]?.id ?? "";
      setSelectedGroupId(initialGroupId);
      setGroupDrafts(initialGroupId ? createDraftsFromConditionRoot(fields, groups[0].root) : [createDefaultDraft(fields)]);
    });

    return () => {
      active = false;
    };
  }, [fields, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDrafts(createDraftsFromConditionRoot(fields, conditionRoot));
  }, [conditionRoot, fields, open]);

  if (!open) {
    return null;
  }

  const handleLoadFilterGroup = async (groupId: string) => {
    const group = filterGroups.find((item) => item.id === groupId);
    if (!group) {
      return;
    }

    setDrafts(cloneDrafts(groupDrafts));
    setConfigStatus(`已加载筛选组：${group.name}`);
  };

  const handleSaveFilterGroup = async (groupId: string) => {
    const group = filterGroups.find((item) => item.id === groupId);
    if (!group) {
      return;
    }

    try {
      await saveFilterGroup({
        id: group.id,
        name: group.name,
        root: buildDraftRoot(fields, groupDrafts),
        now: () => new Date().toISOString(),
      });
      await refreshFilterGroups();
      await onFilterGroupsChange?.();
      setConfigStatus(`已保存筛选组：${group.name}`);
    } catch (error) {
      setConfigStatus(error instanceof Error ? error.message : "保存筛选组失败。");
    }
  };

  const handleSaveAsFilterGroup = async (name: string) => {
    try {
      const savedGroup = await saveFilterGroup({
        name,
        root: buildDraftRoot(fields, groupDrafts),
        now: () => new Date().toISOString(),
      });
      await refreshFilterGroups();
      await onFilterGroupsChange?.();
      setConfigStatus(`已另存为筛选组：${savedGroup.name}`);
    } catch (error) {
      setConfigStatus(error instanceof Error ? error.message : "另存为筛选组失败。");
    }
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

        {view === "rules" ? (
          <>
            <div className="workspace-dialog__list" role="list" aria-label="筛选规则列表">
              {drafts.map((draft, index) => (
                <FilterDialogRuleRow
                  key={`${draft.id}-${index}`}
                  draft={draft}
                  index={index}
                  fields={fields}
                  filterGroups={filterGroups}
                  disableRemove={drafts.length === 1}
                  onChange={(nextDraft) => setDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? nextDraft : item)))}
                  onRemove={() => setDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                />
              ))}
            </div>

            <div className="workspace-dialog__list-actions">
              <button type="button" className="button-secondary" onClick={() => setDrafts((current) => [...current, createDefaultDraft(fields, current.length)])}>
                添加规则
              </button>
            </div>
          </>
        ) : (
          <FilterGroupConfigMenu
            drafts={groupDrafts}
            fields={fields}
            filterGroups={filterGroups}
            selectedGroupId={selectedGroupId}
            status={configStatus}
            onBack={() => setView("rules")}
            onDraftAdd={() => setGroupDrafts((current) => [...current, createDefaultDraft(fields, current.length)])}
            onDraftChange={(index, nextDraft) =>
              setGroupDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? nextDraft : item)))
            }
            onDraftRemove={(index) => setGroupDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))}
            onLoad={handleLoadFilterGroup}
            onSave={handleSaveFilterGroup}
            onSaveAs={handleSaveAsFilterGroup}
            onSelectedGroupChange={(groupId) => {
              selectGroupForConfig(groupId);
              setConfigStatus("");
            }}
          />
        )}

        <div className="dialog-panel__actions">
          {view === "rules" ? (
            <button type="button" className="button-secondary" onClick={() => setView("groups")}>
              配置筛选组
            </button>
          ) : null}
          <button type="button" className="button-secondary" onClick={() => setDrafts([createDefaultDraft(fields)])}>
            清空
          </button>
          <button type="button" className="button-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(buildConditionRootFromDrafts(fields, drafts));
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
