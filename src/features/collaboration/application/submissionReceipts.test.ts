import { describe, expect, test } from "vitest";
import { applyAcceptedReceiptToLocalInvoices, buildSubmissionPrecheck, buildSubmissionReceipt } from "./submissionReceipts";
import { buildSubmissionDraft } from "./submissionDrafts";
import { makeInvoiceDocument } from "./testUtils";

function makeDraft() {
  return buildSubmissionDraft({
    senderName: "Alice",
    beneficiaryName: "Alice",
    sourceSnapshotId: "snapshot-1",
    filterGroupId: "group-1",
    documents: [
      makeInvoiceDocument({ id: "doc-1", invoiceNumber: "INV-001" }),
      makeInvoiceDocument({ id: "doc-2", invoiceNumber: "INV-002", edited: true }),
    ],
    includeSourceFiles: true,
    submissionTagsText: "待报销",
    note: "",
    successAckLocalTag: "",
    successAckLocalTagEnabled: true,
    now: () => "2026-04-01T10:00:00.000Z",
  });
}

describe("submissionReceipts", () => {
  test("blocks duplicates already present in the finance library", () => {
    const draft = makeDraft();
    const precheck = buildSubmissionPrecheck({
      draft,
      existingDocuments: [makeInvoiceDocument({ id: "existing-1", invoiceNumber: "INV-001", contentHash: "hash-9" })],
      requireSourceFiles: false,
    });

    expect(precheck.acceptable).toBe(false);
    expect(precheck.duplicateInvoiceNumbers).toEqual(["INV-001"]);
    expect(precheck.blockedItems).toEqual([
      expect.objectContaining({
        invoiceId: "doc-1",
        blockedReason: "same_number_diff_hash",
      }),
    ]);
  });

  test("marks edited or manual invoices as review required", () => {
    const draft = makeDraft();
    const precheck = buildSubmissionPrecheck({
      draft,
      existingDocuments: [],
      requireSourceFiles: false,
    });

    expect(precheck.reviewRequiredItems).toEqual([
      expect.objectContaining({
        invoiceId: "doc-2",
        reviewRequired: true,
      }),
    ]);
  });

  test("applies local success tags only after an accepted receipt", () => {
    const draft = buildSubmissionDraft({
      senderName: "Alice",
      beneficiaryName: "Alice",
      sourceSnapshotId: "snapshot-1",
      filterGroupId: "group-1",
      documents: [makeInvoiceDocument({ id: "doc-1", invoiceNumber: "INV-001", tags: ["差旅"] })],
      includeSourceFiles: false,
      submissionTagsText: "",
      note: "",
      successAckLocalTag: "",
      successAckLocalTagEnabled: true,
      now: () => "2026-04-01T10:00:00.000Z",
    });
    const acceptedReceipt = buildSubmissionReceipt({
      draft,
      accepted: true,
      receiverName: "Finance",
      assignedTagsText: "2026上半年",
      assignedBeneficiary: "Alice",
      receivedBy: "Finance",
      duplicateInvoiceNumbers: [],
      conflictItems: [],
      now: () => "2026-04-01T10:05:00.000Z",
    });
    const rejectedReceipt = buildSubmissionReceipt({
      draft,
      accepted: false,
      receiverName: "Finance",
      assignedTagsText: "2026上半年",
      assignedBeneficiary: "Alice",
      receivedBy: "Finance",
      duplicateInvoiceNumbers: ["INV-001"],
      conflictItems: [{ invoiceId: "doc-1", invoiceNumber: "INV-001", reason: "duplicate" }],
      now: () => "2026-04-01T10:05:00.000Z",
    });

    expect(
      applyAcceptedReceiptToLocalInvoices({
        documents: [makeInvoiceDocument({ id: "doc-1", invoiceNumber: "INV-001", tags: ["差旅"] })],
        draft,
        receipt: acceptedReceipt,
        now: () => "2026-04-01T10:05:00.000Z",
      }),
    ).toEqual([
      expect.objectContaining({
        id: "doc-1",
        tags: ["差旅", "已发送财务"],
        collaborationStatus: "submitted",
        lastSubmissionId: draft.submissionId,
      }),
    ]);

    expect(
      applyAcceptedReceiptToLocalInvoices({
        documents: [makeInvoiceDocument({ id: "doc-1", invoiceNumber: "INV-001", tags: ["差旅"] })],
        draft,
        receipt: rejectedReceipt,
        now: () => "2026-04-01T10:05:00.000Z",
      }),
    ).toEqual([]);
  });
});
