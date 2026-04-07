import { createEmptyConditionGroup } from "../../../shared/types/filterGroup";
import type { FileSavedViewQuery, InvoiceSavedViewQuery, WorkspaceSavedViewQuery } from "../../../shared/types/savedView";

export function createDefaultInvoiceViewQuery(): InvoiceSavedViewQuery {
  return {
    scope: "invoices",
    searchText: "",
    status: "all",
    tag: "",
    tagGroupId: "",
    ruleId: "",
    sortBy: "updatedAt",
    sortDirection: "desc",
  };
}

export function createDefaultFileViewQuery(): FileSavedViewQuery {
  return {
    scope: "files",
    searchText: "",
    field: "all",
    sortBy: "updatedAt",
    sortDirection: "desc",
  };
}

export function createDefaultWorkspaceViewQuery(): WorkspaceSavedViewQuery {
  return {
    scope: "workspace",
    searchText: "",
    conditionRoot: createEmptyConditionGroup(),
    sorters: [{ fieldId: "updatedAt", direction: "desc" }],
    groupByFieldId: "",
    fieldOrder: [],
    recordColumnWidths: {},
    itemColumnWidths: {},
  };
}
