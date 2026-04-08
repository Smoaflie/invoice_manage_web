import { appDb } from "../../../shared/db/appDb";
import type { FileEntry } from "../../../shared/types/fileEntry";
import type { InvoiceRecord } from "../../../shared/types/invoiceRecord";
import type { InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { FilterGroup, FilterGroupRule } from "../../../shared/types/filterGroup";
import type { SavedView } from "../../../shared/types/savedView";
import type { SettingRecord } from "../../../shared/types/settings";
import type { TagDefinition, TagGroup, TagGroupLink } from "../../../shared/types/tagDefinition";
import { legacyTransferDataSchema, settingsKeySchema, transferDataSchema } from "../../../shared/validation/schemas";
import { migrateLegacyTables } from "../../documents/application/migrateLegacyTables";
import { buildImportPlan, type ImportConflict } from "./importDataConflicts";

const WEB_ONLY_OCR_SECRET_KEYS = new Set(["ocr.baiduApiKey", "ocr.baiduSecretKey", "ocr.tencentSecretId", "ocr.tencentSecretKey"]);
const IMPORTABLE_SETTING_KEYS = new Set(settingsKeySchema.options);

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
  conflictedInvoiceDocuments: number;
};

export type ImportConflictMode = "reject" | "continue_with_conflicts";
export type ImportDataOptions = {
  conflictMode?: ImportConflictMode;
};

type ImportConflictError = Error & {
  name: "ImportConflictError";
  conflicts: ImportConflict[];
};

function sanitizeImportedPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const rawPayload = payload as { settings?: unknown; invoiceDocuments?: unknown };
  const settings = Array.isArray(rawPayload.settings)
    ? rawPayload.settings.filter((setting) => {
        if (!(setting && typeof setting === "object" && "key" in setting)) {
          return true;
        }

        const key = setting.key;
        return typeof key === "string" && key !== "ocr.language" && IMPORTABLE_SETTING_KEYS.has(key as (typeof settingsKeySchema.options)[number]);
      })
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

function createImportConflictError(conflicts: ImportConflict[]): ImportConflictError {
  const error = new Error("检测到导入冲突，请确认后继续导入。") as ImportConflictError;
  error.name = "ImportConflictError";
  error.conflicts = conflicts;
  return error;
}

function remapImportedAuditLogs(invoiceAuditLogs: InvoiceAuditLog[], sourceIdToImportedId: Map<string, string>, importedInvoiceDocumentIds: Set<string>) {
  return invoiceAuditLogs.flatMap((auditLog) => {
    const importedInvoiceDocumentId = sourceIdToImportedId.get(auditLog.invoiceDocumentId);
    if (!importedInvoiceDocumentId || !importedInvoiceDocumentIds.has(importedInvoiceDocumentId)) {
      return [];
    }

    return [{
      ...auditLog,
      id: globalThis.crypto.randomUUID(),
      invoiceDocumentId: importedInvoiceDocumentId,
    }];
  });
}

export async function importData(payload: unknown, options: ImportDataOptions = {}): Promise<ImportDataResult> {
  const parsedPayload = await parseTransferPayload(payload);
  const existingInvoiceDocuments = await appDb.invoiceDocuments.toArray();
  const importPlan = buildImportPlan(parsedPayload.invoiceDocuments, existingInvoiceDocuments);
  const conflictMode = options.conflictMode ?? "reject";
  if (importPlan.conflicts.length > 0 && conflictMode !== "continue_with_conflicts") {
    throw createImportConflictError(importPlan.conflicts);
  }

  const invoiceDocuments = importPlan.invoiceDocuments;
  const importedInvoiceDocumentIds = new Set(invoiceDocuments.map((document) => document.id));
  const invoiceAuditLogs = remapImportedAuditLogs(parsedPayload.invoiceAuditLogs, importPlan.sourceIdToImportedId, importedInvoiceDocumentIds);
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
    ],
    async () => {
      if (invoiceDocuments.length > 0) {
        await appDb.invoiceDocuments.bulkAdd(invoiceDocuments);
      }

      if (invoiceAuditLogs.length > 0) {
        await appDb.invoiceAuditLogs.bulkAdd(invoiceAuditLogs);
      }

      if (tagDefinitions.length > 0) {
        await appDb.tagDefinitions.bulkPut(tagDefinitions);
      }

      if (tagGroups.length > 0) {
        await appDb.tagGroups.bulkPut(tagGroups);
      }

      if (tagGroupLinks.length > 0) {
        await appDb.tagGroupLinks.bulkPut(tagGroupLinks);
      }

      if (filterGroups.length > 0) {
        await appDb.filterGroups.bulkPut(filterGroups);
      }

      if (filterGroupRules.length > 0) {
        await appDb.filterGroupRules.bulkPut(filterGroupRules);
      }

      if (savedViews.length > 0) {
        await appDb.savedViews.bulkPut(savedViews);
      }

      if (settings.length > 0) {
        await appDb.settings.bulkPut(settings);
      }
    },
  );

  return {
    importedInvoiceDocuments: invoiceDocuments.length,
    conflictedInvoiceDocuments: importPlan.conflictedInvoiceDocuments,
  };
}
