import { render } from "@testing-library/react";
import { vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

const mockedDepsInternal = vi.hoisted(() => ({
  saveWorkspaceDraftRowMock: vi.fn(),
  importFilesMock: vi.fn(),
  exportDataMock: vi.fn(),
  importDataMock: vi.fn(),
  buildWorkspaceExcelExportMock: vi.fn(() => ({
    filename: "invoice-workspace-test.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    content: new Uint8Array([1, 2, 3]),
  })),
  triggerWorkspaceExcelDownloadMock: vi.fn(),
  persistFileHandleMock: vi.fn(async () => "handle-ref"),
  bulkUpdateInvoiceTagsMock: vi.fn(),
  savedViews: [] as Array<{
    id: string;
    scope: "workspace";
    name: string;
    isDefault: boolean;
    query: unknown;
    visibleColumns: string[];
    createdAt: string;
    updatedAt: string;
  }>,
  activeViewId: null as string | null,
}));
export const mockedDeps = mockedDepsInternal;

vi.mock("../application/saveWorkspaceCell", () => ({
  saveWorkspaceCell: vi.fn(),
  saveWorkspaceDraftRow: mockedDepsInternal.saveWorkspaceDraftRowMock,
}));

vi.mock("../../files/application/importFiles", () => ({
  importFiles: mockedDepsInternal.importFilesMock,
}));

vi.mock("../../transfer/application/exportData", () => ({
  exportData: mockedDepsInternal.exportDataMock,
}));

vi.mock("../../transfer/application/importData", () => ({
  importData: mockedDepsInternal.importDataMock,
}));

vi.mock("../application/workspaceExcelExport", () => ({
  buildWorkspaceExcelExport: mockedDepsInternal.buildWorkspaceExcelExportMock,
  triggerWorkspaceExcelDownload: mockedDepsInternal.triggerWorkspaceExcelDownloadMock,
}));

vi.mock("../../../shared/fs/fileHandles", () => ({
  persistFileHandle: mockedDepsInternal.persistFileHandleMock,
}));

vi.mock("../../invoices/application/bulkUpdateInvoiceTags", () => ({
  bulkUpdateInvoiceTags: mockedDepsInternal.bulkUpdateInvoiceTagsMock,
}));

vi.mock("../../views/application/savedViews", () => ({
  buildDefaultViewName: () => "默认工作区视图",
  listSavedViews: vi.fn(async () => [...mockedDepsInternal.savedViews]),
  loadSavedView: vi.fn(async (viewId: string | null) => mockedDepsInternal.savedViews.find((view) => view.id === viewId) ?? null),
  loadDefaultSavedView: vi.fn(async () => mockedDepsInternal.savedViews.find((view) => view.isDefault) ?? null),
  saveActiveViewId: vi.fn(async (_key: string, value: string | null) => {
    mockedDepsInternal.activeViewId = value;
  }),
  loadActiveViewId: vi.fn(async () => mockedDepsInternal.activeViewId),
  saveSavedView: vi.fn(async (input: {
    id?: string;
    scope: "workspace";
    name: string;
    isDefault: boolean;
    query: unknown;
    visibleColumns: string[];
    now: () => string;
  }) => {
    const timestamp = input.now();
    const existingIndex = mockedDepsInternal.savedViews.findIndex((view) => view.id === input.id);
    const id = input.id ?? `view-${mockedDepsInternal.savedViews.length + 1}`;
    const nextView = {
      id,
      scope: input.scope,
      name: input.name,
      isDefault: input.isDefault,
      query: input.query,
      visibleColumns: [...input.visibleColumns],
      createdAt: existingIndex >= 0 ? mockedDepsInternal.savedViews[existingIndex].createdAt : timestamp,
      updatedAt: timestamp,
    };

    if (input.isDefault) {
      mockedDepsInternal.savedViews = mockedDepsInternal.savedViews.map((view) => ({ ...view, isDefault: false }));
    }

    if (existingIndex >= 0) {
      mockedDepsInternal.savedViews[existingIndex] = nextView;
    } else {
      mockedDepsInternal.savedViews.push(nextView);
    }

    return nextView;
  }),
}));

vi.mock("../../tags/application/tagMetadata", () => ({
  loadTagMetadata: vi.fn(async () => ({
    definitions: [],
    groups: [],
    links: [],
  })),
}));

import { InvoiceWorkspace } from "./InvoiceWorkspace";

export function buildRow(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
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

type RenderInvoiceWorkspaceInput = Partial<Parameters<typeof InvoiceWorkspace>[0]>;

export function renderInvoiceWorkspace(overrides: RenderInvoiceWorkspaceInput = {}) {
  return render(
    <InvoiceWorkspace
      view="records"
      invoiceDocuments={[buildRow()]}
      message="工作区已加载。"
      onOpenDetails={() => {}}
      onEdit={() => {}}
      onOpenPdf={() => {}}
      onDelete={() => {}}
      onReparseSingle={() => {}}
      onBulkReparse={() => {}}
      onRefresh={() => {}}
      {...overrides}
    />,
  );
}

export function resetInvoiceWorkspaceMocks() {
  mockedDeps.saveWorkspaceDraftRowMock.mockReset();
  mockedDeps.importFilesMock.mockReset();
  mockedDeps.exportDataMock.mockReset();
  mockedDeps.importDataMock.mockReset();
  mockedDeps.buildWorkspaceExcelExportMock.mockReset();
  mockedDeps.buildWorkspaceExcelExportMock.mockReturnValue({
    filename: "invoice-workspace-test.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    content: new Uint8Array([1, 2, 3]),
  });
  mockedDeps.triggerWorkspaceExcelDownloadMock.mockReset();
  mockedDeps.persistFileHandleMock.mockClear();
  mockedDeps.bulkUpdateInvoiceTagsMock.mockReset();
  mockedDeps.savedViews = [];
  mockedDeps.activeViewId = null;
}
