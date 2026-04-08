import type { OcrProviderErrorInput } from "../types";

export function parseTencentError(input: OcrProviderErrorInput) {
  if (
    typeof input.body === "object" &&
    input.body !== null &&
    "Response" in input.body &&
    typeof input.body.Response === "object" &&
    input.body.Response !== null &&
    "Error" in input.body.Response &&
    typeof input.body.Response.Error === "object" &&
    input.body.Response.Error !== null &&
    "Message" in input.body.Response.Error &&
    typeof input.body.Response.Error.Message === "string"
  ) {
    return input.body.Response.Error.Message;
  }

  return `OCR 请求失败：${input.status}`;
}
