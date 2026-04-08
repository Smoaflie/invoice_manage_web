import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { SavedViewQuery } from "../../../shared/types/savedView";
import type { FilterGroupRule } from "../../../shared/types/filterGroup";
import { applySavedViewQuery } from "../../query/queryEngine";
import { createDefaultInvoiceViewQuery } from "../../views/application/defaultSavedViews";
import { isActionableInvoice } from "./documentRows";

export type InvoiceFilterStatus = "all" | "parsed" | "needs_attention";

type PendingItem = {
  id: string;
  label: string;
  detail: string;
};

export function bindingStatusLabel(status: InvoiceDocument["bindingStatus"]) {
  switch (status) {
    case "readable":
      return "可读取";
    case "unreadable":
      return "无法读取";
    case "needs_reparse":
      return "需重识别";
  }
}

export function bindingErrorTypeLabel(errorType: InvoiceDocument["bindingErrorType"]) {
  switch (errorType) {
    case "handle_missing":
      return "缺少文件句柄";
    case "permission_denied":
      return "权限被拒绝";
    case "file_not_found":
      return "文件不存在";
    case "handle_unavailable":
      return "句柄不可用";
    case "hash_mismatch":
      return "文件内容已变化";
    case null:
      return "—";
  }
}

export function parseStatusLabel(status: InvoiceDocument["parseStatus"]) {
  switch (status) {
    case "idle":
      return "未识别";
    case "parsed":
      return "已识别";
    case "parse_failed":
      return "识别失败";
    case "needs_reparse":
      return "待重识别";
  }
}

export function conflictStatusLabel(status: InvoiceDocument["conflictStatus"]) {
  switch (status) {
    case "none":
      return "无冲突";
    case "same_number_diff_hash":
      return "同号异文件";
    case "same_hash_diff_invoice_data":
      return "同文件异信息";
  }
}

function sortByUpdatedAt<T extends { updatedAt: string }>(rows: T[]) {
  return [...rows].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function buildOverviewViewModel(
  invoiceDocuments: InvoiceDocument[],
  query?: SavedViewQuery | null,
  context: { groupTagMap?: Record<string, string[]>; filterRules?: FilterGroupRule[] } = {},
) {
  const visibleDocuments = query
    ? applySavedViewQuery(invoiceDocuments, query, context)
    : applySavedViewQuery(invoiceDocuments, createDefaultInvoiceViewQuery(), context);
  const totalAmount = visibleDocuments.reduce((sum, row) => sum + row.totalAmount, 0);
  const parsedCount = visibleDocuments.filter((row) => row.parseStatus === "parsed").length;
  const pendingFileCount = visibleDocuments.filter((row) => row.bindingStatus !== "readable").length;
  const pendingInvoiceCount = visibleDocuments.filter(isActionableInvoice).length;
  const conflictCount = visibleDocuments.filter((row) => row.conflictStatus !== "none").length;
  const recentFiles = sortByUpdatedAt(visibleDocuments).slice(0, 4);
  const recentInvoices = sortByUpdatedAt(visibleDocuments).slice(0, 4);
  const pendingItems: PendingItem[] = [
    ...visibleDocuments
      .filter((row) => row.bindingStatus !== "readable")
      .map((row) => ({ id: row.id, label: row.fileName, detail: bindingStatusLabel(row.bindingStatus) })),
    ...visibleDocuments
      .filter(isActionableInvoice)
      .map((row) => ({
        id: row.id,
        label: row.invoiceNumber || "未编号发票",
        detail: row.conflictStatus !== "none" ? conflictStatusLabel(row.conflictStatus) : parseStatusLabel(row.parseStatus),
      })),
  ].slice(0, 5);

  return {
    totalCount: visibleDocuments.length,
    totalAmount,
    parsedCount,
    needsReviewCount: pendingFileCount + pendingInvoiceCount,
    conflictCount,
    recentFiles,
    recentInvoices,
    pendingItems,
  };
}

export function filterInvoices(invoiceDocuments: InvoiceDocument[], options: { query: string; status: InvoiceFilterStatus }) {
  return applySavedViewQuery(invoiceDocuments, {
    scope: "invoices",
    searchText: options.query,
    status: options.status,
    tag: "",
    tagGroupId: "",
    ruleId: "",
    sortBy: "updatedAt",
    sortDirection: "desc",
  });
}

export function buildFilesViewModel(invoiceDocuments: InvoiceDocument[]) {
  return {
    total: invoiceDocuments.length,
    readable: invoiceDocuments.filter((row) => row.bindingStatus === "readable").length,
    unreadable: invoiceDocuments.filter((row) => row.bindingStatus === "unreadable").length,
    needsReparse: invoiceDocuments.filter((row) => row.bindingStatus === "needs_reparse").length,
  };
}
