import { useEffect, useState } from "react";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { InvoiceSavedViewQuery } from "../../../shared/types/savedView";
import type { FilterGroup, FilterGroupRule } from "../../../shared/types/filterGroup";
import { loadFilterGroups } from "../../filters/application/filterGroups";
import { getDefaultInvoiceColumns } from "../../invoices/application/invoiceTablePreferences";
import { InvoiceTable } from "../../invoices/ui/InvoiceTable";
import { buildGroupTagMap, loadTagMetadata } from "../../tags/application/tagMetadata";
import { applySavedViewQuery } from "../../query/queryEngine";
import { createDefaultInvoiceViewQuery } from "../../views/application/defaultSavedViews";
import { useSavedViewState } from "../../views/ui/useSavedViewState";
import type { InvoiceColumnKey } from "./invoiceColumnOptions";
import { InvoiceWorkspaceToolbar } from "./InvoiceWorkspaceToolbar";
import { hasInvoiceData } from "./documentRows";
import { sameSelection, updateRangeSelection } from "./selectionRange";

type InvoicesWorkspaceProps = {
  invoiceDocuments: InvoiceDocument[];
  message: string;
  onOpenDetails: (invoiceDocumentId: string) => void;
  onEdit: (invoiceDocumentId: string) => void;
  onOpenPdf: (invoiceDocumentId: string) => void | Promise<void>;
  onExportMerged: (invoiceDocumentIds: string[]) => void | Promise<void>;
  onDelete: (invoiceDocumentIds: string[]) => void | Promise<void>;
  onBulkTagUpdate: (invoiceDocumentIds: string[], tagsText: string, mode: "add" | "remove") => void | Promise<void>;
  onBulkReparse: (invoiceDocumentIds: string[]) => void | Promise<void>;
};

export function InvoicesWorkspace({
  invoiceDocuments,
  message,
  onOpenDetails,
  onEdit,
  onOpenPdf,
  onExportMerged,
  onDelete,
  onBulkTagUpdate,
  onBulkReparse,
}: InvoicesWorkspaceProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [bulkTagsText, setBulkTagsText] = useState("");
  const [tagGroups, setTagGroups] = useState<Array<{ id: string; name: string; sortOrder: number }>>([]);
  const [groupTagMap, setGroupTagMap] = useState<Record<string, string[]>>({});
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [filterRules, setFilterRules] = useState<FilterGroupRule[]>([]);
  const {
    activeViewId,
    draftName,
    query: viewQuery,
    visibleColumns,
    setDraftName,
    setQuery: setViewQuery,
    setVisibleColumns,
    selectView,
    saveCurrentView,
    saveAsNewView,
    views,
  } = useSavedViewState<InvoiceSavedViewQuery, InvoiceColumnKey>({
    scope: "invoices",
    activeViewKey: "ui.activeInvoiceViewId",
    createDefaultQuery: createDefaultInvoiceViewQuery,
    createDefaultVisibleColumns: () => getDefaultInvoiceColumns(),
  });
  const invoiceRows = invoiceDocuments.filter(hasInvoiceData);
  const parsedCount = invoiceRows.filter((row) => row.parseStatus === "parsed").length;
  const availableTags = [...new Set(invoiceRows.flatMap((row) => row.tags))].sort((left, right) => left.localeCompare(right, "zh-CN"));
  const filteredRows = applySavedViewQuery(invoiceRows, viewQuery, { groupTagMap, filterRules });
  const availableRules = !viewQuery.tagGroupId ? filterRules : filterRules.filter((rule) => rule.groupId === viewQuery.tagGroupId);
  const attentionCount = invoiceRows.filter((row) => row.parseStatus !== "parsed" || row.conflictStatus !== "none").length;
  const activeFilters = [
    viewQuery.searchText.trim() ? `关键词：${viewQuery.searchText.trim()}` : null,
    viewQuery.tag ? `标签：${viewQuery.tag}` : null,
    viewQuery.tagGroupId ? `标签组：${tagGroups.find((group) => group.id === viewQuery.tagGroupId)?.name ?? "未知"}` : null,
    viewQuery.ruleId
      ? `规则：${availableRules.find((rule) => rule.id === viewQuery.ruleId)?.label ?? filterRules.find((rule) => rule.id === viewQuery.ruleId)?.label ?? "未知"}`
      : null,
    viewQuery.status !== "all" ? `状态：${viewQuery.status === "parsed" ? "已识别" : "待处理"}` : null,
  ].filter(Boolean) as string[];
  const toggleSelected = (invoiceDocumentId: string, options?: { shiftKey: boolean }) => {
    setSelectedIds((current) => {
      const nextSelection = updateRangeSelection(
        filteredRows.map((row) => row.id),
        current,
        invoiceDocumentId,
        anchorId,
        options?.shiftKey ?? false,
      );
      setAnchorId(nextSelection.anchorId);
      return nextSelection.selectedIds;
    });
  };
  const toggleAll = () => {
    setSelectedIds((current) => (current.length === filteredRows.length ? [] : filteredRows.map((row) => row.id)));
  };
  const handleDeleteSelected = async () => {
    await onDelete(selectedIds);
    setSelectedIds([]);
    setAnchorId(null);
  };
  const handleColumnToggle = async (columnKey: InvoiceColumnKey) => {
    const nextColumns = visibleColumns.includes(columnKey)
      ? visibleColumns.filter((item) => item !== columnKey)
      : [...visibleColumns, columnKey];

    setVisibleColumns(nextColumns);
  };
  const handleBulkAddTags = async () => {
    await onBulkTagUpdate(selectedIds, bulkTagsText, "add");
    setBulkTagsText("");
  };
  const handleBulkRemoveTags = async () => {
    await onBulkTagUpdate(selectedIds, bulkTagsText, "remove");
    setBulkTagsText("");
  };
  const clearFilters = () => {
    setViewQuery((current) => ({
      ...createDefaultInvoiceViewQuery(),
      sortBy: current.sortBy,
      sortDirection: current.sortDirection,
    }));
  };

  useEffect(() => {
    void loadTagMetadata().then((snapshot) => {
      setTagGroups(snapshot.groups);
      setGroupTagMap(buildGroupTagMap(snapshot.links));
    });
    void loadFilterGroups().then((snapshot) => {
      setFilterGroups(snapshot.groups);
      setFilterRules(snapshot.rules);
    });
  }, []);

  useEffect(() => {
    if (viewQuery.tagGroupId && !filterGroups.some((group) => group.id === viewQuery.tagGroupId)) {
      setViewQuery((current) => ({ ...current, tagGroupId: "", ruleId: "" }));
    }
  }, [filterGroups, setViewQuery, viewQuery.tagGroupId]);

  useEffect(() => {
    if (viewQuery.ruleId && !availableRules.some((rule) => rule.id === viewQuery.ruleId)) {
      setViewQuery((current) => ({ ...current, ruleId: "" }));
    }
  }, [availableRules, setViewQuery, viewQuery.ruleId]);

  useEffect(() => {
    setSelectedIds((current) => {
      const nextSelectedIds = current.filter((item) => filteredRows.some((row) => row.id === item));
      return sameSelection(current, nextSelectedIds) ? current : nextSelectedIds;
    });
    setAnchorId((current) => (current && filteredRows.some((row) => row.id === current) ? current : null));
  }, [filteredRows]);

  return (
    <section className="workspace-page workspace-page--compact">
      <section className="workspace-card workspace-card--ledger">
        <div className="workspace-card__header">
          <div>
            <p className="workspace-card__eyebrow">发票列表</p>
            <h2>发票台账</h2>
            <p className="workspace-card__copy">{message}</p>
          </div>
          <div className="workspace-card__meta">
            <span>{invoiceRows.length} 条发票记录</span>
            <span>{filteredRows.length} 条结果</span>
            <span>{parsedCount} 条已识别</span>
          </div>
        </div>
        <InvoiceWorkspaceToolbar
          activeViewId={activeViewId}
          activeFilters={activeFilters}
          attentionCount={attentionCount}
          availableRules={availableRules}
          availableTags={availableTags}
          bulkTagsText={bulkTagsText}
          draftName={draftName}
          filterGroups={filterGroups}
          selectedIds={selectedIds}
          tagGroups={tagGroups}
          viewQuery={viewQuery}
          views={views}
          visibleColumns={visibleColumns}
          onBulkTagsTextChange={setBulkTagsText}
          onClearFilters={clearFilters}
          onColumnToggle={handleColumnToggle}
          onDeleteSelected={handleDeleteSelected}
          onDraftNameChange={setDraftName}
          onExportMerged={onExportMerged}
          onSaveAsNewView={saveAsNewView}
          onSaveCurrentView={saveCurrentView}
          onSelectView={selectView}
          onSetQuery={setViewQuery}
          onBulkAddTags={handleBulkAddTags}
          onBulkRemoveTags={handleBulkRemoveTags}
          onBulkReparse={onBulkReparse}
        />
        <InvoiceTable
          rows={filteredRows}
          selectedIds={selectedIds}
          onToggleSelected={toggleSelected}
          onToggleAll={toggleAll}
          onOpenDetails={onOpenDetails}
          onEdit={onEdit}
          onOpenPdf={onOpenPdf}
          onDelete={(invoiceDocumentId) => onDelete([invoiceDocumentId])}
          visibleColumns={visibleColumns}
        />
      </section>
    </section>
  );
}
