import { describe, expect, test } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { createEmptyConditionGroup } from "../../../shared/types/filterGroup";
import { buildWorkspaceRowStates } from "./workspaceRowState";
import { buildDashboardWidgetViewModel, createDashboardDocument, ensureDashboardDocumentDefaults } from "./dashboardDocumentModel";

const fields: WorkspaceFieldDefinition[] = [{ id: "uploader", label: "上传者", source: "builtin", type: "string", options: [], visible: true, width: 160, editable: true }];

const rows: InvoiceDocument[] = [
  {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "a.pdf",
    fileSize: 1,
    lastModified: 1,
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: null,
    ocrParsedAt: null,
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-001",
    invoiceCode: "",
    invoiceDate: "",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "",
    sellerName: "",
    items: [],
    tags: ["已报销"],
    annotation: "",
    uploader: "Alice",
    owner: "",
    beneficiary: "Alice",
    sourceType: "ocr",
    edited: false,
    createdAt: "",
    updatedAt: "",
    collaborationStatus: "local_only",
    reviewStatus: "not_required",
    submittedBy: "",
    receivedBy: "",
    lastSubmissionId: null,
    remark: "",
  },
  {
    id: "doc-2",
    contentHash: "hash-2",
    fileName: "b.pdf",
    fileSize: 1,
    lastModified: 1,
    handleRef: "handle-2",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: null,
    ocrParsedAt: null,
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-002",
    invoiceCode: "",
    invoiceDate: "",
    totalAmount: 200,
    taxAmount: 20,
    amountWithoutTax: 180,
    buyerName: "",
    sellerName: "",
    items: [],
    tags: ["已报销"],
    annotation: "",
    uploader: "Bob",
    owner: "",
    beneficiary: "Bob",
    sourceType: "ocr",
    edited: false,
    createdAt: "",
    updatedAt: "",
    collaborationStatus: "local_only",
    reviewStatus: "not_required",
    submittedBy: "",
    receivedBy: "",
    lastSubmissionId: null,
    remark: "",
  },
];

describe("dashboardDocumentModel", () => {
  test("creates and upgrades dashboard documents with the default total summary widget", () => {
    expect(createDashboardDocument("2026-04-06T00:00:00.000Z")).toMatchObject({
      widgets: [
        expect.objectContaining({
          type: "metric",
          title: "总记录统计",
          metrics: ["row_count", "total_amount", "tax_amount"],
        }),
      ],
      layout: [expect.objectContaining({ colSpan: 1, rowSpan: 1, order: 1 })],
    });

    expect(
      ensureDashboardDocumentDefaults(
        {
          id: "primary",
          createdAt: "2026-04-05T00:00:00.000Z",
          updatedAt: "2026-04-05T00:00:00.000Z",
          widgets: [{ id: "bar-1", type: "bar_chart", title: "按上传者", groupByFieldId: "uploader", valueMetric: "total_amount", conditions: { id: "bar-root", kind: "group", mode: "all", children: [] } }],
          layout: [{ widgetId: "bar-1", colSpan: 2, rowSpan: 1, order: 1 }],
        },
        "2026-04-06T00:00:00.000Z",
      ),
    ).toMatchObject({
      widgets: expect.arrayContaining([expect.objectContaining({ title: "总记录统计" }), expect.objectContaining({ title: "按上传者" })]),
      layout: [expect.objectContaining({ order: 1 }), expect.objectContaining({ order: 2, widgetId: "bar-1" })],
    });
  });

  test("builds metric, bar, pie, and kanban widget view models from one dashboard document", () => {
    const rowStates = buildWorkspaceRowStates(rows, fields);
    const root = createEmptyConditionGroup("root");

    const metric = buildDashboardWidgetViewModel(rowStates, fields, {
      id: "metric-1",
      type: "metric",
      title: "已报销",
      metrics: ["row_count", "total_amount"],
      conditions: root,
    });
    const bar = buildDashboardWidgetViewModel(rowStates, fields, {
      id: "bar-1",
      type: "bar_chart",
      title: "按上传者",
      groupByFieldId: "uploader",
      valueMetric: "total_amount",
      conditions: root,
    });
    const pie = buildDashboardWidgetViewModel(rowStates, fields, {
      id: "pie-1",
      type: "pie_chart",
      title: "按上传者",
      mode: "group_by_field",
      groupByFieldId: "uploader",
      valueMetric: "total_amount",
      conditions: root,
    });
    const kanban = buildDashboardWidgetViewModel(rowStates, fields, {
      id: "kanban-1",
      type: "kanban",
      title: "按上传者看板",
      fieldId: "uploader",
      conditions: root,
    });

    expect(metric).toMatchObject({
      type: "metric",
      metrics: ["row_count", "total_amount"],
      totals: { rowCount: 2, totalAmount: 300, taxAmount: 30 },
    });
    expect(bar).toMatchObject({
      type: "bar_chart",
      items: expect.arrayContaining([expect.objectContaining({ label: "Alice", value: 100 })]),
    });
    expect(pie).toMatchObject({
      type: "pie_chart",
      items: expect.arrayContaining([expect.objectContaining({ label: "Bob", value: 200 })]),
    });
    expect(kanban).toMatchObject({
      type: "kanban",
      columns: expect.arrayContaining([expect.objectContaining({ label: "Alice", count: 1 })]),
    });
  });

  test("filters dashboard widgets through referenced filter groups", () => {
    const rowStates = buildWorkspaceRowStates(rows, fields);

    const metric = buildDashboardWidgetViewModel(
      rowStates,
      fields,
      {
        id: "metric-paid",
        type: "metric",
        title: "已报销",
        metrics: ["row_count", "total_amount"],
        conditions: {
          id: "root",
          kind: "group",
          mode: "all",
          children: [{ id: "paid-ref", kind: "filter_group", filterGroupId: "paid" }],
        },
      },
      (filterGroupId) =>
        filterGroupId === "paid"
          ? {
              id: "paid-root",
              kind: "group",
              mode: "all",
              children: [{ id: "alice-only", kind: "field", fieldId: "uploader", operator: "equals", value: "Alice" }],
            }
          : null,
    );

    expect(metric).toMatchObject({
      type: "metric",
      totals: { rowCount: 1, totalAmount: 100, taxAmount: 10 },
    });
  });

  test("builds custom pie slices from filter groups on top of the widget scope", () => {
    const rowStates = buildWorkspaceRowStates(rows, fields);

    const pie = buildDashboardWidgetViewModel(
      rowStates,
      fields,
      {
        id: "pie-custom",
        type: "pie_chart",
        title: "自定义分类",
        mode: "custom_filter_groups",
        sliceFilters: [
          { id: "slice-a", label: "Alice 组", filterGroupId: "alice" },
          { id: "slice-b", label: "Bob 组", filterGroupId: "bob" },
        ],
        valueMetric: "total_amount",
        conditions: {
          id: "root",
          kind: "group",
          mode: "all",
          children: [{ id: "paid-ref", kind: "filter_group", filterGroupId: "paid" }],
        },
      },
      (filterGroupId) => {
        if (filterGroupId === "paid") {
          return {
            id: "paid-root",
            kind: "group",
            mode: "all",
            children: [],
          };
        }
        if (filterGroupId === "alice") {
          return {
            id: "alice-root",
            kind: "group",
            mode: "all",
            children: [{ id: "alice-only", kind: "field", fieldId: "uploader", operator: "equals", value: "Alice" }],
          };
        }
        if (filterGroupId === "bob") {
          return {
            id: "bob-root",
            kind: "group",
            mode: "all",
            children: [{ id: "bob-only", kind: "field", fieldId: "uploader", operator: "equals", value: "Bob" }],
          };
        }
        return null;
      },
    );

    expect(pie).toMatchObject({
      type: "pie_chart",
      items: [
        { id: "slice-a", label: "Alice 组", value: 100 },
        { id: "slice-b", label: "Bob 组", value: 200 },
      ],
    });
  });
});
