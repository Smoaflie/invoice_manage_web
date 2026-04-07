import { PDFDocument } from "pdf-lib";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { downloadMergedPdf, exportMergedPdf, mergePdfFiles } from "./exportMergedPdf";

async function createPdfFile(name: string) {
  const pdf = await PDFDocument.create();
  pdf.addPage([200, 200]);
  const bytes = await pdf.save();
  const fileBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const file = new File([fileBuffer], name, { type: "application/pdf" });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    configurable: true,
  });
  return file;
}

describe("exportMergedPdf", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("merges multiple pdf files into one document", async () => {
    const mergedBytes = await mergePdfFiles([await createPdfFile("one.pdf"), await createPdfFile("two.pdf")]);
    const mergedDocument = await PDFDocument.load(mergedBytes);

    expect(mergedDocument.getPageCount()).toBe(2);
  });

  test("downloads the merged pdf with the provided file name", async () => {
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn().mockReturnValue("blob:merged"),
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      configurable: true,
    });
    const click = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockReturnValue({
      click,
      set href(_value: string) {},
      set download(_value: string) {},
    } as unknown as HTMLAnchorElement);

    downloadMergedPdf(new Uint8Array([1, 2, 3]), "picked.pdf");

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(createElement).toHaveBeenCalledWith("a");
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:merged");
  });

  test("exports and downloads a merged pdf", async () => {
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn().mockReturnValue("blob:merged"),
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      configurable: true,
    });
    const click = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      click,
      set href(_value: string) {},
      set download(_value: string) {},
    } as unknown as HTMLAnchorElement);

    await exportMergedPdf([await createPdfFile("one.pdf")], "demo.pdf");

    expect(click).toHaveBeenCalledTimes(1);
  });
});
