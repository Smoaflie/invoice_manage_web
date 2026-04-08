import { createEmptyConditionGroup, type ConditionGroup, type ConditionNode, type FieldCondition, type FilterGroupReferenceCondition } from "../../../shared/types/filterGroup";
import type { WorkspaceFilterOperator } from "../../../shared/types/savedView";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";

export type ConditionRuleType = "field" | "filter_group";

export type DraftCondition = {
  id: string;
  type: ConditionRuleType;
  fieldId: string;
  operator: WorkspaceFilterOperator;
  textValue: string;
  multiValue: string[];
  filterGroupId: string;
};

export function getDraftTargetValue(draft: DraftCondition) {
  return draft.type === "filter_group" ? "filter_group" : `field:${draft.fieldId}`;
}

export function operatorOptions(field: WorkspaceFieldDefinition | undefined) {
  if (!field) {
    return [{ value: "contains", label: "包含" }] satisfies Array<{ value: WorkspaceFilterOperator; label: string }>;
  }
  if (field.type === "number") {
    return [
      { value: "equals", label: "等于" },
      { value: "greater_than", label: "大于" },
      { value: "less_than", label: "小于" },
    ] satisfies Array<{ value: WorkspaceFilterOperator; label: string }>;
  }
  if (field.type === "multi_select") {
    return [{ value: "includes_any", label: "包含任一项" }] satisfies Array<{ value: WorkspaceFilterOperator; label: string }>;
  }
  if (field.type === "single_select") {
    return [{ value: "equals", label: "等于" }] satisfies Array<{ value: WorkspaceFilterOperator; label: string }>;
  }
  return [
    { value: "contains", label: "包含" },
    { value: "equals", label: "等于" },
    { value: "is_not_empty", label: "不为空" },
  ] satisfies Array<{ value: WorkspaceFilterOperator; label: string }>;
}

export function createDefaultDraft(fields: WorkspaceFieldDefinition[], index = 0): DraftCondition {
  const defaultField = fields.find((field) => field.type === "string" || field.type === "single_select") ?? fields[0];
  return {
    id: `draft-${index + 1}`,
    type: "field",
    fieldId: defaultField?.id ?? "",
    operator: operatorOptions(defaultField)[0]?.value ?? "contains",
    textValue: "",
    multiValue: [],
    filterGroupId: "",
  };
}

export function applyDraftTargetValue(fields: WorkspaceFieldDefinition[], draft: DraftCondition, targetValue: string, defaultFilterGroupId = ""): DraftCondition {
  if (targetValue === "filter_group") {
    return {
      ...draft,
      type: "filter_group",
      fieldId: "",
      operator: "contains",
      textValue: "",
      multiValue: [],
      filterGroupId: draft.filterGroupId || defaultFilterGroupId,
    };
  }

  const fieldId = targetValue.replace(/^field:/, "");
  const nextField = fields.find((field) => field.id === fieldId);

  return {
    ...draft,
    type: "field",
    fieldId,
    operator: operatorOptions(nextField)[0]?.value ?? "contains",
    textValue: "",
    multiValue: [],
    filterGroupId: "",
  };
}

function createFieldDraft(filter: FieldCondition, field: WorkspaceFieldDefinition | undefined): DraftCondition {
  return {
    id: filter.id,
    type: "field",
    fieldId: filter.fieldId,
    operator: filter.operator,
    textValue: typeof filter.value === "boolean" || Array.isArray(filter.value) ? "" : String(filter.value ?? ""),
    multiValue: Array.isArray(filter.value) ? filter.value.map((item) => String(item)) : [],
    filterGroupId: "",
  };
}

function createFilterGroupDraft(filter: FilterGroupReferenceCondition): DraftCondition {
  return {
    id: filter.id,
    type: "filter_group",
    fieldId: "",
    operator: "contains",
    textValue: "",
    multiValue: [],
    filterGroupId: filter.filterGroupId,
  };
}

export function createDraftsFromConditionRoot(fields: WorkspaceFieldDefinition[], conditionRoot: ConditionGroup) {
  const drafts = conditionRoot.children
    .map((condition): DraftCondition | null => {
      if (condition.kind === "field") {
        return createFieldDraft(condition, fields.find((field) => field.id === condition.fieldId));
      }
      if (condition.kind === "filter_group") {
        return createFilterGroupDraft(condition);
      }
      return null;
    })
    .filter((draft): draft is DraftCondition => Boolean(draft));

  return drafts.length > 0 ? drafts : [createDefaultDraft(fields)];
}

function buildFieldCondition(fields: WorkspaceFieldDefinition[], draft: DraftCondition): FieldCondition | null {
  const field = fields.find((item) => item.id === draft.fieldId);
  if (!field) {
    return null;
  }

  const value =
    draft.operator === "is_not_empty"
      ? true
      : field.type === "multi_select"
        ? draft.multiValue
        : field.type === "number"
          ? Number(draft.textValue || 0)
          : draft.textValue.trim();
  const empty =
    draft.operator === "is_not_empty" ? false : field.type === "multi_select" ? draft.multiValue.length === 0 : draft.textValue.trim().length === 0;
  if (empty) {
    return null;
  }

  return {
    id: draft.id,
    kind: "field",
    fieldId: draft.fieldId,
    operator: draft.operator,
    value,
  };
}

function buildNodeFromDraft(fields: WorkspaceFieldDefinition[], draft: DraftCondition): ConditionNode | null {
  if (draft.type === "filter_group") {
    if (!draft.filterGroupId) {
      return null;
    }
    return {
      id: draft.id,
      kind: "filter_group",
      filterGroupId: draft.filterGroupId,
    };
  }

  return buildFieldCondition(fields, draft);
}

export function buildConditionRootFromDrafts(fields: WorkspaceFieldDefinition[], drafts: DraftCondition[], rootId = "condition-root"): ConditionGroup {
  return {
    ...createEmptyConditionGroup(rootId),
    children: drafts
      .map((draft) => buildNodeFromDraft(fields, draft))
      .filter((condition): condition is ConditionNode => Boolean(condition)),
  };
}
