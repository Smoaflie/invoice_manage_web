import { describe, expect, test } from "vitest";
import type { WorkspaceFilter } from "../../../shared/types/savedView";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { buildWorkspaceFields } from "./workspaceFields";
import { buildWorkspaceRowStates } from "./workspaceRowState";
import { buildReferenceWorkspaceData, sortReferenceWorkspaceData } from "./referenceWorkspaceModel";

const rows: InvoiceDocument[] = [
  {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "east.pdf",
    fileSize: 10,
    lastModified: 1,
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: "baidu",
    ocrParsedAt: "2026-04-01T00:00:00.000Z",
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
    items: [],
    tags: ["待报销"],
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "doc-2",
    contentHash: "hash-2",
    fileName: "north.pdf",
    fileSize: 10,
    lastModified: 1,
    handleRef: "handle-2",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: "baidu",
    ocrParsedAt: "2026-04-01T00:00:00.000Z",
    parseStatus: "needs_reparse",
    conflictStatus: "same_number_diff_hash",
    conflictMessage: "",
    invoiceNumber: "INV-002",
    invoiceCode: "CODE-002",
    invoiceDate: "2026-03-29",
    totalAmount: 220,
    taxAmount: 20,
    amountWithoutTax: 200,
    buyerName: "华北买方",
    sellerName: "北京供应商",
    items: [],
    tags: ["已报销"],
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T01:00:00.000Z",
  },
];

const fields = buildWorkspaceFields({
  tagGroups: [{ id: "expense-status", name: "报销状态", sortOrder: 1 }],
  tagGroupLinks: [
    { tagName: "待报销", groupId: "expense-status" },
    { tagName: "已报销", groupId: "expense-status" },
  ],
});

describe("referenceWorkspaceModel", () => {
  test("builds grouped reference data from invoice rows", () => {
    const data = buildReferenceWorkspaceData(buildWorkspaceRowStates(rows, fields), fields, { groupByFieldId: "parseStatus", searchText: "", filters: [] });

    expect(data.groups.map((group) => ({ id: group.id, count: group.rows.length }))).toEqual([
      { id: "parsed", count: 1 },
      { id: "needs_reparse", count: 1 },
    ]);
    expect(data.groupIds).toEqual(["parsed", "needs_reparse"]);
    expect(data.rows.map((row) => row.id)).toEqual(["doc-1", "doc-2"]);
    expect([...data.rowIdSet]).toEqual(["doc-1", "doc-2"]);
  });

  test("filters reference data by search text and field rules", () => {
    const filters: WorkspaceFilter[] = [{ fieldId: "buyerName", operator: "contains", value: "华北" }];

    const data = buildReferenceWorkspaceData(buildWorkspaceRowStates(rows, fields), fields, { groupByFieldId: "parseStatus", searchText: "买方", filters });

    expect(data.groups).toHaveLength(1);
    expect(data.groups[0].rows.map((row) => row.id)).toEqual(["doc-2"]);
    expect(data.groupIds).toEqual(["needs_reparse"]);
    expect(data.rows.map((row) => row.id)).toEqual(["doc-2"]);
    expect([...data.rowIdSet]).toEqual(["doc-2"]);
  });

  test("filters reference data through referenced filter groups", () => {
    const data = buildReferenceWorkspaceData(buildWorkspaceRowStates(rows, fields), fields, {
      groupByFieldId: "parseStatus",
      searchText: "",
      conditionRoot: {
        id: "root",
        kind: "group",
        mode: "all",
        children: [{ id: "paid-ref", kind: "filter_group", filterGroupId: "paid" }],
      },
      resolveFilterGroup: (filterGroupId) =>
        filterGroupId === "paid"
          ? {
              id: "paid-root",
              kind: "group",
              mode: "all",
              children: [{ id: "paid-tag", kind: "field", fieldId: "tag-group:expense-status", operator: "includes_any", value: ["已报销"] }],
            }
          : null,
    });

    expect(data.rows.map((row) => row.id)).toEqual(["doc-2"]);
  });

  test("sorts rows inside grouped reference data", () => {
    const data = buildReferenceWorkspaceData(
      buildWorkspaceRowStates(
        [
          { ...rows[0], parseStatus: "parsed", totalAmount: 99, updatedAt: "2026-04-01T00:10:00.000Z" },
          { ...rows[1], id: "doc-3", parseStatus: "parsed", totalAmount: 320, updatedAt: "2026-04-01T00:20:00.000Z" },
        ],
        fields,
      ),
      fields,
      { groupByFieldId: "parseStatus", searchText: "", filters: [] },
    );

    const sorted = sortReferenceWorkspaceData(data, fields, { fieldId: "totalAmount", direction: "desc", isActive: true });

    expect(sorted.groups[0].rows.map((row) => row.id)).toEqual(["doc-3", "doc-1"]);
  });
});
