import { describe, expect, test } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { hasInvoiceData } from "./documentRows";

function makeRow(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
  return {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "demo.pdf",
    fileSize: 10,
    lastModified: 1,
    relativePath: "",
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
    proofFiles: [],
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("InvoicesWorkspace invoice row gating", () => {
  test("treats parsed invoice fields as invoice data", () => {
    expect(hasInvoiceData(makeRow({ invoiceNumber: "INV-001" }))).toBe(true);
    expect(hasInvoiceData(makeRow({ buyerName: "Buyer" }))).toBe(true);
    expect(hasInvoiceData(makeRow({ totalAmount: 100 }))).toBe(true);
  });

  test("hides file-only rows with no invoice payload", () => {
    expect(
      hasInvoiceData(
        makeRow({
          invoiceNumber: "",
          invoiceCode: "",
          invoiceDate: "",
          buyerName: "",
          sellerName: "",
          totalAmount: 0,
          taxAmount: 0,
          amountWithoutTax: 0,
          items: [],
          tags: [],
          annotation: "",
        }),
      ),
    ).toBe(false);
  });
});
