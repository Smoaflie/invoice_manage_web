import { describe, expect, test } from "vitest";
import { dashboardDocumentSchema, filterGroupSchema, savedViewSchema } from "./schemas";

describe("schemas", () => {
  test("accepts workspace saved views with a root condition group", () => {
    const savedView = savedViewSchema.parse({
      id: "view-1",
      scope: "workspace",
      name: "华北已报销",
      isDefault: false,
      query: {
        scope: "workspace",
        searchText: "",
        conditionRoot: {
          id: "root-1",
          kind: "group",
          mode: "all",
          children: [
            { id: "field-1", kind: "field", fieldId: "buyerName", operator: "contains", value: "华北" },
            { id: "group-ref-1", kind: "filter_group", filterGroupId: "filter-group-2025" },
          ],
        },
        sorters: [{ fieldId: "updatedAt", direction: "desc" }],
        groupByFieldId: "",
        fieldOrder: ["invoiceNumber", "buyerName"],
        recordColumnWidths: { invoiceNumber: 168, buyerName: 192 },
        itemColumnWidths: { name: 220, amount: 120 },
        tableColumnWidths: { itemDetails: 144, actions: 262 },
      },
      visibleColumns: ["invoiceNumber", "buyerName"],
      createdAt: "2026-04-04T00:00:00.000Z",
      updatedAt: "2026-04-04T00:00:00.000Z",
    });

    expect(savedView.query).toMatchObject({
      scope: "workspace",
      conditionRoot: expect.objectContaining({
        kind: "group",
        children: expect.arrayContaining([
          expect.objectContaining({ kind: "field", fieldId: "buyerName" }),
          expect.objectContaining({ kind: "filter_group", filterGroupId: "filter-group-2025" }),
        ]),
      }),
      recordColumnWidths: { invoiceNumber: 168, buyerName: 192 },
      itemColumnWidths: { name: 220, amount: 120 },
      tableColumnWidths: { itemDetails: 144, actions: 262 },
    });
  });

  test("accepts filter groups stored as condition trees", () => {
    const filterGroup = filterGroupSchema.parse({
      id: "group-1",
      name: "2025报销",
      root: {
        id: "root-1",
        kind: "group",
        mode: "all",
        children: [{ id: "field-1", kind: "field", fieldId: "tags", operator: "includes_any", value: ["2025报销"] }],
      },
      createdAt: "2026-04-04T00:00:00.000Z",
      updatedAt: "2026-04-04T00:00:00.000Z",
    });

    expect(filterGroup.root.children).toHaveLength(1);
  });

  test("accepts dashboard documents with widgets and layout entries", () => {
    const dashboardDocument = dashboardDocumentSchema.parse({
      id: "primary",
      createdAt: "2026-04-04T00:00:00.000Z",
      updatedAt: "2026-04-04T00:00:00.000Z",
      widgets: [
        {
          id: "metric-1",
          type: "metric",
          title: "已报销",
          metrics: ["row_count", "total_amount"],
          conditions: { id: "root-metric", kind: "group", mode: "all", children: [] },
        },
        {
          id: "kanban-1",
          type: "kanban",
          title: "报销看板",
          fieldId: "beneficiary",
          conditions: { id: "root-kanban", kind: "group", mode: "all", children: [] },
        },
      ],
      layout: [
        { widgetId: "metric-1", colSpan: 1, rowSpan: 1, order: 1 },
        { widgetId: "kanban-1", colSpan: 2, rowSpan: 2, order: 2 },
      ],
    });

    expect(dashboardDocument.widgets).toHaveLength(2);
    expect(dashboardDocument.layout[1]).toMatchObject({ widgetId: "kanban-1", rowSpan: 2 });
  });
});
