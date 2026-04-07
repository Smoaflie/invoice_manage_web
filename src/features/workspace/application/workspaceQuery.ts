import type { ConditionGroup } from "../../../shared/types/filterGroup";
import type { WorkspaceSavedViewQuery } from "../../../shared/types/savedView";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { buildWorkspaceRowStates, type WorkspaceRowState } from "./workspaceRowState";
import { getWorkspaceFieldValue } from "./workspaceValueResolver";
import { createConditionMatcher, createWorkspaceFilterMatcher, createWorkspaceSearchMatcher } from "./workspaceRowFilters";
const zhCollator = new Intl.Collator("zh-CN");

function compareValues(left: unknown, right: unknown, direction: "asc" | "desc") {
  const leftValue = Array.isArray(left) ? left.join(" ") : left;
  const rightValue = Array.isArray(right) ? right.join(" ") : right;

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
  }

  const result = zhCollator.compare(String(leftValue ?? ""), String(rightValue ?? ""));
  return direction === "asc" ? result : -result;
}

function getStateValue(rowState: WorkspaceRowState, fieldId: string) {
  return rowState.values[fieldId] ?? "";
}

function groupRows(rowStates: WorkspaceRowState[], fields: WorkspaceFieldDefinition[], fieldId: string) {
  const field = fields.find((item) => item.id === fieldId);
  const groupOrder = new Map((field?.options ?? []).map((option, index) => [option, index]));
  const buckets = new Map<string, WorkspaceRowState[]>();

  for (const rowState of rowStates) {
    const rawValue = field ? getStateValue(rowState, field.id) : "";
    const keys = Array.isArray(rawValue) ? (rawValue.length > 0 ? rawValue : ["未设置"]) : [String(rawValue || "未设置")];

    for (const key of keys) {
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(rowState);
      } else {
        buckets.set(key, [rowState]);
      }
    }
  }

  return [...buckets.entries()]
    .map(([id, groupedRows]) => ({ id, label: id, rows: groupedRows, count: groupedRows.length }))
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

      return zhCollator.compare(left.label, right.label);
    });
}

export { getWorkspaceFieldValue } from "./workspaceValueResolver";

export function buildKanbanColumnsFromRowStates(rowStates: WorkspaceRowState[], fields: WorkspaceFieldDefinition[], fieldId: string) {
  return groupRows(rowStates, fields, fieldId).map((group) => ({
    ...group,
    rows: group.rows.map((rowState) => rowState.row),
  }));
}

export function buildAnalyticsSummaryFromRowStates(rowStates: WorkspaceRowState[], fields: WorkspaceFieldDefinition[], fieldId: string) {
  const breakdown = groupRows(rowStates, fields, fieldId).map((group) => ({
    id: group.id,
    label: group.label,
    count: group.count,
    totalAmount: group.rows.reduce((sum, rowState) => sum + rowState.row.totalAmount, 0),
  }));

  return {
    totals: {
      rowCount: rowStates.length,
      totalAmount: rowStates.reduce((sum, rowState) => sum + rowState.row.totalAmount, 0),
      taxAmount: rowStates.reduce((sum, rowState) => sum + rowState.row.taxAmount, 0),
    },
    breakdown,
  };
}

export function applyWorkspaceQuery(
  rows: InvoiceDocument[],
  fields: WorkspaceFieldDefinition[],
  query: WorkspaceSavedViewQuery,
  resolveFilterGroup?: (filterGroupId: string) => ConditionGroup | null,
) {
  const rowStates = buildWorkspaceRowStates(rows, fields);
  const matchesSearch = createWorkspaceSearchMatcher(query.searchText);
  const matchesCondition = createConditionMatcher(query.conditionRoot, resolveFilterGroup);
  const filterMatchers = (query.filters ?? []).map((filter) => createWorkspaceFilterMatcher(filter));
  const filteredStates = rowStates.filter((rowState) => matchesSearch(rowState) && matchesCondition(rowState) && filterMatchers.every((matcher) => matcher(rowState)));

  return [...filteredStates]
    .sort((left, right) => {
      for (const sorter of query.sorters) {
        const result = compareValues(getStateValue(left, sorter.fieldId), getStateValue(right, sorter.fieldId), sorter.direction);
        if (result !== 0) {
          return result;
        }
      }

      return right.row.updatedAt.localeCompare(left.row.updatedAt);
    })
    .map((rowState) => rowState.row);
}

export function buildKanbanColumns(rows: InvoiceDocument[], fields: WorkspaceFieldDefinition[], fieldId: string) {
  return buildKanbanColumnsFromRowStates(buildWorkspaceRowStates(rows, fields), fields, fieldId);
}

export function buildWorkspaceGroups(rows: InvoiceDocument[], fields: WorkspaceFieldDefinition[], fieldId: string) {
  return buildKanbanColumnsFromRowStates(buildWorkspaceRowStates(rows, fields), fields, fieldId);
}

export function buildAnalyticsSummary(rows: InvoiceDocument[], fields: WorkspaceFieldDefinition[], fieldId: string) {
  return buildAnalyticsSummaryFromRowStates(buildWorkspaceRowStates(rows, fields), fields, fieldId);
}
