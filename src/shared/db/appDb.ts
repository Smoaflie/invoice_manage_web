import Dexie, { type Table } from "dexie";
import { migrateLegacyTables } from "../../features/documents/application/migrateLegacyTables";
import type { FileEntry } from "../types/fileEntry";
import type { InvoiceRecord } from "../types/invoiceRecord";
import type { InvoiceAuditLog } from "../types/invoiceAuditLog";
import type { DashboardDocument } from "../types/dashboardDocument";
import type { InvoiceDocument } from "../types/invoiceDocument";
import type { FilterGroup, FilterGroupRule } from "../types/filterGroup";
import type { SavedView } from "../types/savedView";
import type { SettingRecord, SettingsKey } from "../types/settings";
import type { TagDefinition, TagGroup, TagGroupLink } from "../types/tagDefinition";

export interface FileHandleRecord {
  key: string;
  handle: FileSystemHandle;
}

export class AppDb extends Dexie {
  invoiceDocuments!: Table<InvoiceDocument, string>;
  invoiceAuditLogs!: Table<InvoiceAuditLog, string>;
  tagDefinitions!: Table<TagDefinition, string>;
  tagGroups!: Table<TagGroup, string>;
  tagGroupLinks!: Table<TagGroupLink, [string, string]>;
  filterGroups!: Table<FilterGroup, string>;
  filterGroupRules!: Table<FilterGroupRule, string>;
  dashboardDocuments!: Table<DashboardDocument, string>;
  savedViews!: Table<SavedView, string>;
  fileEntries!: Table<FileEntry, string>;
  invoiceRecords!: Table<InvoiceRecord, string>;
  settings!: Table<SettingRecord, SettingsKey>;
  fileHandles!: Table<FileHandleRecord, string>;

  constructor() {
    super("invoice-collection-web");

    this.version(1).stores({
      fileEntries: "id, contentHash, fileName, bindingStatus, updatedAt",
      invoiceRecords: "id, fileEntryId, invoiceNumber, conflictStatus, updatedAt",
      settings: "key",
      fileHandles: "key",
    });

    this.version(2)
      .stores({
        invoiceDocuments: "id, contentHash, fileName, bindingStatus, parseStatus, invoiceNumber, conflictStatus, updatedAt",
        invoiceAuditLogs: "id, invoiceDocumentId, changedAt, changeType, targetField",
        tagDefinitions: "name, enabled",
        tagGroups: "id, sortOrder",
        tagGroupLinks: "[tagName+groupId], tagName, groupId",
        filterGroups: "id, sortOrder",
        filterGroupRules: "id, groupId, field",
        fileEntries: "id, contentHash, fileName, bindingStatus, updatedAt",
        invoiceRecords: "id, fileEntryId, invoiceNumber, conflictStatus, updatedAt",
        settings: "key",
        fileHandles: "key",
      })
      .upgrade(async (tx) => {
        const legacyFileEntries = await tx.table<FileEntry, string>("fileEntries").toArray();
        const legacyInvoiceRecords = await tx.table<InvoiceRecord, string>("invoiceRecords").toArray();

        if (legacyFileEntries.length === 0) {
          return;
        }

        const existingDocuments = await tx.table<InvoiceDocument, string>("invoiceDocuments").count();
        if (existingDocuments > 0) {
          return;
        }

        const { invoiceDocuments } = await migrateLegacyTables({
          fileEntries: legacyFileEntries,
          invoiceRecords: legacyInvoiceRecords,
        });

        if (invoiceDocuments.length > 0) {
          await tx.table<InvoiceDocument, string>("invoiceDocuments").bulkAdd(invoiceDocuments);
        }
      });

    this.version(3).stores({
      invoiceDocuments: "id, contentHash, fileName, bindingStatus, parseStatus, invoiceNumber, conflictStatus, updatedAt",
      invoiceAuditLogs: "id, invoiceDocumentId, changedAt, changeType, targetField",
      tagDefinitions: "name, enabled",
      tagGroups: "id, sortOrder",
      tagGroupLinks: "[tagName+groupId], tagName, groupId",
      filterGroups: "id, sortOrder",
      filterGroupRules: "id, groupId, field",
      savedViews: "id, scope, isDefault, updatedAt",
      fileEntries: "id, contentHash, fileName, bindingStatus, updatedAt",
      invoiceRecords: "id, fileEntryId, invoiceNumber, conflictStatus, updatedAt",
      settings: "key",
      fileHandles: "key",
    });

    this.version(4).stores({
      invoiceDocuments: "id, contentHash, fileName, bindingStatus, parseStatus, invoiceNumber, conflictStatus, updatedAt",
      invoiceAuditLogs: "id, invoiceDocumentId, changedAt, changeType, targetField",
      tagDefinitions: "name, enabled",
      tagGroups: "id, sortOrder",
      tagGroupLinks: "[tagName+groupId], tagName, groupId",
      filterGroups: "id, sortOrder",
      filterGroupRules: "id, groupId, field",
      savedViews: "id, scope, isDefault, updatedAt",
      fileEntries: "id, contentHash, fileName, bindingStatus, updatedAt",
      invoiceRecords: "id, fileEntryId, invoiceNumber, conflictStatus, updatedAt",
      settings: "key",
      fileHandles: "key",
    });

    this.version(5).stores({
      invoiceDocuments: "id, contentHash, fileName, bindingStatus, parseStatus, invoiceNumber, conflictStatus, updatedAt",
      invoiceAuditLogs: "id, invoiceDocumentId, changedAt, changeType, targetField",
      tagDefinitions: "name, enabled",
      tagGroups: "id, sortOrder",
      tagGroupLinks: "[tagName+groupId], tagName, groupId",
      filterGroups: "id, sortOrder",
      filterGroupRules: "id, groupId, field",
      savedViews: "id, scope, isDefault, updatedAt",
      fileEntries: "id, contentHash, fileName, bindingStatus, updatedAt",
      invoiceRecords: "id, fileEntryId, invoiceNumber, conflictStatus, updatedAt",
      settings: "key",
      fileHandles: "key",
    });

    this.version(6).stores({
      invoiceDocuments: "id, contentHash, fileName, bindingStatus, parseStatus, invoiceNumber, conflictStatus, updatedAt",
      invoiceAuditLogs: "id, invoiceDocumentId, changedAt, changeType, targetField",
      tagDefinitions: "name, enabled",
      tagGroups: "id, sortOrder",
      tagGroupLinks: "[tagName+groupId], tagName, groupId",
      filterGroups: "id, sortOrder",
      filterGroupRules: "id, groupId, field",
      savedViews: "id, scope, isDefault, updatedAt",
      fileEntries: "id, contentHash, fileName, bindingStatus, updatedAt",
      invoiceRecords: "id, fileEntryId, invoiceNumber, conflictStatus, updatedAt",
      settings: "key",
      fileHandles: "key",
    });

    this.version(7)
      .stores({
        invoiceDocuments:
          "id, contentHash, fileName, bindingStatus, parseStatus, invoiceNumber, conflictStatus, collaborationStatus, reviewStatus, updatedAt",
        invoiceAuditLogs: "id, invoiceDocumentId, changedAt, changeType, targetField",
        tagDefinitions: "name, enabled",
        tagGroups: "id, sortOrder",
        tagGroupLinks: "[tagName+groupId], tagName, groupId",
        filterGroups: "id, sortOrder",
        filterGroupRules: "id, groupId, field",
        savedViews: "id, scope, isDefault, updatedAt",
        fileEntries: "id, contentHash, fileName, bindingStatus, updatedAt",
        invoiceRecords: "id, fileEntryId, invoiceNumber, conflictStatus, updatedAt",
        settings: "key",
        fileHandles: "key",
      })
      .upgrade(async (tx) => {
        await tx.table<InvoiceDocument, string>("invoiceDocuments").toCollection().modify((document) => {
          document.collaborationStatus ??= "local_only";
          document.reviewStatus ??= "not_required";
          document.submittedBy ??= "";
          document.receivedBy ??= "";
          document.beneficiary ??= "";
          document.lastSubmissionId ??= null;
        });
      });

    this.version(8)
      .stores({
        invoiceDocuments:
          "id, contentHash, fileName, bindingStatus, parseStatus, invoiceNumber, conflictStatus, collaborationStatus, reviewStatus, updatedAt",
        invoiceAuditLogs: "id, invoiceDocumentId, changedAt, changeType, targetField",
        tagDefinitions: "name, enabled",
        tagGroups: "id, sortOrder",
        tagGroupLinks: "[tagName+groupId], tagName, groupId",
        filterGroups: "id, name, updatedAt",
        filterGroupRules: "id, groupId, field",
        dashboardDocuments: "id, updatedAt",
        savedViews: "id, scope, isDefault, updatedAt",
        fileEntries: "id, contentHash, fileName, bindingStatus, updatedAt",
        invoiceRecords: "id, fileEntryId, invoiceNumber, conflictStatus, updatedAt",
        settings: "key",
        fileHandles: "key",
      })
      .upgrade(async (tx) => {
        const timestamp = new Date().toISOString();
        const legacyGroups = await tx.table<Record<string, unknown>, string>("filterGroups").toArray();
        const legacyRules = await tx.table<FilterGroupRule, string>("filterGroupRules").toArray();

        await tx.table<FilterGroup, string>("filterGroups").clear();

        for (const legacyGroup of legacyGroups) {
          const groupId = String(legacyGroup.id ?? globalThis.crypto.randomUUID());
          const rules = legacyRules.filter((rule) => rule.groupId === groupId);
          await tx.table<FilterGroup, string>("filterGroups").add({
            id: groupId,
            name: String(legacyGroup.name ?? ""),
            root: {
              id: `migrated-root-${groupId}`,
              kind: "group",
              mode: "all",
              children: rules.map((rule) => ({
                id: rule.id,
                kind: "field" as const,
                fieldId: rule.field,
                operator:
                  (rule.operator ?? "regex") === "regex"
                    ? "matches_regex"
                    : (rule.operator as "equals" | "greater_than" | "less_than"),
                value: rule.pattern,
              })),
            },
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      });
  }
}

export const appDb = new AppDb();
