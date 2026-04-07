import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { buildWorkspaceRowStates } from "../application/workspaceRowState";
import { WorkspaceAnalytics } from "./WorkspaceAnalytics";

const fields: WorkspaceFieldDefinition[] = [
  {
    id: "tag-group:cost-center",
    label: "成本中心",
    source: "tag_group",
    type: "multi_select",
    options: ["华东", "华北"],
    rawOptions: ["成本中心:华东", "成本中心:华北"],
    visible: true,
    width: 120,
    editable: true,
  },
];

const rows: InvoiceDocument[] = [
  {
    id: "doc-1",
    contentHash: "hash-1",
    fileName: "a.pdf",
    fileSize: 1,
    lastModified: 1,
    handleRef: "handle-1",
    bindingStatus: "readable",
    bindingErrorType: null,
    ocrVendor: null,
    ocrParsedAt: null,
    parseStatus: "parsed",
    conflictStatus: "none",
    conflictMessage: "",
    invoiceNumber: "INV-001",
    invoiceCode: "",
    invoiceDate: "",
    totalAmount: 100,
    taxAmount: 10,
    amountWithoutTax: 90,
    buyerName: "",
    sellerName: "",
    items: [],
    tags: ["成本中心:华东"],
    annotation: "",
    uploader: "",
    owner: "",
    sourceType: "ocr",
    edited: false,
    createdAt: "",
    updatedAt: "",
  },
];

const rowStates = buildWorkspaceRowStates(rows, fields);

describe("WorkspaceAnalytics", () => {
  test("renders totals and breakdown cards", () => {
    render(
      <WorkspaceAnalytics
        rowStates={rowStates}
        fields={fields}
        fieldId="tag-group:cost-center"
        emptyState={{
          tone: "empty",
          title: "仪表盘还没有可展示的数据",
          description: "先在记录视图建立票据。",
          bullets: ["记录视图负责建档与导入。"],
        }}
      />,
    );

    expect(screen.getAllByText("记录数").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getByText("华东")).toBeInTheDocument();
    expect(screen.getAllByText("100.00").length).toBeGreaterThan(0);
  });
});
