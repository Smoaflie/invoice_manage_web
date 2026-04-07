import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

export function isActionableInvoice(row: InvoiceDocument) {
  return row.parseStatus !== "parsed" || row.conflictStatus !== "none";
}

export function isReadableDocument(row: InvoiceDocument) {
  return row.bindingStatus === "readable";
}

export function hasInvoiceData(row: InvoiceDocument) {
  return Boolean(
    row.invoiceNumber ||
      row.invoiceCode ||
      row.invoiceDate ||
      row.buyerName ||
      row.sellerName ||
      row.totalAmount ||
      row.taxAmount ||
      row.amountWithoutTax ||
      row.items.length > 0 ||
      row.tags.length > 0 ||
      row.remark ||
      row.annotation,
  );
}
