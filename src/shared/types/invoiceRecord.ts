export type ParseStatus = "idle" | "parsed" | "parse_failed" | "needs_reparse";

export type ConflictStatus = "none" | "same_number_diff_hash";

export interface InvoiceItem {
  [key: string]: unknown;
}

export interface InvoiceRecord {
  id: string;
  fileEntryId: string;
  invoiceNumber: string;
  invoiceCode: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  amountWithoutTax: number;
  buyerName: string;
  sellerName: string;
  items: InvoiceItem[];
  tags: string[];
  remark?: string;
  uploader: string;
  owner: string;
  parseStatus: ParseStatus;
  conflictStatus: ConflictStatus;
  conflictMessage: string;
  createdAt: string;
  updatedAt: string;
}
