import { describe, expect, test } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { matchesFilterRule } from "./matchFilterRules";

function makeRow(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
  return {
    id: "doc-1",
    contentHash: "hash-1",
      fileName: "demo.pdf",
      fileSize: 1,
      lastModified: 1,
      handleRef: "",
    bindingStatus: "unreadable",
    bindingErrorType: "handle_missing",
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
    buyerName: "Buyer Co",
    sellerName: "Seller Co",
      items: [],
      tags: [],
      annotation: "人工备注",
      uploader: "Alice",
      owner: "Bob",
      sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("matchesFilterRule", () => {
  test("matches configured invoice fields with regex", () => {
    expect(matchesFilterRule(makeRow(), { id: "rule-1", groupId: "group-1", label: "Buyer", field: "buyerName", pattern: "Buyer" })).toBe(true);
    expect(matchesFilterRule(makeRow(), { id: "rule-2", groupId: "group-1", label: "Inv", field: "invoiceNumber", pattern: "^INV-" })).toBe(true);
  });

  test("returns false for invalid regex or unmatched field value", () => {
    expect(matchesFilterRule(makeRow(), { id: "rule-1", groupId: "group-1", label: "nope", field: "sellerName", pattern: "Nope" })).toBe(false);
    expect(matchesFilterRule(makeRow(), { id: "rule-2", groupId: "group-1", label: "bad", field: "buyerName", pattern: "(" })).toBe(false);
  });

  test("supports numeric comparison rules for amount and timestamp fields", () => {
    expect(
      matchesFilterRule(makeRow(), {
        id: "rule-amount",
        groupId: "group-1",
        label: "大额发票",
        field: "totalAmount",
        operator: "greater_than",
        pattern: "90",
      }),
    ).toBe(true);
    expect(
      matchesFilterRule(makeRow(), {
        id: "rule-created",
        groupId: "group-1",
        label: "新创建",
        field: "createdAt",
        operator: "equals",
        pattern: String(Date.parse("2026-03-31T00:00:00.000Z")),
      }),
    ).toBe(true);
    expect(
      matchesFilterRule(makeRow(), {
        id: "rule-updated",
        groupId: "group-1",
        label: "较早更新",
        field: "updatedAt",
        operator: "less_than",
        pattern: String(Date.parse("2026-03-31T01:00:00.000Z")),
      }),
    ).toBe(true);
  });
});
