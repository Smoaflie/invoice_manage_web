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

const AUDIT_FIELD_LABELS: Record<string, string> = {
  invoiceNumber: "发票号码",
  invoiceCode: "发票代码",
  invoiceDate: "开票日期",
  buyerName: "购买方",
  sellerName: "销售方",
  amountWithoutTax: "未税金额",
  taxAmount: "税额",
  totalAmount: "总金额",
  tags: "标签",
  remark: "备注",
  annotation: "批注",
  uploader: "上传者",
  owner: "归属人",
  items: "商品明细",
  ocr识别: "OCR 重新识别",
};

function renderValue(value: unknown) {
  if (typeof value === "number") {
    return value.toFixed(2);
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? "—" : JSON.stringify(value);
  }

  return typeof value === "string" && value.length > 0 ? value : "—";
}

function formatAuditTitle(log: InvoiceAuditLog) {
  const fieldLabel = AUDIT_FIELD_LABELS[log.targetField] ?? log.targetField;

  switch (log.changeType) {
    case "ocr_parse":
      return log.targetField === "ocr识别" ? fieldLabel : `OCR 更新${fieldLabel}`;
    case "manual_tag_update":
      return "修改标签";
    case "manual_annotation_update":
      return "修改批注";
    case "manual_create":
      return fieldLabel;
    case "manual_edit":
    default:
      return `修改${fieldLabel}`;
  }
}

function formatOcrVendorLabel(rawValue: string) {
  const vendor = rawValue.trim().split(/\s+/)[0]?.toLowerCase();

  switch (vendor) {
    case "baidu":
      return "百度";
    case "tencent":
      return "腾讯";
    default:
      return rawValue.trim();
  }
}

function formatAuditValue(log: InvoiceAuditLog, value: string) {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return "空";
  }

  if (log.changeType === "ocr_parse" && log.targetField === "ocr识别") {
    return formatOcrVendorLabel(normalized);
  }

  return normalized;
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
              <li>暂无修改记录。</li>
            ) : (
              auditLogs.map((log) => (
                <li key={log.id}>
                  <strong>{formatAuditTitle(log)}</strong>
                  <span>{log.changedAt}</span>
                  <p>
                    {formatAuditValue(log, log.beforeValue)} {"->"} {formatAuditValue(log, log.afterValue)}
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
