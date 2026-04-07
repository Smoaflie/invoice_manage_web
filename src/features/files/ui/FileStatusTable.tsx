import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { bindingErrorTypeLabel, bindingStatusLabel } from "../../dashboard/ui/dashboardViewModels";

type FileStatusTableProps = {
  rows: InvoiceDocument[];
  selectedIds?: string[];
  onToggleSelected?: (invoiceDocumentId: string, options?: { shiftKey: boolean }) => void;
  onToggleAll?: () => void;
  onParse?: (invoiceDocumentId: string) => void | Promise<void>;
  parsingInvoiceDocumentId?: string | null;
  onOpenPdf?: (invoiceDocumentId: string) => void | Promise<void>;
  onCreateManual?: (invoiceDocumentId: string) => void | Promise<void>;
  onDelete?: (invoiceDocumentId: string) => void | Promise<void>;
};

export function FileStatusTable({
  rows,
  selectedIds = [],
  onToggleSelected,
  onToggleAll,
  onParse,
  parsingInvoiceDocumentId,
  onOpenPdf,
  onCreateManual,
  onDelete,
}: FileStatusTableProps) {
  const canParse = onParse !== undefined;
  const canOpenPdf = onOpenPdf !== undefined;
  const canCreateManual = onCreateManual !== undefined;
  const canDelete = onDelete !== undefined;
  const showSelection = onToggleSelected !== undefined;
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));
  const statusTone = (status: InvoiceDocument["bindingStatus"]) => {
    if (status === "readable") {
      return "status-pill status-pill--success";
    }

    if (status === "needs_reparse") {
      return "status-pill status-pill--warning";
    }

    return "status-pill status-pill--danger";
  };

  return (
    <div className="data-table">
      <table className="ledger-table ledger-table--files">
        <thead>
          <tr>
            {showSelection ? (
              <th>
                <input type="checkbox" aria-label="选择全部文件" checked={allSelected} onChange={() => onToggleAll?.()} />
              </th>
            ) : null}
            <th>文件</th>
            <th>状态</th>
            <th>异常</th>
            {canParse || canOpenPdf || canCreateManual || canDelete ? <th>操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={showSelection ? 5 : 4}>暂无文件。</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                {showSelection ? (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`选择文件 ${row.fileName}`}
                      checked={selectedIds.includes(row.id)}
                      onChange={(event) => onToggleSelected?.(row.id, { shiftKey: (event.nativeEvent as MouseEvent).shiftKey })}
                    />
                  </td>
                ) : null}
                <td>{row.fileName}</td>
                <td>
                  <span className={statusTone(row.bindingStatus)}>{bindingStatusLabel(row.bindingStatus)}</span>
                </td>
                <td>{bindingErrorTypeLabel(row.bindingErrorType)}</td>
                {canParse || canOpenPdf || canCreateManual || canDelete ? (
                  <td>
                    <div className="table-action-row">
                      {canParse ? (
                        <button
                          type="button"
                          onClick={() => {
                            void onParse?.(row.id);
                          }}
                          disabled={parsingInvoiceDocumentId === row.id || row.handleRef.length === 0}
                        >
                          {parsingInvoiceDocumentId === row.id ? "识别中..." : "识别发票"}
                        </button>
                      ) : null}
                      {canOpenPdf ? (
                        <button type="button" onClick={() => void onOpenPdf?.(row.id)} disabled={!row.handleRef}>
                          打开 PDF
                        </button>
                      ) : null}
                      {canCreateManual ? (
                        <button type="button" onClick={() => void onCreateManual?.(row.id)}>
                          手动录入
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button type="button" onClick={() => void onDelete?.(row.id)}>
                          删除文件
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
