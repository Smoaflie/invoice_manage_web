import { appDb } from "../../../shared/db/appDb";
import type { SettingsKey } from "../../../shared/types/settings";
import { getStoredHandle } from "../../../shared/fs/fileHandles";
import { openInvoicePdf } from "../../documents/application/openInvoicePdf";
import type { OcrClientConfig } from "../../ocr/infrastructure/ocrClients";
import { getOcrProvider, isOcrProviderId } from "../../ocr/providers/registry";
import type { OcrProviderCredentials, OcrProviderId } from "../../ocr/providers/types";

export type DashboardOcrSettings = {
  vendor: OcrProviderId | null;
  values: Partial<Record<SettingsKey, string | null>>;
};

export async function loadDashboardRows() {
  return appDb.invoiceDocuments.toArray();
}

export async function loadDashboardOcrSettings(): Promise<DashboardOcrSettings> {
  const settings = await appDb.settings.toArray();
  const vendorSetting = settings.find((entry) => entry.key === "ocr.vendor");
  const values = Object.fromEntries(
    settings
      .filter((entry): entry is typeof entry & { value: string | null } => typeof entry.value === "string" || entry.value === null)
      .map((entry) => [entry.key, entry.value]),
  ) as Partial<Record<SettingsKey, string | null>>;

  return {
    vendor: typeof vendorSetting?.value === "string" && isOcrProviderId(vendorSetting.value) ? vendorSetting.value : null,
    values,
  };
}

export function toOcrClientConfig(settings: DashboardOcrSettings): OcrClientConfig {
  if (!settings.vendor || !isOcrProviderId(settings.vendor)) {
    throw new Error("请先选择 OCR 供应商。");
  }

  const provider = getOcrProvider(settings.vendor);
  const credentials = Object.fromEntries(
    provider.getSettingsFields().map((field) => [field.id, settings.values[field.settingKey] ?? ""]),
  ) as OcrProviderCredentials;

  return {
    vendor: settings.vendor,
    credentials,
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

