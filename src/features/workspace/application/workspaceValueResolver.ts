import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { buildItemBrief, buildItemDetail, buildItemField, getTagGroupDisplayValues } from "./workspaceFieldValue";

export function getWorkspaceFieldValue(row: InvoiceDocument, field: WorkspaceFieldDefinition | undefined) {
  if (!field) {
    return "";
  }

  if (field.source === "tag_group") {
    return getTagGroupDisplayValues(row.tags, field);
  }

  switch (field.id) {
    case "fileName":
      return row.fileName;
    case "bindingStatus":
      return row.bindingStatus;
    case "bindingErrorType":
      return row.bindingErrorType ?? "";
    case "parseStatus":
      return row.parseStatus;
    case "conflictStatus":
      return row.conflictStatus;
    case "conflictMessage":
      return row.conflictMessage;
    case "invoiceNumber":
      return row.invoiceNumber;
    case "invoiceCode":
      return row.invoiceCode;
    case "invoiceDate":
      return row.invoiceDate;
    case "buyerName":
      return row.buyerName;
    case "sellerName":
      return row.sellerName;
    case "amountWithoutTax":
      return row.amountWithoutTax;
    case "taxAmount":
      return row.taxAmount;
    case "totalAmount":
      return row.totalAmount;
    case "remark":
      return row.remark;
    case "annotation":
      return row.annotation;
    case "ocrVendor":
      return row.ocrVendor ?? "";
    case "ocrParsedAt":
      return row.ocrParsedAt ?? "";
    case "uploader":
      return row.uploader;
    case "owner":
      return row.owner;
    case "sourceType":
      return row.sourceType;
    case "edited":
      return row.edited ? "是" : "否";
    case "createdAt":
      return row.createdAt;
    case "updatedAt":
      return row.updatedAt;
    case "itemBrief":
      return buildItemBrief(row.items);
    case "itemDetail":
      return buildItemDetail(row.items);
    case "itemType":
      return buildItemField(row.items, "type");
    case "itemUnit":
      return buildItemField(row.items, "unit");
    case "itemQuantity":
      return buildItemField(row.items, "num");
    case "itemUnitPrice":
      return buildItemField(row.items, "unit_price");
    case "itemAmount":
      return buildItemField(row.items, "amount");
    case "itemTaxRate":
      return buildItemField(row.items, "tax_rate");
    case "itemTax":
      return buildItemField(row.items, "tax");
    case "tags":
      return row.tags;
    default:
      return "";
  }
}
