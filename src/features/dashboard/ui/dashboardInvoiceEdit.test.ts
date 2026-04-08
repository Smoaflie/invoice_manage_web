import { afterAll, afterEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { saveDashboardInvoiceEdits } from "./dashboardInvoiceEdit";

async function seedDocument() {
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
    invoiceCode: "CODE-001",
    invoiceDate: "2026-03-30",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "旧买方",
    sellerName: "旧卖方",
    items: [],
    tags: ["原标签"],
    remark: "原始备注",
    annotation: "原始批注",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
  });
}

describe("saveDashboardInvoiceEdits", () => {
  afterEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.invoiceAuditLogs.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  test("stores remark separately from annotation", async () => {
    await seedDocument();
    const invoiceDocuments = await appDb.invoiceDocuments.toArray();

    await saveDashboardInvoiceEdits({
      invoiceDocumentId: "doc-1",
      mode: "manual-edit",
      invoiceDocuments,
      values: {
        invoiceNumber: "INV-001",
        invoiceCode: "CODE-001",
        invoiceDate: "2026-03-30",
        buyerName: "新买方",
        sellerName: "新卖方",
        amountWithoutTax: "90",
        taxAmount: "10",
        totalAmount: "100",
        tagsText: "原标签 新标签",
        uploader: "Alice",
        owner: "Finance",
        remark: "补充备注",
        annotation: "人工批注",
      },
      now: () => "2026-03-31T01:00:00.000Z",
    });

    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      buyerName: "新买方",
      sellerName: "新卖方",
      tags: ["原标签", "新标签"],
      uploader: "Alice",
      owner: "Finance",
      remark: "补充备注",
      annotation: "人工批注",
      edited: true,
    });
  });
});
