import type { InvoiceItem } from "../../../shared/types/invoiceRecord";

export interface OcrInvoiceResponse {
  invoiceNumber?: string | null;
  invoiceCode?: string | null;
  invoiceDate?: string | null;
  totalAmount?: number | string | null;
  taxAmount?: number | string | null;
  amountWithoutTax?: number | string | null;
  buyerName?: string | null;
  sellerName?: string | null;
  items?: InvoiceItem[] | null;
}

export interface NormalizedInvoice {
  invoiceNumber: string;
  invoiceCode: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  amountWithoutTax: number;
  buyerName: string;
  sellerName: string;
  items: InvoiceItem[];
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function normalizeInvoice(response: OcrInvoiceResponse): NormalizedInvoice {
  return {
    invoiceNumber: toText(response.invoiceNumber),
    invoiceCode: toText(response.invoiceCode),
    invoiceDate: toText(response.invoiceDate),
    totalAmount: toNumber(response.totalAmount),
    taxAmount: toNumber(response.taxAmount),
    amountWithoutTax: toNumber(response.amountWithoutTax),
    buyerName: toText(response.buyerName),
    sellerName: toText(response.sellerName),
    items: Array.isArray(response.items) ? response.items : [],
  };
}
