import type { CollaborationStatus, ReviewStatus } from "../../../shared/types/collaboration";
import type { ConflictStatus, ParseStatus } from "../../../shared/types/invoiceDocument";

export interface ExposureSnapshot {
  snapshotId: string;
  createdAt: string;
  createdBy: string;
  filterGroupId: string;
  filterGroupName: string;
  labelSummary: string;
  invoiceNumbers: string[];
  invoiceCount: number;
  digest: string;
}

export interface ExposureMatchResult {
  snapshotId: string;
  matchedInvoiceIds: string[];
  matchedInvoiceNumbers: string[];
  unmatchedInvoiceIds: string[];
  appliedTag: string;
  matchedAt: string;
}

export interface SubmissionDraftItem {
  invoiceId: string;
  invoiceNumber: string;
  invoiceCode: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  amountWithoutTax: number;
  buyerName: string;
  sellerName: string;
  fileName: string;
  contentHash: string;
  tags: string[];
  sourceType: "ocr" | "manual";
  edited: boolean;
  parseStatus: ParseStatus;
  conflictStatus: ConflictStatus;
  fileIncluded: boolean;
  annotation: string;
}

export interface SubmissionDraft {
  submissionId: string;
  createdAt: string;
  senderName: string;
  beneficiaryName: string;
  sourceSnapshotId: string;
  filterGroupId: string;
  invoiceIds: string[];
  invoiceNumbers: string[];
  includeSourceFiles: boolean;
  submissionTags: string[];
  note: string;
  successAckLocalTag: string;
  successAckLocalTagEnabled: boolean;
  items: SubmissionDraftItem[];
}

export interface SubmissionPrecheckItem {
  invoiceId: string;
  invoiceNumber: string;
  blockedReason: "duplicate_number" | "same_number_diff_hash" | "missing_source_file" | "missing_required_field" | null;
  reviewRequired: boolean;
}

export interface SubmissionPrecheckResult {
  acceptable: boolean;
  duplicateInvoiceNumbers: string[];
  blockedItems: SubmissionPrecheckItem[];
  reviewRequiredItems: SubmissionPrecheckItem[];
}

export interface SubmissionReceipt {
  submissionId: string;
  receivedAt: string;
  receiverName: string;
  accepted: boolean;
  acceptedInvoiceIds: string[];
  rejectedInvoiceIds: string[];
  duplicateInvoiceNumbers: string[];
  conflictItems: Array<{ invoiceId: string; invoiceNumber: string; reason: string }>;
  assignedTags: string[];
  assignedBeneficiary: string;
  receivedBy: string;
  message: string;
}

export interface CollaborationInvoicePatch {
  id: string;
  tags?: string[];
  collaborationStatus?: CollaborationStatus;
  reviewStatus?: ReviewStatus;
  submittedBy?: string;
  receivedBy?: string;
  beneficiary?: string;
  lastSubmissionId?: string | null;
  updatedAt: string;
}
