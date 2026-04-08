import { describe, expect, it } from "vitest";
import { createOcrViteProxyConfig } from "./viteProxy";

describe("createOcrViteProxyConfig", () => {
  it("creates dev proxy rules for each OCR provider prefix", () => {
    const proxyConfig = createOcrViteProxyConfig();
    const baidu = proxyConfig["/api/ocr/baidu/"];
    const tencent = proxyConfig["/api/ocr/tencent/"];

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
    const baidu = proxyConfig["/api/ocr/baidu/"];
    const tencent = proxyConfig["/api/ocr/tencent/"];

    expect(typeof baidu).toBe("object");
    expect(typeof tencent).toBe("object");
    expect(baidu && "rewrite" in baidu ? baidu.rewrite?.("/api/ocr/baidu/oauth/2.0/token") : "").toBe("/oauth/2.0/token");
    expect(tencent && "rewrite" in tencent ? tencent.rewrite?.("/api/ocr/tencent/") : "").toBe("/");
  });
});
