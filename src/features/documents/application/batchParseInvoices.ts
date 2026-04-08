import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

export interface BatchParseResult {
  parsedIds: string[];
  skippedIds: string[];
  failedIds: string[];
}

export interface BatchParseProgress {
  totalCount: number;
  completedCount: number;
  parsedCount: number;
  failedCount: number;
  skippedCount: number;
  currentInvoiceDocumentId: string;
}

export async function batchParseInvoices(
  rows: InvoiceDocument[],
  parseOne: (invoiceDocumentId: string) => Promise<void>,
  onProgress?: (progress: BatchParseProgress) => void,
): Promise<BatchParseResult> {
  const parsedIds: string[] = [];
  const skippedIds: string[] = [];
  const failedIds: string[] = [];
  const totalCount = rows.length;

  const emitProgress = (currentInvoiceDocumentId: string) => {
    onProgress?.({
      totalCount,
      completedCount: parsedIds.length + failedIds.length + skippedIds.length,
      parsedCount: parsedIds.length,
      failedCount: failedIds.length,
      skippedCount: skippedIds.length,
      currentInvoiceDocumentId,
    });
  };

  for (const row of rows) {
    if (row.bindingStatus !== "readable" || !row.handleRef) {
      skippedIds.push(row.id);
      emitProgress(row.id);
      continue;
    }

    try {
      await parseOne(row.id);
      parsedIds.push(row.id);
    } catch {
      failedIds.push(row.id);
    }

    emitProgress(row.id);
  }

  return { parsedIds, skippedIds, failedIds };
}
