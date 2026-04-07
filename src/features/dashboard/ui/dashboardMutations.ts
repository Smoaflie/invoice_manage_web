import { batchParseInvoices } from "../../documents/application/batchParseInvoices";
import { bulkUpdateInvoiceTags } from "../../invoices/application/bulkUpdateInvoiceTags";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

export async function bulkReparseInvoiceDocuments(
  invoiceDocuments: InvoiceDocument[],
  invoiceDocumentIds: string[],
  parseOne: (invoiceDocumentId: string) => Promise<void>,
) {
  return batchParseInvoices(
    invoiceDocuments.filter((row) => invoiceDocumentIds.includes(row.id)),
    parseOne,
  );
}

export async function bulkMutateInvoiceTags(
  invoiceDocumentIds: string[],
  tagsText: string,
  mode: "add" | "remove",
) {
  return bulkUpdateInvoiceTags({
    invoiceDocumentIds,
    tagsText,
    mode,
    now: () => new Date().toISOString(),
  });
}
