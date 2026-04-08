import JSZip from "jszip";
import { describe, expect, test } from "vitest";
import { buildInvoiceBundleZip } from "./invoiceBundleExport";

function createPdfFile() {
  const bytes = new Uint8Array([1, 2, 3]);
  const file = new File([bytes], "source.pdf", { type: "application/pdf" });

  Object.defineProperty(file, "arrayBuffer", {
    value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    configurable: true,
  });

  return file;
}

describe("buildInvoiceBundleZip", () => {
  test("packages renamed pdf files together with selected structured data JSON", async () => {
    const zipBytes = await buildInvoiceBundleZip({
      jsonPayload: {
        invoiceDocuments: [{ id: "doc-1", invoiceNumber: "INV-001" }],
        exportedAt: "2026-04-08T00:00:00.000Z",
      },
      pdfEntries: [
        {
          bundleFileName: "INV-001.pdf",
          file: createPdfFile(),
        },
      ],
    });

    const archive = await JSZip.loadAsync(zipBytes);
    const names = Object.keys(archive.files).sort();

    expect(names).toEqual(["INV-001.pdf", "invoice-export.json"]);
    await expect(archive.file("invoice-export.json")?.async("string")).resolves.toContain("\"invoiceNumber\": \"INV-001\"");
    await expect(archive.file("INV-001.pdf")?.async("uint8array")).resolves.toEqual(new Uint8Array([1, 2, 3]));
  });
});
