import { describe, expect, test } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { filterFileRows } from "./fileFilters";

function makeRow(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
  return {
    id: "doc-1",
    contentHash: "hash-1",
      fileName: "demo.pdf",
      fileSize: 1,
      lastModified: 1,
      handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: null,
    ocrParsedAt: null,
    parseStatus: "idle",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "",
    invoiceCode: "",
    invoiceDate: "",
    totalAmount: 0,
    taxAmount: 0,
    amountWithoutTax: 0,
    buyerName: "",
    sellerName: "",
      items: [],
      tags: [],
      remark: "",
      annotation: "",
      uploader: "",
      owner: "",
      sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterFileRows", () => {
  test("filters by a chosen file field", () => {
    const rows = [makeRow(), makeRow({ id: "doc-2", fileName: "buyer.pdf", buyerName: "上海甲方" })];
    expect(filterFileRows(rows, { scope: "files", searchText: "buyer", field: "fileName", sortBy: "updatedAt", sortDirection: "desc" }).map((row) => row.id)).toEqual(["doc-2"]);
    expect(filterFileRows(rows, { scope: "files", searchText: "上海", field: "buyerName", sortBy: "updatedAt", sortDirection: "desc" }).map((row) => row.id)).toEqual(["doc-2"]);
  });

  test("searches across all configured fields", () => {
    const rows = [makeRow({ id: "doc-1", tags: ["已报销"] }), makeRow({ id: "doc-2", bindingStatus: "unreadable", bindingErrorType: "file_not_found" })];
    expect(filterFileRows(rows, { scope: "files", searchText: "已报销", field: "all", sortBy: "updatedAt", sortDirection: "desc" }).map((row) => row.id)).toEqual(["doc-1"]);
    expect(filterFileRows(rows, { scope: "files", searchText: "文件不存在", field: "all", sortBy: "updatedAt", sortDirection: "desc" }).map((row) => row.id)).toEqual(["doc-2"]);
  });

  test("filters by remark", () => {
    const rows = [makeRow({ id: "doc-1", remark: "原始备注" }), makeRow({ id: "doc-2", remark: "" })];
    expect(filterFileRows(rows, { scope: "files", searchText: "原始备注", field: "remark", sortBy: "updatedAt", sortDirection: "desc" }).map((row) => row.id)).toEqual(["doc-1"]);
  });
});
