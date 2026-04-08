import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from "react";
import type { SavedView } from "../../../shared/types/savedView";
import { SavedViewControls } from "../../views/ui/SavedViewControls";
import { WorkspaceCommandDeck } from "./WorkspaceCommandDeck";
import { WorkspaceTagMenu } from "./WorkspaceTagMenu";
import type { WorkspacePresentation } from "./workspacePresentation";
import { WorkspaceViewTabs } from "./WorkspaceViewTabs";

type ReferenceWorkspaceToolbarProps = {
  message: string;
  showGroupButton: boolean;
  showFieldsButton: boolean;
  searchText: string;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  bulkTagsText: string;
  sharedTags: string[];
  totalCount: number;
  resultCount: number;
  selectedCount: number;
  pendingCount: number;
  activeFilterCount: number;
  activeViewId: string;
  draftName: string;
  views: SavedView[];
  canSetAsDefault: boolean;
  presentation: WorkspacePresentation["commandDeck"];
  compactRecordsLayout?: boolean;
  onSearchTextChange: (value: string) => void;
  onBulkTagsTextChange: (value: string) => void;
  onDraftNameChange: (value: string) => void;
  onSelectSavedView: (viewId: string) => void | Promise<void>;
  onSaveCurrentView: () => void | Promise<void>;
  onSaveAsNewView: () => void | Promise<void>;
  onCreateSavedView?: (name: string) => void | Promise<void>;
  onSetDefaultView: () => void | Promise<void>;
  onRenameSavedView?: (name: string) => void | Promise<void>;
  onDuplicateSavedView?: (name: string) => void | Promise<void>;
  onDeleteSavedView?: () => void | Promise<void>;
  onOpenFilter: () => void;
  onOpenSort: () => void;
  onOpenGroup: () => void;
  onOpenFields: () => void;
  onOpenViewField?: () => void;
  viewFieldLabel?: string;
  onImportDataFile: (file: File) => void | Promise<void>;
  onExportData: () => void | Promise<void>;
  onExportExcel?: () => void | Promise<void>;
  showExportExcelButton?: boolean;
  onDeleteSelected: () => void;
  onReparseSelected: () => void;
  onAddTagsToSelected: () => void;
  onRemoveTagsFromSelected: () => void;
};
const SEARCH_COMMIT_DELAY_MS = 120;

function CountBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return <span className="reference-workspace__action-badge">{count}</span>;
}

export function ReferenceWorkspaceToolbar(props: ReferenceWorkspaceToolbarProps) {
  const [searchInput, setSearchInput] = useState(props.searchText);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const compactRecordsLayout = props.compactRecordsLayout === true;

  useEffect(() => {
    setSearchInput(props.searchText);
  }, [props.searchText]);

  useEffect(() => {
    if (searchInput === props.searchText) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      props.onSearchTextChange(searchInput);
    }, SEARCH_COMMIT_DELAY_MS);

    return () => globalThis.clearTimeout(timeoutId);
  }, [props.onSearchTextChange, props.searchText, searchInput]);

  const handleImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    void props.onImportDataFile(file);
    event.target.value = "";
  };

  return (
    <header className="reference-workspace__toolbar" data-testid="reference-workspace-toolbar">
      {compactRecordsLayout ? (
        <WorkspaceViewTabs
          views={props.views}
          activeViewId={props.activeViewId}
          builtinLabel="默认视图"
          canSetAsDefault={props.canSetAsDefault}
          onSelectView={props.onSelectSavedView}
          onCreateView={props.onCreateSavedView ?? (async () => {})}
          onRenameView={props.onRenameSavedView ?? (async () => {})}
          onDuplicateView={props.onDuplicateSavedView ?? (async () => {})}
          onDeleteView={props.onDeleteSavedView ?? (async () => {})}
          onSetDefaultView={props.onSetDefaultView}
        />
      ) : (
        <>
          <WorkspaceCommandDeck presentation={props.presentation} />
          <SavedViewControls
            className="reference-workspace__saved-views"
            dataTestId="reference-workspace-saved-views"
            views={props.views}
            activeViewId={props.activeViewId}
            draftName={props.draftName}
            scopeLabel="工作区"
            builtinLabel="初始化视图"
            onDraftNameChange={props.onDraftNameChange}
            onSelectView={props.onSelectSavedView}
            onSaveCurrent={props.onSaveCurrentView}
            onSaveAsNew={props.onSaveAsNewView}
            onSetAsDefault={props.onSetDefaultView}
            canSetAsDefault={props.canSetAsDefault}
          />
        </>
      )}
      <div className="reference-workspace__toolbar-main">
        {compactRecordsLayout ? null : (
          <div className="reference-workspace__toolbar-status" data-testid="reference-workspace-toolbar-status">
            <div className="reference-workspace__toolbar-notice">{props.message}</div>
            <div className="reference-workspace__stats" aria-label="工作区统计">
              <span>{props.totalCount} 条记录</span>
              <span>{props.resultCount} 条结果</span>
              <span>{props.selectedCount} 条已选</span>
            </div>
          </div>
        )}

        <div
          className={compactRecordsLayout ? "reference-workspace__toolbar-actions reference-workspace__toolbar-actions--compact" : "reference-workspace__toolbar-actions reference-workspace__toolbar-actions--secondary"}
          data-testid="reference-workspace-toolbar-actions"
        >
          <div className={compactRecordsLayout ? "reference-workspace__actions reference-workspace__actions--compact" : "reference-workspace__actions reference-workspace__actions--primary"}>
            <div className="reference-workspace__search reference-workspace__search--compact reference-workspace__search--inline">
              <input aria-label="搜索" ref={props.searchInputRef} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="搜索记录..." />
            </div>
            <button type="button" aria-label="筛选" className="workspace-toolbar-shell__ghost" onClick={props.onOpenFilter}>
              筛选
              <CountBadge count={props.activeFilterCount} />
            </button>
            <button type="button" className="workspace-toolbar-shell__ghost" onClick={props.onOpenSort}>
              排序
            </button>
            {props.showGroupButton ? (
              <button type="button" className="workspace-toolbar-shell__ghost" onClick={props.onOpenGroup}>
                分组
              </button>
            ) : null}
            {props.showFieldsButton ? (
              <button type="button" className="workspace-toolbar-shell__ghost" onClick={props.onOpenFields}>
                字段
              </button>
            ) : null}
            <button type="button" className="workspace-toolbar-shell__ghost" onClick={() => importInputRef.current?.click()}>
              导入数据
            </button>
            <button type="button" className="workspace-toolbar-shell__ghost" onClick={props.onExportData}>
              导出数据
            </button>
            {props.showExportExcelButton ? (
              <button type="button" className="workspace-toolbar-shell__ghost" disabled={props.selectedCount === 0} onClick={props.onExportExcel}>
                导出 Excel
              </button>
            ) : null}
            {props.viewFieldLabel && props.onOpenViewField ? (
              <button type="button" className="workspace-toolbar-shell__ghost" onClick={props.onOpenViewField}>
                {props.viewFieldLabel}
              </button>
            ) : null}
            {!compactRecordsLayout ? null : (
              <WorkspaceTagMenu
                selectedCount={props.selectedCount}
                sharedTags={props.sharedTags}
                tagsText={props.bulkTagsText}
                onTagsTextChange={props.onBulkTagsTextChange}
                onAddTags={props.onAddTagsToSelected}
                onRemoveTags={props.onRemoveTagsFromSelected}
              />
            )}
            {!compactRecordsLayout ? null : (
              <button type="button" className="workspace-toolbar-shell__ghost" disabled={props.selectedCount === 0} onClick={props.onReparseSelected}>
                批量 OCR
              </button>
            )}
            {!compactRecordsLayout ? null : (
              <button
                type="button"
                className="workspace-toolbar-shell__ghost workspace-toolbar-shell__ghost--danger"
                disabled={props.selectedCount === 0}
                onClick={props.onDeleteSelected}
              >
                删除所选
              </button>
            )}
          </div>
          {compactRecordsLayout ? null : (
            <div className="reference-workspace__actions reference-workspace__actions--secondary">
              <WorkspaceTagMenu
                selectedCount={props.selectedCount}
                sharedTags={props.sharedTags}
                tagsText={props.bulkTagsText}
                onTagsTextChange={props.onBulkTagsTextChange}
                onAddTags={props.onAddTagsToSelected}
                onRemoveTags={props.onRemoveTagsFromSelected}
              />
              <button type="button" className="workspace-toolbar-shell__ghost" disabled={props.selectedCount === 0} onClick={props.onReparseSelected}>
                批量 OCR
              </button>
              <button
                type="button"
                className="workspace-toolbar-shell__ghost workspace-toolbar-shell__ghost--danger"
                disabled={props.selectedCount === 0}
                onClick={props.onDeleteSelected}
              >
                删除所选
              </button>
            </div>
          )}
        </div>
      </div>
      <input ref={importInputRef} type="file" accept="application/json,.json" hidden onChange={handleImportChange} />
    </header>
  );
}
