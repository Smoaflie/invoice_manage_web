import type { DashboardSidebarStatus } from "../../dashboard/ui/dashboardSidebarStatus";
import type { DashboardView } from "../../dashboard/ui/Dashboard";
import type { InvoiceBundleNamingMode } from "../../documents/application/invoicePdfExport";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { ReferenceInvoiceWorkspace } from "./ReferenceInvoiceWorkspace";
import type { WorkspaceView } from "./referenceWorkspaceController.shared";

type InvoiceWorkspaceProps = {
  view: WorkspaceView;
  invoiceDocuments: InvoiceDocument[];
  message: string;
  onSidebarStatusChange?: (status: DashboardSidebarStatus) => void;
  onSelectView?: (view: Exclude<DashboardView, "settings">) => void;
  onOpenDetails: (invoiceDocumentId: string) => void;
  onEdit: (invoiceDocumentId: string) => void;
  onOpenPdf: (invoiceDocumentId: string) => void | Promise<void>;
  onExportMergedPdf?: (invoiceDocumentIds: string[]) => void | Promise<void>;
  onExportZip?: (invoiceDocumentIds: string[], bundleNamingMode: InvoiceBundleNamingMode) => void | Promise<void>;
  onDelete: (invoiceDocumentIds: string[]) => void | Promise<void>;
  onReparseSingle?: (invoiceDocumentId: string) => void | Promise<void>;
  onBulkReparse: (invoiceDocumentIds: string[]) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
};

export function InvoiceWorkspace(props: InvoiceWorkspaceProps) {
  return <ReferenceInvoiceWorkspace {...props} />;
}
