import { describe, expect, it, vi } from "vitest";
import { testBaiduCredentials } from "./testCredentials";

describe("testBaiduCredentials", () => {
  it("throws a clear error when the proxy returns an empty response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 502,
      }),
    );

    await expect(
      testBaiduCredentials({
        apiKey: "api-key",
        secretKey: "secret-key",
      }),
    ).rejects.toThrow("百度 OCR 鉴权接口返回空响应，请确认当前运行环境的 /api/ocr/* 转发已接通。");
  });
});
