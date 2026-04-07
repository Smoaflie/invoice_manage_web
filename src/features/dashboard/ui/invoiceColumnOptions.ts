export const INVOICE_COLUMN_OPTIONS = [
  { key: "invoiceNumber", label: "发票号码" },
  { key: "invoiceCode", label: "发票代码" },
  { key: "invoiceDate", label: "开票日期" },
  { key: "buyerName", label: "购买方" },
  { key: "sellerName", label: "销售方" },
  { key: "totalAmount", label: "总金额" },
  { key: "tags", label: "标签" },
  { key: "remark", label: "备注" },
  { key: "annotation", label: "批注" },
  { key: "parseStatus", label: "识别状态" },
  { key: "conflictStatus", label: "冲突状态" },
] as const;

export type InvoiceColumnKey = (typeof INVOICE_COLUMN_OPTIONS)[number]["key"];
