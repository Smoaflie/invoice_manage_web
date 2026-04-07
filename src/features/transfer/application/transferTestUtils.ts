import { appDb } from "../../../shared/db/appDb";
import type { TransferInvoiceDocument } from "./exportData";

export async function clearTransferTables() {
  await appDb.invoiceDocuments.clear();
  await appDb.invoiceAuditLogs.clear();
  await appDb.tagDefinitions.clear();
  await appDb.tagGroups.clear();
  await appDb.tagGroupLinks.clear();
  await appDb.filterGroupRules.clear();
  await appDb.filterGroups.clear();
  await appDb.savedViews.clear();
  await appDb.settings.clear();
  await appDb.fileHandles.clear();
}

export function buildTransferInvoiceDocument(overrides: Partial<TransferInvoiceDocument> = {}): TransferInvoiceDocument {
  return {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "demo.pdf",
    fileSize: 123,
    lastModified: 1,
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
    remark: "",
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
