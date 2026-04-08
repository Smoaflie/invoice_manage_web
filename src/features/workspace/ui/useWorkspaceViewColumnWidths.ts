import { useCallback, useMemo } from "react";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceSavedViewQuery, WorkspaceTableColumnWidths } from "../../../shared/types/savedView";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import type { WorkspaceRowState } from "../application/workspaceRowState";
import { buildAutoColumnWidthMap, toColumnSampleText } from "./workspaceColumnWidths";
import { WORKSPACE_ITEM_COLUMNS, type WorkspaceItemColumnKey } from "./workspaceItemColumns";
import { resolveWorkspaceTableColumnWidths } from "./workspaceTableLayout";

type UseWorkspaceViewColumnWidthsInput = {
  fields: WorkspaceFieldDefinition[];
  rowStates: WorkspaceRowState[];
  invoiceDocuments: InvoiceDocument[];
  query: WorkspaceSavedViewQuery;
  setQuery: (updater: (current: WorkspaceSavedViewQuery) => WorkspaceSavedViewQuery) => void;
};

export function useWorkspaceViewColumnWidths(input: UseWorkspaceViewColumnWidthsInput) {
  const recordColumnSamples = useMemo(
    () =>
      input.fields.reduce(
        (samples, field) => ({
          ...samples,
          [field.id]: input.rowStates
            .map((rowState) => toColumnSampleText(rowState.values[field.id]))
            .filter((value) => value.length > 0),
        }),
        {} as Record<string, string[]>,
      ),
    [input.fields, input.rowStates],
  );

  const computedRecordColumnWidths = useMemo(
    () => buildAutoColumnWidthMap(input.fields.map((field) => ({ key: field.id, label: field.label })), recordColumnSamples),
    [input.fields, recordColumnSamples],
  );

  const itemColumnSamples = useMemo(
    () =>
      WORKSPACE_ITEM_COLUMNS.reduce(
        (samples, column) => ({
          ...samples,
          [column.key]: input.invoiceDocuments
            .flatMap((document) => document.items)
            .map((item) => toColumnSampleText(item[column.key]))
            .filter((value) => value.length > 0),
        }),
        {} as Record<WorkspaceItemColumnKey, string[]>,
      ),
    [input.invoiceDocuments],
  );

  const computedItemColumnWidths = useMemo(
    () => buildAutoColumnWidthMap(WORKSPACE_ITEM_COLUMNS, itemColumnSamples),
    [itemColumnSamples],
  );

  const recordColumnWidths = useMemo(
    () => ({ ...computedRecordColumnWidths, ...(input.query.recordColumnWidths ?? {}) }),
    [computedRecordColumnWidths, input.query.recordColumnWidths],
  );

  const itemColumnWidths = useMemo(
    () => ({ ...computedItemColumnWidths, ...(input.query.itemColumnWidths ?? {}) }),
    [computedItemColumnWidths, input.query.itemColumnWidths],
  );

  const tableColumnWidths = useMemo(
    () => resolveWorkspaceTableColumnWidths(input.query.tableColumnWidths),
    [input.query.tableColumnWidths],
  );

  const setRecordColumnWidths = useCallback(
    (nextRecordColumnWidths: Record<string, number>) =>
      input.setQuery((current) => ({ ...current, recordColumnWidths: nextRecordColumnWidths })),
    [input],
  );

  const setItemColumnWidths = useCallback(
    (nextItemColumnWidths: Record<string, number>) =>
      input.setQuery((current) => ({ ...current, itemColumnWidths: nextItemColumnWidths })),
    [input],
  );

  const setTableColumnWidths = useCallback(
    (nextTableColumnWidths: WorkspaceTableColumnWidths) =>
      input.setQuery((current) => ({ ...current, tableColumnWidths: nextTableColumnWidths })),
    [input],
  );

  return {
    recordColumnWidths,
    itemColumnWidths,
    tableColumnWidths,
    setRecordColumnWidths,
    setItemColumnWidths,
    setTableColumnWidths,
  };
}
