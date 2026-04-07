import { PDFDocument } from "pdf-lib";

export async function mergePdfFiles(files: File[]) {
  if (files.length === 0) {
    throw new Error("请选择至少一个 PDF 文件。");
  }

  const mergedDocument = await PDFDocument.create();

  for (const file of files) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      throw new Error(`仅支持导出 PDF 文件：${file.name}`);
    }

    const sourceBytes = "arrayBuffer" in file ? await file.arrayBuffer() : await new Response(file).arrayBuffer();
    const sourceDocument = await PDFDocument.load(sourceBytes);
    const copiedPages = await mergedDocument.copyPages(sourceDocument, sourceDocument.getPageIndices());
    copiedPages.forEach((page) => mergedDocument.addPage(page));
  }

  return mergedDocument.save();
}

export function downloadMergedPdf(pdfBytes: Uint8Array, fileName: string) {
  const normalizedBytes = pdfBytes.slice();
  const blob = new Blob([normalizedBytes.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportMergedPdf(files: File[], fileName = "merged-invoices.pdf") {
  const pdfBytes = await mergePdfFiles(files);
  downloadMergedPdf(pdfBytes, fileName);
}
