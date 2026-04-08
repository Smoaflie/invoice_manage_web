import type { OcrProxyRequestInput } from "../types";
import { parseBaiduError } from "./errors";
import { baiduManifest } from "./manifest";
import { normalizeBaiduResponse } from "./normalizeResponse";
import { requestBaiduAccessToken } from "./requestToken";
import { readJsonResponse } from "../readJsonResponse";

function hasBaiduError(body: unknown) {
  return typeof body === "object" && body !== null && ("error_code" in body || "error_msg" in body);
}

function toInvoiceBody(input: OcrProxyRequestInput) {
  return new URLSearchParams(
    input.fileKind === "pdf"
      ? { pdf_file: input.fileBase64 }
      : { image: input.fileBase64 },
  ).toString();
}

export async function recognizeBaiduInvoice(input: OcrProxyRequestInput) {
  const apiKey = input.credentials.apiKey?.trim() ?? "";
  const secretKey = input.credentials.secretKey?.trim() ?? "";

  if (!apiKey || !secretKey) {
    throw new Error("请填写百度 OCR 的 API_KEY 和 SECRET_KEY。");
  }

  const accessToken = await requestBaiduAccessToken(apiKey, secretKey, input.signal);
  const response = await fetch(
    `/api/ocr/baidu${baiduManifest.paths.invoice}?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: toInvoiceBody(input),
      signal: input.signal,
    },
  );
  const body = await readJsonResponse(response, "百度 OCR 识别接口");

  if (!response.ok) {
    throw new Error(parseBaiduError({ status: response.status, body }));
  }

  if (hasBaiduError(body)) {
    throw new Error(parseBaiduError({ status: response.status, body }));
  }

  return normalizeBaiduResponse(body);
}
