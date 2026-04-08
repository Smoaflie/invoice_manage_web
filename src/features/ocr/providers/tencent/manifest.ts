import type { OcrProviderManifest } from "../types";

export const tencentManifest: OcrProviderManifest = {
  id: "tencent",
  label: "Tencent",
  upstreamOrigin: "https://ocr.tencentcloudapi.com",
  paths: {
    invoice: "/",
  },
};
