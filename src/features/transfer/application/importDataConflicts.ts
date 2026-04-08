import type { ConflictStatus, InvoiceDocument } from "../../../shared/types/invoiceDocument";

type ImportedInvoiceDocument = Omit<InvoiceDocument, "handleRef" | "bindingStatus" | "bindingErrorType">;

const INVOICE_INFO_FIELDS = [
  "invoiceNumber",
  "invoiceCode",
  "invoiceDate",
  "totalAmount",
  "taxAmount",
  "amountWithoutTax",
  "buyerName",
  "sellerName",
  "items",
] as const;

const INVOICE_INFO_FIELD_LABELS: Record<(typeof INVOICE_INFO_FIELDS)[number], string> = {
  invoiceNumber: "发票号码",
  invoiceCode: "发票代码",
  invoiceDate: "开票日期",
  totalAmount: "总金额",
  taxAmount: "税额",
  amountWithoutTax: "未税金额",
  buyerName: "购买方",
  sellerName: "销售方",
  items: "货物明细",
};

export type ImportConflict = {
  importedInvoiceDocumentId: string;
  existingInvoiceDocumentId: string;
  status: Exclude<ConflictStatus, "none">;
  message: string;
};

export type ImportPlan = {
  conflicts: ImportConflict[];
  conflictedInvoiceDocuments: number;
  conflictedInvoiceDocumentIds: string[];
  sourceIdToImportedId: Map<string, string>;
  invoiceDocuments: InvoiceDocument[];
};

function buildImportedInvoiceDocumentId(sourceId: string, takenIds: Set<string>) {
  if (!takenIds.has(sourceId)) {
    takenIds.add(sourceId);
    return sourceId;
  }

  const nextId = globalThis.crypto.randomUUID();
  takenIds.add(nextId);
  return nextId;
}

function normalizeInvoiceInfoValue(value: unknown) {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    return String(value);
  }

  return String(value ?? "").trim();
}

function findDifferingInvoiceInfoFields(imported: ImportedInvoiceDocument, existing: InvoiceDocument) {
  return INVOICE_INFO_FIELDS.filter((field) => normalizeInvoiceInfoValue(imported[field]) !== normalizeInvoiceInfoValue(existing[field]));
}

function buildConflictLocator(document: Pick<InvoiceDocument, "fileName" | "contentHash" | "invoiceNumber">) {
  return `${document.fileName} / ${document.contentHash} / 发票号码 ${document.invoiceNumber || "空"}`;
}

function buildSameHashConflict(importedId: string, imported: ImportedInvoiceDocument, existing: InvoiceDocument): ImportConflict {
  const differingFields = findDifferingInvoiceInfoFields(imported, existing)
    .map((field) => INVOICE_INFO_FIELD_LABELS[field])
    .join("、");

  return {
    importedInvoiceDocumentId: importedId,
    existingInvoiceDocumentId: existing.id,
    status: "same_hash_diff_invoice_data",
    message: `与文件 ${buildConflictLocator(existing)} 冲突：文件内容哈希相同，但除文件名外的发票信息不同（${differingFields}）。`,
  };
}

function buildSameNumberConflict(importedId: string, existing: InvoiceDocument): ImportConflict {
  return {
    importedInvoiceDocumentId: importedId,
    existingInvoiceDocumentId: existing.id,
    status: "same_number_diff_hash",
    message: `与文件 ${buildConflictLocator(existing)} 冲突：发票号码相同，但文件内容哈希不同。`,
  };
}

function normalizeImportedInvoiceDocument(
  entry: ImportedInvoiceDocument,
  importedId: string,
  conflict?: ImportConflict,
): InvoiceDocument {
  return {
    ...entry,
    id: importedId,
    handleRef: "",
    bindingStatus: "unreadable",
    bindingErrorType: "handle_missing",
    conflictStatus: conflict?.status ?? entry.conflictStatus,
    conflictMessage: conflict?.message ?? entry.conflictMessage,
  };
}

export function buildImportPlan(importedDocuments: ImportedInvoiceDocument[], existingDocuments: InvoiceDocument[]): ImportPlan {
  const takenIds = new Set(existingDocuments.map((document) => document.id));
  const comparableExistingDocuments = existingDocuments.filter((document) => document.conflictStatus === "none");
  const conflicts: ImportConflict[] = [];
  const sourceIdToImportedId = new Map<string, string>();
  const invoiceDocuments: InvoiceDocument[] = [];
  const conflictedInvoiceDocumentIds: string[] = [];
  let conflictedInvoiceDocuments = 0;

  for (const imported of importedDocuments) {
    const sameHashMatches = comparableExistingDocuments.filter((document) => document.contentHash === imported.contentHash);
    const sameHashDuplicate = sameHashMatches.find((document) => findDifferingInvoiceInfoFields(imported, document).length === 0);
    if (sameHashDuplicate) {
      continue;
    }

    const sameHashConflict = sameHashMatches[0];
    if (sameHashConflict) {
      const importedId = buildImportedInvoiceDocumentId(imported.id, takenIds);
      const conflict = buildSameHashConflict(importedId, imported, sameHashConflict);
      conflicts.push(conflict);
      conflictedInvoiceDocumentIds.push(importedId);
      conflictedInvoiceDocuments += 1;
      sourceIdToImportedId.set(imported.id, importedId);
      invoiceDocuments.push(normalizeImportedInvoiceDocument(imported, importedId, conflict));
      continue;
    }

    const normalizedInvoiceNumber = imported.invoiceNumber.trim();
    const sameNumberConflict = normalizedInvoiceNumber.length > 0
      ? comparableExistingDocuments.find((document) => document.invoiceNumber.trim() === normalizedInvoiceNumber && document.contentHash !== imported.contentHash)
      : undefined;

    if (sameNumberConflict) {
      const importedId = buildImportedInvoiceDocumentId(imported.id, takenIds);
      const conflict = buildSameNumberConflict(importedId, sameNumberConflict);
      conflicts.push(conflict);
      conflictedInvoiceDocumentIds.push(importedId);
      conflictedInvoiceDocuments += 1;
      sourceIdToImportedId.set(imported.id, importedId);
      invoiceDocuments.push(normalizeImportedInvoiceDocument(imported, importedId, conflict));
      continue;
    }

    const importedId = buildImportedInvoiceDocumentId(imported.id, takenIds);
    sourceIdToImportedId.set(imported.id, importedId);
    invoiceDocuments.push(normalizeImportedInvoiceDocument(imported, importedId));
  }

  return {
    conflicts,
    conflictedInvoiceDocuments,
    conflictedInvoiceDocumentIds,
    sourceIdToImportedId,
    invoiceDocuments,
  };
}
