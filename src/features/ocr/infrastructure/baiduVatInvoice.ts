import type { InvoiceItem } from "../../../shared/types/invoiceRecord";
import type { OcrInvoiceResponse } from "./normalizeInvoice";

type BaiduWord = {
  row?: string;
  word?: string;
};

type BaiduWordsResult = Record<string, string | BaiduWord[] | undefined>;

function readWord(value: string | BaiduWord[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0 && typeof value[0]?.word === "string") {
    return value[0].word;
  }

  return "";
}

function toRows(values: string | BaiduWord[] | undefined, offset: number) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((entry) => ({
    row: Number(entry.row ?? "0") + offset,
    word: entry.word ?? "",
  }));
}

function collectRows(pages: BaiduWordsResult[], key: string) {
  const rows: Array<{ row: number; word: string }> = [];
  let offset = 0;

  for (const page of pages) {
    const pageRows = toRows(page[key], offset);
    rows.push(...pageRows);
    const pageMaxRow = pageRows.reduce((max, entry) => Math.max(max, entry.row), offset);
    offset = pageMaxRow + 1;
  }

  return rows;
}

function buildRowWords(rows: Array<{ row: number; word: string }>) {
  const words: string[] = [];

  for (const entry of rows) {
    while (words.length < entry.row) {
      words.push("");
    }

    words[entry.row] = entry.word;
  }

  return words;
}

function sliceWordRange(words: string[], start: number, end: number) {
  return words.slice(start, end).join("");
}

function readCommodityItems(pages: BaiduWordsResult[]): InvoiceItem[] {
  const fields = [
    "CommodityName",
    "CommodityType",
    "CommodityUnit",
    "CommodityNum",
    "CommodityPrice",
    "CommodityAmount",
    "CommodityTaxRate",
    "CommodityTax",
  ] as const;

  const rowMap = Object.fromEntries(
    fields.map((field) => [field, buildRowWords(collectRows(pages, field))]),
  ) as Record<(typeof fields)[number], string[]>;
  const amountRows = collectRows(pages, "CommodityAmount").map((entry) => entry.row);

  if (amountRows.length === 0) {
    return [];
  }

  const boundaries = [...amountRows, Math.max(...amountRows) + 1];

  return boundaries.slice(0, -1).map((startRow, index) => ({
    name: sliceWordRange(rowMap.CommodityName, startRow, boundaries[index + 1]),
    type: sliceWordRange(rowMap.CommodityType, startRow, boundaries[index + 1]),
    unit: sliceWordRange(rowMap.CommodityUnit, startRow, boundaries[index + 1]),
    quantity: sliceWordRange(rowMap.CommodityNum, startRow, boundaries[index + 1]),
    unitPrice: sliceWordRange(rowMap.CommodityPrice, startRow, boundaries[index + 1]),
    amount: sliceWordRange(rowMap.CommodityAmount, startRow, boundaries[index + 1]),
    taxRate: sliceWordRange(rowMap.CommodityTaxRate, startRow, boundaries[index + 1]),
    tax: sliceWordRange(rowMap.CommodityTax, startRow, boundaries[index + 1]),
  }));
}

export function normalizeBaiduVatInvoiceResponse(pages: BaiduWordsResult[]): OcrInvoiceResponse {
  const lastPage = pages.at(-1);

  if (!lastPage) {
    throw new Error("Baidu OCR returned no invoice pages.");
  }

  return {
    invoiceNumber: readWord(lastPage.InvoiceNum),
    invoiceCode: readWord(lastPage.InvoiceCode),
    invoiceDate: readWord(lastPage.InvoiceDate),
    totalAmount: readWord(lastPage.AmountInFiguers),
    amountWithoutTax: readWord(lastPage.TotalAmount),
    taxAmount: readWord(lastPage.TotalTax),
    buyerName: readWord(lastPage.PurchaserName),
    sellerName: readWord(lastPage.SellerName),
    items: readCommodityItems(pages),
  };
}
