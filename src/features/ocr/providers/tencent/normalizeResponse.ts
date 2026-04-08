import type { OcrInvoiceResponse } from "../../infrastructure/normalizeInvoice";

type TencentInvoiceItem = {
  Name?: string;
  Specification?: string;
  Unit?: string;
  Quantity?: string;
  Price?: string;
  Total?: string;
  TaxRate?: string;
  Tax?: string;
};

type TencentInvoiceData = {
  InvoiceNum?: string;
  Number?: string;
  InvoiceCode?: string;
  Code?: string;
  Date?: string;
  Total?: string;
  TotalTax?: string;
  PretaxAmount?: string;
  Tax?: string;
  Buyer?: string;
  PurchaserName?: string;
  Seller?: string;
  SellerName?: string;
  VatElectronicItems?: TencentInvoiceItem[];
  VatInvoiceItemInfos?: TencentInvoiceItem[];
  VatInvoiceInfos?: TencentInvoiceItem[];
};

function sumAmounts(...values: Array<string | undefined>) {
  const numbers = values
    .map((value) => (typeof value === "string" && value.trim().length > 0 ? Number(value) : NaN))
    .filter((value) => Number.isFinite(value));

  if (numbers.length === 0) {
    return undefined;
  }

  return numbers.reduce((total, value) => total + value, 0).toFixed(2);
}

function readInvoiceData(body: unknown): TencentInvoiceData | null {
  if (typeof body !== "object" || body === null || !("Response" in body)) {
    return null;
  }

  const response = body.Response;

  if (typeof response !== "object" || response === null) {
    return null;
  }

  if ("MixedInvoiceItems" in response && Array.isArray(response.MixedInvoiceItems)) {
    for (const item of response.MixedInvoiceItems) {
      if (typeof item !== "object" || item === null || !("SingleInvoiceInfos" in item)) {
        continue;
      }

      const infos = item.SingleInvoiceInfos;

      if (typeof infos !== "object" || infos === null) {
        continue;
      }

      const infoCandidates = [
        "VatSpecialInvoice",
        "VatCommonInvoice",
        "VatElectronicCommonInvoice",
        "VatElectronicSpecialInvoice",
        "VatElectronicInvoiceFull",
        "MotorVehicleSaleInvoice",
        "UsedCarPurchaseInvoice",
      ] as const;

      for (const key of infoCandidates) {
        if (key in infos && typeof infos[key] === "object" && infos[key] !== null) {
          return infos[key] as TencentInvoiceData;
        }
      }
    }
  }

  const candidates = [
    "VatSpecialInvoice",
    "VatCommonInvoice",
    "VatElectronicCommonInvoice",
    "VatElectronicInvoiceFull",
    "MotorVehicleSaleInvoice",
    "UsedCarPurchaseInvoice",
  ] as const;

  for (const key of candidates) {
    if (key in response && typeof response[key] === "object" && response[key] !== null) {
      return response[key] as TencentInvoiceData;
    }
  }

  return null;
}

export function normalizeTencentResponse(body: unknown): OcrInvoiceResponse {
  const invoice = readInvoiceData(body);

  if (!invoice) {
    return (body ?? {}) as OcrInvoiceResponse;
  }

  return {
    invoiceNumber: invoice.InvoiceNum ?? invoice.Number,
    invoiceCode: invoice.InvoiceCode ?? invoice.Code,
    invoiceDate: invoice.Date,
    totalAmount: invoice.Total && invoice.Total.trim().length > 0 ? invoice.Total : sumAmounts(invoice.PretaxAmount, invoice.TotalTax ?? invoice.Tax),
    taxAmount: invoice.TotalTax ?? invoice.Tax,
    amountWithoutTax: invoice.PretaxAmount,
    buyerName: invoice.Buyer ?? invoice.PurchaserName,
    sellerName: invoice.Seller ?? invoice.SellerName,
    items: (invoice.VatElectronicItems ?? invoice.VatInvoiceItemInfos ?? invoice.VatInvoiceInfos)?.map((item) => ({
      name: item.Name ?? "",
      type: item.Specification ?? "",
      unit: item.Unit ?? "",
      quantity: item.Quantity ?? "",
      unitPrice: item.Price ?? "",
      amount: item.Total ?? "",
      taxRate: item.TaxRate ?? "",
      tax: item.Tax ?? "",
    })),
  };
}
