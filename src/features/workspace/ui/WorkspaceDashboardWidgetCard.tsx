import { useEffect, useRef, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { DashboardWidget } from "../../../shared/types/dashboardDocument";
import { isDashboardPresetWidget, type DashboardWidgetViewModel } from "../application/dashboardDocumentModel";
import type { DashboardWidgetPresentation } from "../application/dashboardWidgetPresentation";
import { WorkspaceDashboardBarChart, WorkspaceDashboardPieChart } from "./WorkspaceDashboardCharts";

type WorkspaceDashboardWidgetCardProps = {
  widget: DashboardWidget;
  viewModel: DashboardWidgetViewModel;
  presentation: DashboardWidgetPresentation;
  menuOpen: boolean;
  dragging: boolean;
  dragOver: boolean;
  onOpenDetails: (invoiceDocumentId: string) => void;
  onToggleMenu: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onMenuClose: () => void;
  onDragStart: (widgetId: string, event: ReactDragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onResizeStart: (widgetId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
};

const WIDGET_LABELS: Record<DashboardWidget["type"], string> = {
  metric: "指标卡",
  bar_chart: "图表",
  pie_chart: "图表",
  kanban: "看板",
};

function renderMetricBody(viewModel: Extract<DashboardWidgetViewModel, { type: "metric" }>, presentation: DashboardWidgetPresentation) {
  return (
    <div
      className={`summary-strip dashboard-widget__metrics dashboard-widget__metrics--${presentation.metricLayout}`}
      data-testid="dashboard-metric-body"
      data-metric-layout={presentation.metricLayout}
    >
      {viewModel.metrics.includes("row_count") ? (
        <article className="summary-chip">
          <span>记录数</span>
          <strong>{viewModel.totals.rowCount}</strong>
        </article>
      ) : null}
      {viewModel.metrics.includes("total_amount") ? (
        <article className="summary-chip">
          <span>总金额</span>
          <strong>{viewModel.totals.totalAmount.toFixed(2)}</strong>
        </article>
      ) : null}
      {viewModel.metrics.includes("tax_amount") ? (
        <article className="summary-chip">
          <span>税额</span>
          <strong>{viewModel.totals.taxAmount.toFixed(2)}</strong>
        </article>
      ) : null}
    </div>
  );
}

function renderKanbanBody(
  viewModel: Extract<DashboardWidgetViewModel, { type: "kanban" }>,
  presentation: DashboardWidgetPresentation,
  onOpenDetails: (invoiceDocumentId: string) => void,
) {
  return (
    <div className="dashboard-widget__kanban" data-kanban-layout={presentation.profile}>
      <div className="reference-board__track">
        {viewModel.columns.map((column) => (
          <section key={column.id} className="reference-board__column">
            <header className="reference-board__header">
              <strong>{column.label}</strong>
              <span className="reference-board__count">{column.count}</span>
            </header>
            <div className="reference-board__cards">
              {column.rows.map((row) => (
                <button key={row.id} type="button" className="reference-board__card" onClick={() => onOpenDetails(row.id)}>
                  <div className="reference-board__card-copy">
                    <strong>{row.fileName || "未绑定文件"}</strong>
                    <span>{row.invoiceNumber || "未填写发票号码"}</span>
                  </div>
                  <div className="reference-board__meta">
                    <span>{row.buyerName || "未填写购买方"}</span>
                    <span>{row.totalAmount.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function renderWidgetBody(
  viewModel: DashboardWidgetViewModel,
  presentation: DashboardWidgetPresentation,
  onOpenDetails: (invoiceDocumentId: string) => void,
) {
  if (viewModel.type === "metric") {
    return renderMetricBody(viewModel, presentation);
  }
  if (viewModel.type === "kanban") {
    return renderKanbanBody(viewModel, presentation, onOpenDetails);
  }
  return viewModel.type === "bar_chart" ? (
    <WorkspaceDashboardBarChart items={viewModel.items} layout={presentation.chartLayout} />
  ) : (
    <WorkspaceDashboardPieChart items={viewModel.items} layout={presentation.chartLayout} />
  );
}

export function WorkspaceDashboardWidgetCard(props: WorkspaceDashboardWidgetCardProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!props.menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node | null)) {
        props.onMenuClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        props.onMenuClose();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [props.menuOpen, props.onMenuClose]);

  return (
    <section
      data-dashboard-profile={props.presentation.profile}
      className={
        props.dragOver
          ? "workspace-card workspace-card--ledger workspace-card--dashboard-widget workspace-card--dashboard-widget-drop"
          : props.dragging
            ? "workspace-card workspace-card--ledger workspace-card--dashboard-widget workspace-card--dashboard-widget-dragging"
            : "workspace-card workspace-card--ledger workspace-card--dashboard-widget"
      }
    >
      <div className="workspace-card__header">
        <div
          className="dashboard-widget__drag-surface"
          draggable
          title={`拖动仪表盘“${props.widget.title}”调整位置`}
          onDragStart={(event) => props.onDragStart(props.widget.id, event)}
          onDragEnd={props.onDragEnd}
        >
          <span className="dashboard-widget__drag-handle" data-testid="dashboard-drag-handle" aria-hidden="true" />
          <p className="workspace-card__eyebrow">{WIDGET_LABELS[props.widget.type]}</p>
          <h2>{props.widget.title}</h2>
        </div>
        <div className="workspace-card__meta dashboard-widget__actions" ref={menuRef}>
          <button
            type="button"
            className="dashboard-widget__menu-button"
            aria-label={`仪表盘“${props.widget.title}”操作`}
            aria-haspopup="menu"
            aria-expanded={props.menuOpen}
            onClick={props.onToggleMenu}
          >
            <span className="dashboard-widget__button-icon" aria-hidden="true">
              ⋮
            </span>
          </button>
          {props.menuOpen ? (
            <div className="dashboard-widget__menu" role="menu" aria-label={`${props.widget.title}操作`}>
              <button type="button" role="menuitem" onClick={props.onEdit}>
                编辑仪表盘
              </button>
              {isDashboardPresetWidget(props.widget) ? null : (
                <button type="button" role="menuitem" onClick={props.onRemove}>
                  删除仪表盘
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="dashboard-widget__body">{renderWidgetBody(props.viewModel, props.presentation, props.onOpenDetails)}</div>

      <button
        type="button"
        className="dashboard-widget__resize-handle"
        aria-label={`调整仪表盘“${props.widget.title}”大小`}
        onPointerDown={(event) => props.onResizeStart(props.widget.id, event)}
      >
        <span className="dashboard-widget__button-icon" aria-hidden="true">
          ⤢
        </span>
      </button>
    </section>
  );
}
