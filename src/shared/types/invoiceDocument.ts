import type { CollaborationStatus, ReviewStatus } from "./collaboration";

export type BindingStatus = "readable" | "unreadable" | "needs_reparse";

export type BindingErrorType =
  | "handle_missing"
  | "permission_denied"
  | "file_not_found"
  | "handle_unavailable"
  | "hash_mismatch"
  | null;

export type ParseStatus = "idle" | "parsed" | "parse_failed" | "needs_reparse";

export type ConflictStatus = "none" | "same_number_diff_hash" | "same_hash_diff_invoice_data";

export interface InvoiceDocumentItem {
  [key: string]: unknown;
}

export interface InvoiceDocument {
  id: string;
  contentHash: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  relativePath?: string;
  proofFiles?: string[];
  handleRef: string;
  bindingStatus: BindingStatus;
  bindingErrorType: BindingErrorType;
  ocrVendor: string | null;
  ocrParsedAt: string | null;
  parseStatus: ParseStatus;
  conflictStatus: ConflictStatus;
  conflictMessage: string;
  invoiceNumber: string;
  invoiceCode: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  amountWithoutTax: number;
  buyerName: string;
  sellerName: string;
  items: InvoiceDocumentItem[];
  tags: string[];
  remark?: string;
  annotation: string;
  uploader: string;
  owner: string;
  collaborationStatus?: CollaborationStatus;
  reviewStatus?: ReviewStatus;
  submittedBy?: string;
  receivedBy?: string;
  beneficiary?: string;
  lastSubmissionId?: string | null;
  sourceType: "ocr" | "manual";
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}
