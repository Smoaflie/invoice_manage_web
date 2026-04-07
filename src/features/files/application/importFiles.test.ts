import { afterEach, afterAll, describe, expect, it, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { getStoredHandle, persistFileHandle } from "../../../shared/fs/fileHandles";
import { hashFile } from "../../../shared/hash/hashFile";
import { importFiles } from "./importFiles";

describe("importFiles", () => {
  afterEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.fileHandles.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("rebinds an existing invoice document when the hash matches", async () => {
    const file = new File(["same-content"], "demo.pdf", { type: "application/pdf" });
    const contentHash = await hashFile(file);
    await appDb.invoiceDocuments.add({
      id: "doc-1",
      contentHash,
      fileName: "old.pdf",
      fileSize: 11,
      lastModified: 1,
      handleRef: "handle-1",
      bindingStatus: "unreadable",
      bindingErrorType: "handle_unavailable",
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
      updatedAt: "2026-03-30T00:00:00.000Z",
    });

    const persistHandle = vi.fn().mockResolvedValue("handle-2");
    const handle = { kind: "file", name: "demo.pdf" } as FileSystemFileHandle;

    const result = await importFiles([{ file, handle }], {
      persistHandle,
      now: () => "2026-03-30T00:00:00.000Z",
    });

    expect(result.rebound).toHaveLength(1);
    expect(result.created).toHaveLength(0);
    expect(persistHandle).toHaveBeenCalledTimes(1);
    expect(await appDb.invoiceDocuments.count()).toBe(1);

    const storedEntry = await appDb.invoiceDocuments.get("doc-1");
    expect(storedEntry).toMatchObject({
      id: "doc-1",
      handleRef: "handle-2",
    });
  });

  it("rebinds with the real handle persistence path and retires the old handle record", async () => {
    const file = new File(["same-content"], "demo.pdf", { type: "application/pdf" });
    const contentHash = await hashFile(file);
    const oldHandle = { kind: "file", name: "old.pdf" } as FileSystemFileHandle;
    const oldHandleRef = await persistFileHandle(oldHandle);

    await appDb.invoiceDocuments.add({
      id: "doc-1",
      contentHash,
      fileName: "old.pdf",
      fileSize: 11,
      lastModified: 1,
      handleRef: oldHandleRef,
      bindingStatus: "unreadable",
      bindingErrorType: "handle_unavailable",
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
      updatedAt: "2026-03-30T00:00:00.000Z",
    });

    const newHandle = { kind: "file", name: "demo.pdf" } as FileSystemFileHandle;

    const result = await importFiles([{ file, handle: newHandle }], {
      persistHandle: persistFileHandle,
      now: () => "2026-03-30T00:00:00.000Z",
    });

    expect(result.rebound).toHaveLength(1);
    expect(result.created).toHaveLength(0);

    const storedEntry = await appDb.invoiceDocuments.get("doc-1");
    expect(storedEntry).toBeTruthy();
    expect(storedEntry?.handleRef).not.toBe(oldHandleRef);

    expect(await getStoredHandle(oldHandleRef)).toBeUndefined();

    const rebindingHandleRef = storedEntry?.handleRef ?? "";
    expect(await getStoredHandle(rebindingHandleRef)).toMatchObject({
      kind: "file",
      name: "demo.pdf",
    });
    expect(await appDb.fileHandles.count()).toBe(1);
  });

  it("creates a new invoice document with empty custom fields", async () => {
    const file = new File(["new-content"], "new.pdf", { type: "application/pdf" });

    const result = await importFiles([{ file, handle: null }], {
      persistHandle: vi.fn(),
      now: () => "2026-03-30T00:00:00.000Z",
    });

    expect(result.created).toHaveLength(1);
    expect(result.created[0]).toMatchObject({
      fileName: "new.pdf",
    });

    const storedEntry = await appDb.invoiceDocuments.get(result.created[0].id);
    expect(storedEntry).toMatchObject({
      bindingStatus: "unreadable",
    });
  });
});
