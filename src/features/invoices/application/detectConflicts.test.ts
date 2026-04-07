import { afterAll, afterEach, describe, expect, it } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { detectConflicts } from "./detectConflicts";

describe("detectConflicts", () => {
  afterEach(async () => {
    await appDb.invoiceDocuments.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("flags records that share an invoice number but not a content hash", async () => {
    await appDb.invoiceDocuments.bulkAdd([
      {
        id: "doc-1",
        contentHash: "hash-1",
        fileName: "a.pdf",
        fileSize: 1,
        lastModified: 1,
        handleRef: "handle-1",
        bindingStatus: "readable",
        bindingErrorType: null,
        ocrVendor: "baidu",
        ocrParsedAt: "2026-03-30T00:00:00.000Z",
        parseStatus: "parsed",
        conflictStatus: "none",
        conflictMessage: "",
        invoiceNumber: "INV-001",
        invoiceCode: "",
        invoiceDate: "",
        totalAmount: 1,
        taxAmount: 0,
        amountWithoutTax: 1,
        buyerName: "",
        sellerName: "",
        items: [],
        tags: [],
        annotation: "",
        uploader: "",
        owner: "",
        sourceType: "ocr",
        edited: false,
        createdAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T00:00:00.000Z",
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
        ocrVendor: "baidu",
        ocrParsedAt: "2026-03-30T00:00:00.000Z",
        parseStatus: "parsed",
        invoiceNumber: "INV-001",
        invoiceCode: "",
        invoiceDate: "",
        totalAmount: 1,
        taxAmount: 0,
        amountWithoutTax: 1,
        buyerName: "",
        sellerName: "",
        items: [],
        tags: [],
        annotation: "",
        uploader: "",
        owner: "",
        conflictStatus: "none",
        conflictMessage: "",
        sourceType: "ocr",
        edited: false,
        createdAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T00:00:00.000Z",
      },
    ]);

    const result = await detectConflicts("INV-001");

    expect(result.status).toBe("same_number_diff_hash");
  });

  it("clears stale conflict state for blank invoice numbers", async () => {
    await appDb.invoiceDocuments.bulkAdd([
      {
        id: "doc-1",
        contentHash: "hash-1",
        fileName: "a.pdf",
        fileSize: 1,
        lastModified: 1,
        handleRef: "handle-1",
        bindingStatus: "readable",
        bindingErrorType: null,
        ocrVendor: "baidu",
        ocrParsedAt: "2026-03-30T00:00:00.000Z",
        parseStatus: "parsed",
        conflictStatus: "same_number_diff_hash",
        conflictMessage: "stale",
        invoiceNumber: "",
        invoiceCode: "",
        invoiceDate: "",
        totalAmount: 1,
        taxAmount: 0,
        amountWithoutTax: 1,
        buyerName: "",
        sellerName: "",
        items: [],
        tags: [],
        annotation: "",
        uploader: "",
        owner: "",
        sourceType: "ocr",
        edited: false,
        createdAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T00:00:00.000Z",
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
        ocrVendor: "baidu",
        ocrParsedAt: "2026-03-30T00:00:00.000Z",
        invoiceNumber: "   ",
        invoiceCode: "",
        invoiceDate: "",
        totalAmount: 1,
        taxAmount: 0,
        amountWithoutTax: 1,
        buyerName: "",
        sellerName: "",
        items: [],
        tags: [],
        annotation: "",
        uploader: "",
        owner: "",
        parseStatus: "parsed",
        conflictStatus: "same_number_diff_hash",
        conflictMessage: "stale",
        sourceType: "ocr",
        edited: false,
        createdAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T00:00:00.000Z",
      },
    ]);

    const result = await detectConflicts("   ");

    expect(result.status).toBe("none");
    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      conflictStatus: "none",
      conflictMessage: "",
    });
    expect(await appDb.invoiceDocuments.get("doc-2")).toMatchObject({
      conflictStatus: "none",
      conflictMessage: "",
    });
  });

  it("clears a stale conflict when one record moves to a new invoice number", async () => {
    await appDb.invoiceDocuments.bulkAdd([
      {
        id: "doc-1",
        contentHash: "hash-1",
        fileName: "a.pdf",
        fileSize: 1,
        lastModified: 1,
        handleRef: "handle-1",
        bindingStatus: "readable",
        bindingErrorType: null,
        ocrVendor: "baidu",
        ocrParsedAt: "2026-03-30T00:00:00.000Z",
        parseStatus: "parsed",
        conflictStatus: "none",
        conflictMessage: "",
        invoiceNumber: "INV-001",
        invoiceCode: "",
        invoiceDate: "",
        totalAmount: 1,
        taxAmount: 0,
        amountWithoutTax: 1,
        buyerName: "",
        sellerName: "",
        items: [],
        tags: [],
        annotation: "",
        uploader: "",
        owner: "",
        sourceType: "ocr",
        edited: false,
        createdAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T00:00:00.000Z",
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
        ocrVendor: "baidu",
        ocrParsedAt: "2026-03-30T00:00:00.000Z",
        invoiceNumber: "INV-001",
        invoiceCode: "",
        invoiceDate: "",
        totalAmount: 1,
        taxAmount: 0,
        amountWithoutTax: 1,
        buyerName: "",
        sellerName: "",
        items: [],
        tags: [],
        annotation: "",
        uploader: "",
        owner: "",
        parseStatus: "parsed",
        conflictStatus: "none",
        conflictMessage: "",
        sourceType: "ocr",
        edited: false,
        createdAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T00:00:00.000Z",
      },
    ]);

    await detectConflicts("INV-001");
    await appDb.invoiceDocuments.update("doc-2", { invoiceNumber: "INV-002" });

    const result = await detectConflicts("INV-002", "INV-001");

    expect(result.status).toBe("none");
    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      conflictStatus: "none",
      conflictMessage: "",
    });
    expect(await appDb.invoiceDocuments.get("doc-2")).toMatchObject({
      invoiceNumber: "INV-002",
      conflictStatus: "none",
      conflictMessage: "",
    });
  });
});
