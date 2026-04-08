import type { OcrProviderCredentials } from "../types";
import { requestBaiduAccessToken } from "./requestToken";

export async function testBaiduCredentials(credentials: OcrProviderCredentials) {
  const apiKey = credentials.apiKey?.trim() ?? "";
  const secretKey = credentials.secretKey?.trim() ?? "";

  if (!apiKey || !secretKey) {
    throw new Error("请填写百度 OCR 的 API_KEY 和 SECRET_KEY。");
  }

  await requestBaiduAccessToken(apiKey, secretKey);

  return {
    message: "百度 OCR 鉴权通过。",
  };
}
