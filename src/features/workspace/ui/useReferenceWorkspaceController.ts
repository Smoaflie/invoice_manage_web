import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition, type DragEvent as ReactDragEvent } from "react";
import { createEmptyConditionGroup, type ConditionGroup, type FieldCondition } from "../../../shared/types/filterGroup";
import type { WorkspaceSavedViewQuery } from "../../../shared/types/savedView";
import { createDefaultWorkspaceViewQuery } from "../../views/application/defaultSavedViews";
import { mergeFieldOrder, mergeVisibleFieldIds } from "../application/workspaceFieldLayout";
import { collectDroppedFiles } from "../application/workspaceFileImport";
import { pickWorkspaceFiles } from "../application/workspaceFilePicker";
import { selectWorkspaceDisplayFields } from "../application/workspaceFields";
import { countWorkspaceDrafts, updateWorkspaceDrafts, type WorkspaceDrafts } from "../application/workspaceDrafts";
import { buildReferenceWorkspaceData, sortReferenceWorkspaceData } from "../application/referenceWorkspaceModel";
import { applyWorkspaceRowDrafts, buildWorkspaceBaseRowStates } from "../application/workspaceRowState";
import { saveWorkspaceDraftRow } from "../application/saveWorkspaceCell";
import { usePersistedWorkspaceSelection } from "../application/usePersistedWorkspaceSelection";
import { useWorkspaceTransferActions } from "../application/useWorkspaceTransferActions";
import { useWorkspaceSchema } from "../application/useWorkspaceSchema";
import { useSavedViewState } from "../../views/ui/useSavedViewState";
import { equalIdSet, sameStringArray, type ReferenceInvoiceWorkspaceProps } from "./referenceWorkspaceController.shared";
import { useWorkspaceAuxiliaryDocuments } from "./useWorkspaceAuxiliaryDocuments";
import { useWorkspaceBatchActions } from "./useWorkspaceBatchActions";
import { useWorkspaceSearchFocus } from "./useWorkspaceSearchFocus";
import { useWorkspaceSavedViewActions } from "./useWorkspaceSavedViewActions";
import { useWorkspaceViewDrafts } from "./useWorkspaceViewDrafts";
import { useWorkspaceViewColumnWidths } from "./useWorkspaceViewColumnWidths";

export function useReferenceWorkspaceController(props: ReferenceInvoiceWorkspaceProps) {
  const { fields: allFields } = useWorkspaceSchema(props.invoiceDocuments);
  const fields = useMemo(() => selectWorkspaceDisplayFields(allFields), [allFields]);
  const savedViewState = useSavedViewState<WorkspaceSavedViewQuery>({
    scope: "workspace",
    activeViewKey: "ui.activeWorkspaceViewId",
    createDefaultQuery: createDefaultWorkspaceViewQuery,
    createDefaultVisibleColumns: () => fields.map((field) => field.id),
  });
  const [bulkTagsText, setBulkTagsText] = useState("");
  const [kanbanFieldId, setKanbanFieldId] = useState("parseStatus");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [fieldConfigOpen, setFieldConfigOpen] = useState(false);
  const [viewFieldOpen, setViewFieldOpen] = useState(false);
  const [drafts, setDrafts] = useState<WorkspaceDrafts>({});
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [savingChanges, setSavingChanges] = useState(false);
  const [importingFiles, setImportingFiles] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [, startQueryTransition] = useTransition();
  const deferredSearchText = useDeferredValue(savedViewState.query.searchText);
  const fieldsById = useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);
  const documentIds = useMemo(() => props.invoiceDocuments.map((document) => document.id), [props.invoiceDocuments]);
  const { selectedIdSet, setSelectedIdSet } = usePersistedWorkspaceSelection(documentIds);
  const transferActions = useWorkspaceTransferActions({ onRefresh: props.onRefresh, setWorkspaceMessage, setSelectedIdSet, setImportingFiles });
  const { dashboardDocument, filterGroups, refreshFilterGroups, resolveFilterGroup, saveDashboardDocument } = useWorkspaceAuxiliaryDocuments();
  const { currentView, hasViewDraft, handleSaveViewDraft, handleDiscardViewDraft } = useWorkspaceViewDrafts({
    fields,
    savedViewState,
    setWorkspaceMessage,
  });
  useEffect(() => { setWorkspaceMessage((current) => (current ? "" : current)); }, [props.message]);
  useEffect(() => {
    if (!savedViewState.ready || fields.length === 0) {
      return;
    }
    const nextVisibleFieldIds = mergeVisibleFieldIds(fields, savedViewState.visibleColumns);
    if (!sameStringArray(savedViewState.visibleColumns, nextVisibleFieldIds)) {
      savedViewState.setVisibleColumns(nextVisibleFieldIds);
    }
    const nextFieldOrder = mergeFieldOrder(fields, savedViewState.query.fieldOrder ?? []);
    if (!sameStringArray(savedViewState.query.fieldOrder ?? [], nextFieldOrder)) {
      savedViewState.setQuery((current) => ({ ...current, fieldOrder: nextFieldOrder }));
    }
  }, [fields, savedViewState.query.fieldOrder, savedViewState.ready, savedViewState.setQuery, savedViewState.setVisibleColumns, savedViewState.visibleColumns]);

  useEffect(() => {
    if ((savedViewState.query.sorters ?? []).length > 0) {
      return;
    }
    savedViewState.setQuery((current) => ({
      ...current,
      sorters: [{ fieldId: "updatedAt", direction: "desc" }],
    }));
  }, [savedViewState.query.sorters, savedViewState.setQuery]);

  const baseRowStates = useMemo(() => buildWorkspaceBaseRowStates(props.invoiceDocuments, allFields), [allFields, props.invoiceDocuments]);
  const rowStates = useMemo(() => applyWorkspaceRowDrafts(baseRowStates, allFields, drafts), [allFields, baseRowStates, drafts]);
  const visibleFieldIdSet = useMemo(() => new Set(savedViewState.visibleColumns), [savedViewState.visibleColumns]);
  const visibleFields = useMemo(() => fields.filter((field) => visibleFieldIdSet.has(field.id)), [fields, visibleFieldIdSet]);
  const queryFieldOrder = savedViewState.query.fieldOrder ?? [];
  const queryFilters = savedViewState.query.filters ?? [];
  const querySorters = savedViewState.query.sorters ?? [];
  const queryConditionRoot = savedViewState.query.conditionRoot ?? createEmptyConditionGroup();
  const activeFilterCount = queryConditionRoot.children.length;
  const orderedVisibleFieldIds = useMemo(() => queryFieldOrder.filter((id) => visibleFieldIdSet.has(id)), [queryFieldOrder, visibleFieldIdSet]);
  const { recordColumnWidths, itemColumnWidths, tableColumnWidths, setRecordColumnWidths, setItemColumnWidths, setTableColumnWidths } = useWorkspaceViewColumnWidths({
    fields,
    rowStates,
    invoiceDocuments: props.invoiceDocuments,
    query: savedViewState.query,
    setQuery: savedViewState.setQuery,
  });
  const activeSorter = querySorters[0] ?? { fieldId: "updatedAt", direction: "desc" as const };
  const groupedData = useMemo(
    () =>
      sortReferenceWorkspaceData(
        buildReferenceWorkspaceData(rowStates, fields, {
          groupByFieldId: savedViewState.query.groupByFieldId,
          searchText: deferredSearchText,
          conditionRoot: queryConditionRoot,
          filters: queryFilters,
          resolveFilterGroup,
        }),
        fields,
        { fieldId: activeSorter.fieldId, direction: activeSorter.direction, isActive: true },
      ),
    [activeSorter.direction, activeSorter.fieldId, deferredSearchText, fields, queryConditionRoot, queryFilters, resolveFilterGroup, rowStates, savedViewState.query.groupByFieldId],
  );
  const filteredRows = groupedData.rows;
  const groupIds = groupedData.groupIds;
  const groupIdSet = useMemo(() => new Set(groupIds), [groupIds]);
  const filteredSelectedCount = useMemo(() => filteredRows.filter((row) => selectedIdSet.has(row.id)).length, [filteredRows, selectedIdSet]);
  const allRowsSelected = filteredRows.length > 0 && filteredSelectedCount === filteredRows.length;
  const pendingChangeCount = countWorkspaceDrafts(drafts);
  const displayMessage = workspaceMessage || props.message;
  const selectedDocuments = useMemo(() => props.invoiceDocuments.filter((document) => selectedIdSet.has(document.id)), [props.invoiceDocuments, selectedIdSet]);
  const sharedTags = useMemo(() => {
    const [firstDocument, ...restDocuments] = selectedDocuments;
    if (!firstDocument) {
      return [];
    }
    return [...new Set(firstDocument.tags)].filter((tag) => restDocuments.every((document) => document.tags.includes(tag)));
  }, [selectedDocuments]);
  const { handleCreateSavedView, handleRenameSavedView, handleDuplicateSavedView, handleDeleteSavedView } = useWorkspaceSavedViewActions(
    savedViewState,
    currentView?.name,
    setWorkspaceMessage,
  );
  const { handleBulkTagUpdate, handleExportExcel } = useWorkspaceBatchActions({
    selectedIdSet,
    bulkTagsText,
    selectedDocuments,
    allFields,
    onRefresh: props.onRefresh,
    setWorkspaceMessage,
  });

  useEffect(() => {
    setExpandedGroupIds((current) => {
      const preserved = current.filter((id) => groupIdSet.has(id));
      const preservedSet = new Set(preserved);
      const next = [...preserved, ...groupIds.filter((id) => !preservedSet.has(id))];
      return next.length === current.length && next.every((id, index) => id === current[index]) ? current : next;
    });
  }, [groupIdSet, groupIds]);

  const focusWorkspaceSearch = useWorkspaceSearchFocus(searchInputRef, {
    query: savedViewState.query,
    setQuery: savedViewState.setQuery,
  });

  const handleToggleSelected = useCallback((invoiceDocumentId: string) => {
    setSelectedIdSet((current) => {
      const next = new Set(current);
      if (next.has(invoiceDocumentId)) {
        next.delete(invoiceDocumentId);
      } else {
        next.add(invoiceDocumentId);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedIdSet((current) => {
      const next = new Set(current);
      if (filteredRows.every((row) => next.has(row.id))) {
        for (const row of filteredRows) {
          next.delete(row.id);
        }
      } else {
        for (const row of filteredRows) {
          next.add(row.id);
        }
      }
      return equalIdSet(current, next) ? current : next;
    });
  }, [filteredRows, setSelectedIdSet]);

  const handleSaveChanges = useCallback(async () => {
    if (pendingChangeCount === 0) {
      return;
    }
    setSavingChanges(true);
    try {
      for (const [invoiceDocumentId, rowDrafts] of Object.entries(drafts)) {
        await saveWorkspaceDraftRow({ invoiceDocumentId, rowDrafts, fieldsById, now: () => new Date().toISOString() });
      }
      await props.onRefresh();
      setDrafts({});
      setWorkspaceMessage(`已保存 ${pendingChangeCount} 项修改。`);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : "保存修改失败。");
    } finally {
      setSavingChanges(false);
    }
  }, [drafts, fieldsById, pendingChangeCount, props.onRefresh]);

  return {
    fields,
    filteredRows,
    rowStates,
    visibleFields,
    orderedVisibleFieldIds,
    groupedData,
    allRowsSelected,
    selectedIdSet,
    expandedGroupIds,
    dragActive,
    importingFiles,
    pendingChangeCount,
    activeFilterCount,
    recordColumnWidths,
    itemColumnWidths,
    tableColumnWidths,
    dashboardDocument,
    filterGroups,
    resolveFilterGroup,
    saveDashboardDocument,
    savingChanges,
    displayMessage,
    savedViewState,
    currentView,
    hasViewDraft,
    sharedTags,
    bulkTagsText,
    kanbanFieldId,
    filterOpen,
    sortOpen,
    groupOpen,
    fieldConfigOpen,
    viewFieldOpen,
    searchInputRef,
    setBulkTagsText,
    setKanbanFieldId,
    setFilterOpen,
    setSortOpen,
    setGroupOpen,
    setFieldConfigOpen,
    setViewFieldOpen,
    setDragActive,
    setRecordColumnWidths,
    setItemColumnWidths,
    setTableColumnWidths,
    handleToggleSelected,
    handleToggleAll,
    handleDeleteSelected: () => void props.onDelete([...selectedIdSet]),
    handleReparseSelected: () => void props.onBulkReparse([...selectedIdSet]),
    handleDeleteSingle: (invoiceDocumentId: string) => void props.onDelete([invoiceDocumentId]),
    handleReparseSingle: (invoiceDocumentId: string) => void props.onReparseSingle(invoiceDocumentId),
    handleOpenPdfSingle: (invoiceDocumentId: string) => void props.onOpenPdf(invoiceDocumentId),
    handleToggleGroup: (groupId: string) => setExpandedGroupIds((current) => (current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId])),
    handleBulkAddTags: () => void handleBulkTagUpdate("add"),
    handleBulkRemoveTags: () => void handleBulkTagUpdate("remove"),
    handleExportExcel,
    handleCreateSavedView,
    handleRenameSavedView,
    handleDuplicateSavedView,
    handleDeleteSavedView,
    handleSaveViewDraft,
    handleDiscardViewDraft,
    handleSaveChanges,
    handleDiscardChanges: () => setDrafts({}),
    handleImportFiles: () => void pickWorkspaceFiles().then(transferActions.handleImportPickedFiles),
    handleImportDataFile: transferActions.handleImportDataFile,
    handleExportData: transferActions.handleExportData,
    handleDropImport: (event: DragEvent | ReactDragEvent<HTMLElement>) => {
      const dataTransfer = "dataTransfer" in event ? event.dataTransfer : undefined;
      if (!dataTransfer) {
        return;
      }
      void collectDroppedFiles(dataTransfer).then(transferActions.handleImportPickedFiles);
    },
    focusWorkspaceSearch,
    setSearchText: (value: string) => savedViewState.setQuery((current) => ({ ...current, searchText: value })),
    refreshFilterGroups,
    setConditionRoot: (nextConditionRoot: ConditionGroup) =>
      savedViewState.setQuery((current) => ({
        ...current,
        filters:
          nextConditionRoot.mode === "all" && nextConditionRoot.children.every((child) => child.kind === "field")
            ? nextConditionRoot.children.filter((child): child is FieldCondition => child.kind === "field")
            : [],
        conditionRoot: { ...(current.conditionRoot ?? createEmptyConditionGroup()), ...nextConditionRoot },
      })),
    setSorter: (fieldId: string, direction: "asc" | "desc") => savedViewState.setQuery((current) => ({ ...current, sorters: [{ fieldId, direction }] })),
    setGroupByFieldId: (fieldId: string) => savedViewState.setQuery((current) => ({ ...current, groupByFieldId: fieldId })),
    setVisibleFieldIds: (nextVisibleFieldIds: string[]) => savedViewState.setVisibleColumns(nextVisibleFieldIds),
    setFieldOrder: (nextFieldOrder: string[]) => savedViewState.setQuery((current) => ({ ...current, fieldOrder: nextFieldOrder })),
  };
}
