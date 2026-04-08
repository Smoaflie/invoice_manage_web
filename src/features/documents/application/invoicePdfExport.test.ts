import { describe, expect, test, vi } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { InvoicePdfExportError, prepareInvoicePdfExport } from "./invoicePdfExport";

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
    tags: [],
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "2026-04-08T00:00:00.000Z",
    updatedAt: "2026-04-08T00:00:00.000Z",
    ...overrides,
  };
}

function createPdfFile(name: string) {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "application/pdf" });
}

describe("prepareInvoicePdfExport", () => {
  test("rejects conflict rows before trying to load any PDF files", async () => {
    const loadFile = vi.fn(async () => createPdfFile("demo.pdf"));

    const promise = prepareInvoicePdfExport([makeRow({ fileName: "conflict.pdf", conflictStatus: "same_number_diff_hash" })], {
      loadFile,
    });

    await expect(promise).rejects.toBeInstanceOf(InvoicePdfExportError);
    await expect(promise).rejects.toMatchObject({
      details: {
        conflictFileNames: ["conflict.pdf"],
      },
    });
    expect(loadFile).not.toHaveBeenCalled();
  });

  test("rejects unparsed and unedited rows before trying to load any PDF files", async () => {
    const loadFile = vi.fn(async () => createPdfFile("demo.pdf"));

    const promise = prepareInvoicePdfExport([makeRow({ fileName: "pending.pdf", parseStatus: "idle", edited: false })], {
      loadFile,
    });

    await expect(promise).rejects.toMatchObject({
      details: {
        unresolvedFileNames: ["pending.pdf"],
      },
    });
    expect(loadFile).not.toHaveBeenCalled();
  });

  test("rejects rows whose PDF file cannot be loaded", async () => {
    const loadFile = vi.fn(async (invoiceDocumentId: string) => {
      if (invoiceDocumentId === "doc-2") {
        throw new Error("缺少文件");
      }

      return createPdfFile("doc-1.pdf");
    });

    const promise = prepareInvoicePdfExport(
      [makeRow({ id: "doc-1", fileName: "ok.pdf" }), makeRow({ id: "doc-2", fileName: "missing.pdf", invoiceNumber: "INV-002" })],
      { loadFile },
    );

    await expect(promise).rejects.toMatchObject({
      details: {
        missingPdfFileNames: ["missing.pdf"],
      },
    });
  });

  test("fails invoice-number ZIP exports when any invoice number is blank", async () => {
    const loadFile = vi.fn(async () => createPdfFile("demo.pdf"));

    const promise = prepareInvoicePdfExport([makeRow({ fileName: "blank-number.pdf", invoiceNumber: "   " })], {
      loadFile,
      bundleNamingMode: "invoice_number",
    });

    await expect(promise).rejects.toMatchObject({
      details: {
        missingInvoiceNumberFileNames: ["blank-number.pdf"],
      },
    });
    expect(loadFile).not.toHaveBeenCalled();
  });

  test("builds duplicate-safe bundle names for total-amount ZIP exports", async () => {
    const loadFile = vi.fn(async (invoiceDocumentId: string) => createPdfFile(`${invoiceDocumentId}.pdf`));

    const result = await prepareInvoicePdfExport(
      [
        makeRow({ id: "doc-1", fileName: "one.pdf", totalAmount: 100 }),
        makeRow({ id: "doc-2", fileName: "two.pdf", invoiceNumber: "INV-002", totalAmount: 100 }),
        makeRow({ id: "doc-3", fileName: "three.pdf", invoiceNumber: "INV-003", parseStatus: "idle", edited: true, totalAmount: 200.5 }),
      ],
      {
        loadFile,
        bundleNamingMode: "total_amount",
      },
    );

    expect(result.entries.map((entry) => entry.bundleFileName)).toEqual(["100.pdf", "100_2.pdf", "200.5.pdf"]);
  });
});
