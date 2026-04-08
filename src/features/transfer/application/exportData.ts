import { appDb } from "../../../shared/db/appDb";
import type { InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { FilterGroup, FilterGroupRule } from "../../../shared/types/filterGroup";
import type { SavedView } from "../../../shared/types/savedView";
import type { SettingRecord } from "../../../shared/types/settings";
import type { TagDefinition, TagGroup, TagGroupLink } from "../../../shared/types/tagDefinition";

export type TransferInvoiceDocument = Omit<InvoiceDocument, "handleRef" | "bindingStatus" | "bindingErrorType">;
const WEB_ONLY_OCR_SECRET_KEYS = new Set(["ocr.baiduApiKey", "ocr.baiduSecretKey", "ocr.tencentSecretId", "ocr.tencentSecretKey"]);

export type ExportDataPayload = {
  invoiceDocuments: TransferInvoiceDocument[];
  invoiceAuditLogs: InvoiceAuditLog[];
  tagDefinitions: TagDefinition[];
  tagGroups: TagGroup[];
  tagGroupLinks: TagGroupLink[];
  filterGroups: FilterGroup[];
  filterGroupRules: FilterGroupRule[];
  savedViews: SavedView[];
  settings: SettingRecord[];
  exportedAt: string;
};

export type ExportDataOptions = {
  invoiceDocumentIds?: string[];
};

function normalizeTransferInvoiceDocument(entry: InvoiceDocument): TransferInvoiceDocument {
  const {
    handleRef: _handleRef,
    bindingStatus: _bindingStatus,
    bindingErrorType: _bindingErrorType,
    relativePath: _relativePath,
    customFields: _customFields,
    proofFiles: _proofFiles,
    ...rest
  } = entry as InvoiceDocument & {
    relativePath?: string;
    customFields?: unknown;
    proofFiles?: string[];
  };
  return rest;
}

export async function exportData(options: ExportDataOptions = {}): Promise<ExportDataPayload> {
  const [invoiceDocuments, invoiceAuditLogs, tagDefinitions, tagGroups, tagGroupLinks, filterGroups, filterGroupRules, savedViews, settings] = await Promise.all([
    appDb.invoiceDocuments.toArray(),
    appDb.invoiceAuditLogs.toArray(),
    appDb.tagDefinitions.toArray(),
    appDb.tagGroups.toArray(),
    appDb.tagGroupLinks.toArray(),
    appDb.filterGroups.toArray(),
    appDb.filterGroupRules.toArray(),
    appDb.savedViews.toArray(),
    appDb.settings.toArray(),
  ]);
  const selectedIdSet = options.invoiceDocumentIds ? new Set(options.invoiceDocumentIds) : null;
  const selectedInvoiceDocuments = selectedIdSet ? invoiceDocuments.filter((entry) => selectedIdSet.has(entry.id)) : invoiceDocuments;
  const exportMetadata = selectedIdSet === null;

  return {
    invoiceDocuments: selectedInvoiceDocuments.map(normalizeTransferInvoiceDocument),
    invoiceAuditLogs: exportMetadata ? invoiceAuditLogs : [],
    tagDefinitions: exportMetadata ? tagDefinitions : [],
    tagGroups: exportMetadata ? tagGroups : [],
    tagGroupLinks: exportMetadata ? tagGroupLinks : [],
    filterGroups: exportMetadata ? filterGroups : [],
    filterGroupRules: exportMetadata ? filterGroupRules : [],
    savedViews: exportMetadata ? savedViews : [],
    settings: exportMetadata ? settings.filter((setting) => !WEB_ONLY_OCR_SECRET_KEYS.has(setting.key)) : [],
    exportedAt: new Date().toISOString(),
  };
}
