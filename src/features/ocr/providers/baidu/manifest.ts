import type { OcrProviderManifest } from "../types";

export const baiduManifest: OcrProviderManifest = {
  id: "baidu",
  label: "Baidu",
  upstreamOrigin: "https://aip.baidubce.com",
  paths: {
    token: "/oauth/2.0/token",
    invoice: "/rest/2.0/ocr/v1/vat_invoice",
  },
};
