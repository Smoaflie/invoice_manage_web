import { describe, expect, it } from "vitest";
import { normalizeTencentResponse } from "./normalizeResponse";

describe("normalizeTencentResponse", () => {
  it("normalizes VatElectronicInvoiceFull responses from MixedInvoiceItems", () => {
    const normalized = normalizeTencentResponse({
      Response: {
        MixedInvoiceItems: [
          {
            SingleInvoiceInfos: {
              VatElectronicInvoiceFull: {
                Buyer: "南京理工大学",
                Seller: "深圳市优信硅创电子有限公司",
                Date: "2025年04月07日",
                Number: "25952000000064642836",
                Code: "144032539110",
                PretaxAmount: "46.88",
                Tax: "0.44",
                Total: "",
                VatElectronicItems: [
                  {
                    Name: "*电子元件*配件",
                    Quantity: "14",
                    Price: "3.34857143",
                    Total: "46.88",
                    TaxRate: "0.95%",
                    Tax: "0.44",
                  },
                ],
              },
            },
          },
        ],
      },
    });

    expect(normalized).toMatchObject({
      invoiceNumber: "25952000000064642836",
      invoiceCode: "144032539110",
      invoiceDate: "2025年04月07日",
      amountWithoutTax: "46.88",
      taxAmount: "0.44",
      totalAmount: "47.32",
      buyerName: "南京理工大学",
      sellerName: "深圳市优信硅创电子有限公司",
      items: [
        expect.objectContaining({
          name: "*电子元件*配件",
          quantity: "14",
          unitPrice: "3.34857143",
          amount: "46.88",
          taxRate: "0.95%",
          tax: "0.44",
        }),
      ],
    });
  });
});
