import { z } from "zod";

export const fieldConditionSchema = z.object({
  id: z.string(),
  kind: z.literal("field"),
  fieldId: z.string(),
  operator: z.enum(["contains", "equals", "matches_regex", "includes_any", "greater_than", "less_than", "is_not_empty"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export const filterGroupReferenceConditionSchema = z.object({
  id: z.string(),
  kind: z.literal("filter_group"),
  filterGroupId: z.string(),
});

export const conditionGroupSchema: z.ZodType = z.lazy(() =>
  z.object({
    id: z.string(),
    kind: z.literal("group"),
    mode: z.enum(["all", "any"]),
    children: z.array(z.union([fieldConditionSchema, filterGroupReferenceConditionSchema, conditionGroupSchema])),
  }),
);

export const workspaceSavedViewQuerySchema = z.object({
  scope: z.literal("workspace"),
  searchText: z.string(),
  conditionRoot: conditionGroupSchema,
  sorters: z.array(
    z.object({
      fieldId: z.string(),
      direction: z.enum(["asc", "desc"]),
    }),
  ),
  groupByFieldId: z.string(),
  fieldOrder: z.array(z.string()),
  recordColumnWidths: z.record(z.string(), z.number()).optional(),
  itemColumnWidths: z.record(z.string(), z.number()).optional(),
});

export const filterGroupDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  root: conditionGroupSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const dashboardLayoutItemSchema = z.object({
  widgetId: z.string(),
  colSpan: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  rowSpan: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  order: z.number(),
});

const metricWidgetSchema = z.object({
  id: z.string(),
  type: z.literal("metric"),
  title: z.string(),
  metrics: z.array(z.enum(["row_count", "total_amount", "tax_amount"])),
  conditions: conditionGroupSchema,
});

const barChartWidgetSchema = z.object({
  id: z.string(),
  type: z.literal("bar_chart"),
  title: z.string(),
  groupByFieldId: z.string(),
  valueMetric: z.literal("total_amount"),
  conditions: conditionGroupSchema,
});

const pieChartWidgetSchema = z.object({
  id: z.string(),
  type: z.literal("pie_chart"),
  title: z.string(),
  mode: z.enum(["group_by_field", "custom_filter_groups"]),
  groupByFieldId: z.string().optional(),
  sliceFilters: z.array(z.object({ id: z.string(), label: z.string(), filterGroupId: z.string() })).optional(),
  valueMetric: z.literal("total_amount"),
  conditions: conditionGroupSchema,
});

const kanbanWidgetSchema = z.object({
  id: z.string(),
  type: z.literal("kanban"),
  title: z.string(),
  fieldId: z.string(),
  conditions: conditionGroupSchema,
});

export const dashboardDocumentSchema = z.object({
  id: z.literal("primary"),
  widgets: z.array(z.discriminatedUnion("type", [metricWidgetSchema, barChartWidgetSchema, pieChartWidgetSchema, kanbanWidgetSchema])),
  layout: z.array(dashboardLayoutItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
