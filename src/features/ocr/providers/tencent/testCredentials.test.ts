import { describe, expect, it, vi } from "vitest";
import { testTencentCredentials } from "./testCredentials";

describe("testTencentCredentials", () => {
  it("throws a clear error when the proxy returns an empty response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 502,
      }),
    );

    await expect(
      testTencentCredentials({
        secretId: "secret-id",
        secretKey: "secret-key",
      }),
    ).rejects.toThrow("腾讯 OCR 测试请求返回空响应，请确认当前运行环境的 /api/ocr/* 转发已接通。");
  });
});
