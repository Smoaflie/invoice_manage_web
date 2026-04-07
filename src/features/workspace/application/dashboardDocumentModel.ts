import { createEmptyConditionGroup, type ConditionGroup } from "../../../shared/types/filterGroup";
import type { DashboardDocument, DashboardWidget, DashboardWidgetType, PieChartSliceFilter } from "../../../shared/types/dashboardDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import type { WorkspaceRowState } from "./workspaceRowState";
import { buildAnalyticsSummaryFromRowStates, buildKanbanColumnsFromRowStates } from "./workspaceQuery";
import { createConditionMatcher } from "./workspaceRowFilters";

const DASHBOARD_FIELD_PREFERENCES = ["beneficiary", "uploader", "owner", "parseStatus"] as const;
export const DEFAULT_DASHBOARD_SUMMARY_WIDGET_ID = "dashboard-total-summary";
const DEFAULT_DASHBOARD_SUMMARY_WIDGET_TITLE = "总记录统计";
const DASHBOARD_WIDGET_DEFAULT_SPANS: Record<DashboardWidgetType, { colSpan: 1 | 2 | 3 | 4; rowSpan: 1 | 2 | 3 }> = {
  metric: { colSpan: 1, rowSpan: 1 },
  bar_chart: { colSpan: 2, rowSpan: 1 },
  pie_chart: { colSpan: 2, rowSpan: 1 },
  kanban: { colSpan: 2, rowSpan: 2 },
};

type DashboardMetricWidgetViewModel = {
  id: string;
  type: "metric";
  title: string;
  metrics: Array<"row_count" | "total_amount" | "tax_amount">;
  totals: {
    rowCount: number;
    totalAmount: number;
    taxAmount: number;
  };
};

type DashboardGroupedValueItem = {
  id: string;
  label: string;
  value: number;
};

type DashboardBarChartWidgetViewModel = {
  id: string;
  type: "bar_chart";
  title: string;
  items: DashboardGroupedValueItem[];
};

type DashboardPieChartWidgetViewModel = {
  id: string;
  type: "pie_chart";
  title: string;
  items: DashboardGroupedValueItem[];
};

type DashboardKanbanWidgetViewModel = {
  id: string;
  type: "kanban";
  title: string;
  columns: ReturnType<typeof buildKanbanColumnsFromRowStates>;
};

export type DashboardWidgetViewModel =
  | DashboardMetricWidgetViewModel
  | DashboardBarChartWidgetViewModel
  | DashboardPieChartWidgetViewModel
  | DashboardKanbanWidgetViewModel;

function filterRowStates(rowStates: WorkspaceRowState[], widget: DashboardWidget, resolveFilterGroup?: (filterGroupId: string) => ConditionGroup | null) {
  const matcher = createConditionMatcher(widget.conditions, resolveFilterGroup);
  return rowStates.filter(matcher);
}

function buildGroupedValueItems(rowStates: WorkspaceRowState[], fields: WorkspaceFieldDefinition[], fieldId: string) {
  return buildAnalyticsSummaryFromRowStates(rowStates, fields, fieldId).breakdown.map((item) => ({
    id: item.id,
    label: item.label,
    value: item.totalAmount,
  }));
}

function sumTotalAmount(rowStates: WorkspaceRowState[]) {
  return rowStates.reduce((sum, rowState) => sum + rowState.row.totalAmount, 0);
}

function buildPieSliceItems(
  rowStates: WorkspaceRowState[],
  widget: Extract<DashboardWidget, { type: "pie_chart" }>,
  resolveFilterGroup?: (filterGroupId: string) => ConditionGroup | null,
) {
  return (widget.sliceFilters ?? []).map((slice) => ({
    id: slice.id,
    label: slice.label,
    value: sumTotalAmount(
      resolveFilterGroup
        ? rowStates.filter(createConditionMatcher(resolveFilterGroup(slice.filterGroupId) ?? createEmptyConditionGroup(`missing-${slice.filterGroupId}`), resolveFilterGroup))
        : [],
    ),
  }));
}

function buildPieItems(
  rowStates: WorkspaceRowState[],
  fields: WorkspaceFieldDefinition[],
  widget: Extract<DashboardWidget, { type: "pie_chart" }>,
  resolveFilterGroup?: (filterGroupId: string) => ConditionGroup | null,
) {
  if (widget.mode === "custom_filter_groups") {
    return buildPieSliceItems(rowStates, widget, resolveFilterGroup);
  }
  return buildGroupedValueItems(rowStates, fields, widget.groupByFieldId ?? "");
}

function createDashboardWidgetTitle(widgetType: DashboardWidgetType, index: number) {
  switch (widgetType) {
    case "metric":
      return `统计卡片 ${index}`;
    case "bar_chart":
      return `条形图 ${index}`;
    case "pie_chart":
      return `饼图 ${index}`;
    case "kanban":
      return `看板卡片 ${index}`;
  }
}

function resequenceLayout(layout: DashboardDocument["layout"]) {
  return layout.map((item, index) => ({ ...item, order: index + 1 }));
}

function createDefaultSummaryWidget() {
  return {
    id: DEFAULT_DASHBOARD_SUMMARY_WIDGET_ID,
    type: "metric" as const,
    title: DEFAULT_DASHBOARD_SUMMARY_WIDGET_TITLE,
    metrics: ["row_count", "total_amount", "tax_amount"] as const,
    conditions: createEmptyConditionGroup("dashboard-widget-total-summary"),
  };
}

function createDefaultSummaryLayoutItem() {
  return {
    widgetId: DEFAULT_DASHBOARD_SUMMARY_WIDGET_ID,
    colSpan: DASHBOARD_WIDGET_DEFAULT_SPANS.metric.colSpan,
    rowSpan: DASHBOARD_WIDGET_DEFAULT_SPANS.metric.rowSpan,
    order: 1,
  };
}

function hasDefaultSummaryWidget(dashboardDocument: DashboardDocument) {
  return dashboardDocument.widgets.some((widget) => widget.id === DEFAULT_DASHBOARD_SUMMARY_WIDGET_ID);
}

function countUserWidgetsByType(dashboardDocument: DashboardDocument, widgetType: DashboardWidgetType) {
  return dashboardDocument.widgets.filter((widget) => widget.type === widgetType && widget.id !== DEFAULT_DASHBOARD_SUMMARY_WIDGET_ID).length;
}

export function pickDefaultDashboardFieldId(fields: WorkspaceFieldDefinition[]) {
  return DASHBOARD_FIELD_PREFERENCES.find((fieldId) => fields.some((field) => field.id === fieldId)) ?? fields[0]?.id ?? "";
}

export function createDashboardDocument(timestamp: string): DashboardDocument {
  const summaryWidget = createDefaultSummaryWidget();
  return {
    id: "primary",
    widgets: [summaryWidget],
    layout: [createDefaultSummaryLayoutItem()],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function ensureDashboardDocumentDefaults(dashboardDocument: DashboardDocument | null, timestamp: string): DashboardDocument {
  if (!dashboardDocument) {
    return createDashboardDocument(timestamp);
  }
  if (hasDefaultSummaryWidget(dashboardDocument)) {
    return dashboardDocument;
  }
  return {
    ...dashboardDocument,
    widgets: [createDefaultSummaryWidget(), ...dashboardDocument.widgets],
    layout: resequenceLayout([createDefaultSummaryLayoutItem(), ...dashboardDocument.layout]),
    updatedAt: timestamp,
  };
}

export function createDashboardSliceFilter(filterGroupId = "", index = 1): PieChartSliceFilter {
  return {
    id: globalThis.crypto.randomUUID(),
    label: `分类 ${index}`,
    filterGroupId,
  };
}

export function appendDashboardWidget(
  dashboardDocument: DashboardDocument | null,
  widgetType: DashboardWidgetType,
  fields: WorkspaceFieldDefinition[],
  timestamp: string,
) {
  const baseDocument = ensureDashboardDocumentDefaults(dashboardDocument, timestamp);
  const widgetIndex = countUserWidgetsByType(baseDocument, widgetType) + 1;
  const widgetId = globalThis.crypto.randomUUID();
  const defaultFieldId = pickDefaultDashboardFieldId(fields);
  const widget =
    widgetType === "metric"
      ? {
          id: widgetId,
          type: "metric" as const,
          title: createDashboardWidgetTitle(widgetType, widgetIndex),
          metrics: ["row_count", "total_amount", "tax_amount"] as const,
          conditions: createEmptyConditionGroup(`dashboard-widget-${widgetId}`),
        }
      : widgetType === "bar_chart"
        ? {
            id: widgetId,
            type: "bar_chart" as const,
            title: createDashboardWidgetTitle(widgetType, widgetIndex),
            groupByFieldId: defaultFieldId,
            valueMetric: "total_amount" as const,
            conditions: createEmptyConditionGroup(`dashboard-widget-${widgetId}`),
          }
        : widgetType === "pie_chart"
          ? {
              id: widgetId,
              type: "pie_chart" as const,
              title: createDashboardWidgetTitle(widgetType, widgetIndex),
              mode: "group_by_field" as const,
              groupByFieldId: defaultFieldId,
              valueMetric: "total_amount" as const,
              conditions: createEmptyConditionGroup(`dashboard-widget-${widgetId}`),
            }
          : {
              id: widgetId,
              type: "kanban" as const,
              title: createDashboardWidgetTitle(widgetType, widgetIndex),
              fieldId: defaultFieldId,
              conditions: createEmptyConditionGroup(`dashboard-widget-${widgetId}`),
            };

  const span = DASHBOARD_WIDGET_DEFAULT_SPANS[widgetType];
  return {
    ...baseDocument,
    updatedAt: timestamp,
    widgets: [...baseDocument.widgets, widget],
    layout: [
      ...baseDocument.layout,
      {
        widgetId,
        colSpan: span.colSpan,
        rowSpan: span.rowSpan,
        order: baseDocument.layout.length + 1,
      },
    ],
  };
}

export function updateDashboardWidget(
  dashboardDocument: DashboardDocument,
  widgetId: string,
  updater: (widget: DashboardWidget) => DashboardWidget,
  timestamp: string,
) {
  return {
    ...dashboardDocument,
    updatedAt: timestamp,
    widgets: dashboardDocument.widgets.map((widget) => (widget.id === widgetId ? updater(widget) : widget)),
  };
}

export function removeDashboardWidget(dashboardDocument: DashboardDocument, widgetId: string, timestamp: string) {
  if (widgetId === DEFAULT_DASHBOARD_SUMMARY_WIDGET_ID) {
    return dashboardDocument;
  }
  return {
    ...dashboardDocument,
    updatedAt: timestamp,
    widgets: dashboardDocument.widgets.filter((widget) => widget.id !== widgetId),
    layout: resequenceLayout(dashboardDocument.layout.filter((item) => item.widgetId !== widgetId)),
  };
}

export function isDashboardPresetWidget(widget: DashboardWidget) {
  return widget.id === DEFAULT_DASHBOARD_SUMMARY_WIDGET_ID;
}

export function buildDashboardWidgetViewModel(
  rowStates: WorkspaceRowState[],
  fields: WorkspaceFieldDefinition[],
  widget: DashboardWidget,
  resolveFilterGroup?: (filterGroupId: string) => ConditionGroup | null,
): DashboardWidgetViewModel {
  const filteredRowStates = filterRowStates(rowStates, widget, resolveFilterGroup);

  switch (widget.type) {
    case "metric":
      return {
        id: widget.id,
        type: "metric",
        title: widget.title,
        metrics: widget.metrics,
        totals: buildAnalyticsSummaryFromRowStates(filteredRowStates, fields, "").totals,
      };
    case "bar_chart":
      return {
        id: widget.id,
        type: "bar_chart",
        title: widget.title,
        items: buildGroupedValueItems(filteredRowStates, fields, widget.groupByFieldId),
      };
    case "pie_chart":
      return {
        id: widget.id,
        type: "pie_chart",
        title: widget.title,
        items: buildPieItems(filteredRowStates, fields, widget, resolveFilterGroup),
      };
    case "kanban":
      return {
        id: widget.id,
        type: "kanban",
        title: widget.title,
        columns: buildKanbanColumnsFromRowStates(filteredRowStates, fields, widget.fieldId),
      };
  }
}
