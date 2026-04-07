export type InvoiceAuditChangeType =
  | "manual_create"
  | "manual_edit"
  | "manual_tag_update"
  | "manual_annotation_update";

export interface InvoiceAuditLog {
  id: string;
  invoiceDocumentId: string;
  changedAt: string;
  changeType: InvoiceAuditChangeType;
  targetField: string;
  beforeValue: string;
  afterValue: string;
}
