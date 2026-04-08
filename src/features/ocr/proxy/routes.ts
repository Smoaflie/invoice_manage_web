import { OCR_PROVIDERS } from "../providers/registry";

export type OcrProxyRoute = {
  providerId: string;
  prefix: string;
  upstreamOrigin: string;
};

export function getOcrProxyRoutes(): OcrProxyRoute[] {
  return OCR_PROVIDERS.map((provider) => ({
    providerId: provider.id,
    prefix: `/api/ocr/${provider.id}/`,
    upstreamOrigin: provider.manifest.upstreamOrigin,
  }));
}
