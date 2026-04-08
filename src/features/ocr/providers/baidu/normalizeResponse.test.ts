import { describe, expect, it } from "vitest";
import { normalizeBaiduResponse } from "./normalizeResponse";

describe("normalizeBaiduResponse", () => {
  it("normalizes object responses with a top-level words_result payload", () => {
    const normalized = normalizeBaiduResponse({
      words_result: {
        InvoiceNum: "25952000000064642836",
        InvoiceCode: "144032539110",
        InvoiceDate: "2025年04月07日",
        AmountInFiguers: "47.32",
        TotalAmount: "46.88",
        TotalTax: "0.44",
        PurchaserName: "南京理工大学",
        SellerName: "深圳市优信硅创电子有限公司",
      },
    });

    expect(normalized).toMatchObject({
      invoiceNumber: "25952000000064642836",
      invoiceCode: "144032539110",
      invoiceDate: "2025年04月07日",
      totalAmount: "47.32",
      amountWithoutTax: "46.88",
      taxAmount: "0.44",
      buyerName: "南京理工大学",
      sellerName: "深圳市优信硅创电子有限公司",
    });
  });
});
