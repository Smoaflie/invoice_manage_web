import type { WorkspaceTableColumnWidths } from "../../../shared/types/savedView";
import type { DragEvent } from "react";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import type { ReferenceWorkspaceGroup } from "../application/referenceWorkspaceModel";
import type { WorkspacePresentation } from "./workspacePresentation";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";
import { WorkspaceTable } from "./WorkspaceTable";

type WorkspaceRecordsSurfaceProps = {
  allSelected: boolean;
  groups: ReferenceWorkspaceGroup[];
  expandedGroupIds: string[];
  fields: WorkspaceFieldDefinition[];
  fieldOrder: string[];
  recordColumnWidths: Record<string, number>;
  itemColumnWidths: Record<string, number>;
  tableColumnWidths: WorkspaceTableColumnWidths;
  selectedIdSet: Set<string>;
  dragActive: boolean;
  importLabel: string;
  emptyState: WorkspacePresentation["emptyState"];
  onToggleSelected: (invoiceDocumentId: string) => void;
  onToggleAll: () => void;
  onOpenDetails: (invoiceDocumentId: string) => void;
  onEdit: (invoiceDocumentId: string) => void;
  onOpenPdf: (invoiceDocumentId: string) => void;
  onDelete: (invoiceDocumentId: string) => void;
  onReparse: (invoiceDocumentId: string) => void;
  onToggleGroup: (groupId: string) => void;
  onRecordColumnWidthsChange: (nextWidths: Record<string, number>) => void;
  onItemColumnWidthsChange: (nextWidths: Record<string, number>) => void;
  onTableColumnWidthsChange: (nextWidths: WorkspaceTableColumnWidths) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

export function WorkspaceRecordsSurface(props: WorkspaceRecordsSurfaceProps) {
  return (
    <div
      className="workspace-records-shell"
      data-testid="workspace-dropzone"
      onDragOver={props.onDragOver}
      onDragLeave={props.onDragLeave}
      onDrop={props.onDrop}
    >
      <div
        className={props.dragActive ? "workspace-records-shell__dropzone workspace-records-shell__dropzone--active" : "workspace-records-shell__dropzone"}
        data-testid="workspace-records-shell"
      >
        <span>把 PDF 拖进表格即可建档或重绑文件。</span>
        <span>{props.importLabel}</span>
      </div>
      {props.groups.length === 0 ? <WorkspaceEmptyState emptyState={props.emptyState} /> : null}
      <WorkspaceTable
        allSelected={props.allSelected}
        groups={props.groups}
        expandedGroupIds={props.expandedGroupIds}
        fields={props.fields}
        fieldOrder={props.fieldOrder}
        recordColumnWidths={props.recordColumnWidths}
        itemColumnWidths={props.itemColumnWidths}
        tableColumnWidths={props.tableColumnWidths}
        selectedIdSet={props.selectedIdSet}
        onToggleSelected={props.onToggleSelected}
        onToggleAll={props.onToggleAll}
        onOpenDetails={props.onOpenDetails}
        onEdit={props.onEdit}
        onOpenPdf={props.onOpenPdf}
        onDelete={props.onDelete}
        onReparse={props.onReparse}
        onToggleGroup={props.onToggleGroup}
        onRecordColumnWidthsChange={props.onRecordColumnWidthsChange}
        onItemColumnWidthsChange={props.onItemColumnWidthsChange}
        onTableColumnWidthsChange={props.onTableColumnWidthsChange}
      />
    </div>
  );
}
