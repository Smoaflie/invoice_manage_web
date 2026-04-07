import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { hashFile } from "../../../shared/hash/hashFile";

const mockDeps = vi.hoisted(() => {
  const handles = new Map<string, FileSystemFileHandle>();
  return {
    handles,
    getStoredHandle: vi.fn(async (key: string) => handles.get(key)),
  };
});

vi.mock("../../../shared/fs/fileHandles", () => ({
  getStoredHandle: mockDeps.getStoredHandle,
}));

vi.mock("../../settings/ui/OcrSettingsForm", () => ({
  OcrSettingsForm: () => <div>Mock OCR settings form</div>,
}));

vi.mock("../../ocr/bridge/extensionBridge", () => ({
  hasOcrExtensionBridge: vi.fn(async () => true),
}));

vi.mock("../../workspace/ui/InvoiceWorkspace", () => ({
  InvoiceWorkspace: ({
    view,
    invoiceDocuments,
    message,
    onSidebarStatusChange,
  }: {
    view: string;
    invoiceDocuments: Array<{ invoiceNumber: string }>;
    message: string;
    onSidebarStatusChange?: (status: { message: string; stats: string[] }) => void;
  }) => (
    <div data-testid="invoice-workspace">
      <div data-testid="workspace-view">{view}</div>
      <div data-testid="workspace-count">{invoiceDocuments.length}</div>
      <div data-testid="workspace-message">{message}</div>
      <div data-testid="workspace-invoice-numbers">{invoiceDocuments.map((row) => row.invoiceNumber).join(",")}</div>
      <div data-testid="workspace-sidebar-callback">{onSidebarStatusChange ? "connected" : "missing"}</div>
    </div>
  ),
}));

import { Dashboard } from "./Dashboard";

async function seedDashboardState() {
  await appDb.invoiceDocuments.clear();
  await appDb.settings.clear();
  const file = new File(["same-content"], "demo.pdf", { type: "application/pdf", lastModified: 42 });
  const contentHash = await hashFile(file);
  mockDeps.handles.set("handle-1", {
    kind: "file",
    name: "demo.pdf",
    getFile: vi.fn().mockResolvedValue(file),
  } as unknown as FileSystemFileHandle);
  await appDb.invoiceDocuments.add({
    id: "doc-1",
    contentHash,
    fileName: "demo.pdf",
    fileSize: 11,
    lastModified: 1,
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: null,
    ocrParsedAt: null,
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-100",
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
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
  });
}

describe("Dashboard", () => {
  beforeEach(async () => {
    mockDeps.handles.clear();
    mockDeps.getStoredHandle.mockClear();
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
    expect(screen.getByText("扩展状态")).toBeInTheDocument();
    expect(screen.getByText("识别偏好")).toBeInTheDocument();
  });
});
