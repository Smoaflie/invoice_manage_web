import { appDb } from "../../../shared/db/appDb";
import { getStoredHandle } from "../../../shared/fs/fileHandles";
import { openInvoicePdf } from "../../documents/application/openInvoicePdf";
import { OCR_VENDORS, type OcrClientConfig, type OcrVendor } from "../../ocr/infrastructure/ocrClients";

export type DashboardOcrSettings = {
  vendor: string | null;
  enabled: boolean;
};

export async function loadDashboardRows() {
  return appDb.invoiceDocuments.toArray();
}

export async function loadDashboardOcrSettings(): Promise<DashboardOcrSettings> {
  const [vendorSetting, enabledSetting] = await Promise.all([
    appDb.settings.get("ocr.vendor"),
    appDb.settings.get("ocr.enabled"),
  ]);

  return {
    vendor: typeof vendorSetting?.value === "string" || vendorSetting?.value === null ? vendorSetting.value : null,
    enabled: typeof enabledSetting?.value === "boolean" ? enabledSetting.value : false,
  };
}

export function toOcrClientConfig(settings: DashboardOcrSettings): OcrClientConfig {
  if (!settings.enabled) {
    throw new Error("请先在设置中启用 OCR。");
  }

  if (!isSupportedOcrVendor(settings.vendor)) {
    throw new Error("请先选择 OCR 供应商。");
  }

  return {
    vendor: settings.vendor,
  };
}

export async function loadReadableFile(handle: FileSystemFileHandle) {
  const queryPermission = handle.queryPermission?.bind(handle);
  const requestPermission = handle.requestPermission?.bind(handle);
  const descriptor = { mode: "read" as const };

  if (queryPermission) {
    const permissionState = await queryPermission(descriptor);
    if (permissionState !== "granted") {
      const requestedState = requestPermission ? await requestPermission(descriptor) : permissionState;

      if (requestedState !== "granted") {
        throw new Error("当前浏览器未授予文件读取权限，请重新授权后再识别。");
      }
    }
  }

  try {
    return await handle.getFile();
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      throw new Error("当前浏览器未授予文件读取权限，请重新授权后再识别。");
    }

    throw error;
  }
}

export async function getStoredFileHandle(invoiceDocumentId: string): Promise<FileSystemFileHandle> {
  const invoiceDocument = await appDb.invoiceDocuments.get(invoiceDocumentId);

  if (!invoiceDocument) {
    throw new Error(`发票记录不存在：${invoiceDocumentId}`);
  }

  if (!invoiceDocument.handleRef) {
    throw new Error(`当前记录没有已绑定的文件：${invoiceDocument.fileName}`);
  }

  const handle = await getStoredHandle(invoiceDocument.handleRef);

  if (!handle || handle.kind !== "file") {
    throw new Error(`当前文件句柄不可用：${invoiceDocument.fileName}`);
  }

  return handle as FileSystemFileHandle;
}

export async function loadFileFromStoredHandle(invoiceDocumentId: string): Promise<File> {
  return loadReadableFile(await getStoredFileHandle(invoiceDocumentId));
}

export async function openStoredInvoicePdf(invoiceDocumentId: string) {
  const handle = await getStoredFileHandle(invoiceDocumentId);
  await loadReadableFile(handle);
  await openInvoicePdf(handle);
}

export function parseAmount(value: string) {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseTags(tagsText: string) {
  return [...new Set(tagsText.split(/[\s,\n，]+/).map((item) => item.trim()).filter((item) => item.length > 0))];
}

function isSupportedOcrVendor(vendor: string | null): vendor is OcrVendor {
  return vendor !== null && OCR_VENDORS.includes(vendor as OcrVendor);
}
