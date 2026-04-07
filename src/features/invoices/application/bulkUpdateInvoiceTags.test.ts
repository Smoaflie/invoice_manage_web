import { afterAll, afterEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { bulkUpdateInvoiceTags } from "./bulkUpdateInvoiceTags";

async function seedDocument(id: string, tags: string[]) {
  await appDb.invoiceDocuments.put({
    id,
    contentHash: `hash-${id}`,
    fileName: `${id}.pdf`,
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
    invoiceNumber: id,
    invoiceCode: "",
    invoiceDate: "",
    totalAmount: 0,
    taxAmount: 0,
    amountWithoutTax: 0,
    buyerName: "",
    sellerName: "",
    items: [],
    tags,
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
  });
}

describe("bulkUpdateInvoiceTags", () => {
  afterEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.invoiceAuditLogs.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  test("adds whitespace-separated tags and skips duplicates", async () => {
    await seedDocument("doc-1", ["已报销"]);

    const result = await bulkUpdateInvoiceTags({
      invoiceDocumentIds: ["doc-1"],
      tagsText: "已报销 差旅 差旅",
      mode: "add",
      now: () => "2026-03-31T01:00:00.000Z",
    });

    expect(result.updatedCount).toBe(1);
    expect((await appDb.invoiceDocuments.get("doc-1"))?.tags).toEqual(["已报销", "差旅"]);
    expect(await appDb.invoiceAuditLogs.count()).toBe(1);
  });

  test("removes only existing matching tags", async () => {
    await seedDocument("doc-1", ["已报销", "差旅", "待核验"]);

    const result = await bulkUpdateInvoiceTags({
      invoiceDocumentIds: ["doc-1"],
      tagsText: "差旅 不存在",
      mode: "remove",
      now: () => "2026-03-31T01:00:00.000Z",
    });

    expect(result.updatedCount).toBe(1);
    expect((await appDb.invoiceDocuments.get("doc-1"))?.tags).toEqual(["已报销", "待核验"]);
  });
});
