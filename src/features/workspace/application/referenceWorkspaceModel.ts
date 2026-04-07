import type { ConditionGroup } from "../../../shared/types/filterGroup";
import type { WorkspaceFilter } from "../../../shared/types/savedView";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import type { WorkspaceRowState } from "./workspaceRowState";
import { createConditionMatcher, createWorkspaceFilterMatcher, createWorkspaceSearchMatcher } from "./workspaceRowFilters";
const zhCollator = new Intl.Collator("zh-CN");

export type ReferenceWorkspaceGroup = {
  id: string;
  name: string;
  rows: WorkspaceRowState[];
};

export type ReferenceWorkspaceData = {
  groups: ReferenceWorkspaceGroup[];
  groupIds: string[];
  rows: WorkspaceRowState[];
  rowIdSet: Set<string>;
};

type BuildReferenceWorkspaceDataInput = {
  groupByFieldId: string;
  searchText: string;
  conditionRoot?: ConditionGroup;
  filters?: WorkspaceFilter[];
  resolveFilterGroup?: (filterGroupId: string) => ConditionGroup | null;
};

type ReferenceSortConfig = {
  fieldId: string | null;
  direction: "asc" | "desc";
  isActive: boolean;
};

function getRowValue(rowState: WorkspaceRowState, fieldId: string) {
  return rowState.values[fieldId] ?? "";
}

function compareValues(left: unknown, right: unknown, direction: "asc" | "desc") {
  const leftValue = Array.isArray(left) ? left.join(" ") : left;
  const rightValue = Array.isArray(right) ? right.join(" ") : right;

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
  }

  const result = zhCollator.compare(String(leftValue ?? ""), String(rightValue ?? ""));
  return direction === "asc" ? result : -result;
}

function createGroupOrder(field: WorkspaceFieldDefinition | undefined) {
  return new Map((field?.options ?? []).map((option, index) => [option, index]));
}

function groupLabelKeys(rowState: WorkspaceRowState, field: WorkspaceFieldDefinition | undefined) {
  const rawValue = field ? getRowValue(rowState, field.id) : "";
  if (Array.isArray(rawValue)) {
    return rawValue.length > 0 ? rawValue.map((item) => String(item)) : ["未设置"];
  }
  return [String(rawValue || "未设置")];
}

function finalizeReferenceWorkspaceData(groups: ReferenceWorkspaceGroup[]): ReferenceWorkspaceData {
  const groupIds: string[] = [];
  const rows: WorkspaceRowState[] = [];
  const rowIdSet = new Set<string>();

  for (const group of groups) {
    groupIds.push(group.id);
    for (const row of group.rows) {
      rows.push(row);
      rowIdSet.add(row.id);
    }
  }

  return { groups, groupIds, rows, rowIdSet };
}

export function buildReferenceWorkspaceData(rowStates: WorkspaceRowState[], fields: WorkspaceFieldDefinition[], input: BuildReferenceWorkspaceDataInput): ReferenceWorkspaceData {
  const groupField = fields.find((field) => field.id === input.groupByFieldId);
  const matchesSearch = createWorkspaceSearchMatcher(input.searchText);
  const filterMatchers = (input.filters ?? []).map((filter: WorkspaceFilter) => createWorkspaceFilterMatcher(filter));
  const matchesCondition = input.conditionRoot ? createConditionMatcher(input.conditionRoot, input.resolveFilterGroup) : () => true;
  const groupOrder = createGroupOrder(groupField);
  const buckets = new Map<string, WorkspaceRowState[]>();

  for (const rowState of rowStates) {
    if (!matchesSearch(rowState)) {
      continue;
    }
    if (!matchesCondition(rowState) || !filterMatchers.every((matcher) => matcher(rowState))) {
      continue;
    }

    const keys = input.groupByFieldId ? groupLabelKeys(rowState, groupField) : ["全部记录"];
    for (const key of keys) {
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(rowState);
      } else {
        buckets.set(key, [rowState]);
      }
    }
  }

  const groups = [...buckets.entries()]
    .map(([id, groupedRows]) => ({ id, name: id, rows: groupedRows }))
    .sort((left, right) => {
      const leftIndex = groupOrder.get(left.id) ?? -1;
      const rightIndex = groupOrder.get(right.id) ?? -1;
      if (leftIndex >= 0 || rightIndex >= 0) {
        if (leftIndex < 0) {
          return 1;
        }
        if (rightIndex < 0) {
          return -1;
        }
        return leftIndex - rightIndex;
      }
      return zhCollator.compare(left.name, right.name);
    });

  return finalizeReferenceWorkspaceData(groups);
}

export function sortReferenceWorkspaceData(data: ReferenceWorkspaceData, fields: WorkspaceFieldDefinition[], sortConfig: ReferenceSortConfig): ReferenceWorkspaceData {
  if (!sortConfig.isActive || !sortConfig.fieldId) {
    return data;
  }

  const field = fields.find((item) => item.id === sortConfig.fieldId);

  return finalizeReferenceWorkspaceData(
    data.groups.map((group) => ({
      ...group,
      rows: [...group.rows].sort((left, right) => {
        const result = compareValues(field ? getRowValue(left, field.id) : "", field ? getRowValue(right, field.id) : "", sortConfig.direction);
        return result !== 0 ? result : right.row.updatedAt.localeCompare(left.row.updatedAt);
      }),
    })),
  );
}
