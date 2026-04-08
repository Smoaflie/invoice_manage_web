import { parseBaiduError } from "./errors";
import { baiduFields } from "./fields";
import { baiduManifest } from "./manifest";
import { normalizeBaiduResponse } from "./normalizeResponse";
import { recognizeBaiduInvoice } from "./recognizeInvoice";
import { testBaiduCredentials } from "./testCredentials";
import type { OcrProvider } from "../types";

export const baiduProvider: OcrProvider = {
  id: "baidu",
  label: "Baidu",
  manifest: baiduManifest,
  getSettingsFields: () => baiduFields,
  testCredentials: testBaiduCredentials,
  recognizeInvoice: recognizeBaiduInvoice,
  parseError: parseBaiduError,
  normalizeResponse: normalizeBaiduResponse,
};
