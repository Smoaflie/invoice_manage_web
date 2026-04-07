import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { InvoiceColumnKey } from "../../dashboard/ui/invoiceColumnOptions";
import { conflictStatusLabel, parseStatusLabel } from "../../dashboard/ui/dashboardViewModels";

export interface InvoiceTableProps {
  rows: InvoiceDocument[];
  selectedIds?: string[];
  onToggleSelected?: (invoiceDocumentId: string, options?: { shiftKey: boolean }) => void;
  onToggleAll?: () => void;
  onOpenDetails?: (invoiceDocumentId: string) => void;
  onEdit?: (invoiceDocumentId: string) => void;
  onOpenPdf?: (invoiceDocumentId: string) => void;
  onDelete?: (invoiceDocumentId: string) => void;
  visibleColumns?: InvoiceColumnKey[];
}

export function InvoiceTable({
  rows,
  selectedIds = [],
  onToggleSelected,
  onToggleAll,
  onOpenDetails,
  onEdit,
  onOpenPdf,
  onDelete,
  visibleColumns,
}: InvoiceTableProps) {
  const parseTone = (status: InvoiceDocument["parseStatus"]) => {
    if (status === "parsed") {
      return "status-pill status-pill--success";
    }

    if (status === "idle") {
      return "status-pill status-pill--neutral";
    }

    return "status-pill status-pill--warning";
  };

  const conflictTone = (status: InvoiceDocument["conflictStatus"]) => {
    return status === "none" ? "status-pill status-pill--neutral" : "status-pill status-pill--danger";
  };
  const showSelection = onToggleSelected !== undefined;
  const showActions = onOpenDetails || onEdit || onOpenPdf || onDelete;
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));
  const isVisible = (column: InvoiceColumnKey) => visibleColumns?.includes(column) ?? true;
  const dataColumnCount = [
    isVisible("invoiceNumber"),
    isVisible("invoiceCode"),
    isVisible("invoiceDate"),
    isVisible("buyerName"),
    isVisible("sellerName"),
    isVisible("totalAmount"),
    isVisible("tags"),
    isVisible("remark"),
    isVisible("annotation"),
    isVisible("parseStatus"),
    isVisible("conflictStatus"),
  ].filter(Boolean).length;

  return (
    <div className="data-table">
      <table className="ledger-table">
        <thead>
          <tr>
            {showSelection ? (
              <th>
                <input type="checkbox" aria-label="选择全部发票" checked={allSelected} onChange={() => onToggleAll?.()} />
              </th>
            ) : null}
            {isVisible("invoiceNumber") ? <th>发票号码</th> : null}
            {isVisible("invoiceCode") ? <th>发票代码</th> : null}
            {isVisible("invoiceDate") ? <th>开票日期</th> : null}
            {isVisible("buyerName") ? <th>购买方</th> : null}
            {isVisible("sellerName") ? <th>销售方</th> : null}
            {isVisible("totalAmount") ? <th>总金额</th> : null}
            {isVisible("tags") ? <th>标签</th> : null}
            {isVisible("remark") ? <th>备注</th> : null}
            {isVisible("annotation") ? <th>批注</th> : null}
            {isVisible("parseStatus") ? <th>识别状态</th> : null}
            {isVisible("conflictStatus") ? <th>冲突状态</th> : null}
            {showActions ? <th>操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={(showSelection ? 1 : 0) + dataColumnCount + (showActions ? 1 : 0)}>暂无发票记录。</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                {showSelection ? (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`选择发票 ${row.invoiceNumber || row.fileName}`}
                      checked={selectedIds.includes(row.id)}
                      onChange={(event) => onToggleSelected?.(row.id, { shiftKey: (event.nativeEvent as MouseEvent).shiftKey })}
                    />
                  </td>
                ) : null}
                {isVisible("invoiceNumber") ? <td>{row.invoiceNumber || "—"}</td> : null}
                {isVisible("invoiceCode") ? <td>{row.invoiceCode || "—"}</td> : null}
                {isVisible("invoiceDate") ? <td>{row.invoiceDate || "—"}</td> : null}
                {isVisible("buyerName") ? <td>{row.buyerName || "—"}</td> : null}
                {isVisible("sellerName") ? <td>{row.sellerName || "—"}</td> : null}
                {isVisible("totalAmount") ? <td>{row.totalAmount.toFixed(2)}</td> : null}
                {isVisible("tags") ? (
                  <td>
                    <div className="table-tag-list">
                      {row.tags.length === 0 ? "—" : row.tags.map((tag) => <span key={tag} className="table-tag">{tag}</span>)}
                    </div>
                  </td>
                ) : null}
                {isVisible("remark") ? <td>{row.remark || "—"}</td> : null}
                {isVisible("annotation") ? <td>{row.annotation || "—"}</td> : null}
                {isVisible("parseStatus") ? (
                  <td>
                    <div className="table-status-stack">
                      <span className={parseTone(row.parseStatus)}>{parseStatusLabel(row.parseStatus)}</span>
                      {row.sourceType === "manual" ? <span className="status-pill status-pill--neutral">手动添加</span> : null}
                      {row.edited ? <span className="status-pill status-pill--warning">被编辑</span> : null}
                    </div>
                  </td>
                ) : null}
                {isVisible("conflictStatus") ? (
                  <td>
                    <span className={conflictTone(row.conflictStatus)}>{conflictStatusLabel(row.conflictStatus)}</span>
                  </td>
                ) : null}
                {showActions ? (
                  <td>
                    <div className="table-action-row">
                      {onOpenDetails ? (
                        <button type="button" onClick={() => onOpenDetails(row.id)}>
                          查看详情
                        </button>
                      ) : null}
                      {onEdit ? (
                        <button type="button" onClick={() => onEdit(row.id)}>
                          编辑发票
                        </button>
                      ) : null}
                      {onOpenPdf ? (
                        <button type="button" onClick={() => onOpenPdf(row.id)} disabled={!row.handleRef}>
                          打开 PDF
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button type="button" onClick={() => onDelete(row.id)}>
                          删除记录
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
