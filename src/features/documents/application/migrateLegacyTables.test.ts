import { describe, expect, test } from "vitest";
import { migrateLegacyTables } from "./migrateLegacyTables";

describe("migrateLegacyTables", () => {
  test("merges a file entry and invoice record into one invoice document", async () => {
    const result = await migrateLegacyTables({
      fileEntries: [
        {
          id: "file-1",
          contentHash: "hash-1",
          fileName: "demo.pdf",
          fileSize: 123,
          lastModified: 1000,
          relativePath: "2026/demo.pdf",
          handleRef: "handle-1",
          bindingStatus: "readable",
          bindingErrorType: null,
          ocrVendor: "baidu",
          ocrParsedAt: "2026-03-31T00:00:00.000Z",
          createdAt: "2026-03-31T00:00:00.000Z",
          updatedAt: "2026-03-31T00:00:00.000Z",
        },
      ],
      invoiceRecords: [
        {
          id: "invoice-1",
          fileEntryId: "file-1",
          invoiceNumber: "INV-001",
          invoiceCode: "CODE-1",
          invoiceDate: "2026-03-30",
          totalAmount: 100,
          taxAmount: 10,
          amountWithoutTax: 90,
          buyerName: "Buyer",
          sellerName: "Seller",
          items: [],
          tags: ["已报销"],
          remark: "原始备注",
          uploader: "Alice",
          owner: "Finance",
          parseStatus: "parsed",
          conflictStatus: "none",
          conflictMessage: "",
          createdAt: "2026-03-31T00:00:00.000Z",
          updatedAt: "2026-03-31T00:00:00.000Z",
        },
      ],
    });

    expect(result.invoiceDocuments).toHaveLength(1);
    expect(result.invoiceDocuments[0]).toMatchObject({
      id: "file-1",
      invoiceNumber: "INV-001",
      fileName: "demo.pdf",
      tags: ["已报销"],
      sourceType: "ocr",
      edited: false,
      remark: "原始备注",
      annotation: "",
    });
  });

  test("creates a document for unparsed legacy file rows", async () => {
    const result = await migrateLegacyTables({
      fileEntries: [
        {
          id: "file-2",
          contentHash: "hash-2",
          fileName: "pending.pdf",
          fileSize: 50,
          lastModified: 2000,
          relativePath: "pending.pdf",
          handleRef: "",
          bindingStatus: "unreadable",
          bindingErrorType: "handle_missing",
          ocrVendor: null,
          ocrParsedAt: null,
          createdAt: "2026-03-31T00:00:00.000Z",
          updatedAt: "2026-03-31T00:00:00.000Z",
        },
      ],
      invoiceRecords: [],
    });

    expect(result.invoiceDocuments[0]).toMatchObject({
      id: "file-2",
      invoiceNumber: "",
      parseStatus: "idle",
      bindingStatus: "unreadable",
      sourceType: "ocr",
    });
  });
});
