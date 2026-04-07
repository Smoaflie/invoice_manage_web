import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { SubmissionDraft } from "../types/collaboration";

type BuildSubmissionDraftInput = {
  senderName: string;
  beneficiaryName: string;
  sourceSnapshotId: string;
  filterGroupId: string;
  documents: InvoiceDocument[];
  includeSourceFiles: boolean;
  submissionTagsText: string;
  note: string;
  successAckLocalTag: string;
  successAckLocalTagEnabled: boolean;
  now: () => string;
};

function parseTags(text: string) {
  return [...new Set(text.split(/[\s,，]+/u).map((tag) => tag.trim()).filter(Boolean))];
}

export function buildSubmissionDraft(input: BuildSubmissionDraftInput): SubmissionDraft {
  const submissionTags = parseTags(input.submissionTagsText);
  const successAckLocalTag = input.successAckLocalTag.trim() || "已发送财务";
  const documents = [...input.documents].sort((left, right) => left.invoiceNumber.localeCompare(right.invoiceNumber, "zh-CN"));

  return {
    submissionId: globalThis.crypto.randomUUID(),
    createdAt: input.now(),
    senderName: input.senderName.trim(),
    beneficiaryName: input.beneficiaryName.trim(),
    sourceSnapshotId: input.sourceSnapshotId,
    filterGroupId: input.filterGroupId,
    invoiceIds: documents.map((document) => document.id),
    invoiceNumbers: documents.map((document) => document.invoiceNumber),
    includeSourceFiles: input.includeSourceFiles,
    submissionTags,
    note: input.note.trim(),
    successAckLocalTag,
    successAckLocalTagEnabled: input.successAckLocalTagEnabled,
    items: documents.map((document) => ({
      invoiceId: document.id,
      invoiceNumber: document.invoiceNumber,
      invoiceCode: document.invoiceCode,
      invoiceDate: document.invoiceDate,
      totalAmount: document.totalAmount,
      taxAmount: document.taxAmount,
      amountWithoutTax: document.amountWithoutTax,
      buyerName: document.buyerName,
      sellerName: document.sellerName,
      fileName: document.fileName,
      contentHash: document.contentHash,
      tags: [...document.tags],
      sourceType: document.sourceType,
      edited: document.edited,
      parseStatus: document.parseStatus,
      conflictStatus: document.conflictStatus,
      fileIncluded: input.includeSourceFiles,
      annotation: document.annotation,
    })),
  };
}
