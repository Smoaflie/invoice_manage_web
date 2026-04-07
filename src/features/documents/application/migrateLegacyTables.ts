import type { FileEntry } from "../../../shared/types/fileEntry";
import type { InvoiceRecord } from "../../../shared/types/invoiceRecord";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

export interface LegacyTableSnapshot {
  fileEntries: FileEntry[];
  invoiceRecords: InvoiceRecord[];
}

export interface LegacyMigrationResult {
  invoiceDocuments: InvoiceDocument[];
}

function buildBaseDocument(fileEntry: FileEntry): InvoiceDocument {
  return {
    id: fileEntry.id,
    contentHash: fileEntry.contentHash,
    fileName: fileEntry.fileName,
    fileSize: fileEntry.fileSize,
    lastModified: fileEntry.lastModified,
    handleRef: fileEntry.handleRef,
    bindingStatus: fileEntry.bindingStatus,
    bindingErrorType: fileEntry.bindingErrorType,
    ocrVendor: fileEntry.ocrVendor,
    ocrParsedAt: fileEntry.ocrParsedAt,
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
    remark: "",
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: fileEntry.createdAt,
    updatedAt: fileEntry.updatedAt,
  };
}

function mergeInvoiceRecord(document: InvoiceDocument, invoiceRecord: InvoiceRecord): InvoiceDocument {
  return {
    ...document,
    parseStatus: invoiceRecord.parseStatus,
    conflictStatus: invoiceRecord.conflictStatus,
    conflictMessage: invoiceRecord.conflictMessage,
    invoiceNumber: invoiceRecord.invoiceNumber,
    invoiceCode: invoiceRecord.invoiceCode,
    invoiceDate: invoiceRecord.invoiceDate,
    totalAmount: invoiceRecord.totalAmount,
    taxAmount: invoiceRecord.taxAmount,
    amountWithoutTax: invoiceRecord.amountWithoutTax,
    buyerName: invoiceRecord.buyerName,
    sellerName: invoiceRecord.sellerName,
    items: invoiceRecord.items,
    tags: invoiceRecord.tags,
    remark: invoiceRecord.remark ?? "",
    uploader: invoiceRecord.uploader,
    owner: invoiceRecord.owner,
    updatedAt: invoiceRecord.updatedAt,
  };
}

export async function migrateLegacyTables(snapshot: LegacyTableSnapshot): Promise<LegacyMigrationResult> {
  const invoiceByFileEntryId = new Map(snapshot.invoiceRecords.map((record) => [record.fileEntryId, record]));
  const invoiceDocuments = snapshot.fileEntries.map((fileEntry) => {
    const baseDocument = buildBaseDocument(fileEntry);
    const invoiceRecord = invoiceByFileEntryId.get(fileEntry.id);
    return invoiceRecord ? mergeInvoiceRecord(baseDocument, invoiceRecord) : baseDocument;
  });

  return { invoiceDocuments };
}
