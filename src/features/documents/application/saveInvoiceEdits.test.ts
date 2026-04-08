import { afterAll, afterEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { buildAuditEntries, saveInvoiceEdits } from "./saveInvoiceEdits";

describe("saveInvoiceEdits", () => {
  afterEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.invoiceAuditLogs.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  test("builds one audit entry per changed field", () => {
    const result = buildAuditEntries({
      invoiceDocumentId: "doc-1",
      before: {
        buyerName: "A",
        annotation: "",
      },
      after: {
        buyerName: "B",
        annotation: "已核实",
      },
      changeType: "manual_edit",
      changedAt: "2026-03-31T00:00:00.000Z",
    });

    expect(result).toEqual([
      expect.objectContaining({
        targetField: "buyerName",
        beforeValue: "A",
        afterValue: "B",
      }),
      expect.objectContaining({
        targetField: "annotation",
        beforeValue: "",
        afterValue: "已核实",
      }),
    ]);
  });

  test("updates a document and stores audit entries", async () => {
    await appDb.invoiceDocuments.add({
      id: "doc-1",
      contentHash: "hash-1",
      fileName: "demo.pdf",
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
      invoiceCode: "",
      invoiceDate: "2026-03-30",
      totalAmount: 100,
      taxAmount: 10,
      amountWithoutTax: 90,
      buyerName: "Old Buyer",
      sellerName: "Seller",
      items: [],
      tags: ["原标签"],
      annotation: "",
      uploader: "",
      owner: "",
      sourceType: "ocr",
      edited: false,
      createdAt: "2026-03-31T00:00:00.000Z",
      updatedAt: "2026-03-31T00:00:00.000Z",
    });

    await saveInvoiceEdits({
      invoiceDocumentId: "doc-1",
      nextValues: {
        buyerName: "New Buyer",
        annotation: "人工复核",
      },
      changeType: "manual_edit",
      now: () => "2026-03-31T01:00:00.000Z",
    });

    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      buyerName: "New Buyer",
      annotation: "人工复核",
      edited: true,
      updatedAt: "2026-03-31T01:00:00.000Z",
    });
    expect(await appDb.invoiceAuditLogs.count()).toBe(2);
  });

  test("stores audit entries for uploader owner and tags without marking edited", async () => {
    await appDb.invoiceDocuments.add({
      id: "doc-3",
      contentHash: "hash-3",
      fileName: "demo.pdf",
      fileSize: 10,
      lastModified: 1,
      handleRef: "handle-3",
      bindingStatus: "readable",
      bindingErrorType: null,
      ocrVendor: "baidu",
      ocrParsedAt: "2026-03-31T00:00:00.000Z",
      parseStatus: "parsed",
      conflictStatus: "none",
      conflictMessage: "",
      invoiceNumber: "INV-003",
      invoiceCode: "",
      invoiceDate: "2026-03-30",
      totalAmount: 100,
      taxAmount: 10,
      amountWithoutTax: 90,
      buyerName: "Old Buyer",
      sellerName: "Seller",
      items: [],
      tags: ["原标签"],
      annotation: "",
      uploader: "",
      owner: "",
      sourceType: "ocr",
      edited: false,
      createdAt: "2026-03-31T00:00:00.000Z",
      updatedAt: "2026-03-31T00:00:00.000Z",
    });

    await saveInvoiceEdits({
      invoiceDocumentId: "doc-3",
      nextValues: {
        uploader: "Alice",
        owner: "Finance",
        tags: ["新标签"],
      },
      changeType: "manual_edit",
      now: () => "2026-03-31T01:00:00.000Z",
    });

    expect(await appDb.invoiceDocuments.get("doc-3")).toMatchObject({
      uploader: "Alice",
      owner: "Finance",
      tags: ["新标签"],
      edited: false,
      updatedAt: "2026-03-31T01:00:00.000Z",
    });
    expect(await appDb.invoiceAuditLogs.toArray()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ targetField: "uploader", beforeValue: "", afterValue: "Alice" }),
        expect.objectContaining({ targetField: "owner", beforeValue: "", afterValue: "Finance" }),
        expect.objectContaining({ targetField: "tags", beforeValue: "[\"原标签\"]", afterValue: "[\"新标签\"]" }),
      ]),
    );
  });

  test("marks edited when audit-only fields change together with business fields", async () => {
    await appDb.invoiceDocuments.add({
      id: "doc-4",
      contentHash: "hash-4",
      fileName: "demo.pdf",
      fileSize: 10,
      lastModified: 1,
      handleRef: "handle-4",
      bindingStatus: "readable",
      bindingErrorType: null,
      ocrVendor: "baidu",
      ocrParsedAt: "2026-03-31T00:00:00.000Z",
      parseStatus: "parsed",
      conflictStatus: "none",
      conflictMessage: "",
      invoiceNumber: "INV-004",
      invoiceCode: "",
      invoiceDate: "2026-03-30",
      totalAmount: 100,
      taxAmount: 10,
      amountWithoutTax: 90,
      buyerName: "Old Buyer",
      sellerName: "Seller",
      items: [],
      tags: ["原标签"],
      annotation: "",
      uploader: "",
      owner: "",
      sourceType: "ocr",
      edited: false,
      createdAt: "2026-03-31T00:00:00.000Z",
      updatedAt: "2026-03-31T00:00:00.000Z",
    });

    await saveInvoiceEdits({
      invoiceDocumentId: "doc-4",
      nextValues: {
        buyerName: "New Buyer",
        owner: "Finance",
      },
      changeType: "manual_edit",
      now: () => "2026-03-31T01:00:00.000Z",
    });

    expect(await appDb.invoiceDocuments.get("doc-4")).toMatchObject({
      buyerName: "New Buyer",
      owner: "Finance",
      edited: true,
    });
  });

  test("keeps manual-created documents out of edited state", async () => {
    await appDb.invoiceDocuments.add({
      id: "doc-2",
      contentHash: "hash-2",
      fileName: "manual.pdf",
      fileSize: 10,
      lastModified: 1,
      handleRef: "handle-2",
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
    });

    await saveInvoiceEdits({
      invoiceDocumentId: "doc-2",
      nextValues: {
        sourceType: "manual",
        parseStatus: "parsed",
        invoiceNumber: "INV-MANUAL",
      },
      changeType: "manual_create",
      now: () => "2026-03-31T02:00:00.000Z",
    });

    expect(await appDb.invoiceDocuments.get("doc-2")).toMatchObject({
      sourceType: "manual",
      parseStatus: "parsed",
      invoiceNumber: "INV-MANUAL",
      edited: false,
    });
  });
});
