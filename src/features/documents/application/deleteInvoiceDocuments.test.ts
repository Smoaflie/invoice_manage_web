import { afterAll, afterEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { deleteInvoiceDocuments } from "./deleteInvoiceDocuments";

describe("deleteInvoiceDocuments", () => {
  afterEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.invoiceAuditLogs.clear();
    await appDb.fileHandles.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  test("deletes documents, audit logs and stored handles together", async () => {
    await appDb.invoiceDocuments.add({
      id: "doc-1",
      contentHash: "hash-1",
      fileName: "demo.pdf",
      fileSize: 10,
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
      invoiceCode: "",
      invoiceDate: "",
      totalAmount: 10,
      taxAmount: 1,
      amountWithoutTax: 9,
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
    await appDb.invoiceAuditLogs.add({
      id: "log-1",
      invoiceDocumentId: "doc-1",
      changedAt: "2026-03-31T01:00:00.000Z",
      changeType: "manual_edit",
      targetField: "buyerName",
      beforeValue: "",
      afterValue: "Buyer",
    });
    await appDb.fileHandles.add({
      key: "handle-1",
      handle: {} as FileSystemHandle,
    });

    await deleteInvoiceDocuments(["doc-1"]);

    expect(await appDb.invoiceDocuments.get("doc-1")).toBeUndefined();
    expect(await appDb.invoiceAuditLogs.where("invoiceDocumentId").equals("doc-1").count()).toBe(0);
    expect(await appDb.fileHandles.get("handle-1")).toBeUndefined();
  });

  test("keeps shared handles that are still referenced by other documents", async () => {
    await appDb.invoiceDocuments.bulkAdd([
      {
        id: "doc-1",
        contentHash: "hash-1",
        fileName: "demo-1.pdf",
        fileSize: 10,
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
      },
      {
        id: "doc-2",
        contentHash: "hash-2",
        fileName: "demo-2.pdf",
        fileSize: 10,
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
      },
    ]);
    await appDb.fileHandles.add({
      key: "handle-1",
      handle: {} as FileSystemHandle,
    });

    await deleteInvoiceDocuments(["doc-1"]);

    expect(await appDb.invoiceDocuments.get("doc-1")).toBeUndefined();
    expect(await appDb.invoiceDocuments.get("doc-2")).toBeDefined();
    expect(await appDb.fileHandles.get("handle-1")).toBeDefined();
  });
});
