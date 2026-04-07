import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

vi.mock("../../files/ui/FileImportPanel", () => ({
  FileImportPanel: () => <div>mock-import</div>,
}));

vi.mock("../../transfer/ui/DataTransferPanel", () => ({
  DataTransferPanel: () => <div>mock-transfer</div>,
}));

vi.mock("../../files/ui/FileStatusTable", () => ({
  FileStatusTable: ({ rows }: { rows: Array<{ fileName: string }> }) => <div data-testid="file-status-table">{rows.map((row) => row.fileName).join(",")}</div>,
}));

import { FilesWorkspace } from "./FilesWorkspace";

function makeInvoiceDocument(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
  return {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "demo.pdf",
    fileSize: 10,
    lastModified: 1,
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: null,
    ocrParsedAt: null,
    parseStatus: "idle",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "",
    invoiceCode: "",
    invoiceDate: "",
    totalAmount: 0,
    taxAmount: 0,
    amountWithoutTax: 0,
    buyerName: "",
    sellerName: "",
    items: [],
    tags: [],
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("FilesWorkspace saved views", () => {
  afterEach(async () => {
    cleanup();
    await appDb.savedViews.clear();
    await appDb.settings.clear();
  });

  test("applies the default saved file view on load", async () => {
    await appDb.savedViews.add({
      id: "file-view-default",
      scope: "files",
      name: "异常文件",
      isDefault: true,
      query: {
        scope: "files",
        searchText: "broken",
        field: "fileName",
        sortBy: "updatedAt",
        sortDirection: "desc",
      },
      visibleColumns: [],
      createdAt: "2026-03-31T00:00:00.000Z",
      updatedAt: "2026-03-31T00:00:00.000Z",
    });

    render(
      <FilesWorkspace
        invoiceDocuments={[
          makeInvoiceDocument({ id: "doc-1", fileName: "good.pdf" }),
          makeInvoiceDocument({ id: "doc-2", fileName: "broken.pdf" }),
        ]}
        dashboardMessage="测试"
        parsingInvoiceDocumentId={null}
        onImportComplete={vi.fn()}
        onParse={vi.fn()}
        onOpenPdf={vi.fn()}
        onCreateManual={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByDisplayValue("broken")).toBeInTheDocument());
    expect(screen.getByTestId("file-status-table")).toHaveTextContent("broken.pdf");
    expect(screen.getByTestId("file-status-table")).not.toHaveTextContent("good.pdf");
  });
});
