import type { FilterGroupRule } from "../../shared/types/filterGroup";
import type { InvoiceDocument } from "../../shared/types/invoiceDocument";
import type { FileSavedViewQuery, InvoiceSavedViewQuery, SavedViewQuery, WorkspaceSavedViewQuery } from "../../shared/types/savedView";
import { hasInvoiceData, isActionableInvoice } from "../dashboard/ui/documentRows";
import { matchesFilterRule } from "../filters/application/matchFilterRules";

type QueryContext = {
  groupTagMap?: Record<string, string[]>;
  filterRules?: FilterGroupRule[];
};

function compareText(left: string, right: string, direction: "asc" | "desc") {
  const result = left.localeCompare(right, "zh-CN");
  return direction === "asc" ? result : -result;
}

function compareNumber(left: number, right: number, direction: "asc" | "desc") {
  return direction === "asc" ? left - right : right - left;
}

function compareBindingStatus(left: InvoiceDocument["bindingStatus"], right: InvoiceDocument["bindingStatus"], direction: "asc" | "desc") {
  const weight = { readable: 0, needs_reparse: 1, unreadable: 2 };
  return compareNumber(weight[left], weight[right], direction);
}

function bindingStatusText(status: InvoiceDocument["bindingStatus"]) {
  switch (status) {
    case "readable":
      return "可读取";
    case "unreadable":
      return "无法读取";
    case "needs_reparse":
      return "需重识别";
  }
}

function bindingErrorText(errorType: InvoiceDocument["bindingErrorType"]) {
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
      return "";
  }
}

function sortInvoices(rows: InvoiceDocument[], query: InvoiceSavedViewQuery) {
  return [...rows].sort((left, right) => {
    switch (query.sortBy) {
      case "invoiceDate":
        return compareText(left.invoiceDate, right.invoiceDate, query.sortDirection);
      case "invoiceNumber":
        return compareText(left.invoiceNumber, right.invoiceNumber, query.sortDirection);
      case "totalAmount":
        return compareNumber(left.totalAmount, right.totalAmount, query.sortDirection);
      case "fileName":
        return compareText(left.fileName, right.fileName, query.sortDirection);
      case "updatedAt":
      default:
        return compareText(left.updatedAt, right.updatedAt, query.sortDirection);
    }
  });
}

function sortFiles(rows: InvoiceDocument[], query: FileSavedViewQuery) {
  return [...rows].sort((left, right) => {
    switch (query.sortBy) {
      case "fileName":
        return compareText(left.fileName, right.fileName, query.sortDirection);
      case "bindingStatus":
        return compareBindingStatus(left.bindingStatus, right.bindingStatus, query.sortDirection);
      case "updatedAt":
      default:
        return compareText(left.updatedAt, right.updatedAt, query.sortDirection);
    }
  });
}

function invoiceMatchesQuery(row: InvoiceDocument, query: InvoiceSavedViewQuery, context: QueryContext) {
  if (!hasInvoiceData(row)) {
    return false;
  }

  const normalizedSearch = query.searchText.trim().toLowerCase();
  const remark = row.remark ?? "";
  const annotation = row.annotation ?? "";
  const matchesSearch =
    normalizedSearch.length === 0 ||
    row.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
    row.buyerName.toLowerCase().includes(normalizedSearch) ||
    row.sellerName.toLowerCase().includes(normalizedSearch) ||
    remark.toLowerCase().includes(normalizedSearch) ||
    annotation.toLowerCase().includes(normalizedSearch);

  if (!matchesSearch) {
    return false;
  }

  if (query.status === "parsed" && !(row.parseStatus === "parsed" && row.conflictStatus === "none")) {
    return false;
  }

  if (query.status === "needs_attention" && !isActionableInvoice(row)) {
    return false;
  }

  if (query.tag && !row.tags.includes(query.tag)) {
    return false;
  }

  if (query.tagGroupId) {
    const groupTags = context.groupTagMap?.[query.tagGroupId] ?? [];
    if (!row.tags.some((tag) => groupTags.includes(tag))) {
      return false;
    }
  }

  if (query.ruleId) {
    const rule = context.filterRules?.find((item) => item.id === query.ruleId);
    if (rule && !matchesFilterRule(row, rule)) {
      return false;
    }
  }

  return true;
}

function fileFieldValue(row: InvoiceDocument, field: FileSavedViewQuery["field"]) {
  switch (field) {
    case "fileName":
      return row.fileName;
    case "bindingStatus":
      return bindingStatusText(row.bindingStatus);
    case "bindingErrorType":
      return bindingErrorText(row.bindingErrorType);
    case "invoiceNumber":
      return row.invoiceNumber;
    case "buyerName":
      return row.buyerName;
    case "sellerName":
      return row.sellerName;
    case "remark":
      return row.remark ?? "";
    case "annotation":
      return row.annotation ?? "";
    case "tags":
      return row.tags.join(" ");
    case "all":
      return [
        row.fileName,
        bindingStatusText(row.bindingStatus),
        bindingErrorText(row.bindingErrorType),
        row.invoiceNumber,
        row.buyerName,
        row.sellerName,
        row.remark,
        row.annotation,
        row.tags.join(" "),
      ].join(" ");
    default:
      return "";
  }
}

function fileMatchesQuery(row: InvoiceDocument, query: FileSavedViewQuery) {
  const normalizedSearch = query.searchText.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }
  return fileFieldValue(row, query.field).toLowerCase().includes(normalizedSearch);
}

function workspaceMatchesQuery(row: InvoiceDocument, query: WorkspaceSavedViewQuery) {
  const normalizedSearch = query.searchText.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  return [
    row.fileName,
    row.invoiceNumber,
    row.buyerName,
    row.sellerName,
    row.uploader,
    row.owner,
    row.remark ?? "",
    row.annotation ?? "",
    row.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

export function applySavedViewQuery(rows: InvoiceDocument[], query: SavedViewQuery, context: QueryContext = {}) {
  if (query.scope === "invoices") {
    return sortInvoices(rows.filter((row) => invoiceMatchesQuery(row, query, context)), query);
  }

  if (query.scope === "files") {
    return sortFiles(rows.filter((row) => fileMatchesQuery(row, query)), query);
  }

  return rows.filter((row) => workspaceMatchesQuery(row, query));
}
