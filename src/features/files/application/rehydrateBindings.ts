import { appDb } from "../../../shared/db/appDb";
import { hashFile } from "../../../shared/hash/hashFile";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

type RehydrateBindingsOptions = {
  loadHandle: (handleRef: string) => Promise<FileSystemFileHandle | null | undefined>;
  now: () => string;
};

type RehydrateBindingsResult = {
  readable: number;
  unreadable: number;
  needsReparse: number;
};

function getBindingErrorType(error: unknown): InvoiceDocument["bindingErrorType"] {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "permission_denied";
    }

    if (error.name === "NotFoundError") {
      return "file_not_found";
    }
  }

  return "handle_unavailable";
}

async function updateEntry(entry: InvoiceDocument, patch: Partial<InvoiceDocument>) {
  await appDb.transaction("rw", appDb.invoiceDocuments, async () => {
    await appDb.invoiceDocuments.update(entry.id, patch);
  });
}

export async function rehydrateBindings(options: RehydrateBindingsOptions): Promise<RehydrateBindingsResult> {
  const entries = await appDb.invoiceDocuments.toArray();
  let readable = 0;
  let unreadable = 0;
  let needsReparse = 0;

  for (const entry of entries) {
    if (!entry.handleRef) {
      await updateEntry(entry, {
        bindingStatus: "unreadable",
        bindingErrorType: "handle_missing",
        updatedAt: options.now(),
      });
      unreadable += 1;
      continue;
    }

    const handle = await options.loadHandle(entry.handleRef);

    if (!handle) {
      await updateEntry(entry, {
        bindingStatus: "unreadable",
        bindingErrorType: "handle_unavailable",
        updatedAt: options.now(),
      });
      unreadable += 1;
      continue;
    }

    try {
      const file = await handle.getFile();
      const contentHash = await hashFile(file);

      if (contentHash !== entry.contentHash) {
        await updateEntry(entry, {
          bindingStatus: "needs_reparse",
          bindingErrorType: "hash_mismatch",
          contentHash,
          updatedAt: options.now(),
        });
        needsReparse += 1;
        continue;
      }

      await updateEntry(entry, {
        fileName: file.name,
        fileSize: file.size,
        lastModified: file.lastModified,
        bindingStatus: "readable",
        bindingErrorType: null,
        updatedAt: options.now(),
      });
      readable += 1;
    } catch (error) {
      await updateEntry(entry, {
        bindingStatus: "unreadable",
        bindingErrorType: getBindingErrorType(error),
        updatedAt: options.now(),
      });
      unreadable += 1;
    }
  }

  return { readable, unreadable, needsReparse };
}
