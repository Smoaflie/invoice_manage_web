import { useState, type MouseEvent as ReactMouseEvent } from "react";
import type { WorkspaceTableColumnWidths } from "../../../shared/types/savedView";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { useWorkspaceColumnResize } from "./useWorkspaceColumnResize";
import { MIN_COLUMN_WIDTH } from "./workspaceColumnWidths";
import { INDEX_COLUMN_WIDTH, SELECT_COLUMN_WIDTH, cellWidth } from "./workspaceTableLayout";

type WorkspaceTableHeaderProps = {
  allSelected: boolean;
  visibleFields: WorkspaceFieldDefinition[];
  recordColumnWidths: Record<string, number>;
  tableColumnWidths: WorkspaceTableColumnWidths;
  onToggleAll: () => void;
  onRecordColumnWidthsChange: (nextWidths: Record<string, number>) => void;
  onTableColumnWidthsChange: (nextWidths: WorkspaceTableColumnWidths) => void;
};

export function WorkspaceTableHeader(props: WorkspaceTableHeaderProps) {
  const [trailingGuideX, setTrailingGuideX] = useState<number | null>(null);
  const { guideX: recordGuideX, startResize } = useWorkspaceColumnResize({
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
  const startTrailingResize = (event: ReactMouseEvent<HTMLButtonElement>, fieldId: string, startWidth: number) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    setTrailingGuideX(startX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setTrailingGuideX(moveEvent.clientX);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setTrailingGuideX(null);

      props.onRecordColumnWidthsChange({
        ...props.recordColumnWidths,
        [fieldId]: Math.max(Math.round(startWidth + (upEvent.clientX - startX)), MIN_COLUMN_WIDTH),
      });
      props.onTableColumnWidthsChange(props.tableColumnWidths);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
  const guideX = recordGuideX ?? trailingGuideX;

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
              ) : props.visibleFields.length > 0 ? (
                <button
                  type="button"
                  className="table-column-resize-handle"
                  aria-label="调整列宽 商品详情"
                  onMouseDown={(event) => startTrailingResize(event, field.id, props.recordColumnWidths[field.id] ?? field.width)}
                />
              ) : null}
            </div>
          );
        })}
        <div className="table-cell table-cell--head table-cell--head-resizable table-cell--item-details" style={cellWidth(props.tableColumnWidths.itemDetails)}>
          <span>商品详情</span>
        </div>
        <div className="table-cell table-cell--head table-cell--actions" style={cellWidth(props.tableColumnWidths.actions)}>
          操作
        </div>
      </div>
      {guideX !== null ? <div className="table-column-resize-guide" style={{ left: `${guideX}px` }} /> : null}
    </>
  );
}
