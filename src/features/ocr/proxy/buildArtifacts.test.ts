import { describe, expect, it } from "vitest";
import { renderOcrProxyScript, renderVercelConfig } from "./buildArtifacts";

describe("buildArtifacts", () => {
  it("renders fixed provider proxy routes for the standalone proxy script", () => {
    const script = renderOcrProxyScript();

    expect(script).toContain('"/api/ocr/baidu/"');
    expect(script).toContain('"https://aip.baidubce.com"');
    expect(script).toContain('"/api/ocr/tencent/"');
    expect(script).toContain('"https://ocr.tencentcloudapi.com"');
    expect(script).toContain('upstreamUrl.protocol === "http:" ? http : https');
  });

  it("renders fixed provider rewrites for demo builds", () => {
    const vercel = renderVercelConfig();

    expect(vercel).toEqual({
      rewrites: [
        {
          source: "/api/ocr/baidu/:path*",
          destination: "https://aip.baidubce.com/:path*",
        },
        {
          source: "/api/ocr/tencent/:path*",
          destination: "https://ocr.tencentcloudapi.com/:path*",
        },
      ],
    });
  });
});
