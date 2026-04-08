import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { InvoiceDetailsDrawer } from "./InvoiceDetailsDrawer";

const invoiceDocument: InvoiceDocument = {
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
  parseStatus: "parsed",
  conflictStatus: "none",
  conflictMessage: "",
  invoiceNumber: "INV-001",
  invoiceCode: "CODE-001",
  invoiceDate: "2026-03-30",
  totalAmount: 100,
  taxAmount: 10,
  amountWithoutTax: 90,
  buyerName: "买方",
  sellerName: "卖方",
  items: [],
  tags: [],
  remark: "",
  annotation: "",
  uploader: "local",
  owner: "",
  sourceType: "ocr",
  edited: false,
  createdAt: "2026-03-31T00:00:00.000Z",
  updatedAt: "2026-03-31T00:00:00.000Z",
};

describe("InvoiceDetailsDrawer", () => {
  afterEach(() => {
    cleanup();
  });

  it("formats audit log timestamps with the Asia/Shanghai timezone", () => {
    const auditLogs: InvoiceAuditLog[] = [
      {
        id: "log-1",
        invoiceDocumentId: "doc-1",
        changedAt: "2026-04-08T10:00:00.000Z",
        changeType: "manual_edit",
        targetField: "buyerName",
        beforeValue: "旧买方",
        afterValue: "新买方",
      },
    ];

    render(
      <InvoiceDetailsDrawer
        invoiceDocument={invoiceDocument}
        auditLogs={auditLogs}
        open
        onClose={() => {}}
        onEdit={() => {}}
        onOpenPdf={() => {}}
      />,
    );

    expect(screen.getByText("2026/4/8 18:00:00")).toBeInTheDocument();
  });
});
