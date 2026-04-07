import { describe, expect, it } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { buildFilesViewModel, buildOverviewViewModel, filterInvoices } from "./dashboardViewModels";

const baseInvoiceDocument: InvoiceDocument = {
  id: "doc-1",
  contentHash: "hash",
  fileName: "invoice-a.pdf",
  fileSize: 10,
  lastModified: 1,
  handleRef: "handle-1",
  bindingStatus: "readable",
  bindingErrorType: null,
  ocrVendor: null,
  ocrParsedAt: null,
  parseStatus: "parsed",
  conflictStatus: "none",
  conflictMessage: "",
  invoiceNumber: "INV-001",
  invoiceCode: "",
  invoiceDate: "2026-03-31",
  totalAmount: 120,
  taxAmount: 20,
  amountWithoutTax: 100,
  buyerName: "Northwind",
  sellerName: "Contoso",
  items: [],
  tags: [],
  annotation: "",
  uploader: "",
  owner: "",
  sourceType: "ocr",
  edited: false,
  createdAt: "2026-03-31T00:00:00.000Z",
  updatedAt: "2026-03-31T00:00:00.000Z",
};

describe("dashboardViewModels", () => {
  it("builds overview metrics from unified invoice documents", () => {
    const rows: InvoiceDocument[] = [
      baseInvoiceDocument,
      {
        ...baseInvoiceDocument,
        id: "doc-2",
        fileName: "invoice-b.pdf",
        parseStatus: "parse_failed",
        bindingStatus: "needs_reparse",
        invoiceNumber: "INV-002",
        totalAmount: 80,
        updatedAt: "2026-03-31T01:00:00.000Z",
      },
      {
        ...baseInvoiceDocument,
        id: "doc-3",
        fileName: "invoice-c.pdf",
        invoiceNumber: "INV-003",
        conflictStatus: "same_number_diff_hash",
        totalAmount: 40,
        updatedAt: "2026-03-31T02:00:00.000Z",
      },
    ];

    const viewModel = buildOverviewViewModel(rows);

    expect(viewModel.totalAmount).toBe(240);
    expect(viewModel.parsedCount).toBe(2);
    expect(viewModel.needsReviewCount).toBe(3);
    expect(viewModel.conflictCount).toBe(1);
    expect(viewModel.recentFiles[0]?.fileName).toBe("invoice-c.pdf");
    expect(viewModel.recentInvoices[0]?.invoiceNumber).toBe("INV-003");
    expect(viewModel.pendingItems).toHaveLength(3);
  });

  it("filters invoices by query and status", () => {
    const rows: InvoiceDocument[] = [
      baseInvoiceDocument,
      { ...baseInvoiceDocument, id: "doc-2", invoiceNumber: "INV-ABC", buyerName: "Globex", parseStatus: "idle" },
      { ...baseInvoiceDocument, id: "doc-3", invoiceNumber: "INV-XYZ", buyerName: "Initech", conflictStatus: "same_number_diff_hash" },
    ];

    expect(filterInvoices(rows, { query: "globex", status: "all" })).toHaveLength(1);
    expect(filterInvoices(rows, { query: "", status: "needs_attention" })).toHaveLength(2);
    expect(filterInvoices(rows, { query: "inv", status: "parsed" })).toHaveLength(1);
  });

  it("summarizes file binding states for the files page", () => {
    const files: InvoiceDocument[] = [
      baseInvoiceDocument,
      { ...baseInvoiceDocument, id: "doc-2", bindingStatus: "unreadable", fileName: "broken.pdf" },
      { ...baseInvoiceDocument, id: "doc-3", bindingStatus: "needs_reparse", fileName: "changed.pdf" },
    ];

    expect(buildFilesViewModel(files)).toEqual({
      total: 3,
      readable: 1,
      unreadable: 1,
      needsReparse: 1,
    });
  });
});
