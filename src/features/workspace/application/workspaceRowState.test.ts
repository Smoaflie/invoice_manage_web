import { describe, expect, test } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { buildWorkspaceFields } from "./workspaceFields";
import { applyWorkspaceRowDrafts, buildWorkspaceBaseRowStates, buildWorkspaceRowStates } from "./workspaceRowState";

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
    items: [],
    tags: ["时期:2024年", "待报销", "普通标签"],
    remark: "原始备注",
    annotation: "",
    uploader: "张三",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
  },
];

const fields = buildWorkspaceFields({
  tagGroups: [
    { id: "group-status", name: "报销状态", sortOrder: 1 },
    { id: "group-period", name: "时期", sortOrder: 2 },
  ],
  tagGroupLinks: [
    { tagName: "待报销", groupId: "group-status" },
    { tagName: "时期:2024年", groupId: "group-period" },
    { tagName: "时期:2025年", groupId: "group-period" },
  ],
});

describe("workspaceRowState", () => {
  test("materializes draft values and rewrites tag-group drafts into effective tags", () => {
    const rowStates = buildWorkspaceRowStates(rows, fields, {
      "doc-1": {
        buyerName: "新买方",
        "tag-group:group-period": ["2025年"],
      },
    });

    expect(rowStates).toHaveLength(1);
    expect(rowStates[0].values.buyerName).toBe("新买方");
    expect(rowStates[0].values["tag-group:group-period"]).toEqual(["2025年"]);
    expect(rowStates[0].tags).toEqual(["待报销", "普通标签", "时期:2025年"]);
    expect(rowStates[0].searchText).toContain("新买方");
    expect(rowStates[0].searchText).toContain("2025年");
    expect(rowStates[0].searchText).toContain("原始备注");
  });

  test("reuses untouched row states when only one row has drafts", () => {
    const moreRows: InvoiceDocument[] = [
      ...rows,
      {
        ...rows[0],
        id: "doc-2",
        contentHash: "hash-2",
        invoiceNumber: "INV-002",
        buyerName: "华北买方",
        tags: ["时期:2024年", "待报销"],
      },
    ];

    const baseRowStates = buildWorkspaceBaseRowStates(moreRows, fields);
    const draftedRowStates = applyWorkspaceRowDrafts(baseRowStates, fields, {
      "doc-1": {
        buyerName: "新买方",
      },
    });

    expect(draftedRowStates[0]).not.toBe(baseRowStates[0]);
    expect(draftedRowStates[1]).toBe(baseRowStates[1]);
  });

  test("returns the original row-state array when there are no drafts", () => {
    const baseRowStates = buildWorkspaceBaseRowStates(rows, fields);

    expect(applyWorkspaceRowDrafts(baseRowStates, fields, {})).toBe(baseRowStates);
  });
});
