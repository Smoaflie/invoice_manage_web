export const FILTER_GROUP_FIELDS = [
  "invoiceNumber",
  "invoiceCode",
  "invoiceDate",
  "buyerName",
  "sellerName",
  "amountWithoutTax",
  "taxAmount",
  "totalAmount",
  "uploader",
  "owner",
  "annotation",
  "fileName",
  "parseStatus",
  "conflictStatus",
  "bindingStatus",
  "createdAt",
  "updatedAt",
] as const;

export type FilterGroupField = (typeof FILTER_GROUP_FIELDS)[number];
export type FilterGroupRuleOperator = "regex" | "equals" | "greater_than" | "less_than";
export type ConditionGroupMode = "all" | "any";
export type FieldConditionOperator = "contains" | "equals" | "matches_regex" | "includes_any" | "greater_than" | "less_than" | "is_not_empty";

export const FILTER_GROUP_NUMERIC_FIELDS = new Set<FilterGroupField>(["amountWithoutTax", "taxAmount", "totalAmount", "createdAt", "updatedAt"]);

export const FILTER_GROUP_FIELD_LABELS: Record<FilterGroupField, string> = {
  invoiceNumber: "发票号码",
  invoiceCode: "发票代码",
  invoiceDate: "开票日期",
  buyerName: "购买方",
  sellerName: "销售方",
  amountWithoutTax: "未税金额",
  taxAmount: "税额",
  totalAmount: "总金额",
  uploader: "上传者",
  owner: "归属人",
  annotation: "批注",
  fileName: "文件名",
  parseStatus: "识别状态",
  conflictStatus: "冲突状态",
  bindingStatus: "绑定状态",
  createdAt: "创建时间",
  updatedAt: "更新时间",
};

export interface FieldCondition {
  id: string;
  kind: "field";
  fieldId: string;
  operator: FieldConditionOperator;
  value: string | number | boolean | string[];
}

export interface FilterGroupReferenceCondition {
  id: string;
  kind: "filter_group";
  filterGroupId: string;
}

export interface ConditionGroup {
  id: string;
  kind: "group";
  mode: ConditionGroupMode;
  children: ConditionNode[];
}

export type ConditionNode = FieldCondition | FilterGroupReferenceCondition | ConditionGroup;

export interface FilterGroup {
  id: string;
  name: string;
  root: ConditionGroup;
  createdAt: string;
  updatedAt: string;
}

export interface FilterGroupRule {
  id: string;
  groupId: string;
  label: string;
  field: FilterGroupField;
  operator?: FilterGroupRuleOperator;
  pattern: string;
}

export function createEmptyConditionGroup(id = "condition-root"): ConditionGroup {
  return {
    id,
    kind: "group",
    mode: "all",
    children: [],
  };
}
