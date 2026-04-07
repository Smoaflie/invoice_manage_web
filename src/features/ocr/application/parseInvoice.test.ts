import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { hashFile } from "../../../shared/hash/hashFile";
import { parseInvoice } from "./parseInvoice";

describe("parseInvoice", () => {
  afterEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.settings.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("stores parsed invoice data and OCR metadata", async () => {
    await appDb.invoiceDocuments.add({
      id: "doc-1",
      contentHash: "hash-1",
      fileName: "demo.pdf",
      fileSize: 123,
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
      createdAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z"
    });

    const requestOcr = vi.fn().mockResolvedValue({
      invoiceNumber: "INV-001",
      totalAmount: 100,
      taxAmount: 6,
      amountWithoutTax: 94,
      buyerName: "Buyer",
      sellerName: "Seller",
      items: []
    });

    const result = await parseInvoice("doc-1", {
      loadFile: vi.fn().mockResolvedValue(new File(["pdf"], "demo.pdf", { type: "application/pdf" })),
      requestOcr,
      vendor: "baidu",
      now: () => "2026-03-30T00:00:00.000Z"
    });

    expect(result.invoiceNumber).toBe("INV-001");
    expect(await appDb.invoiceDocuments.count()).toBe(1);
    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      invoiceNumber: "INV-001",
      ocrVendor: "baidu",
      ocrParsedAt: "2026-03-30T00:00:00.000Z",
      bindingStatus: "readable",
      bindingErrorType: null
    });
  });

  it("preserves existing invoice metadata and refreshes the file snapshot", async () => {
    const file = new File(["pdf-updated"], "updated.pdf", {
      type: "application/pdf",
      lastModified: 42,
    });
    const contentHash = await hashFile(file);

    await appDb.invoiceDocuments.add({
      id: "doc-1",
      contentHash: "old-hash",
      fileName: "old.pdf",
      fileSize: 10,
      lastModified: 1,
      handleRef: "handle-1",
      bindingStatus: "needs_reparse",
      bindingErrorType: "hash_mismatch",
      ocrVendor: "old-vendor",
      ocrParsedAt: "2026-03-29T00:00:00.000Z",
      parseStatus: "parsed",
      conflictStatus: "same_number_diff_hash",
      conflictMessage: "keep me",
      invoiceNumber: "OLD-001",
      invoiceCode: "OLD-CODE",
      invoiceDate: "2026-03-29",
      totalAmount: 1,
      taxAmount: 0,
      amountWithoutTax: 1,
      buyerName: "Old Buyer",
      sellerName: "Old Seller",
      items: [],
      tags: ["keep"],
      annotation: "",
      uploader: "uploader-1",
      owner: "owner-1",
      sourceType: "ocr",
      edited: false,
      createdAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z",
    });

    const result = await parseInvoice("doc-1", {
      loadFile: vi.fn().mockResolvedValue(file),
      requestOcr: vi.fn().mockResolvedValue({
        invoiceNumber: "INV-002",
        invoiceCode: "NEW-CODE",
        invoiceDate: "2026-03-30",
        totalAmount: 100,
        taxAmount: 6,
        amountWithoutTax: 94,
        buyerName: "Buyer",
        sellerName: "Seller",
        items: [],
      }),
      vendor: "baidu",
      now: () => "2026-03-30T00:00:00.000Z",
    });

    expect(result.invoiceNumber).toBe("INV-002");
    expect(await appDb.invoiceDocuments.count()).toBe(1);
      expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
        invoiceNumber: "INV-002",
        invoiceCode: "NEW-CODE",
        tags: ["keep"],
        uploader: "uploader-1",
        owner: "owner-1",
        conflictStatus: "none",
        conflictMessage: "",
        createdAt: "2026-03-30T00:00:00.000Z",
    });
    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      fileName: "updated.pdf",
      fileSize: file.size,
      lastModified: 42,
      contentHash,
      ocrVendor: "baidu",
      ocrParsedAt: "2026-03-30T00:00:00.000Z",
      bindingStatus: "readable",
      bindingErrorType: null,
    });
  });

  it("recomputes conflicts after reparsing an imported invoice record", async () => {
    await appDb.invoiceDocuments.bulkAdd([
      {
        id: "doc-1",
        contentHash: "hash-1",
        fileName: "one.pdf",
        fileSize: 1,
        lastModified: 1,
        handleRef: "handle-1",
        bindingStatus: "readable",
        bindingErrorType: null,
        ocrVendor: null,
        ocrParsedAt: null,
        parseStatus: "parsed",
        conflictStatus: "same_number_diff_hash",
        conflictMessage: "stale conflict",
        invoiceNumber: "DUP-001",
        invoiceCode: "",
        invoiceDate: "",
        totalAmount: 0,
        taxAmount: 0,
        amountWithoutTax: 0,
        buyerName: "",
        sellerName: "",
        items: [],
        tags: ["keep"],
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
        fileName: "two.pdf",
        fileSize: 1,
        lastModified: 1,
        handleRef: "handle-2",
        bindingStatus: "readable",
        bindingErrorType: null,
        ocrVendor: null,
        ocrParsedAt: null,
        parseStatus: "parsed",
        conflictStatus: "same_number_diff_hash",
        conflictMessage: "stale conflict",
        invoiceNumber: "DUP-001",
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
        createdAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T00:00:00.000Z",
      },
    ]);

    const reparsedFile = new File(["pdf-updated"], "updated.pdf", {
      type: "application/pdf",
      lastModified: 77,
    });

    await parseInvoice("doc-1", {
      loadFile: vi.fn().mockResolvedValue(reparsedFile),
      requestOcr: vi.fn().mockResolvedValue({
        invoiceNumber: "UNIQUE-001",
        invoiceCode: "",
        invoiceDate: "",
        totalAmount: 0,
        taxAmount: 0,
        amountWithoutTax: 0,
        buyerName: "",
        sellerName: "",
        items: [],
      }),
      vendor: "baidu",
      now: () => "2026-03-30T12:00:00.000Z",
    });

    expect(await appDb.invoiceDocuments.count()).toBe(2);
    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      invoiceNumber: "UNIQUE-001",
      tags: ["keep"],
      conflictStatus: "none",
      conflictMessage: "",
    });
    expect(await appDb.invoiceDocuments.get("doc-2")).toMatchObject({
      conflictStatus: "none",
      conflictMessage: "",
    });
  });
});
