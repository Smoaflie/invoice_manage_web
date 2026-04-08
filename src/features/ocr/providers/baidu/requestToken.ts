import { baiduManifest } from "./manifest";
import { parseBaiduError } from "./errors";
import { readJsonResponse } from "../readJsonResponse";

function hasBaiduError(body: unknown) {
  return typeof body === "object" && body !== null && ("error_code" in body || "error_msg" in body);
}

export async function requestBaiduAccessToken(
  apiKey: string,
  secretKey: string,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: apiKey,
    client_secret: secretKey,
  });
  const response = await fetch(`/api/ocr/baidu${baiduManifest.paths.token}?${params.toString()}`, {
    method: "POST",
    signal,
  });
  const body = await readJsonResponse(response, "百度 OCR 鉴权接口");

  if (!response.ok) {
    throw new Error(parseBaiduError({ status: response.status, body }));
  }

  if (hasBaiduError(body)) {
    throw new Error(parseBaiduError({ status: response.status, body }));
  }

  if (typeof body?.access_token !== "string" || body.access_token.length === 0) {
    throw new Error("百度 OCR 鉴权失败，未返回 access_token。");
  }

  return body.access_token;
}
