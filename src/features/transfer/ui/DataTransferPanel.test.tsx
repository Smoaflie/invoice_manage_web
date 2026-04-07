import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTransferPanel } from "./DataTransferPanel";

const { exportDataMock, importDataMock } = vi.hoisted(() => ({
  exportDataMock: vi.fn(),
  importDataMock: vi.fn(),
}));

vi.mock("../application/exportData", () => ({
  exportData: exportDataMock,
}));

vi.mock("../application/importData", () => ({
  importData: importDataMock,
}));

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read blob."));
    reader.readAsText(blob);
  });
}

function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    value: files,
    configurable: true,
  });
}

describe("DataTransferPanel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("downloads exported transfer data as JSON", async () => {
    const user = userEvent.setup();
    const createObjectUrlSpy = vi.fn().mockReturnValue("blob:exported");
    const revokeObjectUrlSpy = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectUrlSpy, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectUrlSpy, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    exportDataMock.mockResolvedValue({
      fileEntries: [{ id: "file-1" }],
      invoiceRecords: [{ id: "invoice-1" }],
      settings: [{ key: "app.theme", value: "system" }],
      exportedAt: "2026-03-30T00:00:00.000Z",
    });

    const { container } = render(<DataTransferPanel />);

    await user.click(screen.getByRole("button", { name: "导出 JSON" }));

    await waitFor(() => expect(exportDataMock).toHaveBeenCalledTimes(1));
    expect(screen.getByText("JSON 导出文件已生成，可直接下载。")).toBeInTheDocument();

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    const exportedBlob = createObjectUrlSpy.mock.calls[0][0] as Blob;
    expect(await readBlobText(exportedBlob)).toBe(
      JSON.stringify(
        {
          fileEntries: [{ id: "file-1" }],
          invoiceRecords: [{ id: "invoice-1" }],
          settings: [{ key: "app.theme", value: "system" }],
          exportedAt: "2026-03-30T00:00:00.000Z",
        },
        null,
        2,
      ),
    );

    const downloadLink = container.querySelector("a[download]") as HTMLAnchorElement | null;
    expect(downloadLink).toBeNull();
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:exported");
  });

  it("imports a JSON file and shows the result", async () => {
    const user = userEvent.setup();
    const onImportComplete = vi.fn();
    importDataMock.mockResolvedValue({
      importedInvoiceDocuments: 1,
    });

    render(<DataTransferPanel onImportComplete={onImportComplete} />);

    await user.click(screen.getByRole("button", { name: "导入 JSON" }));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();
    const payload = {
      fileEntries: [{ id: "file-1" }],
      invoiceRecords: [{ id: "invoice-1" }],
      settings: [],
    };

    const file = new File([JSON.stringify(payload)], "transfer.json", { type: "application/json" });
    setInputFiles(input as HTMLInputElement, [file]);
    fireEvent.change(input as HTMLInputElement);

    await waitFor(() => expect(importDataMock).toHaveBeenCalledTimes(1));
    expect(importDataMock).toHaveBeenCalledWith(payload);
    expect(onImportComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText("已覆盖本地数据并导入 1 条发票记录。")).toBeInTheDocument();
  });

  it("shows an error when import fails", async () => {
    const user = userEvent.setup();
    importDataMock.mockRejectedValue(new Error("bad payload"));

    render(<DataTransferPanel />);

    await user.click(screen.getByRole("button", { name: "导入 JSON" }));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();

    const file = new File([JSON.stringify({ fileEntries: [] })], "transfer.json", { type: "application/json" });
    setInputFiles(input as HTMLInputElement, [file]);
    fireEvent.change(input as HTMLInputElement);

    await waitFor(() => expect(importDataMock).toHaveBeenCalledTimes(1));
    expect(screen.getByText("导入失败。")).toBeInTheDocument();
  });
});
