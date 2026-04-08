import { parseTencentError } from "./errors";
import { tencentFields } from "./fields";
import { tencentManifest } from "./manifest";
import { normalizeTencentResponse } from "./normalizeResponse";
import { recognizeTencentInvoice } from "./recognizeInvoice";
import { testTencentCredentials } from "./testCredentials";
import type { OcrProvider } from "../types";

export const tencentProvider: OcrProvider = {
  id: "tencent",
  label: "Tencent",
  manifest: tencentManifest,
  getSettingsFields: () => tencentFields,
  testCredentials: testTencentCredentials,
  recognizeInvoice: recognizeTencentInvoice,
  parseError: parseTencentError,
  normalizeResponse: normalizeTencentResponse,
};
