import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { InvoiceTable } from "./InvoiceTable";

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
    ocrVendor: "baidu",
    ocrParsedAt: "2026-03-31T00:00:00.000Z",
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-001",
    invoiceCode: "",
    invoiceDate: "2026-03-31",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "Buyer",
    sellerName: "Seller",
    items: [],
    tags: ["已报销", "差旅"],
    remark: "原始备注",
    annotation: "人工备注",
    uploader: "",
    owner: "",
    sourceType: "manual",
    edited: true,
    createdAt: "2026-03-31T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("InvoiceTable", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders tags, remark, annotation and action buttons", () => {
    render(
      <InvoiceTable
        rows={[makeRow()]}
        selectedIds={[]}
        onToggleSelected={vi.fn()}
        onToggleAll={vi.fn()}
        onOpenDetails={vi.fn()}
        onEdit={vi.fn()}
        onOpenPdf={vi.fn()}
      />,
    );

    expect(screen.getByText("已报销")).toBeInTheDocument();
    expect(screen.getByText("差旅")).toBeInTheDocument();
    expect(screen.getByText("原始备注")).toBeInTheDocument();
    expect(screen.getByText("人工备注")).toBeInTheDocument();
    expect(screen.getByText("手动添加")).toBeInTheDocument();
    expect(screen.getByText("被编辑")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看详情" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑发票" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开 PDF" })).toBeInTheDocument();
  });

  test("hides optional columns when visibleColumns excludes them", () => {
    render(
      <InvoiceTable
        rows={[makeRow()]}
        selectedIds={[]}
        onToggleSelected={vi.fn()}
        onToggleAll={vi.fn()}
        visibleColumns={["invoiceNumber", "totalAmount"]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "发票号码" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "总金额" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "购买方" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "标签" })).not.toBeInTheDocument();
  });

  test("toggles row selection", async () => {
    const user = userEvent.setup();
    const onToggleSelected = vi.fn();

    render(
      <InvoiceTable
        rows={[makeRow()]}
        selectedIds={[]}
        onToggleSelected={onToggleSelected}
        onToggleAll={vi.fn()}
        onOpenDetails={vi.fn()}
        onEdit={vi.fn()}
        onOpenPdf={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "选择发票 INV-001" }));

    expect(onToggleSelected).toHaveBeenCalledWith("doc-1", { shiftKey: false });
  });

  test("passes shift selection intent and renders delete action", async () => {
    const user = userEvent.setup();
    const onToggleSelected = vi.fn();

    render(
      <InvoiceTable
        rows={[makeRow({ id: "doc-1" }), makeRow({ id: "doc-2", invoiceNumber: "INV-002" }), makeRow({ id: "doc-3", invoiceNumber: "INV-003" })]}
        selectedIds={[]}
        onToggleSelected={onToggleSelected}
        onToggleAll={vi.fn()}
        onOpenDetails={vi.fn()}
        onEdit={vi.fn()}
        onOpenPdf={vi.fn()}
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
    expect(screen.getAllByRole("button", { name: "删除记录" })).toHaveLength(3);
  });
});
