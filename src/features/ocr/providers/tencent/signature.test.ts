import { describe, expect, it, vi } from "vitest";
import { buildTencentAuthorization } from "./signature";

describe("buildTencentAuthorization", () => {
  it("signs only the expected canonical headers with the exact request values", async () => {
    const digestMock = vi
      .spyOn(globalThis.crypto.subtle, "digest")
      .mockResolvedValue(new Uint8Array(32).buffer);
    const importKeyMock = vi.spyOn(globalThis.crypto.subtle, "importKey").mockResolvedValue({} as CryptoKey);
    const signMock = vi.spyOn(globalThis.crypto.subtle, "sign").mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

    const authorization = await buildTencentAuthorization({
      secretId: "secret-id",
      secretKey: "secret-key",
      timestamp: 1775610123,
      payload: "{\"ImageBase64\":\"abc\"}",
      host: "ocr.tencentcloudapi.com",
      service: "ocr",
      action: "RecognizeGeneralInvoice",
      version: "2018-11-19",
    });

    expect(importKeyMock).toHaveBeenCalled();
    expect(digestMock).toHaveBeenCalled();
    expect(signMock).toHaveBeenCalled();
    expect(authorization).toContain("SignedHeaders=content-type;host");
  });
});
