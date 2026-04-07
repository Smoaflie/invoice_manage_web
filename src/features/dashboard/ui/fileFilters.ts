import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { FileSavedViewQuery } from "../../../shared/types/savedView";
import { applySavedViewQuery } from "../../query/queryEngine";

export const FILE_FILTER_FIELDS = [
  { key: "all", label: "全部字段" },
  { key: "fileName", label: "文件名" },
  { key: "bindingStatus", label: "绑定状态" },
  { key: "bindingErrorType", label: "异常原因" },
  { key: "invoiceNumber", label: "发票号码" },
  { key: "buyerName", label: "购买方" },
  { key: "sellerName", label: "销售方" },
  { key: "remark", label: "备注" },
  { key: "annotation", label: "批注" },
  { key: "tags", label: "标签" },
] as const;

export type FileFilterField = (typeof FILE_FILTER_FIELDS)[number]["key"];

export function filterFileRows(rows: InvoiceDocument[], query: FileSavedViewQuery) {
  return applySavedViewQuery(rows, query);
}
