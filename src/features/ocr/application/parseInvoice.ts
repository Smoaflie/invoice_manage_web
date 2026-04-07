import { appDb } from "../../../shared/db/appDb";
import { hashFile } from "../../../shared/hash/hashFile";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
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
  };

  await appDb.transaction("rw", appDb.invoiceDocuments, async () => {
    await appDb.invoiceDocuments.put(nextInvoiceDocument);
  });
  await detectConflicts(parsedInvoice.invoiceNumber, invoiceDocument.invoiceNumber);

  return parsedInvoice;
}
