import { afterAll, afterEach, describe, expect, it } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { exportData } from "./exportData";
import { importData } from "./importData";
import { buildTransferInvoiceDocument, clearTransferTables } from "./transferTestUtils";

describe("importData", () => {
  afterEach(async () => {
    await clearTransferTables();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("merges transfer data and preserves local file handles for matching invoice documents", async () => {
    await appDb.invoiceDocuments.add({
      ...buildTransferInvoiceDocument({
        id: "doc-old",
        contentHash: "hash-shared",
        fileName: "old.pdf",
        fileSize: 1,
        invoiceNumber: "INV-OLD",
        buyerName: "本地买方",
        createdAt: "2026-03-29T00:00:00.000Z",
        updatedAt: "2026-03-29T00:00:00.000Z",
        parseStatus: "parsed",
      }),
      handleRef: "persisted-handle",
      bindingStatus: "readable",
      bindingErrorType: null,
    });
    await appDb.settings.put({ key: "app.theme", value: "dark", updatedAt: "2026-03-29T00:00:00.000Z" });
    await appDb.fileHandles.add({ key: "persisted-handle", handle: {} as FileSystemHandle });

    const result = await importData({
      invoiceDocuments: [
        buildTransferInvoiceDocument({
          id: "doc-imported",
          contentHash: "hash-shared",
          fileName: "imported.pdf",
          fileSize: 2,
          invoiceNumber: "INV-OLD",
          buyerName: "本地买方",
        }),
      ],
      invoiceAuditLogs: [],
      tagDefinitions: [],
      tagGroups: [],
      tagGroupLinks: [],
      filterGroups: [],
      filterGroupRules: [],
      savedViews: [],
      settings: [
        { key: "ocr.baiduApiKey", value: "secret-web-key", updatedAt: "2026-03-30T00:00:00.000Z" },
        { key: "ocr.vendor", value: "baidu", updatedAt: "2026-03-30T00:00:00.000Z" },
      ],
    });

    expect(result.importedInvoiceDocuments).toBe(0);
    expect(await appDb.invoiceDocuments.count()).toBe(1);
    expect(await appDb.filterGroups.count()).toBe(0);
    expect(await appDb.filterGroupRules.count()).toBe(0);
    expect(await appDb.savedViews.count()).toBe(0);
    expect(await appDb.settings.count()).toBe(2);
    expect(await appDb.settings.get("ocr.baiduApiKey")).toBeUndefined();
    expect(await appDb.settings.get("ocr.vendor")).toMatchObject({ value: "baidu" });
    expect(await appDb.settings.get("app.theme")).toMatchObject({ value: "dark" });
    expect(await appDb.invoiceDocuments.get("doc-old")).toMatchObject({
      handleRef: "persisted-handle",
      bindingStatus: "readable",
      bindingErrorType: null,
      fileName: "old.pdf",
      buyerName: "本地买方",
    });
    expect(await appDb.invoiceDocuments.get("doc-imported")).toBeUndefined();
    expect(await appDb.fileHandles.count()).toBe(1);
  });

  it("rejects malformed payloads before writing transfer data", async () => {
    await appDb.invoiceDocuments.add({
      ...buildTransferInvoiceDocument({
        id: "doc-existing",
        contentHash: "hash-existing",
        fileName: "existing.pdf",
        fileSize: 1,
        createdAt: "2026-03-28T00:00:00.000Z",
        updatedAt: "2026-03-28T00:00:00.000Z",
      }),
      handleRef: "",
      bindingStatus: "unreadable",
      bindingErrorType: "handle_missing",
    });

    await expect(
      importData({
        invoiceDocuments: [{ ...buildTransferInvoiceDocument({ id: "doc-invalid", contentHash: "hash-invalid", fileName: "invalid.pdf" }), fileSize: "123" as never }],
        invoiceAuditLogs: [],
        tagDefinitions: [],
        tagGroups: [],
        tagGroupLinks: [],
        filterGroups: [],
        filterGroupRules: [],
        savedViews: [],
        settings: [],
      }),
    ).rejects.toThrow();

    expect(await appDb.invoiceDocuments.get("doc-existing")).toMatchObject({
      fileName: "existing.pdf",
    });
  });

  it("ignores removed and unsupported settings from older exports", async () => {
    const result = await importData({
      invoiceDocuments: [buildTransferInvoiceDocument({ id: "doc-legacy-setting", contentHash: "hash-legacy-setting", fileName: "legacy.pdf" })],
      invoiceAuditLogs: [],
      tagDefinitions: [],
      tagGroups: [],
      tagGroupLinks: [],
      filterGroups: [{ id: "filter-group-1", name: "购买方分组", root: { id: "condition-root", kind: "group", mode: "all", children: [] }, createdAt: "2026-03-30T00:00:00.000Z", updatedAt: "2026-03-30T00:00:00.000Z" }],
      filterGroupRules: [{ id: "filter-rule-1", groupId: "filter-group-1", label: "Buyer", field: "buyerName", pattern: "Buyer" }],
      savedViews: [
        {
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
          visibleColumns: ["invoiceNumber"],
          createdAt: "2026-03-30T00:00:00.000Z",
          updatedAt: "2026-03-30T00:00:00.000Z",
        },
      ],
      settings: [
        { key: "ocr.language", value: "zh-CN", updatedAt: "2026-03-30T00:00:00.000Z" } as never,
        {
          key: "ui.workspaceViewDraft.workspace-view-1",
          value: {
            query: { scope: "workspace", searchText: "", filters: [], sorts: [], groupBy: null },
            visibleColumns: ["fileName"],
          },
          updatedAt: "2026-03-30T00:00:00.000Z",
        } as never,
        { key: "ocr.vendor", value: "baidu", updatedAt: "2026-03-30T00:00:00.000Z" },
      ],
    });

    expect(result.importedInvoiceDocuments).toBe(1);
    expect(await appDb.filterGroups.count()).toBe(1);
    expect(await appDb.filterGroupRules.count()).toBe(1);
    expect(await appDb.savedViews.count()).toBe(1);
    expect(await appDb.settings.get("ocr.vendor")).toMatchObject({ value: "baidu" });
    expect(await appDb.settings.count()).toBe(1);
  });

  it("fills in missing remarks from older web exports", async () => {
    const payload = await exportData();
    payload.invoiceDocuments = [
      {
        ...buildTransferInvoiceDocument({
          id: "doc-legacy-remark",
          contentHash: "hash-legacy-remark",
          fileName: "legacy-remark.pdf",
          fileSize: 12,
          parseStatus: "parsed",
          invoiceNumber: "INV-LEGACY",
        }),
        annotation: "历史批注",
      } as typeof payload.invoiceDocuments[number],
    ].map(({ remark: _remark, ...document }) => document as typeof payload.invoiceDocuments[number]);

    await importData(payload);

    expect(await appDb.invoiceDocuments.get("doc-legacy-remark")).toMatchObject({
      remark: "",
      annotation: "历史批注",
    });
  });

  it("rejects conflicting invoice imports before writing any data", async () => {
    await appDb.invoiceDocuments.add({
      ...buildTransferInvoiceDocument({
        id: "doc-existing",
        contentHash: "hash-existing",
        fileName: "existing.pdf",
        invoiceNumber: "INV-001",
        buyerName: "本地买方",
      }),
      handleRef: "handle-existing",
      bindingStatus: "readable",
      bindingErrorType: null,
    });

    await expect(
      importData({
        invoiceDocuments: [
          buildTransferInvoiceDocument({
            id: "doc-conflict",
            contentHash: "hash-existing",
            fileName: "incoming.pdf",
            invoiceNumber: "INV-001",
            buyerName: "导入买方",
          }),
        ],
        invoiceAuditLogs: [],
        tagDefinitions: [],
        tagGroups: [],
        tagGroupLinks: [],
        filterGroups: [],
        filterGroupRules: [],
        savedViews: [],
        settings: [],
      }),
    ).rejects.toMatchObject({
      name: "ImportConflictError",
    });

    expect(await appDb.invoiceDocuments.count()).toBe(1);
    expect(await appDb.invoiceDocuments.get("doc-existing")).toMatchObject({
      buyerName: "本地买方",
      conflictStatus: "none",
      conflictMessage: "",
    });
  });

  it("imports conflicting invoices as flagged records when continuing with conflicts", async () => {
    await appDb.invoiceDocuments.add({
      ...buildTransferInvoiceDocument({
        id: "doc-existing",
        contentHash: "hash-existing",
        fileName: "existing.pdf",
        invoiceNumber: "INV-001",
        buyerName: "本地买方",
      }),
      handleRef: "handle-existing",
      bindingStatus: "readable",
      bindingErrorType: null,
    });

    const result = await importData(
      {
        invoiceDocuments: [
          buildTransferInvoiceDocument({
            id: "doc-hash-conflict",
            contentHash: "hash-existing",
            fileName: "same-hash.pdf",
            invoiceNumber: "INV-001",
            buyerName: "导入买方",
          }),
          buildTransferInvoiceDocument({
            id: "doc-number-conflict",
            contentHash: "hash-other",
            fileName: "same-number.pdf",
            invoiceNumber: "INV-001",
            buyerName: "另一导入买方",
          }),
        ],
        invoiceAuditLogs: [],
        tagDefinitions: [],
        tagGroups: [],
        tagGroupLinks: [],
        filterGroups: [],
        filterGroupRules: [],
        savedViews: [],
        settings: [],
      },
      { conflictMode: "continue_with_conflicts" },
    );

    expect(result.importedInvoiceDocuments).toBe(2);
    expect(result.conflictedInvoiceDocuments).toBe(2);
    expect(await appDb.invoiceDocuments.count()).toBe(3);

    const importedRows = (await appDb.invoiceDocuments.toArray()).filter((row) => row.id !== "doc-existing");
    expect(importedRows).toHaveLength(2);
    expect(importedRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fileName: "same-hash.pdf",
          conflictStatus: "same_hash_diff_invoice_data",
          conflictMessage: expect.stringContaining("existing.pdf"),
        }),
        expect.objectContaining({
          fileName: "same-number.pdf",
          conflictStatus: "same_number_diff_hash",
          conflictMessage: expect.stringContaining("hash-existing"),
        }),
      ]),
    );
  });
});
