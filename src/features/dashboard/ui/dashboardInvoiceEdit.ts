import type { InvoiceAuditChangeType } from "../../../shared/types/invoiceAuditLog";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import { saveInvoiceEdits } from "../../documents/application/saveInvoiceEdits";
import { detectConflicts } from "../../invoices/application/detectConflicts";
import type { InvoiceEditValues } from "../../invoices/ui/InvoiceEditDialog";
import { parseAmount, parseTags } from "./dashboardDocumentActions";

type SaveDashboardInvoiceEditsInput = {
  invoiceDocumentId: string;
  mode: "manual-create" | "manual-edit";
  invoiceDocuments: InvoiceDocument[];
  values: InvoiceEditValues;
  now: () => string;
};

export async function saveDashboardInvoiceEdits(input: SaveDashboardInvoiceEditsInput) {
  const currentDocument = input.invoiceDocuments.find((row) => row.id === input.invoiceDocumentId);
  if (!currentDocument) {
    throw new Error("找不到待编辑的发票记录。");
  }

  const changeType: InvoiceAuditChangeType = input.mode === "manual-create" ? "manual_create" : "manual_edit";
  const savedDocument = await saveInvoiceEdits({
    invoiceDocumentId: input.invoiceDocumentId,
    changeType,
    now: input.now,
    nextValues: {
      invoiceNumber: input.values.invoiceNumber.trim(),
      invoiceCode: input.values.invoiceCode.trim(),
      invoiceDate: input.values.invoiceDate.trim(),
      buyerName: input.values.buyerName.trim(),
      sellerName: input.values.sellerName.trim(),
      amountWithoutTax: parseAmount(input.values.amountWithoutTax),
      taxAmount: parseAmount(input.values.taxAmount),
      totalAmount: parseAmount(input.values.totalAmount),
      tags: parseTags(input.values.tagsText),
      remark: input.values.remark.trim(),
      annotation: input.values.annotation.trim(),
      parseStatus: "parsed",
      sourceType: input.mode === "manual-create" ? "manual" : currentDocument.sourceType,
    },
  });

  if (savedDocument.invoiceNumber || currentDocument.invoiceNumber) {
    await detectConflicts(savedDocument.invoiceNumber, currentDocument.invoiceNumber);
  }

  return savedDocument;
}
