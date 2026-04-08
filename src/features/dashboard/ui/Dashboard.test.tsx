import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { hashFile } from "../../../shared/hash/hashFile";

const mockDeps = vi.hoisted(() => {
  const handles = new Map<string, FileSystemFileHandle>();
  return {
    handles,
    getStoredHandle: vi.fn(async (key: string) => handles.get(key)),
    parseInvoiceMock: vi.fn(),
  };
});

vi.mock("../../../shared/fs/fileHandles", () => ({
  getStoredHandle: mockDeps.getStoredHandle,
}));

vi.mock("../../ocr/application/parseInvoice", () => ({
  parseInvoice: mockDeps.parseInvoiceMock,
}));

vi.mock("../../settings/ui/OcrSettingsForm", () => ({
  OcrSettingsForm: () => <div>Mock OCR settings form</div>,
}));

vi.mock("../../workspace/ui/InvoiceWorkspace", () => ({
  InvoiceWorkspace: ({
    view,
    invoiceDocuments,
    message,
    onSidebarStatusChange,
    onReparseSingle,
    onBulkReparse,
  }: {
    view: string;
    invoiceDocuments: Array<{ id: string; invoiceNumber: string }>;
    message: string;
    onSidebarStatusChange?: (status: { message: string; stats: string[] }) => void;
    onReparseSingle?: (invoiceDocumentId: string) => void | Promise<void>;
    onBulkReparse?: (invoiceDocumentIds: string[]) => void | Promise<void>;
  }) => (
    <div data-testid="invoice-workspace">
      <div data-testid="workspace-view">{view}</div>
      <div data-testid="workspace-count">{invoiceDocuments.length}</div>
      <div data-testid="workspace-message">{message}</div>
      <div data-testid="workspace-invoice-numbers">{invoiceDocuments.map((row) => row.invoiceNumber).join(",")}</div>
      <div data-testid="workspace-sidebar-callback">{onSidebarStatusChange ? "connected" : "missing"}</div>
      <button type="button" onClick={() => void onReparseSingle?.(invoiceDocuments[0]?.id ?? "")}>
        触发单条 OCR
      </button>
      <button type="button" onClick={() => void onBulkReparse?.(invoiceDocuments.map((row) => row.id))}>
        触发批量 OCR
      </button>
    </div>
  ),
}));

import { Dashboard } from "./Dashboard";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

async function seedDashboardState(
  rows: Array<{
    id: string;
    handleRef: string;
    invoiceNumber: string;
    fileName: string;
  }> = [{ id: "doc-1", handleRef: "handle-1", invoiceNumber: "INV-100", fileName: "demo.pdf" }],
) {
  await appDb.invoiceDocuments.clear();
  await appDb.invoiceAuditLogs.clear();
  await appDb.settings.clear();
  const file = new File(["same-content"], "demo.pdf", { type: "application/pdf", lastModified: 42 });
  const contentHash = await hashFile(file);
  for (const row of rows) {
    mockDeps.handles.set(row.handleRef, {
      kind: "file",
      name: row.fileName,
      getFile: vi.fn().mockResolvedValue(file),
    } as unknown as FileSystemFileHandle);
  }
  await appDb.invoiceDocuments.bulkAdd(
    rows.map((row) => ({
      id: row.id,
      contentHash,
      fileName: row.fileName,
      fileSize: 11,
      lastModified: 1,
      handleRef: row.handleRef,
      bindingStatus: "readable" as const,
      bindingErrorType: null,
      ocrVendor: null,
      ocrParsedAt: null,
      parseStatus: "parsed" as const,
      conflictStatus: "none" as const,
      conflictMessage: "",
      invoiceNumber: row.invoiceNumber,
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
      sourceType: "ocr" as const,
      edited: false,
      createdAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z",
    })),
  );
  await appDb.settings.bulkAdd([
    {
      key: "ocr.vendor",
      value: "tencent",
      updatedAt: "2026-03-30T00:00:00.000Z",
    },
    {
      key: "ocr.tencentSecretId",
      value: "secret-id",
      updatedAt: "2026-03-30T00:00:00.000Z",
    },
    {
      key: "ocr.tencentSecretKey",
      value: "secret-key",
      updatedAt: "2026-03-30T00:00:00.000Z",
    },
  ]);
}

describe("Dashboard", () => {
  beforeEach(async () => {
    mockDeps.handles.clear();
    mockDeps.getStoredHandle.mockClear();
    mockDeps.parseInvoiceMock.mockReset();
    mockDeps.parseInvoiceMock.mockResolvedValue({
      invoiceNumber: "INV-NEW",
      invoiceCode: "",
      invoiceDate: "",
      totalAmount: 0,
      taxAmount: 0,
      amountWithoutTax: 0,
      buyerName: "",
      sellerName: "",
      items: [],
    });
    await seedDashboardState();
  });

  afterEach(async () => {
    cleanup();
    await appDb.invoiceDocuments.clear();
    await appDb.settings.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("renders the records workspace by default", async () => {
    render(<Dashboard />);

    await waitFor(() => expect(screen.getByTestId("invoice-workspace")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("workspace-count")).toHaveTextContent("1"));
    expect(screen.getByTestId("workspace-view")).toHaveTextContent("records");
    expect(screen.getByTestId("workspace-invoice-numbers")).toHaveTextContent("INV-100");
    expect(screen.getByTestId("workspace-sidebar-callback")).toHaveTextContent("connected");
  });

  it("switches the workspace mode between records and dashboard", async () => {
    render(<Dashboard activeView="dashboard" />);
    await waitFor(() => expect(screen.getByTestId("workspace-view")).toHaveTextContent("dashboard"));
  });

  it("shows the settings workspace when settings view is active", async () => {
    render(<Dashboard activeView="settings" />);
    await waitFor(() => expect(screen.getByText("Mock OCR settings form")).toBeInTheDocument());
    expect(screen.getByText("识别偏好")).toBeInTheDocument();
    expect(screen.getByText("OCR配置")).toBeInTheDocument();
    expect(screen.queryByText("系统状态看板")).not.toBeInTheDocument();
  });

  it("reports OCR start and success status for a single records-row reparse", async () => {
    const user = userEvent.setup();
    const onSidebarStatusChange = vi.fn();
    const deferred = createDeferred<{
      invoiceNumber: string;
      invoiceCode: string;
      invoiceDate: string;
      totalAmount: number;
      taxAmount: number;
      amountWithoutTax: number;
      buyerName: string;
      sellerName: string;
      items: [];
    }>();
    mockDeps.parseInvoiceMock.mockReturnValueOnce(deferred.promise);

    render(<Dashboard onSidebarStatusChange={onSidebarStatusChange} />);

    await waitFor(() => expect(screen.getByTestId("invoice-workspace")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("workspace-message")).toHaveTextContent("本地工作台数据已加载。"));
    await user.click(screen.getByRole("button", { name: "触发单条 OCR" }));

    await waitFor(() => expect(screen.getByTestId("workspace-message")).toHaveTextContent("正在识别发票..."));
    await waitFor(() =>
      expect(onSidebarStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "正在识别发票...",
        }),
      ),
    );

    deferred.resolve({
      invoiceNumber: "INV-SINGLE",
      invoiceCode: "",
      invoiceDate: "",
      totalAmount: 0,
      taxAmount: 0,
      amountWithoutTax: 0,
      buyerName: "",
      sellerName: "",
      items: [],
    });

    await waitFor(() => expect(screen.getByTestId("workspace-message")).toHaveTextContent("已识别发票 INV-SINGLE。"));
    await waitFor(() =>
      expect(onSidebarStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "已识别发票 INV-SINGLE。",
        }),
      ),
    );
  });

  it("reports batch OCR progress and final counts in the sidebar status", async () => {
    const user = userEvent.setup();
    const onSidebarStatusChange = vi.fn();
    const first = createDeferred<{
      invoiceNumber: string;
      invoiceCode: string;
      invoiceDate: string;
      totalAmount: number;
      taxAmount: number;
      amountWithoutTax: number;
      buyerName: string;
      sellerName: string;
      items: [];
    }>();
    const second = createDeferred<never>();

    await seedDashboardState([
      { id: "doc-1", handleRef: "handle-1", invoiceNumber: "INV-100", fileName: "one.pdf" },
      { id: "doc-2", handleRef: "handle-2", invoiceNumber: "INV-200", fileName: "two.pdf" },
    ]);
    mockDeps.parseInvoiceMock.mockReset();
    mockDeps.parseInvoiceMock.mockImplementationOnce(() => first.promise);
    mockDeps.parseInvoiceMock.mockImplementationOnce(() => second.promise);

    render(<Dashboard onSidebarStatusChange={onSidebarStatusChange} />);

    await waitFor(() => expect(screen.getByTestId("workspace-count")).toHaveTextContent("2"));
    await waitFor(() => expect(screen.getByTestId("workspace-message")).toHaveTextContent("本地工作台数据已加载。"));
    await user.click(screen.getByRole("button", { name: "触发批量 OCR" }));

    await waitFor(() => expect(screen.getByTestId("workspace-message")).toHaveTextContent("开始批量 OCR：共 2 条。"));

    first.resolve({
      invoiceNumber: "INV-100",
      invoiceCode: "",
      invoiceDate: "",
      totalAmount: 0,
      taxAmount: 0,
      amountWithoutTax: 0,
      buyerName: "",
      sellerName: "",
      items: [],
    });

    await waitFor(() =>
      expect(screen.getByTestId("workspace-message")).toHaveTextContent("批量 OCR 进行中：共 2 条，已处理 1 条，成功 1，失败 0，跳过 0。"),
    );

    second.reject(new Error("识别失败"));

    await waitFor(() =>
      expect(screen.getByTestId("workspace-message")).toHaveTextContent("批量 OCR 完成：共 2 条，成功 1，失败 1，跳过 0。"),
    );
    await waitFor(() =>
      expect(onSidebarStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "批量 OCR 完成：共 2 条，成功 1，失败 1，跳过 0。",
        }),
      ),
    );
  });
});
