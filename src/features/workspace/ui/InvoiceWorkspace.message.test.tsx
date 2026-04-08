import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { InvoiceWorkspace } from "./InvoiceWorkspace";
import { buildRow, mockedDeps, resetInvoiceWorkspaceMocks } from "./InvoiceWorkspace.testUtils";

describe("InvoiceWorkspace message precedence", () => {
  beforeEach(() => {
    resetInvoiceWorkspaceMocks();
  });

  afterEach(async () => {
    cleanup();
    await appDb.settings.clear();
  });

  test("falls back to the parent message after a local import message", async () => {
    const user = userEvent.setup();
    const onSidebarStatusChange = vi.fn();
    mockedDeps.importDataMock.mockResolvedValue({
      importedInvoiceDocuments: 0,
      conflictedInvoiceDocuments: 0,
      conflictedInvoiceDocumentIds: [],
    });

    const { rerender } = renderWorkspace("本地工作台数据已加载。", onSidebarStatusChange);

    await waitFor(() =>
      expect(onSidebarStatusChange).toHaveBeenCalledWith({
        message: "本地工作台数据已加载。",
        stats: ["1 条记录", "1 条结果", "0 条已选"],
      }),
    );

    await user.click(screen.getByRole("button", { name: "导入数据" }));

    const input = document.querySelector('input[type="file"][accept*=".json"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();

    const file = new File([JSON.stringify({ invoiceDocuments: [] })], "transfer.json", { type: "application/json" });
    Object.defineProperty(input as HTMLInputElement, "files", { value: [file], configurable: true });
    fireEvent.change(input as HTMLInputElement);

    await waitFor(() =>
      expect(onSidebarStatusChange).toHaveBeenLastCalledWith({
        message: "没有新增发票记录。",
        stats: ["1 条记录", "1 条结果", "0 条已选"],
      }),
    );

    rerender(buildWorkspace("已识别发票 INV-NEW。", onSidebarStatusChange));

    await waitFor(() =>
      expect(onSidebarStatusChange).toHaveBeenLastCalledWith({
        message: "已识别发票 INV-NEW。",
        stats: ["1 条记录", "1 条结果", "0 条已选"],
      }),
    );
  });
});

function renderWorkspace(message: string, onSidebarStatusChange: (status: { message: string; stats: string[] }) => void) {
  return render(buildWorkspace(message, onSidebarStatusChange));
}

function buildWorkspace(message: string, onSidebarStatusChange: (status: { message: string; stats: string[] }) => void) {
  return (
    <InvoiceWorkspace
      view="records"
      invoiceDocuments={[buildRow()]}
      message={message}
      onSidebarStatusChange={onSidebarStatusChange}
      onOpenDetails={() => {}}
      onEdit={() => {}}
      onOpenPdf={() => {}}
      onDelete={() => {}}
      onReparseSingle={() => {}}
      onBulkReparse={() => {}}
      onRefresh={() => {}}
    />
  );
}
