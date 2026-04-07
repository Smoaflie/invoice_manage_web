import { afterAll, afterEach, describe, expect, it } from "vitest";
import { appDb } from "./appDb";
import { createEmptyConditionGroup } from "../types/filterGroup";
import { invoiceDocumentSchema, savedViewSchema, settingRecordSchema } from "../validation/schemas";
import type { InvoiceDocument } from "../types/invoiceDocument";
import type { SavedView } from "../types/savedView";

describe("appDb", () => {
  afterEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.invoiceAuditLogs.clear();
    await appDb.tagDefinitions.clear();
    await appDb.tagGroups.clear();
    await appDb.tagGroupLinks.clear();
    await appDb.filterGroupRules.clear();
    await appDb.filterGroups.clear();
    await appDb.savedViews.clear();
    await appDb.fileEntries.clear();
    await appDb.invoiceRecords.clear();
    await appDb.settings.clear();
    await appDb.fileHandles.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("stores invoice documents with metadata tables", async () => {
    const invoiceDocument: InvoiceDocument = {
      id: "file-1",
      contentHash: "hash-1",
      fileName: "demo.pdf",
      fileSize: 123,
      lastModified: 1000,
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
      tags: [],
      remark: "历史备注",
      annotation: "",
      uploader: "",
      owner: "",
      collaborationStatus: "local_only",
      reviewStatus: "not_required",
      submittedBy: "",
      receivedBy: "",
      beneficiary: "",
      lastSubmissionId: null,
      sourceType: "ocr",
      edited: false,
      createdAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z",
    };
    expect(invoiceDocumentSchema.parse(invoiceDocument)).toMatchObject({
      remark: "历史备注",
      collaborationStatus: "local_only",
      reviewStatus: "not_required",
      beneficiary: "",
      lastSubmissionId: null,
    });
    await appDb.invoiceDocuments.add(invoiceDocument);

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
      name: "购买方规则",
      sortOrder: 1,
    });

    await appDb.filterGroupRules.add({
      id: "filter-rule-1",
      groupId: "filter-group-1",
      label: "Buyer",
      field: "buyerName",
      pattern: "Buyer",
    });

    const workspaceView: SavedView = {
      id: "view-1",
      scope: "workspace",
      name: "默认发票视图",
      isDefault: true,
      query: {
        scope: "workspace",
        searchText: "",
        conditionRoot: createEmptyConditionGroup(),
        sorters: [],
        groupByFieldId: "",
        fieldOrder: ["invoiceNumber", "remark", "annotation"],
        recordColumnWidths: { invoiceNumber: 160, remark: 220 },
        itemColumnWidths: { name: 240, amount: 120 },
      },
      visibleColumns: ["invoiceNumber", "remark", "annotation"],
      createdAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z",
    };
    expect(savedViewSchema.parse(workspaceView)).toMatchObject({
      query: expect.objectContaining({
        fieldOrder: ["invoiceNumber", "remark", "annotation"],
        recordColumnWidths: { invoiceNumber: 160, remark: 220 },
        itemColumnWidths: { name: 240, amount: 120 },
      }),
    });
    await appDb.savedViews.add(workspaceView);
    expect(
      settingRecordSchema.parse({
        key: "ui.activeWorkspaceViewId",
        value: "view-1",
        updatedAt: "2026-03-30T00:00:00.000Z",
      }),
    ).toMatchObject({
      key: "ui.activeWorkspaceViewId",
      value: "view-1",
    });
    await appDb.settings.put({
      key: "ui.activeWorkspaceViewId",
      value: "view-1",
      updatedAt: "2026-03-30T00:00:00.000Z",
    });
    expect(await appDb.tagDefinitions.get("已报销")).toBeTruthy();
    expect(await appDb.tagGroups.get("group-1")).toBeTruthy();
    expect(await appDb.tagGroupLinks.where("groupId").equals("group-1").count()).toBe(1);
    expect(await appDb.filterGroups.get("filter-group-1")).toBeTruthy();
    expect(await appDb.filterGroupRules.where("groupId").equals("filter-group-1").count()).toBe(1);
    expect(await appDb.savedViews.get("view-1")).toBeTruthy();
    expect(await appDb.settings.get("ui.activeWorkspaceViewId")).toMatchObject({ value: "view-1" });
    expect(await appDb.invoiceDocuments.get("file-1")).toMatchObject({
      collaborationStatus: "local_only",
      reviewStatus: "not_required",
      beneficiary: "",
      lastSubmissionId: null,
    });
  });
});
