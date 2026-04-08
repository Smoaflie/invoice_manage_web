import type { ConditionGroup, FieldCondition, FieldConditionOperator } from "./filterGroup";

export type SavedViewScope = "invoices" | "files" | "workspace";
export type ViewSortDirection = "asc" | "desc";

export type InvoiceSavedViewQuery = {
  scope: "invoices";
  searchText: string;
  status: "all" | "parsed" | "needs_attention";
  tag: string;
  tagGroupId: string;
  ruleId: string;
  sortBy: "updatedAt" | "invoiceDate" | "invoiceNumber" | "totalAmount" | "fileName";
  sortDirection: ViewSortDirection;
};

export type FileSavedViewQuery = {
  scope: "files";
  searchText: string;
  field: "all" | "fileName" | "bindingStatus" | "bindingErrorType" | "invoiceNumber" | "buyerName" | "sellerName" | "remark" | "annotation" | "tags";
  sortBy: "updatedAt" | "fileName" | "bindingStatus";
  sortDirection: ViewSortDirection;
};

export type WorkspaceFilterOperator = FieldConditionOperator;
export type WorkspaceFilter = FieldCondition;

export type WorkspaceSorter = {
  fieldId: string;
  direction: ViewSortDirection;
};

export type WorkspaceTableColumnWidths = {
  itemDetails: number;
  actions: number;
};

export type WorkspaceSavedViewQuery = {
  scope: "workspace";
  view?: "records" | "kanban" | "analytics" | "dashboard";
  searchText: string;
  conditionRoot: ConditionGroup;
  filters?: WorkspaceFilter[];
  sorters: WorkspaceSorter[];
  groupByFieldId: string;
  kanbanFieldId?: string;
  analyticsBreakdownFieldId?: string;
  fieldOrder: string[];
  recordColumnWidths?: Record<string, number>;
  itemColumnWidths?: Record<string, number>;
  tableColumnWidths?: Partial<WorkspaceTableColumnWidths>;
};

export type SavedViewQuery = InvoiceSavedViewQuery | FileSavedViewQuery | WorkspaceSavedViewQuery;

export interface SavedView {
  id: string;
  scope: SavedViewScope;
  name: string;
  isDefault: boolean;
  query: SavedViewQuery;
  visibleColumns: string[];
  createdAt: string;
  updatedAt: string;
}
