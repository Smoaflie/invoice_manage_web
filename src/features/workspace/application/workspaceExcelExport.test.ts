import { Workbook } from "exceljs";
import { describe, expect, test } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { buildWorkspaceFields } from "./workspaceFields";
import { buildWorkspaceExcelExport } from "./workspaceExcelExport";

const fields = buildWorkspaceFields({
  tagGroups: [{ id: "expense-status", name: "报销状态", sortOrder: 1 }],
  tagGroupLinks: [{ tagName: "待报销", groupId: "expense-status" }],
});

const rows: InvoiceDocument[] = [
  {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "demo.pdf",
    fileSize: 2048,
    lastModified: 1712188800000,
    relativePath: "2026/04/demo.pdf",
    proofFiles: ["proof-a.png", "proof-b.png"],
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: "baidu",
    ocrParsedAt: "2026-04-04T08:00:00.000Z",
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-001",
    invoiceCode: "CODE-001",
    invoiceDate: "2026-04-03",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "华东买方",
    sellerName: "上海供应商",
    items: [
      {
        name: "差旅服务费",
        type: "住宿",
        unit: "晚",
        num: 2,
        unit_price: 200,
        amount: 400,
        tax_rate: "6%",
        tax: 24,
      },
      {
        name: "会议服务费",
        type: "会务",
        unit: "场",
        num: 1,
        unit_price: 500,
        amount: 500,
        tax_rate: "6%",
        tax: 30,
      },
    ],
    tags: ["待报销"],
    remark: "需要尽快报销",
    annotation: "发票原件已收齐",
    uploader: "张三",
    owner: "李四",
    sourceType: "ocr",
    edited: true,
    createdAt: "2026-04-04T08:00:00.000Z",
    updatedAt: "2026-04-04T08:30:00.000Z",
  },
];

function findColumnNumberByHeader(workbook: Workbook, header: string) {
  const worksheet = workbook.getWorksheet(1);
  expect(worksheet).toBeDefined();

  for (let columnNumber = 1; columnNumber <= worksheet.columnCount; columnNumber += 1) {
    if (worksheet.getRow(1).getCell(columnNumber).value === header) {
      return columnNumber;
    }
  }

  throw new Error(`Missing header: ${header}`);
}

describe("workspaceExcelExport", () => {
  test("builds a real xlsx export file", async () => {
    const result = await buildWorkspaceExcelExport({
      invoiceDocuments: rows,
      fields,
      now: () => new Date("2026-04-04T09:30:00.000Z"),
    });

    expect(result.filename).toBe("invoice-workspace-2026-04-04T09-30-00-000Z.xlsx");
    expect(result.mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(result.content).toBeInstanceOf(Uint8Array);

    const workbook = new Workbook();
    await workbook.xlsx.load(result.content as never);
    const worksheet = workbook.getWorksheet(1);
    expect(worksheet).toBeDefined();
    expect(workbook.worksheets).toHaveLength(1);

    const invoiceNumberColumn = findColumnNumberByHeader(workbook, "发票号码");
    const proofFilesColumn = findColumnNumberByHeader(workbook, "证明文件");
    const totalAmountColumn = findColumnNumberByHeader(workbook, "总金额");
    const taxAmountColumn = findColumnNumberByHeader(workbook, "税额");
    const amountWithoutTaxColumn = findColumnNumberByHeader(workbook, "未税金额");
    const lastModifiedColumn = findColumnNumberByHeader(workbook, "最后修改时间戳");
    const lastModifiedReadableColumn = findColumnNumberByHeader(workbook, "最后修改时间戳(易读)");
    const ocrParsedAtColumn = findColumnNumberByHeader(workbook, "OCR时间");
    const ocrParsedAtReadableColumn = findColumnNumberByHeader(workbook, "OCR时间(易读)");
    const itemDetailColumn = findColumnNumberByHeader(workbook, "商品详情");

    expect(worksheet.getCell(2, invoiceNumberColumn).value).toBe("INV-001");
    expect(worksheet.getCell(2, invoiceNumberColumn).numFmt).toBe("@");

    expect(worksheet.getCell(2, proofFilesColumn).value).toBe("proof-a.png\nproof-b.png");
    expect(worksheet.getCell(2, proofFilesColumn).numFmt).toBe("@");
    expect(worksheet.getCell(2, proofFilesColumn).alignment?.wrapText).toBe(true);

    expect(worksheet.getCell(2, itemDetailColumn).value).toBe(
      "差旅服务费 | 住宿 | 晚 | 2 | 200 | 400 | 6% | 24\n会议服务费 | 会务 | 场 | 1 | 500 | 500 | 6% | 30",
    );
    expect(worksheet.getCell(2, itemDetailColumn).numFmt).toBe("@");
    expect(worksheet.getCell(2, itemDetailColumn).alignment?.wrapText).toBe(true);

    expect(worksheet.getCell(2, totalAmountColumn).value).toBe(100);
    expect(worksheet.getCell(2, totalAmountColumn).numFmt).toBe("0.00");
    expect(worksheet.getCell(2, taxAmountColumn).value).toBe(10);
    expect(worksheet.getCell(2, taxAmountColumn).numFmt).toBe("0.00");
    expect(worksheet.getCell(2, amountWithoutTaxColumn).value).toBe(90);
    expect(worksheet.getCell(2, amountWithoutTaxColumn).numFmt).toBe("0.00");

    expect(worksheet.getCell(2, lastModifiedColumn).value).toBe("1712188800000");
    expect(worksheet.getCell(2, lastModifiedColumn).numFmt).toBe("@");
    expect(worksheet.getCell(2, lastModifiedReadableColumn).value).toBe("2024/4/4 08:00:00");
    expect(worksheet.getCell(2, lastModifiedReadableColumn).numFmt).toBe("@");

    expect(worksheet.getCell(2, ocrParsedAtColumn).value).toBe("2026-04-04T08:00:00.000Z");
    expect(worksheet.getCell(2, ocrParsedAtColumn).numFmt).toBe("@");
    expect(worksheet.getCell(2, ocrParsedAtReadableColumn).value).toBe("2026/4/4 16:00:00");
    expect(worksheet.getCell(2, ocrParsedAtReadableColumn).numFmt).toBe("@");
  });
});
