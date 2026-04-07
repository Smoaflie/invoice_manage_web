import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
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
  test("renders reparse action for editable OCR invoices", async () => {
    const user = userEvent.setup();
    const onReparse = vi.fn();

    render(
      <InvoiceEditDialog
        invoiceDocument={makeDocument()}
        open
        mode="manual-edit"
        onClose={vi.fn()}
        onSave={vi.fn()}
        onReparse={onReparse}
      />,
    );

    expect(screen.getByDisplayValue("已报销 差旅")).toBeInTheDocument();
    expect(screen.getByDisplayValue("原始备注")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重新 OCR 识别" }));
    expect(onReparse).toHaveBeenCalledTimes(1);
  });
});
