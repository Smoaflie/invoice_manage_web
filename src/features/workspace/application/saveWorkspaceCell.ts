import { appDb } from "../../../shared/db/appDb";
import type { InvoiceAuditChangeType } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { saveInvoiceEdits } from "../../documents/application/saveInvoiceEdits";
import { writeTagGroupValues } from "./workspaceFieldValue";

type SaveWorkspaceCellInput = {
  invoiceDocumentId: string;
  field: WorkspaceFieldDefinition;
  value: unknown;
  now: () => string;
};

type SaveWorkspaceDraftRowInput = {
  invoiceDocumentId: string;
  rowDrafts: Record<string, unknown>;
  fieldsById: Map<string, WorkspaceFieldDefinition>;
  now: () => string;
};

function toTagGroupValue(value: unknown) {
  return Array.isArray(value) ? [...new Set(value.map((item) => String(item).trim()).filter(Boolean))] : [];
}

function resolveChangeType(flags: { hasBuiltinEdit: boolean; hasAnnotation: boolean; hasTagUpdate: boolean }): InvoiceAuditChangeType {
  if (flags.hasBuiltinEdit || (flags.hasAnnotation && flags.hasTagUpdate)) {
    return "manual_edit";
  }

  if (flags.hasAnnotation) {
    return "manual_annotation_update";
  }

  if (flags.hasTagUpdate) {
    return "manual_tag_update";
  }

  return "manual_edit";
}

function buildDraftNextValues(
  current: InvoiceDocument,
  rowDrafts: Record<string, unknown>,
  fieldsById: Map<string, WorkspaceFieldDefinition>,
) {
  const nextValues: Partial<InvoiceDocument> = {};
  let nextTags = current.tags;
  let hasBuiltinEdit = false;
  let hasAnnotation = false;
  let hasTagUpdate = false;

  for (const [fieldId, value] of Object.entries(rowDrafts)) {
    const field = fieldsById.get(fieldId);
    if (!field) {
      continue;
    }

    if (field.source === "tag_group") {
      nextTags = writeTagGroupValues(nextTags, field, toTagGroupValue(value));
      hasTagUpdate = true;
      continue;
    }

    (nextValues as Record<string, unknown>)[field.id] = value;
    if (field.id === "annotation") {
      hasAnnotation = true;
    } else {
      hasBuiltinEdit = true;
    }
  }

  if (hasTagUpdate) {
    nextValues.tags = nextTags;
  }

  return {
    nextValues,
    changeType: resolveChangeType({ hasBuiltinEdit, hasAnnotation, hasTagUpdate }),
  };
}

export async function saveWorkspaceCell(input: SaveWorkspaceCellInput) {
  const current = await appDb.invoiceDocuments.get(input.invoiceDocumentId);
  if (!current) {
    throw new Error(`Invoice document not found: ${input.invoiceDocumentId}`);
  }

  if (input.field.source === "tag_group") {
    const nextTags = toTagGroupValue(input.value);

    return saveInvoiceEdits({
      invoiceDocumentId: input.invoiceDocumentId,
      nextValues: {
        tags: writeTagGroupValues(current.tags, input.field, nextTags),
      },
      changeType: "manual_tag_update",
      now: input.now,
    });
  }

  const nextFieldValue = input.value;
  const changeType = input.field.id === "annotation" ? "manual_annotation_update" : "manual_edit";

  return saveInvoiceEdits({
    invoiceDocumentId: input.invoiceDocumentId,
    nextValues: {
      [input.field.id]: nextFieldValue,
    },
    changeType,
    now: input.now,
  });
}

export async function saveWorkspaceDraftRow(input: SaveWorkspaceDraftRowInput) {
  const current = await appDb.invoiceDocuments.get(input.invoiceDocumentId);
  if (!current) {
    throw new Error(`Invoice document not found: ${input.invoiceDocumentId}`);
  }

  const { nextValues, changeType } = buildDraftNextValues(current, input.rowDrafts, input.fieldsById);
  if (Object.keys(nextValues).length === 0) {
    return current;
  }

  return saveInvoiceEdits({
    invoiceDocumentId: input.invoiceDocumentId,
    nextValues,
    changeType,
    now: input.now,
  });
}
