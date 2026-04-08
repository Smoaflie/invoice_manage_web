import { afterAll, afterEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { saveWorkspaceCell, saveWorkspaceDraftRow } from "./saveWorkspaceCell";

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
    sellerName: "供应商",
    items: [],
    tags: ["时期:2024年", "普通标签"],
    remark: "原始备注",
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
  });
}

describe("saveWorkspaceCell", () => {
  afterEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.invoiceAuditLogs.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  test("updates a builtin editable field", async () => {
    await seedDocument();

    await saveWorkspaceCell({
      invoiceDocumentId: "doc-1",
      field: {
        id: "buyerName",
        label: "购买方",
        source: "builtin",
        type: "string",
        options: [],
        visible: true,
        width: 180,
        editable: true,
      },
      value: "新买方",
      now: () => "2026-03-31T01:00:00.000Z",
    });

    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      buyerName: "新买方",
      edited: true,
    });
  });

  test("rewrites only tags within a prefixed tag group", async () => {
    await seedDocument();

    await saveWorkspaceCell({
      invoiceDocumentId: "doc-1",
      field: {
        id: "tag-group:period",
        label: "时期",
        source: "tag_group",
        type: "multi_select",
        options: ["2024年", "2025年"],
        rawOptions: ["时期:2024年", "时期:2025年"],
        visible: true,
        width: 180,
        editable: true,
      },
      value: ["2025年"],
      now: () => "2026-03-31T01:00:00.000Z",
    });

    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      tags: ["普通标签", "时期:2025年"],
      edited: false,
    });
    expect(await appDb.invoiceAuditLogs.where("invoiceDocumentId").equals("doc-1").count()).toBe(1);
  });

  test("saves multiple row drafts in a single document write", async () => {
    await seedDocument();

    await saveWorkspaceDraftRow({
      invoiceDocumentId: "doc-1",
      rowDrafts: {
        buyerName: "新买方",
        remark: "补充备注",
        annotation: "备注已更新",
        "tag-group:period": ["2025年"],
      },
      fieldsById: new Map([
        [
          "buyerName",
          {
            id: "buyerName",
            label: "购买方",
            source: "builtin",
            type: "string",
            options: [],
            visible: true,
            width: 180,
            editable: true,
          },
        ],
        [
          "remark",
          {
            id: "remark",
            label: "备注",
            source: "builtin",
            type: "string",
            options: [],
            visible: true,
            width: 180,
            editable: true,
          },
        ],
        [
          "annotation",
          {
            id: "annotation",
            label: "批注",
            source: "builtin",
            type: "string",
            options: [],
            visible: true,
            width: 180,
            editable: true,
          },
        ],
        [
          "tag-group:period",
          {
            id: "tag-group:period",
            label: "时期",
            source: "tag_group",
            type: "multi_select",
            options: ["2024年", "2025年"],
            rawOptions: ["时期:2024年", "时期:2025年"],
            visible: true,
            width: 180,
            editable: true,
          },
        ],
      ]),
      now: () => "2026-03-31T01:00:00.000Z",
    });

    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      buyerName: "新买方",
      remark: "补充备注",
      annotation: "备注已更新",
      tags: ["普通标签", "时期:2025年"],
      edited: true,
    });
    expect(await appDb.invoiceAuditLogs.where("invoiceDocumentId").equals("doc-1").count()).toBe(4);
  });
});
