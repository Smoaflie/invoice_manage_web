export type InvoiceBundlePdfEntry = {
  bundleFileName: string;
  file: File;
};

type BuildInvoiceBundleZipInput = {
  jsonPayload: unknown;
  pdfEntries: InvoiceBundlePdfEntry[];
};

export async function buildInvoiceBundleZip(input: BuildInvoiceBundleZipInput) {
  const { default: JSZip } = await import("jszip");
  const archive = new JSZip();

  archive.file("invoice-export.json", JSON.stringify(input.jsonPayload, null, 2));

  for (const entry of input.pdfEntries) {
    const bytes = "arrayBuffer" in entry.file ? await entry.file.arrayBuffer() : await new Response(entry.file).arrayBuffer();
    archive.file(entry.bundleFileName, bytes);
  }

  return archive.generateAsync({ type: "uint8array" });
}

export function downloadInvoiceBundle(zipBytes: Uint8Array, fileName: string) {
  const blob = new Blob([zipBytes.slice().buffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportInvoiceBundle(input: BuildInvoiceBundleZipInput, fileName = "invoice-export-bundle.zip") {
  downloadInvoiceBundle(await buildInvoiceBundleZip(input), fileName);
}
