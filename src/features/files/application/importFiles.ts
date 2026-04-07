import { appDb } from "../../../shared/db/appDb";
import { hashFile } from "../../../shared/hash/hashFile";
import { persistFileHandle } from "../../../shared/fs/fileHandles";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

export type PickedFile = {
  file: File;
  handle: FileSystemFileHandle | null;
};

type ImportOptions = {
  persistHandle: typeof persistFileHandle;
  now: () => string;
};

type ImportResult = {
  created: InvoiceDocument[];
  rebound: InvoiceDocument[];
};

function buildEntry(file: File, contentHash: string, handleRef: string, now: string): InvoiceDocument {
  return {
    id: globalThis.crypto.randomUUID(),
    contentHash,
    fileName: file.name,
    fileSize: file.size,
    lastModified: file.lastModified,
    handleRef,
    bindingStatus: handleRef ? "readable" : "unreadable",
    bindingErrorType: handleRef ? null : "handle_unavailable",
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
    createdAt: now,
    updatedAt: now,
  };
}

async function persistHandleRef(handle: FileSystemFileHandle | null, persistHandle: ImportOptions["persistHandle"]) {
  if (!handle) {
    return "";
  }

  return persistHandle(handle);
}

export async function importFiles(pickedFiles: PickedFile[], options: ImportOptions): Promise<ImportResult> {
  const created: InvoiceDocument[] = [];
  const rebound: InvoiceDocument[] = [];

  for (const picked of pickedFiles) {
    const contentHash = await hashFile(picked.file);
    await appDb.transaction("rw", appDb.invoiceDocuments, appDb.fileHandles, async () => {
      const existing = await appDb.invoiceDocuments.where("contentHash").equals(contentHash).first();
      const handleRef = await persistHandleRef(picked.handle, options.persistHandle);
      const timestamp = options.now();

      if (existing) {
        const updatedHandleRef = handleRef || existing.handleRef;
        const updatedEntry: InvoiceDocument = {
          ...existing,
          contentHash,
          fileName: picked.file.name,
          fileSize: picked.file.size,
          lastModified: picked.file.lastModified,
          handleRef: updatedHandleRef,
          bindingStatus: handleRef ? "readable" : existing.bindingStatus,
          bindingErrorType: handleRef ? null : existing.bindingErrorType,
          updatedAt: timestamp,
        };

        await appDb.invoiceDocuments.put(updatedEntry);

        if (handleRef && existing.handleRef && existing.handleRef !== handleRef) {
          await appDb.fileHandles.delete(existing.handleRef);
        }

        rebound.push(updatedEntry);
        return;
      }

      const entry = buildEntry(picked.file, contentHash, handleRef, timestamp);
      await appDb.invoiceDocuments.add(entry);
      created.push(entry);
    });
  }

  return { created, rebound };
}
