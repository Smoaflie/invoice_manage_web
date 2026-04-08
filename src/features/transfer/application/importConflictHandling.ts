import type { ImportDataResult } from "./importData";

type ImportConflictErrorLike = {
  name: "ImportConflictError";
  conflicts: unknown[];
};

export function isImportConflictError(error: unknown): error is ImportConflictErrorLike {
  return error instanceof Error && error.name === "ImportConflictError" && Array.isArray((error as { conflicts?: unknown }).conflicts);
}

export function confirmImportConflicts(conflictCount: number) {
  return window.confirm(
    `检测到 ${conflictCount} 条导入冲突。继续后会导入这些记录，并将其标记为冲突以便后续手动处理。是否继续？`,
  );
}

export function buildImportResultMessage(result: ImportDataResult) {
  if (result.importedInvoiceDocuments === 0) {
    return "没有新增发票记录。";
  }

  if (result.conflictedInvoiceDocuments > 0) {
    return `已导入 ${result.importedInvoiceDocuments} 条发票记录，其中 ${result.conflictedInvoiceDocuments} 条已标记为冲突。`;
  }

  return `已导入 ${result.importedInvoiceDocuments} 条发票记录。`;
}
