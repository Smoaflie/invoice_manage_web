import { describe, expect, test } from "vitest";
import { createEmptyConditionGroup } from "../../../shared/types/filterGroup";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { applyWorkspaceQuery, buildAnalyticsSummary, buildKanbanColumns, getWorkspaceFieldValue } from "./workspaceQuery";
import { buildWorkspaceFields } from "./workspaceFields";

const rows: InvoiceDocument[] = [
  {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "a.pdf",
    fileSize: 10,
    lastModified: 1,
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: "baidu",
    ocrParsedAt: "2026-03-31T00:00:00.000Z",
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-001",
    invoiceCode: "CODE-001",
    invoiceDate: "2026-03-30",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "华东买方",
    sellerName: "上海供应商",
    items: [
      {
        name: "*电子元件*连接器",
        type: "GH1.25卧贴",
        unit: "个",
        num: 30,
        unit_price: 0.31,
        amount: 9.31,
        tax_rate: "1%",
        tax: 0.09,
      },
    ],
    tags: ["时期:2024年", "待报销"],
    annotation: "线下纸质单",
    uploader: "张三",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
  },
  {
    id: "doc-2",
    contentHash: "hash-2",
    fileName: "b.pdf",
    fileSize: 10,
    lastModified: 2,
    handleRef: "handle-2",
    bindingStatus: "needs_reparse",
    bindingErrorType: null,
    ocrVendor: "baidu",
    ocrParsedAt: "2026-03-31T00:00:00.000Z",
    parseStatus: "needs_reparse",
    conflictStatus: "same_number_diff_hash",
    conflictMessage: "同号异文件",
    invoiceNumber: "INV-002",
    invoiceCode: "CODE-002",
    invoiceDate: "2026-03-29",
    totalAmount: 220,
    taxAmount: 20,
    amountWithoutTax: 200,
    buyerName: "华北买方",
    sellerName: "北京供应商",
    items: [],
    tags: ["时期：2025年", "已报销"],
    annotation: "",
    uploader: "李四",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T01:00:00.000Z",
  },
];

const fields = buildWorkspaceFields({
  tagGroups: [
    { id: "group-status", name: "报销状态", sortOrder: 1 },
    { id: "group-period", name: "时期", sortOrder: 2 },
  ],
  tagGroupLinks: [
    { tagName: "待报销", groupId: "group-status" },
    { tagName: "已报销", groupId: "group-status" },
    { tagName: "时期:2024年", groupId: "group-period" },
    { tagName: "时期:2025年", groupId: "group-period" },
  ],
});

describe("workspaceQuery", () => {
  test("filters rows by search text and builtin field, then sorts by amount", () => {
    const result = applyWorkspaceQuery(rows, fields, {
      scope: "workspace",
      view: "records",
      searchText: "李四",
      conditionRoot: createEmptyConditionGroup(),
      filters: [{ fieldId: "buyerName", operator: "contains", value: "华北" }],
      sorters: [{ fieldId: "totalAmount", direction: "desc" }],
      groupByFieldId: "",
      kanbanFieldId: "parseStatus",
      analyticsBreakdownFieldId: "parseStatus",
      fieldOrder: ["invoiceNumber", "buyerName"],
    });

    expect(result.map((row) => row.id)).toEqual(["doc-2"]);
  });

  test("filters rows through referenced filter groups in the condition tree", () => {
    const result = applyWorkspaceQuery(
      rows,
      fields,
      {
        scope: "workspace",
        view: "records",
        searchText: "",
        conditionRoot: {
          id: "root",
          kind: "group",
          mode: "all",
          children: [{ id: "paid-ref", kind: "filter_group", filterGroupId: "paid" }],
        },
        filters: [],
        sorters: [{ fieldId: "updatedAt", direction: "desc" }],
        groupByFieldId: "",
        kanbanFieldId: "parseStatus",
        analyticsBreakdownFieldId: "parseStatus",
        fieldOrder: ["invoiceNumber", "buyerName"],
      },
      (filterGroupId) =>
        filterGroupId === "paid"
          ? {
              id: "paid-root",
              kind: "group",
              mode: "all",
              children: [{ id: "paid-tag", kind: "field", fieldId: "tag-group:group-status", operator: "includes_any", value: ["已报销"] }],
            }
          : null,
    );

    expect(result.map((row) => row.id)).toEqual(["doc-2"]);
  });

  test("returns display values for grouped tags and multiline item strings", () => {
    expect(getWorkspaceFieldValue(rows[0], fields.find((field) => field.id === "tag-group:group-period"))).toEqual(["2024年"]);
    expect(getWorkspaceFieldValue(rows[0], fields.find((field) => field.id === "itemBrief"))).toBe("*电子元件*连接器");
  });

  test("builds kanban columns from the selected field", () => {
    const columns = buildKanbanColumns(rows, fields, "tag-group:group-period");

    expect(columns).toEqual([
      expect.objectContaining({ id: "2024年", count: 1 }),
      expect.objectContaining({ id: "2025年", count: 1 }),
    ]);
  });

  test("builds analytics summary from the filtered row set", () => {
    const filteredRows = applyWorkspaceQuery(rows, fields, {
      scope: "workspace",
      view: "analytics",
      searchText: "",
      conditionRoot: createEmptyConditionGroup(),
      filters: [],
      sorters: [],
      groupByFieldId: "",
      kanbanFieldId: "parseStatus",
      analyticsBreakdownFieldId: "tag-group:group-period",
      fieldOrder: [],
    });

    const summary = buildAnalyticsSummary(filteredRows, fields, "tag-group:group-period");

    expect(summary.totals).toMatchObject({
      rowCount: 2,
      totalAmount: 320,
      taxAmount: 30,
    });
    expect(summary.breakdown).toEqual([
      expect.objectContaining({ id: "2024年", count: 1, totalAmount: 100 }),
      expect.objectContaining({ id: "2025年", count: 1, totalAmount: 220 }),
    ]);
  });
});
