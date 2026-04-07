import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { FileStatusTable } from "./FileStatusTable";

function makeRow(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
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

describe("FileStatusTable", () => {
  afterEach(() => {
    cleanup();
  });

  test("allows selecting multiple file rows", async () => {
    const user = userEvent.setup();
    const onToggleSelected = vi.fn();

    render(
      <FileStatusTable
        rows={[makeRow({ id: "doc-1" }), makeRow({ id: "doc-2", fileName: "second.pdf" })]}
        selectedIds={[]}
        onToggleSelected={onToggleSelected}
        onToggleAll={vi.fn()}
        onParse={vi.fn()}
        parsingInvoiceDocumentId={null}
        onOpenPdf={vi.fn()}
        onCreateManual={vi.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);

    expect(onToggleSelected).toHaveBeenNthCalledWith(1, "doc-1", { shiftKey: false });
    expect(onToggleSelected).toHaveBeenNthCalledWith(2, "doc-2", { shiftKey: false });
  });

  test("renders parse, open and manual create actions", () => {
    render(
      <FileStatusTable
        rows={[makeRow()]}
        selectedIds={[]}
        onToggleSelected={vi.fn()}
        onToggleAll={vi.fn()}
        onParse={vi.fn()}
        parsingInvoiceDocumentId={null}
        onOpenPdf={vi.fn()}
        onCreateManual={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "识别发票" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开 PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "手动录入" })).toBeInTheDocument();
  });

  test("passes shift selection intent and renders delete action", async () => {
    const user = userEvent.setup();
    const onToggleSelected = vi.fn();

    render(
      <FileStatusTable
        rows={[makeRow({ id: "doc-1" }), makeRow({ id: "doc-2", fileName: "second.pdf" }), makeRow({ id: "doc-3", fileName: "third.pdf" })]}
        selectedIds={[]}
        onToggleSelected={onToggleSelected}
        onToggleAll={vi.fn()}
        onParse={vi.fn()}
        parsingInvoiceDocumentId={null}
        onOpenPdf={vi.fn()}
        onCreateManual={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.keyboard("{Shift>}");
    await user.click(checkboxes[3]);
    await user.keyboard("{/Shift}");

    expect(onToggleSelected).toHaveBeenNthCalledWith(1, "doc-1", { shiftKey: false });
    expect(onToggleSelected).toHaveBeenNthCalledWith(2, "doc-3", { shiftKey: true });
    expect(screen.getAllByRole("button", { name: "删除文件" })).toHaveLength(3);
  });
});
