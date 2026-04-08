import type { OcrProviderField } from "../types";

export const tencentFields: readonly OcrProviderField[] = [
  { id: "secretId", label: "SecretId", settingKey: "ocr.tencentSecretId" },
  { id: "secretKey", label: "SecretKey", settingKey: "ocr.tencentSecretKey" },
];
