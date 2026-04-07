import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

const mockedDeps = vi.hoisted(() => ({
  saveWorkspaceDraftRowMock: vi.fn(),
  importFilesMock: vi.fn(),
  persistFileHandleMock: vi.fn(async () => "handle-ref"),
}));

vi.mock("../application/saveWorkspaceCell", () => ({
  saveWorkspaceCell: vi.fn(),
  saveWorkspaceDraftRow: mockedDeps.saveWorkspaceDraftRowMock,
}));

vi.mock("../../files/application/importFiles", () => ({
  importFiles: mockedDeps.importFilesMock,
}));

vi.mock("../../../shared/fs/fileHandles", () => ({
  persistFileHandle: mockedDeps.persistFileHandleMock,
}));

vi.mock("../../tags/application/tagMetadata", () => ({
  loadTagMetadata: vi.fn(async () => ({
    definitions: [],
    groups: [],
    links: [],
  })),
}));

import { InvoiceWorkspace } from "./InvoiceWorkspace";

function buildRow(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
  return {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "demo.pdf",
    fileSize: 10,
    lastModified: 1,
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: "baidu",
    ocrParsedAt: "2026-03-31T00:00:00.000Z",
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-001",
    invoiceCode: "CODE-001",
    invoiceDate: "2026-03-31",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "旧买方",
    sellerName: "旧卖方",
    items: [],
    tags: ["待报销"],
    remark: "",
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

describe("InvoiceWorkspace search shortcut", () => {
  beforeEach(() => {
    mockedDeps.saveWorkspaceDraftRowMock.mockReset();
    mockedDeps.importFilesMock.mockReset();
    mockedDeps.persistFileHandleMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  test("focuses the built-in workspace search on Ctrl+F", async () => {
    render(
      <InvoiceWorkspace
        view="records"
        invoiceDocuments={[buildRow()]}
        message="工作区已加载。"
        onOpenDetails={() => {}}
        onEdit={() => {}}
        onOpenPdf={() => {}}
        onDelete={() => {}}
        onBulkReparse={() => {}}
        onRefresh={() => {}}
      />,
    );

    const searchInput = await screen.findByPlaceholderText("搜索记录...");
    expect(searchInput).not.toHaveFocus();

    fireEvent.keyDown(window, { key: "f", ctrlKey: true });

    await waitFor(() => expect(searchInput).toHaveFocus());
  });
});
