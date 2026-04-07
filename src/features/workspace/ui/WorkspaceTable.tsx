import { memo, useEffect, useMemo, useState } from "react";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import type { ReferenceWorkspaceGroup } from "../application/referenceWorkspaceModel";
import type { WorkspaceRowState } from "../application/workspaceRowState";
import { WorkspaceCellDetailMenu } from "./WorkspaceCellDetailMenu";
import { WorkspaceEditableCell } from "./WorkspaceEditableCell";
import { WorkspaceTableHeader } from "./WorkspaceTableHeader";
import { buildWorkspaceVirtualItems, selectWorkspaceVirtualItems, TABLE_BODY_VIEWPORT_HEIGHT } from "./workspaceVirtualItems";
import { ACTIONS_COLUMN_WIDTH, INDEX_COLUMN_WIDTH, ITEM_DETAILS_COLUMN_WIDTH, SELECT_COLUMN_WIDTH, cellWidth } from "./workspaceTableLayout";

type WorkspaceTableProps = {
  allSelected: boolean;
  groups: ReferenceWorkspaceGroup[];
  expandedGroupIds: string[];
  fields: WorkspaceFieldDefinition[];
  fieldOrder: string[];
  recordColumnWidths: Record<string, number>;
  itemColumnWidths: Record<string, number>;
  selectedIdSet: Set<string>;
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
};

function orderedFields(fieldsById: Map<string, WorkspaceFieldDefinition>, fieldOrder: string[]) {
  return fieldOrder
    .map((fieldId) => fieldsById.get(fieldId))
    .filter((field): field is WorkspaceFieldDefinition => Boolean(field));
}

const RowActions = memo(function RowActions(props: Pick<WorkspaceTableProps, "onOpenDetails" | "onEdit" | "onOpenPdf" | "onDelete" | "onReparse"> & { rowId: string }) {
  return (
    <div className="workspace-row-actions task-table-actions">
      <button type="button" className="workspace-row-actions__button" onClick={() => props.onOpenDetails(props.rowId)}>
        详情
      </button>
      <button type="button" className="workspace-row-actions__button" onClick={() => props.onEdit(props.rowId)}>
        编辑
      </button>
      <button type="button" className="workspace-row-actions__button" onClick={() => props.onOpenPdf(props.rowId)}>
        PDF
      </button>
      <button type="button" className="workspace-row-actions__button" onClick={() => props.onReparse(props.rowId)}>
        OCR识别
      </button>
      <button type="button" className="workspace-row-actions__button workspace-row-actions__button--danger" onClick={() => props.onDelete(props.rowId)}>
        删除
      </button>
    </div>
  );
});

const GroupHeader = memo(function GroupHeader(props: { label: string; count: number; expanded: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="table-group-row table-group-toggle" onClick={props.onToggle}>
      <span className={props.expanded ? "table-group-toggle__icon table-group-toggle__icon--expanded" : "table-group-toggle__icon"} aria-hidden="true">
        ▾
      </span>
      <strong>{props.label}</strong>
      <span>{props.count} 条记录</span>
    </button>
  );
});

const WorkspaceTableRow = memo(function WorkspaceTableRow(
  props: Pick<WorkspaceTableProps, "onToggleSelected" | "onOpenDetails" | "onEdit" | "onOpenPdf" | "onDelete" | "onReparse" | "onItemColumnWidthsChange"> & {
    row: WorkspaceRowState;
    rowIndex: number;
    visibleFields: WorkspaceFieldDefinition[];
    recordColumnWidths: Record<string, number>;
    itemColumnWidths: Record<string, number>;
    isSelected: boolean;
  },
) {
  const itemDetails = props.row.row.items;

  return (
    <div className="table-data-row">
      <div className="table-cell table-cell--select" style={cellWidth(SELECT_COLUMN_WIDTH)}>
        <input
          type="checkbox"
          checked={props.isSelected}
          aria-label={`选择 ${props.row.row.invoiceNumber || props.row.row.fileName}`}
          onChange={() => props.onToggleSelected(props.row.id)}
        />
      </div>
      <div className="table-cell table-cell--index" style={cellWidth(INDEX_COLUMN_WIDTH)}>
        {props.rowIndex + 1}
      </div>
      {props.visibleFields.map((field) => (
        <div key={field.id} className="table-cell" style={cellWidth(props.recordColumnWidths[field.id] ?? field.width)}>
          <WorkspaceEditableCell
            field={field}
            value={props.row.values[field.id]}
            columnWidth={props.recordColumnWidths[field.id] ?? field.width}
          />
        </div>
      ))}
      <div className="table-cell table-cell--item-details" style={cellWidth(ITEM_DETAILS_COLUMN_WIDTH)}>
        {itemDetails.length > 0 ? (
          <WorkspaceCellDetailMenu
            buttonLabel="查看商品"
            menuLabel="商品购买详情"
            items={itemDetails}
            columnWidths={props.itemColumnWidths}
            onColumnWidthsChange={props.onItemColumnWidthsChange}
          />
        ) : (
          <span className="editable-cell__placeholder">无</span>
        )}
      </div>
      <div className="table-cell table-cell--actions" style={cellWidth(ACTIONS_COLUMN_WIDTH)}>
        <RowActions
          rowId={props.row.id}
          onOpenDetails={props.onOpenDetails}
          onEdit={props.onEdit}
          onOpenPdf={props.onOpenPdf}
          onDelete={props.onDelete}
          onReparse={props.onReparse}
        />
      </div>
    </div>
  );
});

export function WorkspaceTable(props: WorkspaceTableProps) {
  const fieldsById = useMemo(() => new Map(props.fields.map((field) => [field.id, field])), [props.fields]);
  const visibleFields = useMemo(() => orderedFields(fieldsById, props.fieldOrder), [fieldsById, props.fieldOrder]);
  const expandedGroupIdSet = useMemo(() => new Set(props.expandedGroupIds), [props.expandedGroupIds]);
  const renderStateKey = useMemo(
    () => props.groups.map((group) => `${group.id}:${group.rows.length}:${expandedGroupIdSet.has(group.id) ? "1" : "0"}`).join("|"),
    [expandedGroupIdSet, props.groups],
  );
  const [scrollTop, setScrollTop] = useState(0);
  const virtualContent = useMemo(() => buildWorkspaceVirtualItems(props.groups, expandedGroupIdSet), [expandedGroupIdSet, props.groups]);
  const visibleItems = useMemo(() => selectWorkspaceVirtualItems(virtualContent.items, scrollTop), [scrollTop, virtualContent.items]);

  useEffect(() => {
    const maxScrollTop = Math.max(0, virtualContent.totalHeight - TABLE_BODY_VIEWPORT_HEIGHT);
    setScrollTop((current) => Math.min(current, maxScrollTop));
  }, [renderStateKey, virtualContent.totalHeight]);

  return (
    <div className="task-table-container" data-testid="workspace-table">
      <div className="task-table-body" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        <div className="task-table-content">
          <WorkspaceTableHeader
            allSelected={props.allSelected}
            visibleFields={visibleFields}
            recordColumnWidths={props.recordColumnWidths}
            onToggleAll={props.onToggleAll}
            onRecordColumnWidthsChange={props.onRecordColumnWidthsChange}
          />

          <div className="task-table-body__content">
            {props.groups.length > 0 ? (
              <div className="task-table-body__spacer" style={{ height: virtualContent.totalHeight }}>
                {visibleItems.map((item) => (
                  <div key={item.key} className="task-table-body__item" style={{ transform: `translateY(${item.top}px)` }}>
                    {item.kind === "group" ? (
                      <GroupHeader label={item.label} count={item.count} expanded={item.expanded} onToggle={() => props.onToggleGroup(item.groupId)} />
                    ) : (
                      <WorkspaceTableRow
                        row={item.row}
                        rowIndex={item.rowIndex}
                        visibleFields={visibleFields}
                        recordColumnWidths={props.recordColumnWidths}
                        itemColumnWidths={props.itemColumnWidths}
                        isSelected={props.selectedIdSet.has(item.row.id)}
                        onToggleSelected={props.onToggleSelected}
                        onOpenDetails={props.onOpenDetails}
                        onEdit={props.onEdit}
                        onOpenPdf={props.onOpenPdf}
                        onDelete={props.onDelete}
                        onReparse={props.onReparse}
                        onItemColumnWidthsChange={props.onItemColumnWidthsChange}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
