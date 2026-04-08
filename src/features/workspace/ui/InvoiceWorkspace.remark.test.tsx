import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";

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

import { InvoiceDetailsDrawer } from "../../invoices/ui/InvoiceDetailsDrawer";
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
    remark: "原始备注",
    annotation: "人工批注",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("InvoiceWorkspace remark", () => {
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

  test("matches workspace search against invoice remarks", async () => {
    render(
      <InvoiceWorkspace
        view="records"
        invoiceDocuments={[buildRow({ id: "doc-1", invoiceNumber: "INV-001", remark: "华北差旅备注" }), buildRow({ id: "doc-2", invoiceNumber: "INV-002", remark: "华东办公用品", updatedAt: "2026-03-31T01:00:00.000Z" })]}
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
    fireEvent.change(searchInput, { target: { value: "差旅备注" } });

    await waitFor(() => {
      expect(screen.getByDisplayValue("INV-001")).toBeInTheDocument();
      expect(screen.queryByDisplayValue("INV-002")).not.toBeInTheDocument();
    });
  });

  test("shows remark separately from annotation in the details drawer", () => {
    const invoiceDocument = buildRow();
    const auditLogs: InvoiceAuditLog[] = [];

    render(<InvoiceDetailsDrawer invoiceDocument={invoiceDocument} auditLogs={auditLogs} open onClose={() => {}} onEdit={() => {}} onOpenPdf={() => {}} />);

    expect(screen.getByRole("heading", { name: "标签、备注与批注" })).toBeInTheDocument();
    expect(screen.getByText("原始备注")).toBeInTheDocument();
    expect(screen.getByText("人工批注")).toBeInTheDocument();
  });

  test("renders OCR audit logs with user-facing labels", () => {
    const invoiceDocument = buildRow();
    const auditLogs: InvoiceAuditLog[] = [
      {
        id: "audit-1",
        invoiceDocumentId: "doc-1",
        changedAt: "2026-04-08T10:00:00.000Z",
        changeType: "ocr_parse",
        targetField: "ocr识别",
        beforeValue: "baidu 2026-04-08T09:00:00.000Z",
        afterValue: "tencent 2026-04-08T10:00:00.000Z",
      },
      {
        id: "audit-2",
        invoiceDocumentId: "doc-1",
        changedAt: "2026-04-08T10:00:00.000Z",
        changeType: "ocr_parse",
        targetField: "invoiceNumber",
        beforeValue: "旧号码",
        afterValue: "新号码",
      },
    ];

    render(<InvoiceDetailsDrawer invoiceDocument={invoiceDocument} auditLogs={auditLogs} open onClose={() => {}} onEdit={() => {}} onOpenPdf={() => {}} />);

    expect(screen.getByText("OCR 重新识别")).toBeInTheDocument();
    expect(screen.getByText("百度 -> 腾讯")).toBeInTheDocument();
    expect(screen.getByText("OCR 更新发票号码")).toBeInTheDocument();
    expect(screen.getByText("旧号码 -> 新号码")).toBeInTheDocument();
  });
});
