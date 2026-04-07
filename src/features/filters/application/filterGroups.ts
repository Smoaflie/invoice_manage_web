import { appDb } from "../../../shared/db/appDb";
import type { DashboardDocument } from "../../../shared/types/dashboardDocument";
import { createEmptyConditionGroup, type ConditionGroup, type FilterGroup, type FilterGroupField, type FilterGroupRule, type FilterGroupRuleOperator } from "../../../shared/types/filterGroup";

export async function listFilterGroups() {
  return appDb.filterGroups.orderBy("updatedAt").reverse().toArray();
}

export async function loadFilterGroups() {
  return {
    groups: await listFilterGroups(),
    rules: [] as FilterGroupRule[],
  };
}

export async function saveFilterGroup(input: {
  id?: string;
  name: string;
  root: ConditionGroup;
  now: () => string;
}) {
  const normalizedName = input.name.trim();
  const existingGroups = await appDb.filterGroups.toArray();
  const duplicate = existingGroups.find((group) => group.name === normalizedName && group.id !== input.id);
  if (duplicate) {
    throw new Error("筛选组名称已存在。");
  }

  const timestamp = input.now();
  const existingGroup = input.id ? existingGroups.find((group) => group.id === input.id) ?? null : null;
  const nextGroup: FilterGroup = {
    id: existingGroup?.id ?? globalThis.crypto.randomUUID(),
    name: normalizedName,
    root: input.root,
    createdAt: existingGroup?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await appDb.filterGroups.put(nextGroup);
  return nextGroup;
}

export async function deleteFilterGroup(groupId: string) {
  await appDb.filterGroups.delete(groupId);
}

export async function createFilterGroup(name: string) {
  return saveFilterGroup({
    name,
    root: createEmptyConditionGroup(),
    now: () => new Date().toISOString(),
  });
}

export async function createFilterGroupRule(input: {
  groupId: string;
  label: string;
  field: FilterGroupField;
  operator?: FilterGroupRuleOperator;
  pattern: string;
}) {
  const group = await appDb.filterGroups.get(input.groupId);
  if (!group) {
    throw new Error("筛选组不存在。");
  }

  const rule: FilterGroupRule = {
    id: globalThis.crypto.randomUUID(),
    groupId: input.groupId,
    label: input.label.trim(),
    field: input.field,
    operator: input.operator ?? "regex",
    pattern: input.pattern.trim(),
  };

  await saveFilterGroup({
    id: group.id,
    name: group.name,
    root: {
      ...group.root,
      children: [
        ...group.root.children,
        {
          id: rule.id,
          kind: "field",
          fieldId: input.field,
          operator: rule.operator === "regex" ? "matches_regex" : rule.operator,
          value: rule.pattern,
        },
      ],
    },
    now: () => new Date().toISOString(),
  });

  return rule;
}

export async function deleteFilterGroupRule(ruleId: string) {
  const groups = await appDb.filterGroups.toArray();
  const targetGroup = groups.find((group) => group.root.children.some((child) => child.kind === "field" && child.id === ruleId));
  if (!targetGroup) {
    return;
  }

  await saveFilterGroup({
    id: targetGroup.id,
    name: targetGroup.name,
    root: {
      ...targetGroup.root,
      children: targetGroup.root.children.filter((child) => child.id !== ruleId),
    },
    now: () => new Date().toISOString(),
  });
}

export async function loadDashboardDocument() {
  return (await appDb.dashboardDocuments.get("primary")) ?? null;
}

export async function saveDashboardDocument(document: DashboardDocument) {
  await appDb.dashboardDocuments.put(document);
  return document;
}
