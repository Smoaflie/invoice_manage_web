import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { rehydrateBindings } from "./rehydrateBindings";

function makeEntry(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
  return {
    id: "doc-1",
    contentHash: "hash-1",
      fileName: "demo.pdf",
      fileSize: 123,
      lastModified: 1,
      handleRef: "missing-handle",
    bindingStatus: "readable" as const,
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
    updatedAt: "2026-03-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("rehydrateBindings", () => {
  afterEach(async () => {
    await appDb.invoiceDocuments.clear();
    await appDb.fileHandles.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("marks a file unreadable when the stored handle cannot be opened", async () => {
    await appDb.invoiceDocuments.add(makeEntry());

    const loadHandle = vi.fn().mockResolvedValue(null);

    const result = await rehydrateBindings({
      loadHandle,
      now: () => "2026-03-30T00:00:00.000Z",
    });

    expect(result.unreadable).toBeGreaterThanOrEqual(1);
    expect(result.needsReparse).toBe(0);
  });

  it("preserves unrelated row updates when marking a handle unavailable", async () => {
    await appDb.invoiceDocuments.add(
      makeEntry({
        handleRef: "handle-1",
        ocrVendor: "old-vendor",
      }),
    );

    let resolveLoadHandle: (value: FileSystemFileHandle | null | undefined) => void = () => undefined;
    const loadHandle = vi.fn(
      () =>
        new Promise<FileSystemFileHandle | null | undefined>((resolve) => {
          resolveLoadHandle = resolve;
        }),
    );

    const rehydratePromise = rehydrateBindings({
      loadHandle,
      now: () => "2026-03-30T00:00:00.000Z",
    });

    await appDb.invoiceDocuments.update("doc-1", {
      ocrVendor: "new-vendor",
      updatedAt: "2026-03-30T00:00:01.000Z",
    });

    resolveLoadHandle(null);
    await rehydratePromise;

    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      bindingStatus: "unreadable",
      bindingErrorType: "handle_unavailable",
      ocrVendor: "new-vendor",
    });
  });

  it("marks a file for reparse when the current hash does not match the stored hash", async () => {
    await appDb.invoiceDocuments.add(
      makeEntry({
        contentHash: "different-hash",
        handleRef: "handle-1",
      }),
    );

    const file = new File(["abc"], "demo.pdf", { type: "application/pdf" });
    const loadHandle = vi.fn().mockResolvedValue({
      getFile: vi.fn().mockResolvedValue(file),
    } as unknown as FileSystemFileHandle);

    const result = await rehydrateBindings({
      loadHandle,
      now: () => "2026-03-30T00:00:00.000Z",
    });

    expect(result.needsReparse).toBe(1);
    expect(result.unreadable).toBe(0);
    expect(result.readable).toBe(0);

    expect(await appDb.invoiceDocuments.get("doc-1")).toMatchObject({
      bindingStatus: "needs_reparse",
      bindingErrorType: "hash_mismatch",
    });
  });
});
