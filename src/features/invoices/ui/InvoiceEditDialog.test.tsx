import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { InvoiceEditDialog } from "./InvoiceEditDialog";

function makeDocument(overrides: Partial<InvoiceDocument> = {}): InvoiceDocument {
  return {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "demo.pdf",
    fileSize: 1,
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
    invoiceDate: "",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "",
    sellerName: "",
    items: [],
    tags: ["已报销", "差旅"],
    remark: "原始备注",
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

describe("InvoiceEditDialog", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders reparse action for editable OCR invoices", async () => {
    const user = userEvent.setup();
    const onReparse = vi.fn();

    render(
      <InvoiceEditDialog
        invoiceDocument={makeDocument({ uploader: "Alice", owner: "Finance" })}
        open
        mode="manual-edit"
        onClose={vi.fn()}
        onSave={vi.fn()}
        onReparse={onReparse}
      />,
    );

    expect(screen.getByDisplayValue("已报销 差旅")).toBeInTheDocument();
    expect(screen.getByDisplayValue("原始备注")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Finance")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重新 OCR 识别" }));
    expect(onReparse).toHaveBeenCalledTimes(1);
  });

  test("submits uploader and owner fields", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <InvoiceEditDialog
        invoiceDocument={makeDocument({ uploader: "旧上传人", owner: "旧归属人" })}
        open
        mode="manual-edit"
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

    await user.clear(screen.getByLabelText("上传人"));
    await user.type(screen.getByLabelText("上传人"), "新上传人");
    await user.clear(screen.getByLabelText("归属人"));
    await user.type(screen.getByLabelText("归属人"), "新归属人");
    await user.click(screen.getByRole("button", { name: "保存修改" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        uploader: "新上传人",
        owner: "新归属人",
      }),
    );
  });
});
