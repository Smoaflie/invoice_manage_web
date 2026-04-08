import { useEffect } from "react";
import { createEmptyConditionGroup } from "../../../shared/types/filterGroup";
import { ReferenceWorkspaceToolbar } from "./ReferenceWorkspaceToolbar";
import { FieldConfigDialog } from "./FieldConfigDialog";
import { FilterDialog } from "./FilterDialog";
import { GroupByDialog } from "./GroupByDialog";
import { SortDialog } from "./SortDialog";
import { WorkspaceDashboard } from "./WorkspaceDashboard";
import { WorkspaceKanban } from "./WorkspaceKanban";
import { getWorkspacePresentation } from "./workspacePresentation";
import { WorkspaceRecordsSurface } from "./WorkspaceRecordsSurface";
import { WorkspaceSaveBar } from "./WorkspaceSaveBar";
import { ViewFieldDialog } from "./ViewFieldDialog";
import type { ReferenceInvoiceWorkspaceProps } from "./referenceWorkspaceController.shared";
import { useReferenceWorkspaceController } from "./useReferenceWorkspaceController";

export function ReferenceInvoiceWorkspace(props: ReferenceInvoiceWorkspaceProps) {
  const controller = useReferenceWorkspaceController(props);
  const presentation = getWorkspacePresentation(props.view, controller.filteredRows.length);
  const dashboardView = props.view === "dashboard";

  useEffect(() => {
    props.onSidebarStatusChange?.({
      message: controller.displayMessage,
      stats: [
        `${props.invoiceDocuments.length} 条记录`,
        `${controller.filteredRows.length} 条结果`,
        `${controller.selectedIdSet.size} 条已选`,
      ],
    });
  }, [controller.displayMessage, controller.filteredRows.length, controller.selectedIdSet.size, props.invoiceDocuments.length, props.onSidebarStatusChange]);

  return (
    <section className="reference-workspace" data-testid="reference-workspace-root">
      {dashboardView ? null : (
        <ReferenceWorkspaceToolbar
          presentation={presentation.commandDeck}
          compactRecordsLayout={props.view === "records" || props.view === "kanban"}
          message={controller.displayMessage}
          showGroupButton={props.view === "records"}
          showFieldsButton={props.view === "records"}
          searchText={controller.savedViewState.query.searchText}
          searchInputRef={controller.searchInputRef}
          bulkTagsText={controller.bulkTagsText}
          sharedTags={controller.sharedTags}
          totalCount={props.invoiceDocuments.length}
          resultCount={controller.filteredRows.length}
          selectedCount={controller.selectedIdSet.size}
          pendingCount={controller.pendingChangeCount}
          activeFilterCount={controller.activeFilterCount}
          activeViewId={controller.savedViewState.activeViewId}
          draftName={controller.savedViewState.draftName}
          views={controller.savedViewState.views}
          canSetAsDefault={controller.savedViewState.activeViewId.length > 0 && !controller.currentView?.isDefault}
          hasViewDraft={controller.hasViewDraft}
          onSearchTextChange={controller.setSearchText}
          onBulkTagsTextChange={controller.setBulkTagsText}
          onDraftNameChange={controller.savedViewState.setDraftName}
          onSelectSavedView={controller.savedViewState.selectView}
          onSaveCurrentView={controller.savedViewState.saveCurrentView}
          onSaveAsNewView={controller.savedViewState.saveAsNewView}
          onCreateSavedView={controller.handleCreateSavedView}
          onRenameSavedView={controller.handleRenameSavedView}
          onDuplicateSavedView={controller.handleDuplicateSavedView}
          onDeleteSavedView={controller.handleDeleteSavedView}
          onSaveViewDraft={controller.handleSaveViewDraft}
          onDiscardViewDraft={controller.handleDiscardViewDraft}
          onSetDefaultView={controller.savedViewState.setDefaultView}
          onOpenFilter={() => controller.setFilterOpen(true)}
          onOpenSort={() => controller.setSortOpen(true)}
          onOpenGroup={() => controller.setGroupOpen(true)}
          onOpenFields={() => controller.setFieldConfigOpen(true)}
          onOpenViewField={props.view === "kanban" ? () => controller.setViewFieldOpen(true) : undefined}
          viewFieldLabel={props.view === "kanban" ? "看板字段" : undefined}
          onImportDataFile={controller.handleImportDataFile}
          onExportData={controller.handleExportData}
          onExportExcel={controller.handleExportExcel}
          showExportExcelButton={props.view === "records"}
          onDeleteSelected={controller.handleDeleteSelected}
          onReparseSelected={controller.handleReparseSelected}
          onAddTagsToSelected={controller.handleBulkAddTags}
          onRemoveTagsFromSelected={controller.handleBulkRemoveTags}
        />
      )}

      <section className="reference-workspace__content">
        {props.view === "records" ? (
          <WorkspaceRecordsSurface
            allSelected={controller.allRowsSelected}
            groups={controller.groupedData.groups}
            expandedGroupIds={controller.expandedGroupIds}
            fields={controller.visibleFields}
            fieldOrder={controller.orderedVisibleFieldIds}
            recordColumnWidths={controller.recordColumnWidths}
            itemColumnWidths={controller.itemColumnWidths}
            selectedIdSet={controller.selectedIdSet}
            dragActive={controller.dragActive}
            importLabel={controller.importingFiles ? "导入中..." : "文件会直接进入当前记录工作区。"}
            emptyState={presentation.emptyState}
            onToggleSelected={controller.handleToggleSelected}
            onToggleAll={controller.handleToggleAll}
            onOpenDetails={props.onOpenDetails}
            onEdit={props.onEdit}
            onOpenPdf={controller.handleOpenPdfSingle}
            onDelete={controller.handleDeleteSingle}
            onReparse={controller.handleReparseSingle}
            onToggleGroup={controller.handleToggleGroup}
            onRecordColumnWidthsChange={controller.setRecordColumnWidths}
            onItemColumnWidthsChange={controller.setItemColumnWidths}
            onDragOver={(event) => { event.preventDefault(); controller.setDragActive(true); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { controller.setDragActive(false); } }}
            onDrop={(event) => { event.preventDefault(); controller.setDragActive(false); controller.handleDropImport(event); }}
          />
        ) : null}
        {props.view === "kanban" ? <WorkspaceKanban rowStates={controller.filteredRows} fields={controller.fields} fieldId={controller.kanbanFieldId} emptyState={presentation.emptyState} onOpenDetails={props.onOpenDetails} /> : null}
        {props.view === "dashboard" ? (
          <div className="workspace-surface__view">
            <WorkspaceDashboard
              rowStates={controller.rowStates}
              fields={controller.fields}
              dashboardDocument={controller.dashboardDocument}
              filterGroups={controller.filterGroups}
              resolveFilterGroup={controller.resolveFilterGroup}
              onDashboardDocumentChange={controller.saveDashboardDocument}
              onFilterGroupsChange={controller.refreshFilterGroups}
              onOpenDetails={props.onOpenDetails}
            />
          </div>
        ) : null}
      </section>

      {(props.view === "records" || props.view === "kanban") && controller.pendingChangeCount > 0 ? <WorkspaceSaveBar pendingCount={controller.pendingChangeCount} saving={controller.savingChanges} onDiscard={controller.handleDiscardChanges} onSave={controller.handleSaveChanges} /> : null}
      {dashboardView ? null : (
        <>
          <FilterDialog
            open={controller.filterOpen}
            fields={controller.fields}
            conditionRoot={controller.savedViewState.query.conditionRoot ?? createEmptyConditionGroup()}
            onClose={() => controller.setFilterOpen(false)}
            onApply={controller.setConditionRoot}
            onFilterGroupsChange={controller.refreshFilterGroups}
          />
          <SortDialog open={controller.sortOpen} fields={controller.fields} sortFieldId={controller.savedViewState.query.sorters[0]?.fieldId ?? "updatedAt"} sortDirection={controller.savedViewState.query.sorters[0]?.direction ?? "desc"} onClose={() => controller.setSortOpen(false)} onApply={controller.setSorter} />
          <GroupByDialog open={controller.groupOpen} fields={controller.fields} groupByFieldId={controller.savedViewState.query.groupByFieldId} onClose={() => controller.setGroupOpen(false)} onApply={controller.setGroupByFieldId} />
          <ViewFieldDialog open={controller.viewFieldOpen && props.view === "kanban"} title="看板字段" label="看板字段" fields={controller.fields} fieldId={controller.kanbanFieldId} onClose={() => controller.setViewFieldOpen(false)} onApply={controller.setKanbanFieldId} />
          <FieldConfigDialog open={controller.fieldConfigOpen} fields={controller.fields} visibleFieldIds={controller.savedViewState.visibleColumns} fieldOrder={controller.savedViewState.query.fieldOrder} onClose={() => controller.setFieldConfigOpen(false)} onApply={(nextVisibleFieldIds, nextFieldOrder) => { controller.setVisibleFieldIds(nextVisibleFieldIds); controller.setFieldOrder(nextFieldOrder); controller.setFieldConfigOpen(false); }} />
        </>
      )}
    </section>
  );
}
