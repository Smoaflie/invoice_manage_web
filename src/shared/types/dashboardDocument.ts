import type { ConditionGroup } from "./filterGroup";

export type DashboardWidgetType = "metric" | "bar_chart" | "pie_chart" | "kanban";

export interface DashboardLayoutItem {
  widgetId: string;
  colSpan: 1 | 2 | 3 | 4;
  rowSpan: 1 | 2 | 3;
  order: number;
}

export interface MetricWidgetConfig {
  id: string;
  type: "metric";
  title: string;
  metrics: Array<"row_count" | "total_amount" | "tax_amount">;
  conditions: ConditionGroup;
}

export interface BarChartWidgetConfig {
  id: string;
  type: "bar_chart";
  title: string;
  groupByFieldId: string;
  valueMetric: "total_amount";
  conditions: ConditionGroup;
}

export interface PieChartSliceFilter {
  id: string;
  label: string;
  filterGroupId: string;
}

export interface PieChartWidgetConfig {
  id: string;
  type: "pie_chart";
  title: string;
  mode: "group_by_field" | "custom_filter_groups";
  groupByFieldId?: string;
  sliceFilters?: PieChartSliceFilter[];
  valueMetric: "total_amount";
  conditions: ConditionGroup;
}

export interface KanbanWidgetConfig {
  id: string;
  type: "kanban";
  title: string;
  fieldId: string;
  conditions: ConditionGroup;
}

export type DashboardWidget = MetricWidgetConfig | BarChartWidgetConfig | PieChartWidgetConfig | KanbanWidgetConfig;

export interface DashboardDocument {
  id: "primary";
  widgets: DashboardWidget[];
  layout: DashboardLayoutItem[];
  createdAt: string;
  updatedAt: string;
}
