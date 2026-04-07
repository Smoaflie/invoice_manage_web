import type { FilterGroup, FilterGroupRule } from "../../../shared/types/filterGroup";
import type { InvoiceSavedViewQuery, SavedView } from "../../../shared/types/savedView";
import { SavedViewControls } from "../../views/ui/SavedViewControls";
import type { InvoiceColumnKey } from "./invoiceColumnOptions";
import { INVOICE_COLUMN_OPTIONS } from "./invoiceColumnOptions";

type InvoiceWorkspaceToolbarProps = {
  activeViewId: string;
  activeFilters: string[];
  attentionCount: number;
  availableRules: FilterGroupRule[];
  availableTags: string[];
  bulkTagsText: string;
  draftName: string;
  filterGroups: FilterGroup[];
  selectedIds: string[];
  tagGroups: Array<{ id: string; name: string; sortOrder: number }>;
  viewQuery: InvoiceSavedViewQuery;
  views: SavedView[];
  visibleColumns: string[];
  onBulkTagsTextChange: (value: string) => void;
  onClearFilters: () => void;
  onColumnToggle: (columnKey: InvoiceColumnKey) => void | Promise<void>;
  onDeleteSelected: () => void | Promise<void>;
  onDraftNameChange: (value: string) => void;
  onExportMerged: (invoiceDocumentIds: string[]) => void | Promise<void>;
  onSaveAsNewView: () => void | Promise<void>;
  onSaveCurrentView: () => void | Promise<void>;
  onSelectView: (viewId: string) => void | Promise<void>;
  onSetQuery: (updater: (current: InvoiceSavedViewQuery) => InvoiceSavedViewQuery) => void;
  onBulkAddTags: () => void | Promise<void>;
  onBulkRemoveTags: () => void | Promise<void>;
  onBulkReparse: (invoiceDocumentIds: string[]) => void | Promise<void>;
};

export function InvoiceWorkspaceToolbar({
  activeViewId,
  activeFilters,
  attentionCount,
  availableRules,
  availableTags,
  bulkTagsText,
  draftName,
  filterGroups,
  selectedIds,
  tagGroups,
  viewQuery,
  views,
  visibleColumns,
  onBulkTagsTextChange,
  onClearFilters,
  onColumnToggle,
  onDeleteSelected,
  onDraftNameChange,
  onExportMerged,
  onSaveAsNewView,
  onSaveCurrentView,
  onSelectView,
  onSetQuery,
  onBulkAddTags,
  onBulkRemoveTags,
  onBulkReparse,
}: InvoiceWorkspaceToolbarProps) {
  return (
    <>
      <SavedViewControls
        views={views}
        activeViewId={activeViewId}
        draftName={draftName}
        scopeLabel="发票"
        onDraftNameChange={onDraftNameChange}
        onSelectView={onSelectView}
        onSaveCurrent={onSaveCurrentView}
        onSaveAsNew={onSaveAsNewView}
      />
      <div className="toolbar-row">
        <label className="toolbar-field">
          <span>搜索发票</span>
          <input
            type="search"
            value={viewQuery.searchText}
            onChange={(event) => onSetQuery((current) => ({ ...current, searchText: event.target.value }))}
            placeholder="按发票号码、购买方、销售方搜索"
          />
        </label>
        <label className="toolbar-field toolbar-field--compact">
          <span>标签筛选</span>
          <select value={viewQuery.tag || "all"} onChange={(event) => onSetQuery((current) => ({ ...current, tag: event.target.value === "all" ? "" : event.target.value }))}>
            <option value="all">全部标签</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
        <label className="toolbar-field toolbar-field--compact">
          <span>标签组筛选</span>
          <select
            value={viewQuery.tagGroupId || "all"}
            onChange={(event) =>
              onSetQuery((current) => ({
                ...current,
                tagGroupId: event.target.value === "all" ? "" : event.target.value,
                ruleId: "",
              }))
            }
          >
            <option value="all">全部标签组</option>
            {tagGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <label className="toolbar-field toolbar-field--compact">
          <span>规则筛选</span>
          <select value={viewQuery.ruleId || "all"} onChange={(event) => onSetQuery((current) => ({ ...current, ruleId: event.target.value === "all" ? "" : event.target.value }))}>
            <option value="all">全部规则</option>
            {availableRules.map((rule) => {
              const groupName = filterGroups.find((group) => group.id === rule.groupId)?.name ?? "未分组";
              return (
                <option key={rule.id} value={rule.id}>
                  {groupName} / {rule.label}
                </option>
              );
            })}
          </select>
        </label>
        <div className="filter-tabs" role="tablist" aria-label="发票筛选">
          <button type="button" className={viewQuery.status === "all" ? "filter-tab filter-tab--active" : "filter-tab"} onClick={() => onSetQuery((current) => ({ ...current, status: "all" }))}>
            全部
          </button>
          <button type="button" className={viewQuery.status === "parsed" ? "filter-tab filter-tab--active" : "filter-tab"} onClick={() => onSetQuery((current) => ({ ...current, status: "parsed" }))}>
            已识别
          </button>
          <button
            type="button"
            className={viewQuery.status === "needs_attention" ? "filter-tab filter-tab--active" : "filter-tab"}
            onClick={() => onSetQuery((current) => ({ ...current, status: "needs_attention" }))}
          >
            待处理（{attentionCount}）
          </button>
        </div>
        <details className="toolbar-dropdown">
          <summary>显示字段</summary>
          <div className="toolbar-dropdown__panel">
            {INVOICE_COLUMN_OPTIONS.map((option) => (
              <label key={option.key} className="toolbar-checkbox">
                <input type="checkbox" checked={visibleColumns.includes(option.key)} onChange={() => void onColumnToggle(option.key)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </details>
      </div>
      <div className="toolbar-row toolbar-row--files">
        <div className="workspace-card__meta">
          <span>已选 {selectedIds.length} 条发票</span>
          <span>{activeFilters.length === 0 ? "当前未启用筛选" : `当前筛选：${activeFilters.join(" / ")}`}</span>
        </div>
        <div className="table-action-row">
          <button type="button" className="button-secondary" onClick={onClearFilters} disabled={activeFilters.length === 0}>
            清空筛选
          </button>
        </div>
      </div>
      <div className="toolbar-row toolbar-row--files">
        <label className="toolbar-field">
          <span>批量标签</span>
          <input value={bulkTagsText} onChange={(event) => onBulkTagsTextChange(event.target.value)} placeholder="用空格分隔多个标签" />
        </label>
        <div className="table-action-row">
          <button type="button" onClick={() => void onExportMerged(selectedIds)} disabled={selectedIds.length === 0}>
            导出选中 PDF
          </button>
          <button type="button" onClick={() => void onBulkReparse(selectedIds)} disabled={selectedIds.length === 0}>
            重新识别选中发票
          </button>
          <button type="button" onClick={() => void onBulkAddTags()} disabled={selectedIds.length === 0 || bulkTagsText.trim().length === 0}>
            添加标签
          </button>
          <button type="button" className="button-secondary" onClick={() => void onBulkRemoveTags()} disabled={selectedIds.length === 0 || bulkTagsText.trim().length === 0}>
            删除标签
          </button>
          <button type="button" className="button-secondary" onClick={() => void onDeleteSelected()} disabled={selectedIds.length === 0}>
            删除选中记录
          </button>
        </div>
      </div>
    </>
  );
}
