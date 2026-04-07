import type { OcrInvoiceResponse } from "./normalizeInvoice";
import { extensionBridgeParse } from "../bridge/extensionBridge";

export const OCR_VENDORS = ["baidu", "tencent"] as const;

export type OcrVendor = (typeof OCR_VENDORS)[number];

export interface OcrClientCredentials {
  appId: string;
  apiKey: string;
  secretKey: string;
}

export interface OcrClientConfig {
  vendor: OcrVendor;
  credentials?: OcrClientCredentials;
}

export interface OcrRequestOptions {
  signal?: AbortSignal;
}

async function readBase64(file: File) {
  const buffer =
    typeof file.arrayBuffer === "function" ? await file.arrayBuffer() : await readFileWithReader(file);
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function readFileWithReader(file: File) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(reader.error ?? new Error(`Failed to read ${file.name}.`));
    };

    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error(`Failed to read ${file.name} as binary data.`));
        return;
      }

      resolve(reader.result);
    };

    reader.readAsArrayBuffer(file);
  });
}

function getFileKind(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "image";
}

function assertSupportedVendor(vendor: string): asserts vendor is OcrVendor {
  if (!OCR_VENDORS.includes(vendor as OcrVendor)) {
    throw new Error(`Unsupported OCR vendor: ${vendor}`);
  }
}

async function requestExtensionInvoiceOcr(
  file: File,
  config: OcrClientConfig,
  options: OcrRequestOptions = {},
): Promise<OcrInvoiceResponse> {
  if (options.signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  assertSupportedVendor(config.vendor);
  const encodedFile = await readBase64(file);

  return extensionBridgeParse(
    {
      vendor: config.vendor,
      fileName: file.name,
      mimeType: file.type,
      fileBase64: encodedFile,
      fileKind: getFileKind(file),
    },
  );
}

export async function requestInvoiceOcr(
  file: File,
  config: OcrClientConfig,
  options: OcrRequestOptions = {},
): Promise<OcrInvoiceResponse> {
  return requestExtensionInvoiceOcr(file, config, options);
}
