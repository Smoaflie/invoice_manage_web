import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { writeTagGroupValues } from "./workspaceFieldValue";
import { getWorkspaceFieldValue } from "./workspaceValueResolver";

export type WorkspaceDrafts = Record<string, Record<string, unknown>>;

function sameValue(left: unknown, right: unknown) {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }

  return left === right;
}

export function updateWorkspaceDrafts(
  drafts: WorkspaceDrafts,
  row: InvoiceDocument,
  field: WorkspaceFieldDefinition,
  value: unknown,
) {
  const currentValue = getWorkspaceFieldValue(row, field);
  const rowDrafts = { ...(drafts[row.id] ?? {}) };

  if (sameValue(currentValue, value)) {
    delete rowDrafts[field.id];
  } else {
    rowDrafts[field.id] = value;
  }

  if (Object.keys(rowDrafts).length === 0) {
    const nextDrafts = { ...drafts };
    delete nextDrafts[row.id];
    return nextDrafts;
  }

  return {
    ...drafts,
    [row.id]: rowDrafts,
  };
}

function applyDraftToRow(row: InvoiceDocument, field: WorkspaceFieldDefinition, value: unknown): InvoiceDocument {
  if (field.source === "tag_group") {
    return {
      ...row,
      tags: writeTagGroupValues(row.tags, field, Array.isArray(value) ? value.map((item) => String(item)) : []),
    };
  }

  return {
    ...row,
    [field.id]: value,
  };
}

export function applyWorkspaceDrafts(rows: InvoiceDocument[], fields: WorkspaceFieldDefinition[], drafts: WorkspaceDrafts) {
  return rows.map((row) => {
    const rowDrafts = drafts[row.id];
    if (!rowDrafts) {
      return row;
    }

    return Object.entries(rowDrafts).reduce((nextRow, [fieldId, value]) => {
      const field = fields.find((item) => item.id === fieldId);
      return field ? applyDraftToRow(nextRow, field, value) : nextRow;
    }, row);
  });
}

export function countWorkspaceDrafts(drafts: WorkspaceDrafts) {
  return Object.values(drafts).reduce((sum, rowDrafts) => sum + Object.keys(rowDrafts).length, 0);
}
