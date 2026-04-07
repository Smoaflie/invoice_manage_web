import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

export interface BatchParseResult {
  parsedIds: string[];
  skippedIds: string[];
  failedIds: string[];
}

export async function batchParseInvoices(
  rows: InvoiceDocument[],
  parseOne: (invoiceDocumentId: string) => Promise<void>,
): Promise<BatchParseResult> {
  const parsedIds: string[] = [];
  const skippedIds: string[] = [];
  const failedIds: string[] = [];

  for (const row of rows) {
    if (row.bindingStatus !== "readable" || !row.handleRef) {
      skippedIds.push(row.id);
      continue;
    }

    try {
      await parseOne(row.id);
      parsedIds.push(row.id);
    } catch {
      failedIds.push(row.id);
    }
  }

  return { parsedIds, skippedIds, failedIds };
}
