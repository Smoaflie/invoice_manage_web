import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { useWorkspaceColumnResize } from "./useWorkspaceColumnResize";
import { ACTIONS_COLUMN_WIDTH, INDEX_COLUMN_WIDTH, ITEM_DETAILS_COLUMN_WIDTH, SELECT_COLUMN_WIDTH, cellWidth } from "./workspaceTableLayout";

type WorkspaceTableHeaderProps = {
  allSelected: boolean;
  visibleFields: WorkspaceFieldDefinition[];
  recordColumnWidths: Record<string, number>;
  onToggleAll: () => void;
  onRecordColumnWidthsChange: (nextWidths: Record<string, number>) => void;
};

export function WorkspaceTableHeader(props: WorkspaceTableHeaderProps) {
  const { guideX, startResize } = useWorkspaceColumnResize({
    getWidths: (leftKey, rightKey) => {
      const leftWidth = props.recordColumnWidths[leftKey];
      const rightWidth = props.recordColumnWidths[rightKey];
      return typeof leftWidth === "number" && typeof rightWidth === "number" ? { leftWidth, rightWidth } : null;
    },
    onCommit: (leftKey, rightKey, widths) =>
      props.onRecordColumnWidthsChange({
        ...props.recordColumnWidths,
        [leftKey]: widths.leftWidth,
        [rightKey]: widths.rightWidth,
      }),
  });

  return (
    <>
      <div className="table-header-row">
        <div className="table-cell table-cell--select" style={cellWidth(SELECT_COLUMN_WIDTH)}>
          <input type="checkbox" checked={props.allSelected} aria-label="选择全部记录" onChange={() => props.onToggleAll()} />
        </div>
        <div className="table-cell table-cell--index" style={cellWidth(INDEX_COLUMN_WIDTH)}>
          #
        </div>
        {props.visibleFields.map((field, index) => {
          const nextField = props.visibleFields[index + 1];
          return (
            <div key={field.id} className="table-cell table-cell--head table-cell--head-resizable" style={cellWidth(props.recordColumnWidths[field.id] ?? field.width)}>
              <span>{field.label}</span>
              {nextField ? (
                <button
                  type="button"
                  className="table-column-resize-handle"
                  aria-label={`调整列宽 ${field.label}`}
                  onMouseDown={(event) => startResize(event, field.id, nextField.id)}
                />
              ) : null}
            </div>
          );
        })}
        <div className="table-cell table-cell--head table-cell--item-details" style={cellWidth(ITEM_DETAILS_COLUMN_WIDTH)}>
          商品详情
        </div>
        <div className="table-cell table-cell--head table-cell--actions" style={cellWidth(ACTIONS_COLUMN_WIDTH)}>
          操作
        </div>
      </div>
      {guideX !== null ? <div className="table-column-resize-guide" style={{ left: `${guideX}px` }} /> : null}
    </>
  );
}
