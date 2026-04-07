import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { SubmissionDraft, SubmissionPrecheckItem, SubmissionPrecheckResult, SubmissionReceipt } from "../types/collaboration";

type BuildSubmissionPrecheckInput = {
  draft: SubmissionDraft;
  existingDocuments: InvoiceDocument[];
  requireSourceFiles: boolean;
};

type BuildSubmissionReceiptInput = {
  draft: SubmissionDraft;
  accepted: boolean;
  receiverName: string;
  assignedTagsText: string;
  assignedBeneficiary: string;
  receivedBy: string;
  duplicateInvoiceNumbers: string[];
  conflictItems: Array<{ invoiceId: string; invoiceNumber: string; reason: string }>;
  now: () => string;
};

type ApplyAcceptedReceiptInput = {
  documents: InvoiceDocument[];
  draft: SubmissionDraft;
  receipt: SubmissionReceipt;
  now: () => string;
};

function parseTags(text: string) {
  return [...new Set(text.split(/[\s,，]+/u).map((tag) => tag.trim()).filter(Boolean))];
}

function buildBlockedItem(item: SubmissionDraft["items"][number], existingDocuments: InvoiceDocument[], requireSourceFiles: boolean): SubmissionPrecheckItem | null {
  const duplicate = existingDocuments.find((document) => document.invoiceNumber === item.invoiceNumber);
  if (duplicate) {
    return {
      invoiceId: item.invoiceId,
      invoiceNumber: item.invoiceNumber,
      blockedReason: duplicate.contentHash === item.contentHash ? "duplicate_number" : "same_number_diff_hash",
      reviewRequired: false,
    };
  }

  if (requireSourceFiles && !item.fileIncluded) {
    return {
      invoiceId: item.invoiceId,
      invoiceNumber: item.invoiceNumber,
      blockedReason: "missing_source_file",
      reviewRequired: false,
    };
  }

  if (!item.invoiceNumber.trim()) {
    return {
      invoiceId: item.invoiceId,
      invoiceNumber: item.invoiceNumber,
      blockedReason: "missing_required_field",
      reviewRequired: false,
    };
  }

  return null;
}

function buildReviewItem(item: SubmissionDraft["items"][number]): SubmissionPrecheckItem | null {
  const reviewRequired = item.edited || item.sourceType === "manual" || item.parseStatus === "parse_failed";
  if (!reviewRequired) {
    return null;
  }

  return {
    invoiceId: item.invoiceId,
    invoiceNumber: item.invoiceNumber,
    blockedReason: null,
    reviewRequired: true,
  };
}

export function buildSubmissionPrecheck(input: BuildSubmissionPrecheckInput): SubmissionPrecheckResult {
  const blockedItems = input.draft.items
    .map((item) => buildBlockedItem(item, input.existingDocuments, input.requireSourceFiles))
    .filter(Boolean) as SubmissionPrecheckItem[];
  const blockedIds = new Set(blockedItems.map((item) => item.invoiceId));
  const reviewRequiredItems = input.draft.items
    .filter((item) => !blockedIds.has(item.invoiceId))
    .map(buildReviewItem)
    .filter(Boolean) as SubmissionPrecheckItem[];
  const duplicateInvoiceNumbers = [...new Set(blockedItems.map((item) => item.invoiceNumber).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "zh-CN"),
  );

  return {
    acceptable: blockedItems.length === 0 && reviewRequiredItems.length === 0,
    duplicateInvoiceNumbers,
    blockedItems,
    reviewRequiredItems,
  };
}

export function buildSubmissionReceipt(input: BuildSubmissionReceiptInput): SubmissionReceipt {
  return {
    submissionId: input.draft.submissionId,
    receivedAt: input.now(),
    receiverName: input.receiverName.trim(),
    accepted: input.accepted,
    acceptedInvoiceIds: input.accepted ? [...input.draft.invoiceIds] : [],
    rejectedInvoiceIds: input.accepted ? [] : [...input.draft.invoiceIds],
    duplicateInvoiceNumbers: [...input.duplicateInvoiceNumbers],
    conflictItems: [...input.conflictItems],
    assignedTags: parseTags(input.assignedTagsText),
    assignedBeneficiary: input.assignedBeneficiary.trim(),
    receivedBy: input.receivedBy.trim(),
    message: input.accepted ? "整批成功接收并入库。" : "整批打回。请处理重复或待确认项后重试。",
  };
}

export function applyAcceptedReceiptToLocalInvoices(input: ApplyAcceptedReceiptInput): InvoiceDocument[] {
  if (!input.receipt.accepted) {
    return [];
  }

  const updatedAt = input.now();
  const draftIds = new Set(input.draft.invoiceIds);

  return input.documents.flatMap((document) => {
    if (!draftIds.has(document.id)) {
      return [];
    }

    const nextTags = input.draft.successAckLocalTagEnabled
      ? [...new Set([...document.tags, input.draft.successAckLocalTag])]
      : document.tags;

    return [
      {
        ...document,
        tags: nextTags,
        collaborationStatus: "submitted",
        lastSubmissionId: input.draft.submissionId,
        updatedAt,
      },
    ];
  });
}

export function buildImportedFinanceDocuments(input: { draft: SubmissionDraft; receipt: SubmissionReceipt }): InvoiceDocument[] {
  if (!input.receipt.accepted) {
    return [];
  }

  const beneficiary = input.receipt.assignedBeneficiary || input.draft.beneficiaryName;

  return input.draft.items.map((item) => ({
    id: globalThis.crypto.randomUUID(),
    contentHash: item.contentHash,
    fileName: item.fileName,
    fileSize: 0,
    lastModified: Date.parse(input.receipt.receivedAt),
    handleRef: "",
    bindingStatus: "unreadable",
    bindingErrorType: "handle_missing",
    ocrVendor: null,
    ocrParsedAt: null,
    parseStatus: item.parseStatus,
    conflictStatus: item.conflictStatus === "same_number_diff_hash" ? "same_number_diff_hash" : "none",
    conflictMessage: "",
    invoiceNumber: item.invoiceNumber,
    invoiceCode: item.invoiceCode,
    invoiceDate: item.invoiceDate,
    totalAmount: item.totalAmount,
    taxAmount: item.taxAmount,
    amountWithoutTax: item.amountWithoutTax,
    buyerName: item.buyerName,
    sellerName: item.sellerName,
    items: [],
    tags: [...input.receipt.assignedTags],
    remark: "",
    annotation: item.annotation,
    uploader: input.draft.senderName,
    owner: beneficiary,
    collaborationStatus: "imported",
    reviewStatus: item.edited || item.sourceType === "manual" || item.parseStatus === "parse_failed" ? "pending_review" : "not_required",
    submittedBy: input.draft.senderName,
    receivedBy: input.receipt.receivedBy,
    beneficiary,
    lastSubmissionId: input.draft.submissionId,
    sourceType: item.sourceType,
    edited: item.edited,
    createdAt: input.receipt.receivedAt,
    updatedAt: input.receipt.receivedAt,
  }));
}
