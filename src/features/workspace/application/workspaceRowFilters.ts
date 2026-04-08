import type { ConditionGroup, ConditionNode } from "../../../shared/types/filterGroup";
import type { WorkspaceFilter } from "../../../shared/types/savedView";
import type { WorkspaceRowState } from "./workspaceRowState";

type WorkspaceRowFilter = Pick<WorkspaceFilter, "fieldId" | "operator" | "value">;

function normalizeText(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function getRowFieldValue(rowState: WorkspaceRowState, fieldId: string) {
  return rowState.values[fieldId] ?? "";
}

function normalizeFilterTarget(value: unknown) {
  return normalizeText(Array.isArray(value) ? value.join(" ") : value);
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const directNumber = Number(value);
    if (Number.isFinite(directNumber)) {
      return directNumber;
    }
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }
  return null;
}

export function createWorkspaceSearchMatcher(searchText: string) {
  const normalized = searchText.trim().toLowerCase();
  if (!normalized) {
    return () => true;
  }

  return (rowState: WorkspaceRowState) => rowState.searchText.includes(normalized);
}

export function createWorkspaceFilterMatcher(filter: WorkspaceRowFilter) {
  switch (filter.operator) {
    case "is_not_empty":
      return (rowState: WorkspaceRowState) => normalizeText(getRowFieldValue(rowState, filter.fieldId)).trim().length > 0;
    case "matches_regex": {
      let expression: RegExp | null = null;
      try {
        expression = new RegExp(String(filter.value ?? ""));
      } catch {
        expression = null;
      }

      return (rowState: WorkspaceRowState) => (expression ? expression.test(String(getRowFieldValue(rowState, filter.fieldId) ?? "")) : false);
    }
    case "equals":
      return (rowState: WorkspaceRowState) => {
        if (typeof filter.value === "number") {
          return numericValue(getRowFieldValue(rowState, filter.fieldId)) === filter.value;
        }
        return getRowFieldValue(rowState, filter.fieldId) === filter.value;
      };
    case "greater_than":
      return (rowState: WorkspaceRowState) => {
        const value = numericValue(getRowFieldValue(rowState, filter.fieldId));
        return value !== null && typeof filter.value === "number" && value > filter.value;
      };
    case "less_than":
      return (rowState: WorkspaceRowState) => {
        const value = numericValue(getRowFieldValue(rowState, filter.fieldId));
        return value !== null && typeof filter.value === "number" && value < filter.value;
      };
    case "includes_any": {
      const filterValues = Array.isArray(filter.value) ? new Set(filter.value) : null;
      return (rowState: WorkspaceRowState) => {
        if (!filterValues) {
          return false;
        }

        const rowValue = getRowFieldValue(rowState, filter.fieldId);
        if (!Array.isArray(rowValue)) {
          return false;
        }

        return rowValue.some((value) => filterValues.has(value));
      };
    }
    case "contains":
    default: {
      const normalizedFilterValue = normalizeText(filter.value);
      return (rowState: WorkspaceRowState) => normalizeFilterTarget(getRowFieldValue(rowState, filter.fieldId)).includes(normalizedFilterValue);
    }
  }
}

function evaluateConditionNode(
  node: ConditionNode,
  rowState: WorkspaceRowState,
  resolveFilterGroup: (filterGroupId: string) => ConditionGroup | null,
  visitedGroupIds: Set<string>,
): boolean {
  if (node.kind === "field") {
    return createWorkspaceFilterMatcher(node)(rowState);
  }
  if (node.kind === "filter_group") {
    if (visitedGroupIds.has(node.filterGroupId)) {
      return false;
    }
    const nestedGroup = resolveFilterGroup(node.filterGroupId);
    if (!nestedGroup) {
      return false;
    }
    const nextVisited = new Set(visitedGroupIds);
    nextVisited.add(node.filterGroupId);
    return evaluateConditionGroup(nestedGroup, rowState, resolveFilterGroup, nextVisited);
  }
  return evaluateConditionGroup(node, rowState, resolveFilterGroup, visitedGroupIds);
}

export function evaluateConditionGroup(
  root: ConditionGroup,
  rowState: WorkspaceRowState,
  resolveFilterGroup: (filterGroupId: string) => ConditionGroup | null = () => null,
  visitedGroupIds = new Set<string>(),
): boolean {
  if (root.children.length === 0) {
    return true;
  }

  const results: boolean[] = root.children.map((child) => evaluateConditionNode(child, rowState, resolveFilterGroup, visitedGroupIds));
  return root.mode === "any" ? results.some(Boolean) : results.every(Boolean);
}

export function createConditionMatcher(root: ConditionGroup, resolveFilterGroup: (filterGroupId: string) => ConditionGroup | null = () => null) {
  return (rowState: WorkspaceRowState) => evaluateConditionGroup(root, rowState, resolveFilterGroup);
}
