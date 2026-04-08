import type { OcrProxyRequestInput } from "../types";
import { parseTencentError } from "./errors";
import { tencentManifest } from "./manifest";
import { normalizeTencentResponse } from "./normalizeResponse";
import { buildTencentAuthorization } from "./signature";
import { readJsonResponse } from "../readJsonResponse";

const TENCENT_ACTION = "RecognizeGeneralInvoice";
const TENCENT_VERSION = "2018-11-19";
const TENCENT_SERVICE = "ocr";

function buildPayload(input: OcrProxyRequestInput) {
  return JSON.stringify(
    input.fileKind === "pdf"
      ? { ImageBase64: input.fileBase64, EnablePdf: true }
      : { ImageBase64: input.fileBase64 },
  );
}

export async function recognizeTencentInvoice(input: OcrProxyRequestInput) {
  const secretId = input.credentials.secretId?.trim() ?? "";
  const secretKey = input.credentials.secretKey?.trim() ?? "";

  if (!secretId || !secretKey) {
    throw new Error("请填写腾讯 OCR 的 SecretId 和 SecretKey。");
  }

  const payload = buildPayload(input);
  const timestamp = Math.floor(Date.now() / 1000);
  const authorization = await buildTencentAuthorization({
    secretId,
    secretKey,
    timestamp,
    payload,
    host: new URL(tencentManifest.upstreamOrigin).host,
    service: TENCENT_SERVICE,
    action: TENCENT_ACTION,
    version: TENCENT_VERSION,
  });
  const response = await fetch(`/api/ocr/tencent${tencentManifest.paths.invoice}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      "X-TC-Action": TENCENT_ACTION,
      "X-TC-Version": TENCENT_VERSION,
      "X-TC-Timestamp": String(timestamp),
    },
    body: payload,
    signal: input.signal,
  });
  const body = await readJsonResponse(response, "腾讯 OCR 识别接口");

  if (!response.ok) {
    throw new Error(parseTencentError({ status: response.status, body }));
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "Response" in body &&
    typeof body.Response === "object" &&
    body.Response !== null &&
    "Error" in body.Response
  ) {
    throw new Error(parseTencentError({ status: response.status, body }));
  }

  return normalizeTencentResponse(body);
}
