import { appDb } from "../../../shared/db/appDb";
import type { FileEntry } from "../../../shared/types/fileEntry";
import type { InvoiceRecord } from "../../../shared/types/invoiceRecord";
import type { InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { FilterGroup, FilterGroupRule } from "../../../shared/types/filterGroup";
import type { SavedView } from "../../../shared/types/savedView";
import type { SettingRecord } from "../../../shared/types/settings";
import type { TagDefinition, TagGroup, TagGroupLink } from "../../../shared/types/tagDefinition";
import { legacyTransferDataSchema, transferDataSchema } from "../../../shared/validation/schemas";
import { migrateLegacyTables } from "../../documents/application/migrateLegacyTables";

const WEB_ONLY_OCR_SECRET_KEYS = new Set(["ocr.baiduApiKey", "ocr.baiduSecretKey", "ocr.tencentSecretId", "ocr.tencentSecretKey"]);

export type ImportDataPayload = {
  invoiceDocuments?: Array<Omit<InvoiceDocument, "handleRef" | "bindingStatus" | "bindingErrorType">>;
  invoiceAuditLogs?: InvoiceAuditLog[];
  tagDefinitions?: TagDefinition[];
  tagGroups?: TagGroup[];
  tagGroupLinks?: TagGroupLink[];
  filterGroups?: FilterGroup[];
  filterGroupRules?: FilterGroupRule[];
  savedViews?: SavedView[];
  settings?: SettingRecord[];
};

export type ImportDataResult = {
  importedInvoiceDocuments: number;
};

function sanitizeImportedPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const rawPayload = payload as { settings?: unknown; invoiceDocuments?: unknown };
  const settings = Array.isArray(rawPayload.settings)
    ? rawPayload.settings.filter((setting) => !(setting && typeof setting === "object" && "key" in setting && setting.key === "ocr.language"))
    : rawPayload.settings;
  const invoiceDocuments = Array.isArray(rawPayload.invoiceDocuments)
    ? rawPayload.invoiceDocuments.map((entry) =>
        entry && typeof entry === "object" && !("remark" in entry) ? { ...entry, remark: "" } : entry,
      )
    : rawPayload.invoiceDocuments;

  return {
    ...(payload as Record<string, unknown>),
    settings,
    invoiceDocuments,
  };
}

function normalizeImportedInvoiceDocument(
  entry: Omit<InvoiceDocument, "handleRef" | "bindingStatus" | "bindingErrorType">,
): InvoiceDocument {
  return {
    ...entry,
    handleRef: "",
    bindingStatus: "unreadable",
    bindingErrorType: "handle_missing",
  };
}

async function normalizeLegacyPayload(payload: unknown) {
  const parsedPayload = legacyTransferDataSchema.parse(payload);
  const { invoiceDocuments } = await migrateLegacyTables({
    fileEntries: parsedPayload.fileEntries.map((entry) => ({
      ...entry,
      handleRef: "",
      bindingStatus: "unreadable",
      bindingErrorType: "handle_missing",
    })) as FileEntry[],
    invoiceRecords: parsedPayload.invoiceRecords as InvoiceRecord[],
  });

  return {
    invoiceDocuments,
    invoiceAuditLogs: [] as InvoiceAuditLog[],
    tagDefinitions: [] as TagDefinition[],
    tagGroups: [] as TagGroup[],
    tagGroupLinks: [] as TagGroupLink[],
    filterGroups: [] as FilterGroup[],
    filterGroupRules: [] as FilterGroupRule[],
    savedViews: [] as SavedView[],
    settings: parsedPayload.settings.filter((setting) => !WEB_ONLY_OCR_SECRET_KEYS.has(setting.key)),
  };
}

async function parseTransferPayload(payload: unknown): Promise<{
  invoiceDocuments: Array<Omit<InvoiceDocument, "handleRef" | "bindingStatus" | "bindingErrorType">>;
  invoiceAuditLogs: InvoiceAuditLog[];
  tagDefinitions: TagDefinition[];
  tagGroups: TagGroup[];
  tagGroupLinks: TagGroupLink[];
  filterGroups: FilterGroup[];
  filterGroupRules: FilterGroupRule[];
  savedViews: SavedView[];
  settings: SettingRecord[];
}> {
  const sanitizedPayload = sanitizeImportedPayload(payload);
  if ("invoiceDocuments" in (sanitizedPayload as Record<string, unknown>)) {
    const parsed = transferDataSchema.parse(sanitizedPayload);
    return {
      ...parsed,
      settings: parsed.settings.filter((setting) => !WEB_ONLY_OCR_SECRET_KEYS.has(setting.key)),
    };
  }

  return normalizeLegacyPayload(sanitizedPayload);
}

export async function importData(payload: unknown): Promise<ImportDataResult> {
  const parsedPayload = await parseTransferPayload(payload);

  const invoiceDocuments = parsedPayload.invoiceDocuments.map(normalizeImportedInvoiceDocument);
  const invoiceAuditLogs = parsedPayload.invoiceAuditLogs;
  const tagDefinitions = parsedPayload.tagDefinitions;
  const tagGroups = parsedPayload.tagGroups;
  const tagGroupLinks = parsedPayload.tagGroupLinks;
  const filterGroups = parsedPayload.filterGroups;
  const filterGroupRules = parsedPayload.filterGroupRules;
  const savedViews = parsedPayload.savedViews;
  const settings = parsedPayload.settings;

  await appDb.transaction(
    "rw",
    [
      appDb.invoiceDocuments,
      appDb.invoiceAuditLogs,
      appDb.tagDefinitions,
      appDb.tagGroups,
      appDb.tagGroupLinks,
      appDb.filterGroups,
      appDb.filterGroupRules,
      appDb.savedViews,
      appDb.settings,
      appDb.fileHandles,
    ],
    async () => {
      await Promise.all([
        appDb.invoiceDocuments.clear(),
        appDb.invoiceAuditLogs.clear(),
        appDb.tagDefinitions.clear(),
        appDb.tagGroups.clear(),
        appDb.tagGroupLinks.clear(),
        appDb.filterGroups.clear(),
        appDb.filterGroupRules.clear(),
        appDb.savedViews.clear(),
        appDb.settings.clear(),
        appDb.fileHandles.clear(),
      ]);

      if (invoiceDocuments.length > 0) {
        await appDb.invoiceDocuments.bulkAdd(invoiceDocuments);
      }

      if (invoiceAuditLogs.length > 0) {
        await appDb.invoiceAuditLogs.bulkAdd(invoiceAuditLogs);
      }

      if (tagDefinitions.length > 0) {
        await appDb.tagDefinitions.bulkAdd(tagDefinitions);
      }

      if (tagGroups.length > 0) {
        await appDb.tagGroups.bulkAdd(tagGroups);
      }

      if (tagGroupLinks.length > 0) {
        await appDb.tagGroupLinks.bulkAdd(tagGroupLinks);
      }

      if (filterGroups.length > 0) {
        await appDb.filterGroups.bulkAdd(filterGroups);
      }

      if (filterGroupRules.length > 0) {
        await appDb.filterGroupRules.bulkAdd(filterGroupRules);
      }

      if (savedViews.length > 0) {
        await appDb.savedViews.bulkAdd(savedViews);
      }

      if (settings.length > 0) {
        await appDb.settings.bulkAdd(settings);
      }
    },
  );

  return {
    importedInvoiceDocuments: invoiceDocuments.length,
  };
}
