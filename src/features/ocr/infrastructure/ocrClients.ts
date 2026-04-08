import type { OcrInvoiceResponse } from "./normalizeInvoice";
import { getOcrProvider, isOcrProviderId } from "../providers/registry";
import type { OcrProviderCredentials, OcrProviderId } from "../providers/types";

export type OcrVendor = OcrProviderId;

export interface OcrClientConfig {
  vendor: OcrVendor;
  credentials?: OcrProviderCredentials;
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
  if (!isOcrProviderId(vendor)) {
    throw new Error(`Unsupported OCR vendor: ${vendor}`);
  }
}

async function requestApiInvoiceOcr(
  file: File,
  config: OcrClientConfig,
  options: OcrRequestOptions = {},
): Promise<OcrInvoiceResponse> {
  if (options.signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  assertSupportedVendor(config.vendor);
  const provider = getOcrProvider(config.vendor);
  return provider.recognizeInvoice({
    fileName: file.name,
    mimeType: file.type,
    fileBase64: await readBase64(file),
    fileKind: getFileKind(file),
    credentials: config.credentials ?? {},
    signal: options.signal,
  });
}

export async function requestInvoiceOcr(
  file: File,
  config: OcrClientConfig,
  options: OcrRequestOptions = {},
): Promise<OcrInvoiceResponse> {
  return requestApiInvoiceOcr(file, config, options);
}
