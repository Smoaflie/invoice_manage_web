import { afterAll, afterEach, describe, expect, it } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { exportData } from "./exportData";
import { clearTransferTables } from "./transferTestUtils";

describe("exportData", () => {
  afterEach(async () => {
    await clearTransferTables();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("exports invoice documents and metadata tables as JSON", async () => {
    await appDb.invoiceDocuments.add({
      id: "file-1",
      contentHash: "hash-1",
      fileName: "demo.pdf",
      fileSize: 123,
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
      totalAmount: 0,
      taxAmount: 0,
      amountWithoutTax: 0,
      buyerName: "",
      sellerName: "",
      items: [],
      tags: ["已报销"],
      remark: "原始备注",
      annotation: "需要归档",
      uploader: "",
      owner: "",
      sourceType: "ocr",
      edited: false,
      createdAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z",
    });

    await appDb.invoiceAuditLogs.add({
      id: "audit-1",
      invoiceDocumentId: "file-1",
      changedAt: "2026-03-30T00:00:00.000Z",
      changeType: "manual_annotation_update",
      targetField: "annotation",
      beforeValue: "",
      afterValue: "需要归档",
    });

    await appDb.tagDefinitions.add({
      name: "已报销",
      color: "#00AAFF",
      enabled: true,
      description: "已完成报销流程",
    });

    await appDb.tagGroups.add({
      id: "group-1",
      name: "报销状态",
      sortOrder: 1,
    });

    await appDb.tagGroupLinks.add({
      tagName: "已报销",
      groupId: "group-1",
    });

    await appDb.filterGroups.add({
      id: "filter-group-1",
      name: "购买方分组",
      sortOrder: 1,
    });

    await appDb.filterGroupRules.add({
      id: "filter-rule-1",
      groupId: "filter-group-1",
      label: "Buyer",
      field: "buyerName",
      pattern: "Buyer",
    });

    await appDb.savedViews.add({
      id: "view-1",
      scope: "invoices",
      name: "默认发票视图",
      isDefault: true,
      query: {
        scope: "invoices",
        searchText: "",
        status: "all",
        tag: "",
        tagGroupId: "",
        ruleId: "",
        sortBy: "updatedAt",
        sortDirection: "desc",
      },
      visibleColumns: ["invoiceNumber", "buyerName"],
      createdAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z",
    });

    await appDb.settings.put({
      key: "app.theme",
      value: "system",
      updatedAt: "2026-03-30T00:00:00.000Z",
    });
    await appDb.settings.put({
      key: "ocr.apiKey",
      value: "secret-web-key",
      updatedAt: "2026-03-30T00:00:00.000Z",
    });

    const payload = await exportData();
    expect(payload.invoiceDocuments).toHaveLength(1);
    expect(payload.invoiceAuditLogs).toHaveLength(1);
    expect(payload.tagDefinitions).toHaveLength(1);
    expect(payload.tagGroups).toHaveLength(1);
    expect(payload.tagGroupLinks).toHaveLength(1);
    expect(payload.filterGroups).toHaveLength(1);
    expect(payload.filterGroupRules).toHaveLength(1);
    expect(payload.savedViews).toHaveLength(1);
    expect(payload.settings).toHaveLength(1);
    expect(payload.exportedAt).toBeTypeOf("string");
    expect(payload.invoiceDocuments[0]).not.toHaveProperty("handleRef");
    expect(payload.invoiceDocuments[0]).not.toHaveProperty("bindingStatus");
    expect(payload.invoiceDocuments[0]).not.toHaveProperty("bindingErrorType");
    expect(payload.invoiceDocuments[0]).not.toHaveProperty("relativePath");
    expect(payload.invoiceDocuments[0]).not.toHaveProperty("proofFiles");
    expect(payload.invoiceDocuments[0]).not.toHaveProperty("customFields");
    expect(payload.invoiceDocuments[0]).toMatchObject({
      remark: "原始备注",
      annotation: "需要归档",
    });
    expect(payload).not.toHaveProperty("fileEntries");
    expect(payload).not.toHaveProperty("invoiceRecords");
    expect(payload.settings).not.toContainEqual(
      expect.objectContaining({
        key: "ocr.apiKey",
      }),
    );
  });
});
