import type { OcrCredentialSettingKey } from "../../../shared/types/settings";
import type { OcrInvoiceResponse } from "../infrastructure/normalizeInvoice";

export type OcrProviderId = "baidu" | "tencent";

export type OcrProviderField = {
  id: string;
  label: string;
  settingKey: OcrCredentialSettingKey;
};

export type OcrProviderCredentials = Record<string, string>;

export type OcrProxyRequestInput = {
  fileName: string;
  mimeType: string;
  fileBase64: string;
  fileKind: "pdf" | "image";
  credentials: OcrProviderCredentials;
  signal?: AbortSignal;
};

export type OcrProviderErrorInput = {
  status: number;
  body: unknown;
};

export type OcrProviderManifest = {
  id: OcrProviderId;
  label: string;
  upstreamOrigin: string;
  paths: {
    token?: string;
    invoice?: string;
  };
};

export type OcrProviderTestResult = {
  message: string;
};

export interface OcrProvider {
  id: OcrProviderId;
  label: string;
  manifest: OcrProviderManifest;
  getSettingsFields(): readonly OcrProviderField[];
  testCredentials(credentials: OcrProviderCredentials): Promise<OcrProviderTestResult>;
  recognizeInvoice(input: OcrProxyRequestInput): Promise<OcrInvoiceResponse>;
  parseError(input: OcrProviderErrorInput): string;
  normalizeResponse(body: unknown): OcrInvoiceResponse;
}
