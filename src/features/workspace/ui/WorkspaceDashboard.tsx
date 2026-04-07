import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { ConditionGroup } from "../../../shared/types/filterGroup";
import type { DashboardDocument, DashboardLayoutItem, DashboardWidgetType } from "../../../shared/types/dashboardDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import {
  appendDashboardWidget,
  buildDashboardWidgetViewModel,
  ensureDashboardDocumentDefaults,
  removeDashboardWidget,
  updateDashboardWidget,
} from "../application/dashboardDocumentModel";
import { moveDashboardLayoutItem, replaceDashboardLayoutItem, resizeDashboardLayoutItem } from "../application/dashboardLayoutModel";
import { resolveDashboardWidgetPresentation } from "../application/dashboardWidgetPresentation";
import type { WorkspaceRowState } from "../application/workspaceRowState";
import { WorkspaceDashboardCreateDialog, WorkspaceDashboardWidgetEditorDialog } from "./WorkspaceDashboardDialogs";
import { WorkspaceDashboardWidgetCard } from "./WorkspaceDashboardWidgetCard";

type WorkspaceDashboardProps = {
  rowStates: WorkspaceRowState[];
  fields: WorkspaceFieldDefinition[];
  dashboardDocument: DashboardDocument | null;
  filterGroups?: Array<{ id: string; name: string }>;
  resolveFilterGroup?: (filterGroupId: string) => ConditionGroup | null;
  onDashboardDocumentChange?: (document: DashboardDocument) => void | Promise<void>;
  onFilterGroupsChange?: () => void | Promise<void>;
  onOpenDetails: (invoiceDocumentId: string) => void;
};

type ResizeSession = {
  widgetId: string;
  startX: number;
  startY: number;
  startLayout: DashboardLayoutItem;
  step: {
    columnStep: number;
    rowStep: number;
  };
  handleElement: HTMLButtonElement;
  pointerId: number;
};

const DASHBOARD_PREVIEW_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const DASHBOARD_RESIZE_FALLBACK = { columnStep: 140, rowStep: 140 };
const DASHBOARD_GRID_STYLE = {
  display: "grid",
  "--dashboard-columns": "4",
  "--dashboard-column-width": "180px",
  "--dashboard-gap": "18px",
} as CSSProperties;

function parseGridGap(value: string | null | undefined, fallback = 18) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function measureDashboardResizeStep(handleElement: HTMLButtonElement, layoutItem: DashboardLayoutItem) {
  const slotElement = handleElement.closest(".dashboard-widget-slot");
  if (!(slotElement instanceof HTMLElement)) {
    return DASHBOARD_RESIZE_FALLBACK;
  }
  const slotRect = slotElement.getBoundingClientRect();
  if (slotRect.width <= 0 || slotRect.height <= 0) {
    return DASHBOARD_RESIZE_FALLBACK;
  }

  const gridElement = slotElement.parentElement;
  const gridStyles = gridElement ? window.getComputedStyle(gridElement) : null;
  const columnGap = parseGridGap(gridStyles?.columnGap || gridStyles?.gap);
  const rowGap = parseGridGap(gridStyles?.rowGap || gridStyles?.gap);

  return {
    columnStep: Math.max((slotRect.width - columnGap * (layoutItem.colSpan - 1)) / layoutItem.colSpan, 1),
    rowStep: Math.max((slotRect.height - rowGap * (layoutItem.rowSpan - 1)) / layoutItem.rowSpan, 1),
  };
}

export function WorkspaceDashboard({
  rowStates,
  fields,
  dashboardDocument,
  filterGroups = [],
  resolveFilterGroup,
  onDashboardDocumentChange,
  onFilterGroupsChange,
  onOpenDetails,
}: WorkspaceDashboardProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [menuWidgetId, setMenuWidgetId] = useState<string | null>(null);
  const [editorWidgetId, setEditorWidgetId] = useState<string | null>(null);
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  const effectiveDocument = useMemo(() => ensureDashboardDocumentDefaults(dashboardDocument, DASHBOARD_PREVIEW_TIMESTAMP), [dashboardDocument]);
  const [layoutState, setLayoutState] = useState<DashboardLayoutItem[]>(effectiveDocument.layout);
  const layoutRef = useRef(layoutState);
  const resizeSessionRef = useRef<ResizeSession | null>(null);

  useEffect(() => {
    setLayoutState(effectiveDocument.layout);
  }, [effectiveDocument.layout]);

  useEffect(() => {
    layoutRef.current = layoutState;
  }, [layoutState]);

  const widgetsById = useMemo(() => new Map(effectiveDocument.widgets.map((widget) => [widget.id, widget])), [effectiveDocument.widgets]);
  const orderedWidgets = useMemo(
    () =>
      [...layoutState]
        .sort((left, right) => left.order - right.order)
        .map((layoutItem) => {
          const widget = widgetsById.get(layoutItem.widgetId);
          if (!widget) {
            return null;
          }
          return { layoutItem, widget, viewModel: buildDashboardWidgetViewModel(rowStates, fields, widget, resolveFilterGroup) };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [fields, layoutState, resolveFilterGroup, rowStates, widgetsById],
  );
  const editorWidget = effectiveDocument.widgets.find((widget) => widget.id === editorWidgetId) ?? null;

  const persistDocument = (document: DashboardDocument) => {
    void onDashboardDocumentChange?.(document);
  };

  const buildEditableDocument = (timestamp: string) => ensureDashboardDocumentDefaults(dashboardDocument, timestamp);

  const persistLayout = (nextLayout: DashboardLayoutItem[]) => {
    const timestamp = new Date().toISOString();
    const baseDocument = buildEditableDocument(timestamp);
    setLayoutState(nextLayout);
    persistDocument({ ...baseDocument, layout: nextLayout, updatedAt: timestamp });
  };

  const handleCreateWidget = (widgetType: DashboardWidgetType) => {
    persistDocument(appendDashboardWidget(dashboardDocument, widgetType, fields, new Date().toISOString()));
  };

  const handleMoveWidget = (fromWidgetId: string, toWidgetId: string) => {
    const nextLayout = moveDashboardLayoutItem(layoutRef.current, fromWidgetId, toWidgetId);
    persistLayout(nextLayout);
  };

  const handleResizeStart = (widgetId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    const layoutItem = layoutRef.current.find((item) => item.widgetId === widgetId);
    if (!layoutItem) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    resizeSessionRef.current = {
      widgetId,
      startX: event.clientX,
      startY: event.clientY,
      startLayout: layoutItem,
      step: measureDashboardResizeStep(event.currentTarget, layoutItem),
      handleElement: event.currentTarget,
      pointerId: event.pointerId,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const session = resizeSessionRef.current;
      if (!session) {
        return;
      }
      const previewItem = resizeDashboardLayoutItem([session.startLayout], session.widgetId, {
        deltaX: moveEvent.clientX - session.startX,
        deltaY: moveEvent.clientY - session.startY,
      }, session.step);
      if (previewItem) {
        setLayoutState((current) => replaceDashboardLayoutItem(current, previewItem));
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const session = resizeSessionRef.current;
      resizeSessionRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      if (!session) {
        return;
      }
      if (session.handleElement.hasPointerCapture?.(session.pointerId)) {
        session.handleElement.releasePointerCapture?.(session.pointerId);
      }
      const nextItem = resizeDashboardLayoutItem([session.startLayout], session.widgetId, {
        deltaX: upEvent.clientX - session.startX,
        deltaY: upEvent.clientY - session.startY,
      }, session.step);
      if (nextItem) {
        persistLayout(replaceDashboardLayoutItem(layoutRef.current, nextItem));
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <section className="workspace-dashboard" data-testid="workspace-dashboard">
      <div className="overview-grid overview-grid--dashboard" style={DASHBOARD_GRID_STYLE}>
        {orderedWidgets.map(({ layoutItem, widget, viewModel }) => (
          <div
            key={widget.id}
            className="dashboard-widget-slot"
            style={
              {
                "--dashboard-col-span": String(layoutItem.colSpan),
                "--dashboard-row-span": String(layoutItem.rowSpan),
                gridColumn: `span ${layoutItem.colSpan}`,
                gridRow: `span ${layoutItem.rowSpan}`,
              } as CSSProperties
            }
            onDragOver={(event) => {
              event.preventDefault();
              if (draggingWidgetId && draggingWidgetId !== widget.id) {
                setDragOverWidgetId(widget.id);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              const sourceWidgetId = event.dataTransfer.getData("text/plain") || draggingWidgetId;
              if (sourceWidgetId) {
                handleMoveWidget(sourceWidgetId, widget.id);
              }
              setDraggingWidgetId(null);
              setDragOverWidgetId(null);
            }}
          >
            <WorkspaceDashboardWidgetCard
              widget={widget}
              viewModel={viewModel}
              presentation={resolveDashboardWidgetPresentation(layoutItem)}
              menuOpen={menuWidgetId === widget.id}
              dragging={draggingWidgetId === widget.id}
              dragOver={dragOverWidgetId === widget.id}
              onOpenDetails={onOpenDetails}
              onToggleMenu={() => setMenuWidgetId((current) => (current === widget.id ? null : widget.id))}
              onEdit={() => {
                setMenuWidgetId(null);
                setEditorWidgetId(widget.id);
              }}
              onRemove={() => {
                setMenuWidgetId(null);
                const timestamp = new Date().toISOString();
                const nextDocument = removeDashboardWidget(buildEditableDocument(timestamp), widget.id, timestamp);
                setLayoutState(nextDocument.layout);
                persistDocument(nextDocument);
              }}
              onMenuClose={() => setMenuWidgetId(null)}
              onDragStart={(widgetId, event: ReactDragEvent<HTMLDivElement>) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", widgetId);
                setDraggingWidgetId(widgetId);
                setMenuWidgetId(null);
              }}
              onDragEnd={() => {
                setDraggingWidgetId(null);
                setDragOverWidgetId(null);
              }}
              onResizeStart={handleResizeStart}
            />
          </div>
        ))}

        <button type="button" className="dashboard-add-tile" aria-label="新建仪表盘" onClick={() => setCreateDialogOpen(true)}>
          <span className="dashboard-add-tile__plus">+</span>
          <strong>新建仪表盘</strong>
        </button>
      </div>

      <WorkspaceDashboardCreateDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onCreate={handleCreateWidget} />
      <WorkspaceDashboardWidgetEditorDialog
        open={editorWidget !== null}
        widget={editorWidget}
        fields={fields}
        filterGroups={filterGroups}
        onClose={() => setEditorWidgetId(null)}
        onApply={(nextWidget) => {
          if (!editorWidget) {
            return;
          }
          const timestamp = new Date().toISOString();
          persistDocument(updateDashboardWidget(buildEditableDocument(timestamp), editorWidget.id, () => nextWidget, timestamp));
        }}
        onFilterGroupsChange={onFilterGroupsChange}
      />
    </section>
  );
}
