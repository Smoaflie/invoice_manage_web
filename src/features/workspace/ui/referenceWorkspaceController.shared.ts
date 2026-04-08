import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { InvoiceBundleNamingMode } from "../../documents/application/invoicePdfExport";
import type { DashboardView } from "../../dashboard/ui/Dashboard";
import type { DashboardSidebarStatus } from "../../dashboard/ui/dashboardSidebarStatus";

export type WorkspaceView = Exclude<DashboardView, "settings" | "collaboration"> | "kanban";

export type ReferenceInvoiceWorkspaceProps = {
  view: WorkspaceView;
  invoiceDocuments: InvoiceDocument[];
  message: string;
  onSidebarStatusChange?: (status: DashboardSidebarStatus) => void;
  onSelectView?: (view: WorkspaceView) => void;
  onOpenDetails: (invoiceDocumentId: string) => void;
  onEdit: (invoiceDocumentId: string) => void;
  onOpenPdf: (invoiceDocumentId: string) => void | Promise<void>;
  onExportMergedPdf?: (invoiceDocumentIds: string[]) => void | Promise<void>;
  onExportZip?: (invoiceDocumentIds: string[], bundleNamingMode: InvoiceBundleNamingMode) => void | Promise<void>;
  onDelete: (invoiceDocumentIds: string[]) => void | Promise<void>;
  onReparseSingle: (invoiceDocumentId: string) => void | Promise<void>;
  onBulkReparse: (invoiceDocumentIds: string[]) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
};

export function equalIdSet(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const id of left) {
    if (!right.has(id)) {
      return false;
    }
  }

  return true;
}

export function sameStringArray(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}
