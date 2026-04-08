import type { SettingsKey } from "../../../shared/types/settings";
import { baiduProvider } from "./baidu/provider";
import { tencentProvider } from "./tencent/provider";
import type { OcrProvider, OcrProviderId } from "./types";

export const OCR_PROVIDERS: readonly OcrProvider[] = [baiduProvider, tencentProvider];

export function getOcrProvider(providerId: OcrProviderId): OcrProvider {
  const provider = OCR_PROVIDERS.find((entry) => entry.id === providerId);

  if (!provider) {
    throw new Error(`Unsupported OCR provider: ${providerId}`);
  }

  return provider;
}

export function isOcrProviderId(value: string | null): value is OcrProviderId {
  return value !== null && OCR_PROVIDERS.some((provider) => provider.id === value);
}

export function getOcrProviderOptions() {
  return OCR_PROVIDERS.map((provider) => ({
    value: provider.id,
    label: provider.manifest.label,
  }));
}

export function getAllOcrProviderSettingKeys(): SettingsKey[] {
  return OCR_PROVIDERS.flatMap((provider) => provider.getSettingsFields().map((field) => field.settingKey));
}
