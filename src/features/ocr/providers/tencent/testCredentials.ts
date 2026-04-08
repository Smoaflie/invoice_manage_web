import type { OcrProviderCredentials } from "../types";
import { readJsonResponse } from "../readJsonResponse";
import { parseTencentError } from "./errors";
import { tencentManifest } from "./manifest";
import { buildTencentAuthorization } from "./signature";

const TEST_ACTION = "RecognizeGeneralInvoice";
const TEST_VERSION = "2018-11-19";
const TEST_SERVICE = "ocr";
const TEST_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0p0s8AAAAASUVORK5CYII=";

function isAuthFailure(body: unknown) {
  if (
    typeof body !== "object" ||
    body === null ||
    !("Response" in body) ||
    typeof body.Response !== "object" ||
    body.Response === null ||
    !("Error" in body.Response) ||
    typeof body.Response.Error !== "object" ||
    body.Response.Error === null ||
    !("Code" in body.Response.Error) ||
    typeof body.Response.Error.Code !== "string"
  ) {
    return false;
  }

  const code = body.Response.Error.Code;
  return code.startsWith("AuthFailure") || code.startsWith("FailedOperation.Signature") || code.startsWith("InvalidAuthorization");
}

export async function testTencentCredentials(credentials: OcrProviderCredentials) {
  const secretId = credentials.secretId?.trim() ?? "";
  const secretKey = credentials.secretKey?.trim() ?? "";

  if (!secretId || !secretKey) {
    throw new Error("请填写腾讯 OCR 的 SecretId 和 SecretKey。");
  }

  const payload = JSON.stringify({ ImageBase64: TEST_IMAGE_BASE64 });
  const timestamp = Math.floor(Date.now() / 1000);
  const authorization = await buildTencentAuthorization({
    secretId,
    secretKey,
    timestamp,
    payload,
    host: new URL(tencentManifest.upstreamOrigin).host,
    service: TEST_SERVICE,
    action: TEST_ACTION,
    version: TEST_VERSION,
  });
  const response = await fetch(`/api/ocr/tencent${tencentManifest.paths.invoice}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      "X-TC-Action": TEST_ACTION,
      "X-TC-Version": TEST_VERSION,
      "X-TC-Timestamp": String(timestamp),
    },
    body: payload,
  });
  const body = await readJsonResponse(response, "腾讯 OCR 测试请求");

  if (!response.ok || isAuthFailure(body)) {
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
    return {
      message: `腾讯 OCR 鉴权已通过`,
    };
  }

  return {
    message: "腾讯 OCR 鉴权通过。",
  };
}
