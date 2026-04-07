import type { FileEntry } from "../../../shared/types/fileEntry";
import type { InvoiceRecord } from "../../../shared/types/invoiceRecord";

type DashboardSummaryProps = {
  fileEntries: FileEntry[];
  invoiceRecords: InvoiceRecord[];
};

export function DashboardSummary({ fileEntries, invoiceRecords }: DashboardSummaryProps) {
  const totalAmount = invoiceRecords.reduce((sum, row) => sum + row.totalAmount, 0);
  const unresolvedCount = fileEntries.filter((entry) => entry.bindingStatus !== "readable").length;
  const conflictCount = invoiceRecords.filter((row) => row.conflictStatus !== "none").length;

  return (
    <section className="dashboard-summary" data-testid="dashboard-summary">
      <div>
        <span>Total amount</span>
        <strong>{totalAmount.toFixed(2)}</strong>
      </div>
      <div>
        <span>Invoices</span>
        <strong>{invoiceRecords.length}</strong>
      </div>
      <div>
        <span>Need attention</span>
        <strong>{unresolvedCount}</strong>
      </div>
      <div>
        <span>Conflicts</span>
        <strong>{conflictCount}</strong>
      </div>
    </section>
  );
}
