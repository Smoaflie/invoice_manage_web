import { useEffect, useMemo, useState } from "react";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { FileSavedViewQuery } from "../../../shared/types/savedView";
import { batchParseInvoices } from "../../documents/application/batchParseInvoices";
import { DataTransferPanel } from "../../transfer/ui/DataTransferPanel";
import { FileImportPanel } from "../../files/ui/FileImportPanel";
import { FileStatusTable } from "../../files/ui/FileStatusTable";
import { FILE_FILTER_FIELDS, filterFileRows, type FileFilterField } from "./fileFilters";
import { createDefaultFileViewQuery } from "../../views/application/defaultSavedViews";
import { SavedViewControls } from "../../views/ui/SavedViewControls";
import { useSavedViewState } from "../../views/ui/useSavedViewState";
import { sameSelection, updateRangeSelection } from "./selectionRange";
import { buildFilesViewModel } from "./dashboardViewModels";

type FilesWorkspaceProps = {
  invoiceDocuments: InvoiceDocument[];
  dashboardMessage: string;
  parsingInvoiceDocumentId: string | null;
  onImportComplete: () => void | Promise<void>;
  onParse: (invoiceDocumentId: string) => void | Promise<void>;
  onOpenPdf: (invoiceDocumentId: string) => void | Promise<void>;
  onCreateManual: (invoiceDocumentId: string) => void | Promise<void>;
  onDelete: (invoiceDocumentIds: string[]) => void | Promise<void>;
};

export function FilesWorkspace({
  invoiceDocuments,
  dashboardMessage,
  parsingInvoiceDocumentId,
  onImportComplete,
  onParse,
  onOpenPdf,
  onCreateManual,
  onDelete,
}: FilesWorkspaceProps) {
  const summary = buildFilesViewModel(invoiceDocuments);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const {
    activeViewId,
    draftName,
    query: viewQuery,
    setDraftName,
    setQuery: setViewQuery,
    selectView,
    saveCurrentView,
    saveAsNewView,
    views,
  } = useSavedViewState<FileSavedViewQuery>({
    scope: "files",
    activeViewKey: "ui.activeFileViewId",
    createDefaultQuery: createDefaultFileViewQuery,
    createDefaultVisibleColumns: () => [],
  });
  const filteredRows = useMemo(() => filterFileRows(invoiceDocuments, viewQuery), [invoiceDocuments, viewQuery]);
  const selectedRows = useMemo(() => filteredRows.filter((row) => selectedIds.includes(row.id)), [filteredRows, selectedIds]);
  const actionableSelectedCount = selectedRows.filter((row) => row.bindingStatus === "readable" && row.handleRef).length;
  const activeFilters = [
    viewQuery.searchText.trim() ? `关键词：${viewQuery.searchText.trim()}` : null,
    viewQuery.field !== "all" ? `字段：${FILE_FILTER_FIELDS.find((field) => field.key === viewQuery.field)?.label ?? viewQuery.field}` : null,
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
  const handleBatchParse = async () => {
    const result = await batchParseInvoices(selectedRows, async (invoiceDocumentId) => {
      await Promise.resolve(onParse(invoiceDocumentId));
    });

    if (result.parsedIds.length > 0) {
      setSelectedIds((current) => current.filter((item) => !result.parsedIds.includes(item)));
    }
  };
  const handleDeleteSelected = async () => {
    await onDelete(selectedIds);
    setSelectedIds([]);
    setAnchorId(null);
  };
  const clearFilters = () => {
    setViewQuery(createDefaultFileViewQuery());
  };

  useEffect(() => {
    setSelectedIds((current) => {
      const nextSelectedIds = current.filter((item) => filteredRows.some((row) => row.id === item));
      return sameSelection(current, nextSelectedIds) ? current : nextSelectedIds;
    });
    setAnchorId((current) => (current && filteredRows.some((row) => row.id === current) ? current : null));
  }, [filteredRows]);

  return (
    <section className="workspace-page workspace-page--files">
      <div className="workspace-status workspace-status--files">
        <p>{dashboardMessage}</p>
        <span>{invoiceDocuments.length} 个跟踪文件</span>
      </div>

      <div className="summary-strip">
        <article className="summary-chip">
          <span>文件总数</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="summary-chip">
          <span>可读取</span>
          <strong>{summary.readable}</strong>
        </article>
        <article className="summary-chip">
          <span>无法读取</span>
          <strong>{summary.unreadable}</strong>
        </article>
        <article className="summary-chip">
          <span>需重识别</span>
          <strong>{summary.needsReparse}</strong>
        </article>
      </div>

      <div className="workspace-grid workspace-grid--files">
        <section className="workspace-card workspace-card--utility">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">导入</p>
              <h2>绑定本地 PDF 文件</h2>
              <p className="workspace-card__copy">导入后只保存文件绑定和内容指纹，不在页面侧复制原文件。</p>
            </div>
          </div>
          <FileImportPanel onImportComplete={onImportComplete} />
        </section>

        <section className="workspace-card workspace-card--utility">
          <div className="workspace-card__header">
            <div>
              <p className="workspace-card__eyebrow">传输</p>
              <h2>导出或恢复台账数据</h2>
              <p className="workspace-card__copy">用于迁移结构化数据；文件句柄和本地权限不会跟随导入导出移动。</p>
            </div>
          </div>
          <DataTransferPanel onImportComplete={onImportComplete} />
        </section>
      </div>

      <section className="workspace-card workspace-card--table">
        <div className="workspace-card__header">
          <div>
            <p className="workspace-card__eyebrow">文件状态</p>
            <h2>文件绑定状态</h2>
            <p className="workspace-card__copy">在识别前确认哪些文件可直接读取，哪些需要重新绑定或重新识别。</p>
          </div>
          <div className="workspace-card__meta">
            <span>{summary.readable} 个可识别</span>
            <span>{summary.unreadable + summary.needsReparse} 个待处理</span>
          </div>
        </div>
        <SavedViewControls
          views={views}
          activeViewId={activeViewId}
          draftName={draftName}
          scopeLabel="文件"
          onDraftNameChange={setDraftName}
          onSelectView={selectView}
          onSaveCurrent={saveCurrentView}
          onSaveAsNew={saveAsNewView}
        />
        <div className="toolbar-row toolbar-row--files">
          <label className="toolbar-field">
            <span>搜索文件</span>
            <input
              value={viewQuery.searchText}
              onChange={(event) => setViewQuery((current) => ({ ...current, searchText: event.target.value }))}
              placeholder="输入关键词后筛选文件列表"
            />
          </label>
          <label className="toolbar-field toolbar-field--compact">
            <span>筛选字段</span>
            <select
              value={viewQuery.field}
              onChange={(event) => setViewQuery((current) => ({ ...current, field: event.target.value as FileFilterField }))}
            >
              {FILE_FILTER_FIELDS.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
          <div className="workspace-card__meta">
            <span>已选 {selectedIds.length} 个文件</span>
            <span>可批量识别 {actionableSelectedCount} 个</span>
            <span>{filteredRows.length} 个筛选结果</span>
            <span>{activeFilters.length === 0 ? "当前未启用筛选" : `当前筛选：${activeFilters.join(" / ")}`}</span>
          </div>
          <div className="table-action-row">
            <button type="button" className="button-secondary" onClick={clearFilters} disabled={activeFilters.length === 0}>
              清空筛选
            </button>
            <button type="button" onClick={() => void handleBatchParse()} disabled={actionableSelectedCount === 0 || parsingInvoiceDocumentId !== null}>
              批量识别选中文件
            </button>
            <button type="button" className="button-secondary" onClick={() => void handleDeleteSelected()} disabled={selectedIds.length === 0}>
              删除选中文件
            </button>
          </div>
        </div>
        <FileStatusTable
          rows={filteredRows}
          selectedIds={selectedIds}
          onToggleSelected={toggleSelected}
          onToggleAll={toggleAll}
          onParse={onParse}
          parsingInvoiceDocumentId={parsingInvoiceDocumentId}
          onOpenPdf={onOpenPdf}
          onCreateManual={onCreateManual}
          onDelete={(invoiceDocumentId) => onDelete([invoiceDocumentId])}
        />
      </section>
    </section>
  );
}
