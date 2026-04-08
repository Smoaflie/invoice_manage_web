import type { OcrProviderField } from "../types";

export const baiduFields: readonly OcrProviderField[] = [
  { id: "apiKey", label: "API_KEY", settingKey: "ocr.baiduApiKey" },
  { id: "secretKey", label: "SECRET_KEY", settingKey: "ocr.baiduSecretKey" },
];
