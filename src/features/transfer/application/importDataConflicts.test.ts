import { describe, expect, it } from "vitest";
import { buildImportPlan } from "./importDataConflicts";
import { buildTransferInvoiceDocument } from "./transferTestUtils";

describe("buildImportPlan", () => {
  it("compares imports only against non-conflicting existing invoices", () => {
    const existingDocuments = [
      {
        ...buildTransferInvoiceDocument({
          id: "doc-conflicted-hash",
          contentHash: "hash-existing",
          fileName: "conflicted-hash.pdf",
          invoiceNumber: "INV-001",
          buyerName: "已冲突旧买方",
          conflictStatus: "same_hash_diff_invoice_data",
          conflictMessage: "旧冲突",
        }),
        handleRef: "",
        bindingStatus: "unreadable" as const,
        bindingErrorType: "handle_missing" as const,
      },
      {
        ...buildTransferInvoiceDocument({
          id: "doc-conflicted-number",
          contentHash: "hash-other",
          fileName: "conflicted-number.pdf",
          invoiceNumber: "INV-002",
          buyerName: "已冲突旧买方",
          conflictStatus: "same_number_diff_hash",
          conflictMessage: "旧冲突",
        }),
        handleRef: "",
        bindingStatus: "unreadable" as const,
        bindingErrorType: "handle_missing" as const,
      },
    ];

    const plan = buildImportPlan(
      [
        buildTransferInvoiceDocument({
          id: "doc-import-same-hash",
          contentHash: "hash-existing",
          fileName: "incoming-same-hash.pdf",
          invoiceNumber: "INV-001",
          buyerName: "新买方",
        }),
        buildTransferInvoiceDocument({
          id: "doc-import-same-number",
          contentHash: "hash-new",
          fileName: "incoming-same-number.pdf",
          invoiceNumber: "INV-002",
          buyerName: "另一新买方",
        }),
      ],
      existingDocuments,
    );

    expect(plan.conflicts).toEqual([]);
    expect(plan.conflictedInvoiceDocuments).toBe(0);
    expect(plan.conflictedInvoiceDocumentIds).toEqual([]);
    expect(plan.invoiceDocuments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "doc-import-same-hash",
          conflictStatus: "none",
          conflictMessage: "",
        }),
        expect.objectContaining({
          id: "doc-import-same-number",
          conflictStatus: "none",
          conflictMessage: "",
        }),
      ]),
    );
  });
});
