import { describe, expect, test } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { getWorkspaceFieldValue } from "./workspaceValueResolver";

const row: InvoiceDocument = {
  id: "doc-1",
  contentHash: "hash-1",
  fileName: "invoice.pdf",
  fileSize: 10,
  lastModified: 1,
  handleRef: "handle-1",
  bindingStatus: "readable",
  bindingErrorType: null,
  ocrVendor: "baidu",
  ocrParsedAt: "2026-03-31T00:00:00.000Z",
  parseStatus: "parsed",
  conflictStatus: "none",
  conflictMessage: "",
  invoiceNumber: "INV-001",
  invoiceCode: "CODE-001",
  invoiceDate: "2026-03-30",
  totalAmount: 100,
  taxAmount: 10,
  amountWithoutTax: 90,
  buyerName: "购买方",
  sellerName: "销售方",
  items: [],
  tags: ["待报销", "差旅", "时期:2026年"],
  remark: "",
  annotation: "",
  uploader: "",
  owner: "",
  sourceType: "ocr",
  edited: false,
  createdAt: "2026-03-31T00:00:00.000Z",
  updatedAt: "2026-03-31T00:00:00.000Z",
};

const tagsField: WorkspaceFieldDefinition = {
  id: "tags",
  label: "标签",
  source: "builtin",
  type: "multi_select",
  options: [],
  visible: true,
  width: 180,
  editable: true,
};

describe("workspaceValueResolver", () => {
  test("returns invoice tags for the builtin tags field", () => {
    expect(getWorkspaceFieldValue(row, tagsField)).toEqual(["待报销", "差旅", "时期:2026年"]);
  });
});
