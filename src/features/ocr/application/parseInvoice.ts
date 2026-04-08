import { appDb } from "../../../shared/db/appDb";
import type { InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";
import { hashFile } from "../../../shared/hash/hashFile";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { buildAuditEntries } from "../../documents/application/saveInvoiceEdits";
import { detectConflicts } from "../../invoices/application/detectConflicts";
import { normalizeInvoice, type OcrInvoiceResponse } from "../infrastructure/normalizeInvoice";

export interface ParseInvoiceOptions {
  vendor: string;
  loadFile: (fileEntryId: string) => Promise<File>;
  requestOcr: (file: File) => Promise<OcrInvoiceResponse>;
  now: () => string;
}

export async function parseInvoice(invoiceDocumentId: string, options: ParseInvoiceOptions) {
  const file = await options.loadFile(invoiceDocumentId);
  const parsedInvoice = normalizeInvoice(await options.requestOcr(file));
  const timestamp = options.now();
  const invoiceDocument = await appDb.invoiceDocuments.get(invoiceDocumentId);

  if (!invoiceDocument) {
    throw new Error(`File entry not found: ${invoiceDocumentId}`);
  }

  const contentHash = await hashFile(file);
  const nextInvoiceDocument: InvoiceDocument = {
    ...invoiceDocument,
    invoiceNumber: parsedInvoice.invoiceNumber,
    invoiceCode: parsedInvoice.invoiceCode,
    invoiceDate: parsedInvoice.invoiceDate,
    totalAmount: parsedInvoice.totalAmount,
    taxAmount: parsedInvoice.taxAmount,
    amountWithoutTax: parsedInvoice.amountWithoutTax,
    buyerName: parsedInvoice.buyerName,
    sellerName: parsedInvoice.sellerName,
    items: parsedInvoice.items,
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    updatedAt: timestamp,
    contentHash,
    fileName: file.name,
    fileSize: file.size,
    lastModified: file.lastModified,
    ocrVendor: options.vendor,
    ocrParsedAt: timestamp,
    bindingStatus: "readable",
    bindingErrorType: null,
    edited: false,
  };

  const auditEntries: InvoiceAuditLog[] = [
    {
      id: globalThis.crypto.randomUUID(),
      invoiceDocumentId,
      changedAt: timestamp,
      changeType: "ocr_parse",
      targetField: "ocr识别",
      beforeValue: [invoiceDocument.ocrVendor, invoiceDocument.ocrParsedAt].filter(Boolean).join(" "),
      afterValue: [options.vendor, timestamp].filter(Boolean).join(" "),
    },
    ...buildAuditEntries({
      invoiceDocumentId,
      before: invoiceDocument,
      after: nextInvoiceDocument,
      changeType: "ocr_parse",
      changedAt: timestamp,
    }),
  ];

  await appDb.transaction("rw", appDb.invoiceDocuments, appDb.invoiceAuditLogs, async () => {
    await appDb.invoiceDocuments.put(nextInvoiceDocument);
    await appDb.invoiceAuditLogs.bulkAdd(auditEntries);
  });
  await detectConflicts(parsedInvoice.invoiceNumber, invoiceDocument.invoiceNumber);

  return parsedInvoice;
}
