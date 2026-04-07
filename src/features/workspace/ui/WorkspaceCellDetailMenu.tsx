import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { InvoiceDocumentItem } from "../../../shared/types/invoiceDocument";
import { WorkspaceMenuCellText } from "./WorkspaceMenuCellText";
import { useWorkspaceColumnResize } from "./useWorkspaceColumnResize";
import { WORKSPACE_ITEM_COLUMNS, type WorkspaceItemColumnKey } from "./workspaceItemColumns";

type WorkspaceCellDetailMenuProps = {
  buttonLabel: string;
  menuLabel: string;
  items: InvoiceDocumentItem[];
  columnWidths: Record<string, number>;
  onColumnWidthsChange: (nextWidths: Record<string, number>) => void;
};
const MENU_OFFSET = 8;
const MENU_MAX_WIDTH = 960;
const MENU_MIN_WIDTH = 320;
const MENU_VIEWPORT_PADDING = 16;

function buildPanelStyle(trigger: HTMLButtonElement, preferredWidth?: number) {
  const rect = trigger.getBoundingClientRect();
  const maxWidth = Math.max(MENU_MIN_WIDTH, Math.min(MENU_MAX_WIDTH, window.innerWidth - MENU_VIEWPORT_PADDING * 2));
  const width = Math.min(Math.max(preferredWidth ?? rect.width, rect.width, MENU_MIN_WIDTH), maxWidth);
  const maxLeft = Math.max(MENU_VIEWPORT_PADDING, window.innerWidth - width - MENU_VIEWPORT_PADDING);
  const left = Math.min(Math.max(rect.left, MENU_VIEWPORT_PADDING), maxLeft);
  const top = Math.min(rect.bottom + MENU_OFFSET, window.innerHeight - MENU_VIEWPORT_PADDING);
  return { left, top, width };
}

function formatCellValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }

  return String(value ?? "").trim();
}

export function WorkspaceCellDetailMenu(props: WorkspaceCellDetailMenuProps) {
  const [open, setOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<{ left: number; top: number; width: number } | null>(null);
  const visibleColumns = WORKSPACE_ITEM_COLUMNS.filter((column) => props.items.some((item) => formatCellValue(item[column.key]).length > 0));
  const resolvedColumnWidths = useMemo(
    () =>
      visibleColumns.reduce(
        (widths, column) => ({
          ...widths,
          [column.key]: props.columnWidths[column.key] ?? 120,
        }),
        {} as Record<WorkspaceItemColumnKey, number>,
      ),
    [props.columnWidths, visibleColumns],
  );
  const tableWidth = useMemo(
    () => visibleColumns.reduce((sum, column) => sum + (resolvedColumnWidths[column.key] ?? 120), 0),
    [resolvedColumnWidths, visibleColumns],
  );
  const gridTemplateColumns = visibleColumns.map((column) => `${resolvedColumnWidths[column.key] ?? 120}px`).join(" ");
  const { guideX, startResize } = useWorkspaceColumnResize({
    getWidths: (leftKey, rightKey) => {
      const leftWidth = resolvedColumnWidths[leftKey as WorkspaceItemColumnKey];
      const rightWidth = resolvedColumnWidths[rightKey as WorkspaceItemColumnKey];
      return typeof leftWidth === "number" && typeof rightWidth === "number" ? { leftWidth, rightWidth } : null;
    },
    onCommit: (leftKey, rightKey, widths) =>
      props.onColumnWidthsChange({
        ...props.columnWidths,
        [leftKey]: widths.leftWidth,
        [rightKey]: widths.rightWidth,
      }),
  });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || typeof window === "undefined") {
      return;
    }

    const updatePanelStyle = () => {
      if (!triggerRef.current) {
        return;
      }

      setPanelStyle(buildPanelStyle(triggerRef.current, tableWidth + 24));
    };

    updatePanelStyle();
    window.addEventListener("resize", updatePanelStyle);
    window.addEventListener("scroll", updatePanelStyle, true);
    return () => {
      window.removeEventListener("resize", updatePanelStyle);
      window.removeEventListener("scroll", updatePanelStyle, true);
    };
  }, [open, tableWidth]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const insideDetailPanel = target instanceof Element && target.closest("[data-workspace-cell-menu-detail]") !== null;
      if (shellRef.current?.contains(target) || panelRef.current?.contains(target) || insideDetailPanel) {
        return;
      }

      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="workspace-cell-menu" ref={shellRef}>
      <button
        ref={triggerRef}
        type="button"
        className="workspace-cell-detail__trigger"
        aria-label={props.buttonLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() =>
          setOpen((current) => {
            const nextOpen = !current;
            if (nextOpen && triggerRef.current && typeof window !== "undefined") {
              setPanelStyle(buildPanelStyle(triggerRef.current, tableWidth + 24));
            }
            if (!nextOpen) {
              setPanelStyle(null);
            }
            return nextOpen;
          })
        }
      >
        {props.buttonLabel}
      </button>
      {open && panelStyle && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="workspace-cell-menu__panel"
              role="menu"
              aria-label={props.menuLabel}
              style={{
                left: `${panelStyle.left}px`,
                top: `${panelStyle.top}px`,
                width: `${panelStyle.width}px`,
              }}
            >
              <div className="workspace-cell-menu__table" role="table" aria-label={`${props.menuLabel}表格`}>
                <div className="workspace-cell-menu__head" role="rowgroup">
                  <div className="workspace-cell-menu__row workspace-cell-menu__row--head" role="row" style={{ gridTemplateColumns }}>
                    {visibleColumns.map((column, index) => {
                      const nextColumn = visibleColumns[index + 1];
                      return (
                        <div key={column.key} className="workspace-cell-menu__header workspace-cell-menu__header--resizable" role="columnheader">
                          <span>{column.label}</span>
                          {nextColumn ? (
                            <button
                              type="button"
                              className="table-column-resize-handle"
                              aria-label={`调整列宽 ${column.label}`}
                              onMouseDown={(event) => startResize(event, column.key, nextColumn.key)}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="workspace-cell-menu__body" role="rowgroup">
                  {props.items.map((item, rowIndex) => (
                    <div key={`${rowIndex}-${formatCellValue(item.name) || "item"}`} className="workspace-cell-menu__row" role="row" style={{ gridTemplateColumns }}>
                      {visibleColumns.map((column) => (
                        <div key={column.key} className="workspace-cell-menu__cell" role="cell">
                          <WorkspaceMenuCellText
                            label={column.label}
                            text={formatCellValue(item[column.key])}
                            columnWidth={resolvedColumnWidths[column.key] ?? 120}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {guideX !== null ? <div className="table-column-resize-guide" style={{ left: `${guideX}px` }} /> : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
