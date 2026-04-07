import { useEffect, useState } from "react";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";

type InvoiceEditDialogMode = "manual-create" | "manual-edit";

export type InvoiceEditValues = {
  invoiceNumber: string;
  invoiceCode: string;
  invoiceDate: string;
  buyerName: string;
  sellerName: string;
  amountWithoutTax: string;
  taxAmount: string;
  totalAmount: string;
  tagsText: string;
  remark: string;
  annotation: string;
};

type InvoiceEditDialogProps = {
  invoiceDocument: InvoiceDocument | null;
  open: boolean;
  mode: InvoiceEditDialogMode;
  onClose: () => void;
  onSave: (values: InvoiceEditValues) => void | Promise<void>;
  onReparse?: () => void | Promise<void>;
  reparseBusy?: boolean;
};

function toFormValues(invoiceDocument: InvoiceDocument | null): InvoiceEditValues {
  return {
    invoiceNumber: invoiceDocument?.invoiceNumber ?? "",
    invoiceCode: invoiceDocument?.invoiceCode ?? "",
    invoiceDate: invoiceDocument?.invoiceDate ?? "",
    buyerName: invoiceDocument?.buyerName ?? "",
    sellerName: invoiceDocument?.sellerName ?? "",
    amountWithoutTax: invoiceDocument ? String(invoiceDocument.amountWithoutTax || "") : "",
    taxAmount: invoiceDocument ? String(invoiceDocument.taxAmount || "") : "",
    totalAmount: invoiceDocument ? String(invoiceDocument.totalAmount || "") : "",
    tagsText: invoiceDocument?.tags.join(" ") ?? "",
    remark: invoiceDocument?.remark ?? "",
    annotation: invoiceDocument?.annotation ?? "",
  };
}

export function InvoiceEditDialog({ invoiceDocument, open, mode, onClose, onSave, onReparse, reparseBusy = false }: InvoiceEditDialogProps) {
  const [values, setValues] = useState<InvoiceEditValues>(() => toFormValues(invoiceDocument));

  useEffect(() => {
    if (open) {
      setValues(toFormValues(invoiceDocument));
    }
  }, [invoiceDocument, open]);

  if (!open || !invoiceDocument) {
    return null;
  }

  return (
    <div className="overlay-shell" role="presentation">
      <section className="dialog-panel" aria-label={mode === "manual-create" ? "手动录入发票" : "编辑发票"}>
        <div className="dialog-panel__header">
          <div>
            <p className="workspace-card__eyebrow">{mode === "manual-create" ? "手动录入" : "编辑发票"}</p>
            <h2>{invoiceDocument.fileName}</h2>
          </div>
          <div className="table-action-row">
            {mode === "manual-edit" && onReparse ? (
              <button type="button" className="button-secondary" onClick={() => void onReparse()} disabled={reparseBusy || !invoiceDocument.handleRef}>
                {reparseBusy ? "重新识别中..." : "重新 OCR 识别"}
              </button>
            ) : null}
            <button type="button" className="button-secondary" onClick={onClose}>
              取消
            </button>
          </div>
        </div>

        <form
          className="document-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave(values);
          }}
        >
          <div className="document-form__grid">
            <label>
              <span>发票号码</span>
              <input value={values.invoiceNumber} onChange={(event) => setValues((current) => ({ ...current, invoiceNumber: event.target.value }))} />
            </label>
            <label>
              <span>发票代码</span>
              <input value={values.invoiceCode} onChange={(event) => setValues((current) => ({ ...current, invoiceCode: event.target.value }))} />
            </label>
            <label>
              <span>开票日期</span>
              <input value={values.invoiceDate} onChange={(event) => setValues((current) => ({ ...current, invoiceDate: event.target.value }))} />
            </label>
            <label>
              <span>购买方</span>
              <input value={values.buyerName} onChange={(event) => setValues((current) => ({ ...current, buyerName: event.target.value }))} />
            </label>
            <label>
              <span>销售方</span>
              <input value={values.sellerName} onChange={(event) => setValues((current) => ({ ...current, sellerName: event.target.value }))} />
            </label>
            <label>
              <span>未税金额</span>
              <input value={values.amountWithoutTax} onChange={(event) => setValues((current) => ({ ...current, amountWithoutTax: event.target.value }))} />
            </label>
            <label>
              <span>税额</span>
              <input value={values.taxAmount} onChange={(event) => setValues((current) => ({ ...current, taxAmount: event.target.value }))} />
            </label>
            <label>
              <span>总金额</span>
              <input value={values.totalAmount} onChange={(event) => setValues((current) => ({ ...current, totalAmount: event.target.value }))} />
            </label>
          </div>

          <label>
            <span>标签</span>
            <input value={values.tagsText} onChange={(event) => setValues((current) => ({ ...current, tagsText: event.target.value }))} placeholder="用空格分隔多个标签" />
          </label>

          <label>
            <span>备注</span>
            <textarea rows={3} value={values.remark} onChange={(event) => setValues((current) => ({ ...current, remark: event.target.value }))} />
          </label>

          <label>
            <span>批注</span>
            <textarea rows={4} value={values.annotation} onChange={(event) => setValues((current) => ({ ...current, annotation: event.target.value }))} />
          </label>

          <div className="dialog-panel__actions">
            <button type="submit">{mode === "manual-create" ? "保存为手动发票" : "保存修改"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
