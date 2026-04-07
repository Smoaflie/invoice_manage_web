import { z } from "zod";
import { FILTER_GROUP_FIELDS } from "../types/filterGroup";
import { dashboardDocumentSchema, filterGroupDocumentSchema, workspaceSavedViewQuerySchema } from "./workspaceSchemas";

export { dashboardDocumentSchema } from "./workspaceSchemas";

export const bindingStatusSchema = z.enum(["readable", "unreadable", "needs_reparse"]);
export const bindingErrorTypeSchema = z.enum([
  "handle_missing",
  "permission_denied",
  "file_not_found",
  "handle_unavailable",
  "hash_mismatch",
]).nullable();

export const fileEntrySchema = z.object({
  id: z.string(),
  contentHash: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  lastModified: z.number(),
  relativePath: z.string(),
  handleRef: z.string(),
  bindingStatus: bindingStatusSchema,
  bindingErrorType: bindingErrorTypeSchema,
  ocrVendor: z.string().nullable(),
  ocrParsedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const transferFileEntrySchema = fileEntrySchema.omit({
  handleRef: true,
  bindingStatus: true,
  bindingErrorType: true,
});

export const parseStatusSchema = z.enum(["idle", "parsed", "parse_failed", "needs_reparse"]);
export const conflictStatusSchema = z.enum(["none", "same_number_diff_hash"]);
export const collaborationStatusSchema = z.enum([
  "local_only",
  "matched_in_snapshot",
  "ready_to_submit",
  "submitted",
  "received_pending_decision",
  "import_blocked",
  "imported",
  "returned",
]);
export const reviewStatusSchema = z.enum(["not_required", "pending_review", "approved", "rejected"]);

export const invoiceRecordSchema = z.object({
  id: z.string(),
  fileEntryId: z.string(),
  invoiceNumber: z.string(),
  invoiceCode: z.string(),
  invoiceDate: z.string(),
  totalAmount: z.number(),
  taxAmount: z.number(),
  amountWithoutTax: z.number(),
  buyerName: z.string(),
  sellerName: z.string(),
  items: z.array(z.record(z.string(), z.unknown())),
  tags: z.array(z.string()),
  remark: z.string().default(""),
  uploader: z.string(),
  owner: z.string(),
  parseStatus: parseStatusSchema,
  conflictStatus: conflictStatusSchema,
  conflictMessage: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const transferInvoiceRecordSchema = invoiceRecordSchema;

export const invoiceDocumentSchema = z.object({
  id: z.string(),
  contentHash: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  lastModified: z.number(),
  handleRef: z.string(),
  bindingStatus: bindingStatusSchema,
  bindingErrorType: bindingErrorTypeSchema,
  ocrVendor: z.string().nullable(),
  ocrParsedAt: z.string().nullable(),
  parseStatus: parseStatusSchema,
  conflictStatus: conflictStatusSchema,
  conflictMessage: z.string(),
  invoiceNumber: z.string(),
  invoiceCode: z.string(),
  invoiceDate: z.string(),
  totalAmount: z.number(),
  taxAmount: z.number(),
  amountWithoutTax: z.number(),
  buyerName: z.string(),
  sellerName: z.string(),
  items: z.array(z.record(z.string(), z.unknown())),
  tags: z.array(z.string()),
  remark: z.string().default(""),
  annotation: z.string(),
  uploader: z.string(),
  owner: z.string(),
  collaborationStatus: collaborationStatusSchema.default("local_only"),
  reviewStatus: reviewStatusSchema.default("not_required"),
  submittedBy: z.string().default(""),
  receivedBy: z.string().default(""),
  beneficiary: z.string().default(""),
  lastSubmissionId: z.string().nullable().default(null),
  sourceType: z.enum(["ocr", "manual"]),
  edited: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const transferInvoiceDocumentSchema = invoiceDocumentSchema.omit({
  handleRef: true,
  bindingStatus: true,
  bindingErrorType: true,
});

export const invoiceAuditLogSchema = z.object({ id: z.string(), invoiceDocumentId: z.string(), changedAt: z.string(), changeType: z.enum(["manual_create", "manual_edit", "manual_tag_update", "manual_annotation_update"]), targetField: z.string(), beforeValue: z.string(), afterValue: z.string() });

export const tagDefinitionSchema = z.object({ name: z.string(), color: z.string(), enabled: z.boolean(), description: z.string() });

export const tagGroupSchema = z.object({ id: z.string(), name: z.string(), sortOrder: z.number() });

export const tagGroupLinkSchema = z.object({ tagName: z.string(), groupId: z.string() });

export const filterGroupSchema = filterGroupDocumentSchema;

export const filterGroupRuleSchema = z.object({ id: z.string(), groupId: z.string(), label: z.string(), field: z.enum(FILTER_GROUP_FIELDS), operator: z.enum(["regex", "equals", "greater_than", "less_than"]).optional().default("regex"), pattern: z.string() });

const invoiceSavedViewQuerySchema = z.object({
  scope: z.literal("invoices"),
  searchText: z.string(),
  status: z.enum(["all", "parsed", "needs_attention"]),
  tag: z.string(),
  tagGroupId: z.string(),
  ruleId: z.string(),
  sortBy: z.enum(["updatedAt", "invoiceDate", "invoiceNumber", "totalAmount", "fileName"]),
  sortDirection: z.enum(["asc", "desc"]),
});

const fileSavedViewQuerySchema = z.object({
  scope: z.literal("files"),
  searchText: z.string(),
  field: z.enum(["all", "fileName", "bindingStatus", "bindingErrorType", "invoiceNumber", "buyerName", "sellerName", "remark", "annotation", "tags"]),
  sortBy: z.enum(["updatedAt", "fileName", "bindingStatus"]),
  sortDirection: z.enum(["asc", "desc"]),
});

export const savedViewSchema = z.object({
  id: z.string(),
  scope: z.enum(["invoices", "files", "workspace"]),
  name: z.string(),
  isDefault: z.boolean(),
  query: z.discriminatedUnion("scope", [invoiceSavedViewQuerySchema, fileSavedViewQuerySchema, workspaceSavedViewQuerySchema]),
  visibleColumns: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const settingsKeySchema = z.enum([
  "ocr.vendor",
  "ocr.enabled",
  "ocr.appId",
  "ocr.apiKey",
  "ocr.secretKey",
  "app.theme",
  "app.lastOpenedFolder",
  "ui.invoiceColumns",
  "ui.activeInvoiceViewId",
  "ui.activeFileViewId",
  "ui.dashboardInvoiceViewId",
  "ui.activeWorkspaceViewId",
  "ui.workspaceSelectedIds",
]);

export const ocrSettingsSchema = z.object({ vendor: z.string().nullable(), enabled: z.boolean(), appId: z.string().nullable(), apiKey: z.string().nullable(), secretKey: z.string().nullable() });

export const appSettingsSchema = z.object({ ocr: ocrSettingsSchema, app: z.object({ theme: z.enum(["system", "light", "dark"]), lastOpenedFolder: z.string().nullable() }) });

const ocrVendorSettingRecordSchema = z.object({ key: z.literal("ocr.vendor"), value: z.string().nullable(), updatedAt: z.string() });
const ocrEnabledSettingRecordSchema = z.object({ key: z.literal("ocr.enabled"), value: z.boolean(), updatedAt: z.string() });
const ocrAppIdSettingRecordSchema = z.object({ key: z.literal("ocr.appId"), value: z.string().nullable(), updatedAt: z.string() });
const ocrApiKeySettingRecordSchema = z.object({ key: z.literal("ocr.apiKey"), value: z.string().nullable(), updatedAt: z.string() });
const ocrSecretKeySettingRecordSchema = z.object({ key: z.literal("ocr.secretKey"), value: z.string().nullable(), updatedAt: z.string() });
const appThemeSettingRecordSchema = z.object({ key: z.literal("app.theme"), value: z.enum(["system", "light", "dark"]), updatedAt: z.string() });
const appLastOpenedFolderSettingRecordSchema = z.object({ key: z.literal("app.lastOpenedFolder"), value: z.string().nullable(), updatedAt: z.string() });
const uiInvoiceColumnsSettingRecordSchema = z.object({ key: z.literal("ui.invoiceColumns"), value: z.array(z.string()), updatedAt: z.string() });
const uiActiveInvoiceViewIdSettingRecordSchema = z.object({ key: z.literal("ui.activeInvoiceViewId"), value: z.string().nullable(), updatedAt: z.string() });
const uiActiveFileViewIdSettingRecordSchema = z.object({ key: z.literal("ui.activeFileViewId"), value: z.string().nullable(), updatedAt: z.string() });
const uiDashboardInvoiceViewIdSettingRecordSchema = z.object({ key: z.literal("ui.dashboardInvoiceViewId"), value: z.string().nullable(), updatedAt: z.string() });
const uiActiveWorkspaceViewIdSettingRecordSchema = z.object({ key: z.literal("ui.activeWorkspaceViewId"), value: z.string().nullable(), updatedAt: z.string() });
const uiWorkspaceSelectedIdsSettingRecordSchema = z.object({ key: z.literal("ui.workspaceSelectedIds"), value: z.array(z.string()), updatedAt: z.string() });

export const settingRecordSchema = z.discriminatedUnion("key", [ocrVendorSettingRecordSchema, ocrEnabledSettingRecordSchema, ocrAppIdSettingRecordSchema, ocrApiKeySettingRecordSchema, ocrSecretKeySettingRecordSchema, appThemeSettingRecordSchema, appLastOpenedFolderSettingRecordSchema, uiInvoiceColumnsSettingRecordSchema, uiActiveInvoiceViewIdSettingRecordSchema, uiActiveFileViewIdSettingRecordSchema, uiDashboardInvoiceViewIdSettingRecordSchema, uiActiveWorkspaceViewIdSettingRecordSchema, uiWorkspaceSelectedIdsSettingRecordSchema]);

export const transferSettingRecordSchema = settingRecordSchema;

export const legacyTransferDataSchema = z.object({
  fileEntries: z.array(transferFileEntrySchema).default([]),
  invoiceRecords: z.array(transferInvoiceRecordSchema).default([]),
  settings: z.array(transferSettingRecordSchema).default([]),
});

export const transferDataSchema = z.object({
  invoiceDocuments: z.array(transferInvoiceDocumentSchema).default([]),
  invoiceAuditLogs: z.array(invoiceAuditLogSchema).default([]),
  tagDefinitions: z.array(tagDefinitionSchema).default([]),
  tagGroups: z.array(tagGroupSchema).default([]),
  tagGroupLinks: z.array(tagGroupLinkSchema).default([]),
  filterGroups: z.array(filterGroupSchema).default([]),
  filterGroupRules: z.array(filterGroupRuleSchema).default([]),
  dashboardDocuments: z.array(dashboardDocumentSchema).default([]),
  savedViews: z.array(savedViewSchema).default([]),
  settings: z.array(transferSettingRecordSchema).default([]),
});

export const fileHandleRecordSchema = z.object({ key: z.string(), handle: z.any() });
