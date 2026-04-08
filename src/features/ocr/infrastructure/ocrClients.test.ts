import { afterEach, describe, expect, it, vi } from "vitest";
import { requestInvoiceOcr } from "./ocrClients";

describe("requestInvoiceOcr", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests Baidu token first and then calls the invoice endpoint", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "baidu-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              InvoiceNum: "INV-API-001",
              InvoiceCode: "CODE-001",
              InvoiceDate: "2026-04-08",
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const file = new File(["pdf-content"], "invoice.pdf", { type: "application/pdf" });
    const response = await requestInvoiceOcr(file, {
      vendor: "baidu",
      credentials: {
        apiKey: "api-key",
        secretKey: "secret-key",
      },
    });

    expect(response).toMatchObject({
      invoiceNumber: "INV-API-001",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/ocr/baidu/oauth/2.0/token?grant_type=client_credentials&client_id=api-key&client_secret=secret-key",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/ocr/baidu/rest/2.0/ocr/v1/vat_invoice?access_token=baidu-token",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "pdf_file=cGRmLWNvbnRlbnQ%3D",
      }),
    );
  });

  it("calls Tencent invoice endpoint with signed request payload", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          Response: {
            MixedInvoiceItems: [
              {
                SingleInvoiceInfos: {
                  VatSpecialInvoice: {
                    InvoiceNum: "INV-API-002",
                    InvoiceCode: "CODE-002",
                    Date: "2026-04-08",
                    Total: "123.45",
                    TotalTax: "23.45",
                    PretaxAmount: "100.00",
                    Buyer: "Buyer",
                    Seller: "Seller",
                    VatInvoiceItemInfos: [
                      {
                        Name: "技术服务费",
                        Total: "100.00",
                        Tax: "23.45",
                        TaxRate: "13%",
                      },
                    ],
                  },
                },
              },
            ],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-08T01:02:03.000Z").getTime());

    const file = new File(["image-content"], "invoice.jpg", { type: "image/jpeg" });
    const response = await requestInvoiceOcr(file, {
      vendor: "tencent",
      credentials: {
        secretId: "secret-id",
        secretKey: "secret-key",
      },
    });

    expect(response).toMatchObject({
      invoiceNumber: "INV-API-002",
      invoiceCode: "CODE-002",
      buyerName: "Buyer",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ocr/tencent/",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-TC-Action": "RecognizeGeneralInvoice",
          "X-TC-Version": "2018-11-19",
          "X-TC-Timestamp": "1775610123",
          Authorization: expect.stringContaining("Credential=secret-id/2026-04-08/ocr/tc3_request"),
        }),
        body: JSON.stringify({
          ImageBase64: "aW1hZ2UtY29udGVudA==",
        }),
      }),
    );
  });

  it("throws the provider-specific error content when OCR responds with an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error_msg: "invalid access token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const file = new File(["pdf-content"], "invoice.pdf", { type: "application/pdf" });

    await expect(
      requestInvoiceOcr(file, {
        vendor: "baidu",
        credentials: {
          apiKey: "api-key",
          secretKey: "secret-key",
        },
      }),
    ).rejects.toThrow("invalid access token");
  });
});
