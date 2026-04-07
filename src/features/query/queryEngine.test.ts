import { describe, expect, test } from "vitest";
import type { FilterGroupRule } from "../../shared/types/filterGroup";
import type { InvoiceDocument } from "../../shared/types/invoiceDocument";
import { applySavedViewQuery } from "./queryEngine";

function makeRow(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
  return {
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
    invoiceCode: "CODE-1",
    invoiceDate: "2026-03-31",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "上海甲方",
    sellerName: "深圳乙方",
      items: [],
      tags: ["已报销"],
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

describe("applySavedViewQuery", () => {
  test("filters invoices with tag groups and regex rules", () => {
    const rows = [makeRow(), makeRow({ id: "doc-2", invoiceNumber: "INV-002", buyerName: "北京甲方", tags: ["待核验"] })];
    const rules: FilterGroupRule[] = [{ id: "rule-1", groupId: "group-1", label: "上海", field: "buyerName", pattern: "^上海" }];
    const result = applySavedViewQuery(
      rows,
      {
        scope: "invoices",
        searchText: "",
        status: "all",
        tag: "",
        tagGroupId: "group-1",
        ruleId: "rule-1",
        sortBy: "invoiceNumber",
        sortDirection: "asc",
      },
      { groupTagMap: { "group-1": ["已报销"] }, filterRules: rules },
    );

    expect(result.map((row) => row.id)).toEqual(["doc-1"]);
  });

  test("filters and sorts files", () => {
    const rows = [makeRow({ id: "doc-1", fileName: "z.pdf" }), makeRow({ id: "doc-2", fileName: "a.pdf", bindingStatus: "unreadable" })];
    const result = applySavedViewQuery(rows, {
      scope: "files",
      searchText: "pdf",
      field: "fileName",
      sortBy: "fileName",
      sortDirection: "asc",
    });

    expect(result.map((row) => row.id)).toEqual(["doc-2", "doc-1"]);
  });

  test("searches invoice and file views by remark", () => {
    const rows = [makeRow({ id: "doc-1", remark: "华北差旅备注" }), makeRow({ id: "doc-2", remark: "" })];

    expect(
      applySavedViewQuery(rows, {
        scope: "invoices",
        searchText: "差旅备注",
        status: "all",
        tag: "",
        tagGroupId: "",
        ruleId: "",
        sortBy: "updatedAt",
        sortDirection: "desc",
      }).map((row) => row.id),
    ).toEqual(["doc-1"]);

    expect(
      applySavedViewQuery(rows, {
        scope: "files",
        searchText: "差旅备注",
        field: "remark",
        sortBy: "updatedAt",
        sortDirection: "desc",
      }).map((row) => row.id),
    ).toEqual(["doc-1"]);
  });
});
