import { afterEach, describe, expect, it, vi } from "vitest";
import { requestInvoiceOcr } from "./ocrClients";
import { extensionBridgeParse } from "../bridge/extensionBridge";

vi.mock("../bridge/extensionBridge", () => ({
  extensionBridgeParse: vi.fn(),
}));

describe("requestInvoiceOcr", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("converts PDF files into extension bridge payloads", async () => {
    vi.mocked(extensionBridgeParse).mockResolvedValue({
      invoiceNumber: "INV-EXT-001",
    });

    const file = new File(["pdf-content"], "invoice.pdf", { type: "application/pdf" });
    const response = await requestInvoiceOcr(file, {
      vendor: "baidu",
      credentials: {
        appId: "app-id",
        apiKey: "api-key",
        secretKey: "secret-key",
      },
    });

    expect(response).toMatchObject({
      invoiceNumber: "INV-EXT-001",
    });
    expect(extensionBridgeParse).toHaveBeenCalledWith({
      vendor: "baidu",
      fileName: "invoice.pdf",
      mimeType: "application/pdf",
      fileBase64: "cGRmLWNvbnRlbnQ=",
      fileKind: "pdf",
    });
  });

  it("marks non-pdf uploads as image payloads", async () => {
    vi.mocked(extensionBridgeParse).mockResolvedValue({
      invoiceNumber: "INV-EXT-002",
    });

    const file = new File(["image-content"], "invoice.jpg", { type: "image/jpeg" });
    await requestInvoiceOcr(file, {
      vendor: "tencent",
      credentials: {
        appId: "",
        apiKey: "",
        secretKey: "",
      },
    });

    expect(extensionBridgeParse).toHaveBeenCalledWith({
      vendor: "tencent",
      fileName: "invoice.jpg",
      mimeType: "image/jpeg",
      fileBase64: "aW1hZ2UtY29udGVudA==",
      fileKind: "image",
    });
  });
});
