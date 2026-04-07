import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { InvoicesWorkspace } from "./InvoicesWorkspace";

function makeInvoiceDocument(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
  return {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "demo.pdf",
    fileSize: 10,
    lastModified: 1,
    relativePath: "",
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
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "默认购买方",
    sellerName: "默认销售方",
    items: [],
    tags: [],
    annotation: "",
    uploader: "",
    owner: "",
    proofFiles: [],
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("InvoicesWorkspace saved views", () => {
  afterEach(async () => {
    cleanup();
    await appDb.savedViews.clear();
    await appDb.settings.clear();
    await appDb.tagDefinitions.clear();
    await appDb.tagGroups.clear();
    await appDb.tagGroupLinks.clear();
    await appDb.filterGroups.clear();
    await appDb.filterGroupRules.clear();
  });

  test("applies the default saved invoice view on load", async () => {
    await appDb.savedViews.add({
      id: "invoice-view-default",
      scope: "invoices",
      name: "Globex 视图",
      isDefault: true,
      query: {
        scope: "invoices",
        searchText: "globex",
        status: "all",
        tag: "",
        tagGroupId: "",
        ruleId: "",
        sortBy: "updatedAt",
        sortDirection: "desc",
      },
      visibleColumns: ["invoiceNumber", "buyerName"],
      createdAt: "2026-03-31T00:00:00.000Z",
      updatedAt: "2026-03-31T00:00:00.000Z",
    });

    render(
      <InvoicesWorkspace
        invoiceDocuments={[
          makeInvoiceDocument({ id: "doc-1", invoiceNumber: "INV-001", buyerName: "Northwind" }),
          makeInvoiceDocument({ id: "doc-2", invoiceNumber: "INV-002", buyerName: "Globex" }),
        ]}
        message="测试"
        onOpenDetails={vi.fn()}
        onEdit={vi.fn()}
        onOpenPdf={vi.fn()}
        onExportMerged={vi.fn()}
        onDelete={vi.fn()}
        onBulkTagUpdate={vi.fn()}
        onBulkReparse={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByDisplayValue("globex")).toBeInTheDocument());
    expect(screen.getByText("INV-002")).toBeInTheDocument();
    expect(screen.queryByText("INV-001")).not.toBeInTheDocument();
  });
});
