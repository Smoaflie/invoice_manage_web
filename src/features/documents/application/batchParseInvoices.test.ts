import { describe, expect, test, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { batchParseInvoices } from "./batchParseInvoices";

function makeRow(overrides: Partial<InvoiceDocument>): InvoiceDocument {
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

describe("batchParseInvoices", () => {
  test("parses readable documents and skips unreadable rows", async () => {
    const parseOne = vi.fn().mockResolvedValue(undefined);

    const result = await batchParseInvoices(
      [
        makeRow({ id: "doc-1", bindingStatus: "readable", handleRef: "handle-1" }),
        makeRow({ id: "doc-2", bindingStatus: "unreadable", handleRef: "" }),
      ],
      parseOne,
    );

    expect(parseOne).toHaveBeenCalledTimes(1);
    expect(result.parsedIds).toEqual(["doc-1"]);
    expect(result.skippedIds).toEqual(["doc-2"]);
    expect(result.failedIds).toEqual([]);
  });
});
