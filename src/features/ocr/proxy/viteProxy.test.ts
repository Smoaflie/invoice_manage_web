import { describe, expect, it } from "vitest";
import { createOcrViteProxyConfig } from "./viteProxy";

function expectProxyRule(value: unknown) {
  expect(typeof value).toBe("object");
  expect(value).not.toBeNull();
  return value as { target: string; changeOrigin: boolean; rewrite?: (path: string) => string };
}

describe("createOcrViteProxyConfig", () => {
  it("creates dev proxy rules for each OCR provider prefix", () => {
    const proxyConfig = createOcrViteProxyConfig();
    const baidu = expectProxyRule(proxyConfig["/api/ocr/baidu/"]);
    const tencent = expectProxyRule(proxyConfig["/api/ocr/tencent/"]);

    expect(baidu).toMatchObject({
      target: "https://aip.baidubce.com",
      changeOrigin: true,
    });
    expect(tencent).toMatchObject({
      target: "https://ocr.tencentcloudapi.com",
      changeOrigin: true,
    });
  });

  it("rewrites provider routes back to upstream-relative paths", () => {
    const proxyConfig = createOcrViteProxyConfig();
    const baidu = expectProxyRule(proxyConfig["/api/ocr/baidu/"]);
    const tencent = expectProxyRule(proxyConfig["/api/ocr/tencent/"]);

    expect(baidu.rewrite?.("/api/ocr/baidu/oauth/2.0/token")).toBe("/oauth/2.0/token");
    expect(tencent.rewrite?.("/api/ocr/tencent/")).toBe("/");
  });
});
