import type { InvoiceAuditLog } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { bindingStatusLabel, conflictStatusLabel, parseStatusLabel } from "../../dashboard/ui/dashboardViewModels";

type InvoiceDetailsDrawerProps = {
  invoiceDocument: InvoiceDocument | null;
  auditLogs: InvoiceAuditLog[];
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onOpenPdf: () => void | Promise<void>;
};

const DETAIL_ROWS: Array<{ label: string; field: keyof InvoiceDocument }> = [
  { label: "发票号码", field: "invoiceNumber" },
  { label: "发票代码", field: "invoiceCode" },
  { label: "开票日期", field: "invoiceDate" },
  { label: "购买方", field: "buyerName" },
  { label: "销售方", field: "sellerName" },
  { label: "未税金额", field: "amountWithoutTax" },
  { label: "税额", field: "taxAmount" },
  { label: "总金额", field: "totalAmount" },
  { label: "上传者", field: "uploader" },
  { label: "归属人", field: "owner" },
];

function renderValue(value: unknown) {
  if (typeof value === "number") {
    return value.toFixed(2);
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? "—" : JSON.stringify(value);
  }

  return typeof value === "string" && value.length > 0 ? value : "—";
}

export function InvoiceDetailsDrawer({
  invoiceDocument,
  auditLogs,
  open,
  onClose,
  onEdit,
  onOpenPdf,
}: InvoiceDetailsDrawerProps) {
  if (!open || !invoiceDocument) {
    return null;
  }

  return (
    <div className="overlay-shell" role="presentation">
      <aside className="side-drawer" aria-label="发票详情">
        <div className="side-drawer__header">
          <div>
            <p className="workspace-card__eyebrow">发票详情</p>
            <h2>{invoiceDocument.invoiceNumber || invoiceDocument.fileName}</h2>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="side-drawer__actions">
          <button type="button" onClick={onEdit}>
            编辑发票
          </button>
          <button type="button" className="button-secondary" onClick={() => void onOpenPdf()} disabled={!invoiceDocument.handleRef}>
            打开 PDF
          </button>
        </div>

        <div className="detail-pill-row">
          <span className="status-pill status-pill--neutral">{parseStatusLabel(invoiceDocument.parseStatus)}</span>
          <span className="status-pill status-pill--neutral">{bindingStatusLabel(invoiceDocument.bindingStatus)}</span>
          <span className={invoiceDocument.conflictStatus === "none" ? "status-pill status-pill--neutral" : "status-pill status-pill--danger"}>
            {conflictStatusLabel(invoiceDocument.conflictStatus)}
          </span>
          {invoiceDocument.sourceType === "manual" ? <span className="status-pill status-pill--neutral">手动添加</span> : null}
          {invoiceDocument.edited ? <span className="status-pill status-pill--warning">被编辑</span> : null}
        </div>

        <section className="detail-section">
          <h3>基本信息</h3>
          <dl className="detail-grid">
            {DETAIL_ROWS.map((item) => (
              <div key={item.field}>
                <dt>{item.label}</dt>
                <dd>{renderValue(invoiceDocument[item.field])}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="detail-section">
          <h3>标签、备注与批注</h3>
          <div className="detail-tag-list">
            {invoiceDocument.tags.length === 0 ? "—" : invoiceDocument.tags.map((tag) => <span key={tag} className="table-tag">{tag}</span>)}
          </div>
          <p className="detail-annotation">{invoiceDocument.remark || "暂无备注。"}</p>
          <p className="detail-annotation">{invoiceDocument.annotation || "暂无批注。"}</p>
        </section>

        <section className="detail-section">
          <h3>修改历史</h3>
          <ul className="audit-list">
            {auditLogs.length === 0 ? (
              <li>暂无人工修改记录。</li>
            ) : (
              auditLogs.map((log) => (
                <li key={log.id}>
                  <strong>{log.targetField}</strong>
                  <span>{log.changedAt}</span>
                  <p>
                    {log.beforeValue || "空"} → {log.afterValue || "空"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </aside>
    </div>
  );
}
