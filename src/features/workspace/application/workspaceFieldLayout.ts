import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";

export function mergeVisibleFieldIds(fields: WorkspaceFieldDefinition[], current: string[]) {
  const defaultVisibleIds = fields.map((field) => field.id);
  return current.length === 0 ? defaultVisibleIds : current.filter((id) => defaultVisibleIds.includes(id) || fields.some((field) => field.id === id));
}

export function mergeFieldOrder(fields: WorkspaceFieldDefinition[], current: string[]) {
  const defaultOrder = fields.map((field) => field.id);
  return current.length === 0 ? defaultOrder : [...current.filter((id) => defaultOrder.includes(id)), ...defaultOrder.filter((id) => !current.includes(id))];
}

export function moveFieldOrder(fieldOrder: string[], fieldId: string, direction: "up" | "down") {
  const index = fieldOrder.indexOf(fieldId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= fieldOrder.length) {
    return fieldOrder;
  }

  const next = [...fieldOrder];
  [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  return next;
}
