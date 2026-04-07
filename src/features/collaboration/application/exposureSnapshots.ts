import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { ExposureMatchResult, ExposureSnapshot } from "../types/collaboration";

type BuildExposureSnapshotInput = {
  createdBy: string;
  filterGroupId: string;
  filterGroupName: string;
  labelSummary: string;
  documents: InvoiceDocument[];
  now: () => string;
};

function uniqueSortedInvoiceNumbers(documents: InvoiceDocument[]) {
  return [...new Set(documents.map((document) => document.invoiceNumber.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "zh-CN"),
  );
}

export function buildExposureSnapshot(input: BuildExposureSnapshotInput): ExposureSnapshot {
  const invoiceNumbers = uniqueSortedInvoiceNumbers(input.documents);

  return {
    snapshotId: globalThis.crypto.randomUUID(),
    createdAt: input.now(),
    createdBy: input.createdBy,
    filterGroupId: input.filterGroupId,
    filterGroupName: input.filterGroupName,
    labelSummary: input.labelSummary,
    invoiceNumbers,
    invoiceCount: invoiceNumbers.length,
    digest: invoiceNumbers.join("|"),
  };
}

export function matchExposureSnapshot(snapshot: ExposureSnapshot, documents: InvoiceDocument[]): ExposureMatchResult {
  const numberSet = new Set(snapshot.invoiceNumbers);
  const matchedDocuments = documents.filter((document) => numberSet.has(document.invoiceNumber));
  const unmatchedDocuments = documents.filter((document) => !numberSet.has(document.invoiceNumber));

  return {
    snapshotId: snapshot.snapshotId,
    matchedInvoiceIds: matchedDocuments.map((document) => document.id),
    matchedInvoiceNumbers: [...new Set(matchedDocuments.map((document) => document.invoiceNumber))].sort((left, right) =>
      left.localeCompare(right, "zh-CN"),
    ),
    unmatchedInvoiceIds: unmatchedDocuments.map((document) => document.id),
    appliedTag: "",
    matchedAt: new Date().toISOString(),
  };
}
