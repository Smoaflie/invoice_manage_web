import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { getTagGroupDisplayValues, writeTagGroupValues } from "./workspaceFieldValue";
import type { WorkspaceDrafts } from "./workspaceDrafts";
import { getWorkspaceFieldValue } from "./workspaceValueResolver";

export type WorkspaceRowState = {
  id: string;
  row: InvoiceDocument;
  tags: string[];
  values: Record<string, unknown>;
  searchText: string;
};

function normalizeFieldValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return value;
}

function buildFieldLookup(fields: WorkspaceFieldDefinition[]) {
  const fieldLookup = new Map<string, WorkspaceFieldDefinition>();

  for (const field of fields) {
    fieldLookup.set(field.id, field);
  }

  return fieldLookup;
}

function joinSearchValues(values: Record<string, unknown>, tags: string[]) {
  const fragments: string[] = [];

  for (const value of Object.values(values)) {
    fragments.push(Array.isArray(value) ? value.join(" ") : String(value ?? ""));
  }

  fragments.push(tags.join(" "));
  return fragments.join(" ").toLowerCase();
}

function buildBaseValues(row: InvoiceDocument, fields: WorkspaceFieldDefinition[]) {
  const values: Record<string, unknown> = {};

  for (const field of fields) {
    values[field.id] = getWorkspaceFieldValue(row, field);
  }

  return values;
}

function resolveDraftedTags(
  baseTags: string[],
  fieldLookup: Map<string, WorkspaceFieldDefinition>,
  rowDrafts: Record<string, unknown>,
) {
  let nextTags = baseTags;

  for (const fieldId of Object.keys(rowDrafts)) {
    const field = fieldLookup.get(fieldId);
    if (!field || field.source !== "tag_group") {
      continue;
    }

    const value = rowDrafts[fieldId];
    nextTags = writeTagGroupValues(nextTags, field, Array.isArray(value) ? value.map((item) => String(item)) : []);
  }

  return nextTags;
}

function resolveDraftedValues(
  fields: WorkspaceFieldDefinition[],
  baseValues: Record<string, unknown>,
  draftedTags: string[],
  rowDrafts: Record<string, unknown>,
) {
  const nextValues = { ...baseValues };

  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(rowDrafts, field.id)) {
      nextValues[field.id] = normalizeFieldValue(rowDrafts[field.id]);
      continue;
    }

    if (field.source === "tag_group") {
      nextValues[field.id] = getTagGroupDisplayValues(draftedTags, field);
    }
  }

  return nextValues;
}

export function buildWorkspaceBaseRowStates(rows: InvoiceDocument[], fields: WorkspaceFieldDefinition[]) {
  const rowStates: WorkspaceRowState[] = [];

  for (const row of rows) {
    const values = buildBaseValues(row, fields);

    rowStates.push({
      id: row.id,
      row,
      tags: row.tags,
      values,
      searchText: joinSearchValues(values, row.tags),
    });
  }

  return rowStates;
}

export function applyWorkspaceRowDrafts(
  rowStates: WorkspaceRowState[],
  fields: WorkspaceFieldDefinition[],
  drafts: WorkspaceDrafts = {},
) {
  if (Object.keys(drafts).length === 0) {
    return rowStates;
  }

  const fieldLookup = buildFieldLookup(fields);
  const nextRowStates: WorkspaceRowState[] = [];

  for (const rowState of rowStates) {
    const rowDrafts = drafts[rowState.id];
    if (!rowDrafts || Object.keys(rowDrafts).length === 0) {
      nextRowStates.push(rowState);
      continue;
    }

    const tags = resolveDraftedTags(rowState.tags, fieldLookup, rowDrafts);
    const values = resolveDraftedValues(fields, rowState.values, tags, rowDrafts);

    nextRowStates.push({
      ...rowState,
      tags,
      values,
      searchText: joinSearchValues(values, tags),
    });
  }

  return nextRowStates;
}

export function buildWorkspaceRowStates(rows: InvoiceDocument[], fields: WorkspaceFieldDefinition[], drafts: WorkspaceDrafts = {}) {
  return applyWorkspaceRowDrafts(buildWorkspaceBaseRowStates(rows, fields), fields, drafts);
}
